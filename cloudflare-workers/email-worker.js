// Cloudflare Email Worker — ERP RRI Inbound Email Pipeline
// ==========================================================
// Deploy via Cloudflare Dashboard: Workers & Pages → Create Worker → Paste this code
// Set env vars in Worker settings (see SETTINGS section below)
//
// Flow:
//   Email arrives at pt-rri.com MX → Email Routing Rule → This Worker
//   1. Parse email (headers + body + attachments)
//   2. Upload attachments to R2 via Worker R2 binding
//   3. POST to ERP API  → stored in email_log + email_attachments → Mail Center Inbox
//   4. Relay via Brevo   → arrives at Gmail with proper DKIM/SPF/DMARC → Inbox, not Spam
//   5. Fallback forward  → if Brevo fails, forward original via Cloudflare
//
// ==========================================================
// SETTINGS — Configure these as Worker environment variables:
// ==========================================================
// ERP_INBOUND_URL=https://erp-rri.vercel.app/api/v1/email/inbound
// ERP_INBOUND_SECRET=<generate with: openssl rand -hex 32>
// BREVO_API_KEY=xkeysib-...
// FORWARD_TO_EMAIL=mazzjoeq@gmail.com
// SENDER_EMAIL=marzuqi@pt-rri.com
// SENDER_NAME="ERP RRI"
// MAX_BODY_SIZE=1048576  (1MB, optional)
// R2 bucket binding: [[r2_buckets]] binding = "R2" bucket_name = "email-attachments" (in wrangler.toml)

export default {
  async email(message, env, ctx) {
    const MAX_BODY = parseInt(env.MAX_BODY_SIZE || '1048576', 10)
    const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25MB
    const startTime = Date.now()

    // ---- 1. Extract headers ----
    const rawFrom = message.from
    const to = message.to
    const subject = message.headers.get('subject') || '(No Subject)'
    const messageId = message.headers.get('message-id') || `cf-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const replyTo = message.headers.get('reply-to') || rawFrom
    const cc = message.headers.get('cc') || ''

    // ---- 2. Parse From header (Name <email> format) ----
    const { email: fromEmail, nama: fromNama } = parseFromHeader(rawFrom)

    // ---- 3. Read & parse raw MIME body ----
    let rawText = ''
    try {
      const reader = message.raw.getReader()
      const chunks = []
      let totalSize = 0
      let lastErr = null
      while (true) {
        try {
          const { done, value } = await reader.read()
          if (done) break
          totalSize += value.length
          if (totalSize > MAX_BODY) {
            chunks.push(value.slice(0, MAX_BODY - totalSize + value.length))
            break
          }
          chunks.push(value)
        } catch (readErr) {
          lastErr = readErr
          break
        }
      }
      const actualSize = chunks.reduce((a, c) => a + c.length, 0)
      const allBytes = new Uint8Array(actualSize)
      let pos = 0
      for (const chunk of chunks) {
        allBytes.set(chunk, pos)
        pos += chunk.length
      }
      rawText = new TextDecoder().decode(allBytes)
    } catch (err) {
      console.error('Error reading raw email:', err.message)
    }

    // ---- 4. Parse MIME (body + attachments) ----
    const ctHeader = message.headers.get('content-type') || ''
    const parsed = parseMime(rawText, ctHeader)
    const htmlBody = parsed.htmlBody || ''
    const textBody = parsed.textBody || ''
    const attachments = parsed.attachments || []
    const hasAttachments = attachments.length > 0
    const finalBody = htmlBody || textBody || '(no body)'

    // ---- 5. Upload attachments to R2 ----
    let uploadedAttachments = []
    if (attachments.length > 0 && env.R2) {
      try {
        uploadedAttachments = await uploadAttachmentsToR2(attachments, messageId, env.R2, MAX_ATTACHMENT_SIZE)
        console.log(`Uploaded ${uploadedAttachments.length}/${attachments.length} attachments to R2`)
      } catch (r2Err) {
        console.error('R2 upload error:', r2Err.message)
      }
    }

    // ---- 6. Send to ERP API (store in email_log + email_attachments) ----
    let erpSuccess = false
    let erpResponse = null
    try {
      const erpRes = await fetch(env.ERP_INBOUND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.ERP_INBOUND_SECRET}`,
        },
        body: JSON.stringify({
          messageId,
          fromEmail,
          fromNama,
          toEmail: to,
          cc: cc || undefined,
          subject,
          body: finalBody.substring(0, 50000),
          hasAttachments,
          attachments: uploadedAttachments,
        }),
      })
      erpSuccess = erpRes.ok
      if (erpRes.ok) {
        try { erpResponse = await erpRes.json() } catch {}
      } else {
        const erpErr = await erpRes.text()
        console.error(`ERP API error (${erpRes.status}):`, erpErr)
      }
    } catch (err) {
      console.error('Failed to call ERP API:', err.message)
    }

    // ---- 7. Relay via Brevo (fix spam — proper DKIM/SPF) ----
    let brevoSuccess = false
    try {
      // Include attachments in relay (≤7MB per Brevo limit)
      const MAX_RELAY_ATTACHMENT_SIZE = 7 * 1024 * 1024
      const relayAttachments = []
      for (const att of attachments) {
        if (att.content && att.content.byteLength <= MAX_RELAY_ATTACHMENT_SIZE) {
          relayAttachments.push({
            name: att.filename,
            content: uint8ArrayToBase64(att.content),
          })
        }
      }

      const brevoPayload = {
        sender: { name: env.SENDER_NAME || 'ERP RRI', email: env.SENDER_EMAIL },
        to: [{ email: env.FORWARD_TO_EMAIL }],
        replyTo: { email: replyTo, name: fromNama || fromEmail },
        subject: `${subject}`,
        htmlContent: buildRelayBody(fromEmail, fromNama, to, subject, htmlBody || textBody),
        tags: ['inbound-relay'],
      }
      if (relayAttachments.length > 0) {
        brevoPayload.attachment = relayAttachments
      }

      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brevoPayload),
      })
      brevoSuccess = brevoRes.ok
      if (!brevoSuccess) {
        const brevoErr = await brevoRes.text()
        console.error(`Brevo relay error (${brevoRes.status}):`, brevoErr)
      }
    } catch (err) {
      console.error('Failed to relay via Brevo:', err.message)
    }

    // ---- 8. Fallback: forward original via Cloudflare ----
    if (!brevoSuccess) {
      try {
        await message.forward(env.FORWARD_TO_EMAIL)
        console.log('Fallback: forwarded original email to', env.FORWARD_TO_EMAIL)
      } catch (fwdErr) {
        console.error('Fallback forward failed:', fwdErr.message)
      }
    }

    const elapsed = Date.now() - startTime
    console.log(`Processed email from=${fromEmail} subject="${subject}" erp=${erpSuccess} brevo=${brevoSuccess} attachments=${uploadedAttachments.length} ${elapsed}ms`)
  },
}

