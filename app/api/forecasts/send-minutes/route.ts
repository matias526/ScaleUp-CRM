import { Resend } from "resend"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { recipients, projection, partner, techCompany } = await request.json()
    if (!Array.isArray(recipients) || recipients.length === 0) return NextResponse.json({ error: "Recipients are required" }, { status: 400 })
    if (!process.env.RESEND_API_KEY || !process.env.NEXT_PUBLIC_EMAIL_FROM) return NextResponse.json({ error: "Email service is not configured" }, { status: 503 })
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: process.env.NEXT_PUBLIC_EMAIL_FROM, to: recipients, subject: `Forecast acordado — ${partner} x ${techCompany}`, html: `<h2>Forecast acordado</h2><p><strong>${partner}</strong> x <strong>${techCompany}</strong></p><ul><li>Oportunidades declaradas: ${projection.target_opportunities_declared}</li><li>En propuesta: ${projection.target_opportunities_proposal}</li><li>Ganadas: ${projection.target_opportunities_won}</li><li>Revenue estimado: ${projection.currency} ${projection.target_revenue_amount}</li><li>Posts publicados: ${projection.target_posts_published}</li><li>Casos de éxito: ${projection.target_success_cases}</li></ul>` })
    if (error) return NextResponse.json({ error: error.message }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }) }
}
