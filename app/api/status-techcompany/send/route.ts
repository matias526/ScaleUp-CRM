import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
  const messages = Array.isArray(body.messages) ? body.messages.filter((message: any) => typeof message?.to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to) && typeof message?.html === "string") : []
  const fallbackRecipients = Array.isArray(body.recipients) ? body.recipients.filter((value: unknown): value is string => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)).map((to: string) => ({ to, html: String(body.html || "<p>Weekly status attached.</p>") })) : []
  const uniqueMessages = Array.from(new Map([...messages, ...fallbackRecipients].map((message: any) => [message.to.toLowerCase(), message])).values())
  if (!uniqueMessages.length || uniqueMessages.length > 100) return NextResponse.json({ error: "Select between 1 and 100 valid recipients" }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 503 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const results = await Promise.all(uniqueMessages.map((message: any, index: number) => resend.emails.send({
    from: process.env.NEXT_PUBLIC_EMAIL_FROM || "ScaleUp Status <onboarding@resend.dev>",
    to: [message.to],
    subject: String(message.subject || body.subject || "Weekly TechCompany Status").slice(0, 200),
    html: message.html,
  }, { idempotencyKey: `${String(body.idempotencyKey || `techcompany-status/${body.techCompanyId || "unknown"}/${body.year || "unknown"}/${Date.now()}`)}-${index}` })))
  const failed = results.find((result) => result.error)
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 502 })
  return NextResponse.json({ ids: results.map((result) => result.data?.id).filter(Boolean), count: results.length })
  } catch (error) {
    console.error("[status-techcompany/send] Resend request failed", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send status email" }, { status: 500 })
  }
}