// ---- Parse From header: "Name <email>" → { email, nama } ----
function parseFromHeader(raw) {
  // "John Doe <john@example.com>" → { email: "john@example.com", nama: "John Doe" }
  // "john@example.com" → { email: "john@example.com", nama: null }
  // "<john@example.com>" → { email: "john@example.com", nama: null }
  const match = String(raw).match(/^(.+?)\s*<(.+)>$/)
  if (match) {
    return { email: match[2].trim(), nama: match[1].trim() }
  }
  return { email: String(raw).trim(), nama: null }
}

// ---- MIME Parser (zero dependencies) ----
function parseMime(rawText, ctHeader) {
  if (!rawText) return { htmlBody: '', textBody: '', attachments: [] }

  const headerEnd = rawText.indexOf('\r\n\r\n')
  if (headerEnd < 0) return { htmlBody: '', textBody: rawText, attachments: [] }

  const headerSection = rawText.substring(0, headerEnd)
  const bodySection = rawText.substring(headerEnd + 4)

  const headers = parseHeaders(headerSection)
  const contentType = headers['content-type'] || 'text/plain'
  const contentEncoding = (headers['content-transfer-encoding'] || '').toLowerCase().trim()

  let decodedBody = bodySection
  if (contentEncoding === 'base64') {
    try {
      const binary = atob(bodySection.replace(/[\r\n\s]/g, ''))
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      decodedBody = new TextDecoder().decode(bytes)
    } catch { decodedBody = bodySection }
  } else if (contentEncoding === 'quoted-printable') {
    decodedBody = decodeQuotedPrintable(bodySection)
  }

  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/)
  if (boundaryMatch) {
    return parseMultipart(decodedBody, boundaryMatch[1])
  }

  if (contentType.includes('text/html')) {
    return { htmlBody: decodedBody.trim(), textBody: '', attachments: [] }
  }
  return { htmlBody: '', textBody: decodedBody.trim(), attachments: [] }
}

function parseHeaders(headerSection) {
  const headers = {}
  const lines = headerSection.split('\r\n')
  let currentKey = ''
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (currentKey) headers[currentKey] += ' ' + line.trim()
    } else {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        currentKey = line.substring(0, colonIdx).toLowerCase().trim()
        headers[currentKey] = line.substring(colonIdx + 1).trim()
      }
    }
  }
  return headers
}

