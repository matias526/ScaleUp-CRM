import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const recipients: string[] = Array.isArray(body.recipients) ? [...new Set(body.recipients.filter((value: unknown): value is string => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))] : []
  if (!recipients.length || recipients.length > 100) return NextResponse.json({ error: "Select between 1 and 100 valid recipients" }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 503 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const result = await resend.emails.send({
    from: process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp Status <onboarding@resend.dev>",
    to: recipients,
    subject: String(body.subject || "Weekly TechCompany Status").slice(0, 200),
    html: String(body.html || "<p>Weekly status attached.</p>"),
  }, { idempotencyKey: `techcompany-status/${body.techCompanyId || "unknown"}/${body.year || "unknown"}/${new Date().toISOString().slice(0, 10)}` })

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 502 })
  return NextResponse.json({ id: result.data?.id })
}
