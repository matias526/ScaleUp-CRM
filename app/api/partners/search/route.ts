import { type NextRequest, NextResponse } from "next/server"
import { PartnerService } from "@/lib/services/partner-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const term = searchParams.get("term") || ""

    const partners = await PartnerService.searchPartners(term)

    return NextResponse.json(partners)
  } catch (error) {
    console.error("Error en la búsqueda de partners:", error)
    return NextResponse.json({ error: "Error al buscar partners" }, { status: 500 })
  }
}