function parseMultipart(body, boundary) {
  const parts = body.split('--' + boundary)
  let htmlBody = ''
  let textBody = ''
  const attachments = []

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || trimmed === '--') continue

    const partHeaderEnd = part.indexOf('\r\n\r\n')
    if (partHeaderEnd < 0) continue

    const partHeaders = parseHeaders(part.substring(0, partHeaderEnd))
    const partBody = part.substring(partHeaderEnd + 4)

    const ct = (partHeaders['content-type'] || '').toLowerCase()
    const ce = (partHeaders['content-transfer-encoding'] || '').toLowerCase().trim()
    const cd = (partHeaders['content-disposition'] || '').toLowerCase()

    const subBoundary = ct.match(/boundary="?([^";]+)"?/)
    if (subBoundary) {
      const sub = parseMultipart(partBody, subBoundary[1])
      if (sub.htmlBody) htmlBody = sub.htmlBody
      if (sub.textBody) textBody = sub.textBody
      attachments.push(...sub.attachments)
      continue
    }

    if (cd.includes('attachment') || cd.includes('filename=')) {
      const filename = extractFilename(partHeaders['content-disposition'] || ct)
      const mimeType = partHeaders['content-type'] || 'application/octet-stream'

      let decodedBytes = null
      if (ce === 'base64') {
        try {
          const binary = atob(partBody.replace(/[\r\n\s]/g, ''))
          decodedBytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) decodedBytes[i] = binary.charCodeAt(i)
        } catch {}
      } else if (ce === 'quoted-printable') {
        const decoded = decodeQuotedPrintable(partBody)
        decodedBytes = new Uint8Array(decoded.length)
        for (let i = 0; i < decoded.length; i++) decodedBytes[i] = decoded.charCodeAt(i)
      }

      attachments.push({
        filename: filename || 'attachment',
        mimeType,
        content: decodedBytes,
      })
      continue
    }

    if (ct.includes('text/html')) {
      htmlBody = partBody.trim()
    } else if (ct.includes('text/plain') && !htmlBody) {
      textBody = partBody.trim()
    }
  }

  return { htmlBody, textBody, attachments }
}

function extractFilename(cd) {
  if (!cd) return null
  // Try RFC 2231 / RFC 5987 format: filename*=UTF-8''... (decoded)
  const rfc2231Match = cd.match(/filename\*=(?:UTF-8|utf-8)''([^;\r\n]+)/i)
  if (rfc2231Match) {
    try { return decodeURIComponent(rfc2231Match[1]) } catch { return rfc2231Match[1] }
  }
  // Try standard format: filename="..." or filename=...
  const standardMatch = cd.match(/filename="?([^";\r\n]+)"?/i)
  if (standardMatch) return standardMatch[1].trim()
  return null
}

function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r\n/g, '')
    .replace(/=\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

// ---- Upload attachments to R2 via Worker R2 binding ----
async function uploadAttachmentsToR2(attachments, messageId, r2, maxSize) {
  const results = []

  for (const att of attachments) {
    if (!att.content || !att.filename) continue

    const fileSize = att.content.byteLength
    if (fileSize > maxSize) {
      console.warn(`Skipping attachment ${att.filename}: ${fileSize} bytes exceeds ${maxSize} limit`)
      continue
    }

    const uuid = generateUUID()
    const safeFilename = att.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `email-attachments/${messageId}/${uuid}-${safeFilename}`

    try {
      await r2.put(key, att.content, {
        httpMetadata: {
          contentType: att.mimeType,
        },
        customMetadata: {
          originalFilename: att.filename,
        },
      })

      results.push({
        key,
        fileName: att.filename,
        fileSize,
        mimeType: att.mimeType,
      })

      console.log(`Uploaded: ${key} (${fileSize} bytes)`)
    } catch (uploadErr) {
      console.error(`Failed to upload ${att.filename}:`, uploadErr.message)
    }
  }

  return results
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function buildRelayBody(fromEmail, fromNama, to, subject, originalBody) {
  const safeOriginal = String(originalBody || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')

  const senderDisplay = fromNama ? `${fromNama} <${fromEmail}>` : fromEmail

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0; margin: 0; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #0000FF, #0000D9); padding: 20px 30px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">ERP RRI — Pesan Masuk</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr><td style="padding: 4px 0; color: #666; font-size: 13px;">Dari</td></tr>
                <tr><td style="padding: 2px 0 12px; color: #333; font-size: 15px; font-weight: 600;">${escapeHtml(senderDisplay)}</td></tr>
                <tr><td style="padding: 4px 0; color: #666; font-size: 13px;">Tujuan</td></tr>
                <tr><td style="padding: 2px 0 12px; color: #333; font-size: 15px;">${escapeHtml(to)}</td></tr>
                <tr><td style="padding: 4px 0; color: #666; font-size: 13px;">Subjek</td></tr>
                <tr><td style="padding: 2px 0 12px; color: #333; font-size: 15px; font-weight: 600;">${escapeHtml(subject)}</td></tr>
              </table>
              <hr style="border: none; border-top: 1px solid #eee; margin: 0 0 20px;">
              <div style="color: #333; font-size: 14px; line-height: 1.6;">
                ${safeOriginal}
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; font-style: italic;">
                Pesan ini dikirim ke ${escapeHtml(to)} dan diteruskan secara otomatis oleh ERP RRI.
                Balas email ini akan langsung terkirim ke ${escapeHtml(fromEmail)}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
}

function uint8ArrayToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}