import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/api/auth"
import { supabaseAdmin } from "@/lib/api/supabase-server"
import { sendEmail } from "@/lib/utils/email"

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const body = await request.json()
    const { toEmail, toNama, subject, body: htmlBody, cc, status, draftId, referenceType, referenceId, templateId, params } = body

    if (status === "draft") {
      const now = new Date().toISOString()
      const draft = {
        from_email: auth.user?.email ?? null,
        to_email: toEmail,
        to_nama: toNama ?? null,
        cc: cc ?? null,
        subject: subject ?? "",
        body: htmlBody ?? null,
        status: "draft",
        updated_at: now,
      }

      if (draftId) {
        const { error: updateError } = await supabaseAdmin
          .from("email_log")
          .update(draft)
          .eq("id", draftId)

        if (updateError) throw updateError

        return NextResponse.json({ data: { id: draftId, status: "draft" } })
      }

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from("email_log")
        .insert({ ...draft, created_at: now })
        .select("id")
        .single()

      if (insertError) throw insertError

      return NextResponse.json({ data: { id: insertData.id, status: "draft" } })
    }

    if (!toEmail) {
      return NextResponse.json({ error: "toEmail is required" }, { status: 400 })
    }
    if (!subject && !templateId) {
      return NextResponse.json({ error: "subject or templateId is required" }, { status: 400 })
    }

    const result = await sendEmail({
      to: toEmail,
      toNama: toNama || undefined,
      subject: subject || "",
      html: htmlBody || undefined,
      templateId: templateId || undefined,
      params: params || undefined,
      referenceType: referenceType || undefined,
      referenceId: referenceId || undefined,
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
