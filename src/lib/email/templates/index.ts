export interface FooterData {
  companyNama?: string
  companyNoHp?: string
  companyEmail?: string
}

export function emailLayout(content: string, title: string, footer?: FooterData): string {
  const nama = footer?.companyNama || 'PT. Rizqi Ridho Ilahi'
  const noHp = footer?.companyNoHp || '+6281 2607 5500'
  const email = footer?.companyEmail || 'info@pt-rri.com'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:24px 32px;text-align:center">
<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">${title}</h1>
</td></tr>
<tr><td style="padding:32px">
${content}
</td></tr>
<tr><td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
<p style="margin:0">Dokumen ini dikirim secara otomatis oleh ERP System - <strong>${nama}</strong>.</p>
<p style="margin:4px 0 0">Hubungi kami bila ada pertanyaan lebih lanjut.</p>
<p style="margin:4px 0 0">${noHp} | ${email} | https://pt-rri.com</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export function tableRow(label: string, value: string): string {
  return `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;color:#475569;background-color:#f8fafc;white-space:nowrap;width:140px;font-size:14px">${label}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#1e293b;font-size:14px">${value}</td></tr>`
}

export const COMPANY_KEYS = [
  'company_nama', 'company_alamat', 'company_no_hp', 'company_email',
  'company_logo_url', 'penandatangan_nama', 'penandatangan_jabatan',
] as const

export async function fetchCompanySettings(): Promise<Record<string, string>> {
  const { supabaseAdmin } = await import('@/lib/api/supabase-server')
  const { data } = await supabaseAdmin.from('site_settings').select('key, value').in('key', COMPANY_KEYS as unknown as string[])
  const company: Record<string, string> = {}
  if (data) for (const row of data) company[row.key] = row.value
  return company
}
