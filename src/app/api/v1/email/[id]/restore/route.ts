import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/api/auth"
import { supabaseAdmin } from "@/lib/api/supabase-server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const { id } = await params

    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from("email_log")
      .update({ status: "sent", updated_at: now })
      .eq("id", id)
      .eq("status", "trashed")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { status: "sent" } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to restore email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
