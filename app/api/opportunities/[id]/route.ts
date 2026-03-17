import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: "ID de oportunidad no proporcionado" }, { status: 400 })
    }

    const supabase = createClient()

    // Verificar si la oportunidad existe
    const { data: opportunityExists, error: existsError } = await supabase
      .from("opportunities")
      .select("id")
      .eq("id", params.id)
      .single()

    if (existsError) {
      return NextResponse.json(
        {
          error: "Error al verificar si la oportunidad existe",
          details: existsError,
        },
        { status: 500 },
      )
    }

    if (!opportunityExists) {
      return NextResponse.json({ error: "Oportunidad no encontrada" }, { status: 404 })
    }

    // Obtener los detalles completos
    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .select(`
        *,
        stage:pipeline_stages(id, code, name, display_order),
        tech_company:tech_companies(id, name, logo_url),
        partner:partners(id, name, logo_url),
        end_customer:end_customers(id, name)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: "Error al obtener detalles de la oportunidad",
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json(
      {
        error: "Error inesperado al procesar la solicitud",
        details: error,
      },
      { status: 500 },
    )
  }
}
