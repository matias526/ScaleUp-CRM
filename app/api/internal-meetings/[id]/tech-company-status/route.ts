//import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    //const supabase = createRouteHandlerClient({ cookies })
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const techCompanyId = searchParams.get("techCompanyId")

    if (!techCompanyId) {
      return NextResponse.json({ error: "TechCompany ID is required" }, { status: 400 })
    }

    const { data: techCompany, error: techCompanyError } = await supabase
      .from("tech_companies")
      .select("id, name, logo_url, is_active")
      .eq("id", techCompanyId)
      .eq("is_active", true)
      .single()

    if (techCompanyError || !techCompany) {
      return NextResponse.json({ error: "TechCompany not found" }, { status: 404 })
    }

    const { data: pipelineStages } = await supabase.from("pipeline_stages").select("*").order("display_order")

    const { data: opportunities } = await supabase
      .from("opportunities")
      .select(`
        id,
        title,
        estimated_value,
        estimated_close_date,
        created_at,
        updated_at,
        pipeline_stage_id,
        assigned_to,
        pipeline_stages(code, display_order)
      `)
      .eq("tech_company_id", techCompanyId)

    const funnel =
      pipelineStages?.map((stage) => {
        const stageOpps = opportunities?.filter((opp) => opp.pipeline_stage_id === stage.id) || []
        return {
          stage: stage.code,
          count: stageOpps.length,
          value: stageOpps.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0),
        }
      }) || []

    const { data: involvedUsers } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email
      `)
      .in("id", [...new Set(opportunities?.map((opp) => opp.assigned_to).filter(Boolean) || [])])

    const involucrados =
      involvedUsers?.map((user) => {
        const userOpps = opportunities?.filter((opp) => opp.assigned_to === user.id) || []

        // Get partners count for this user and tech company
        const partnersQuery = supabase
          .from("partner_tech_companies")
          .select("partner_id")
          .eq("tech_company_id", techCompanyId)
          .eq("scaleup_manager_id", user.id)

        // Get tasks count for this user and tech company
        const tasksQuery = supabase
          .from("tasks")
          .select("id")
          .eq("tech_company_id", techCompanyId)
          .eq("assigned_to", user.id)
          .eq("status", "pending")

        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          opportunities: userOpps.length,
          partners: 0, // Will be filled by separate queries
          tasks: 0, // Will be filled by separate queries
        }
      }) || []

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const goodIndicators = {
      closedOpportunities:
        opportunities?.filter((opp) => opp.pipeline_stages?.[0]?.code === "Won" && new Date(opp.updated_at) >= oneWeekAgo)
          .length || 0,

      movedOpportunities:
        opportunities?.filter(
          (opp) => new Date(opp.updated_at) >= oneWeekAgo && opp.pipeline_stages?.[0]?.code !== "Pre-Lead",
        ).length || 0,

      newOpportunities: opportunities?.filter((opp) => new Date(opp.created_at) >= oneWeekAgo).length || 0,
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const badIndicators = {
      stagnantOpportunities:
        opportunities?.filter(
          (opp) =>
            new Date(opp.updated_at) < thirtyDaysAgo &&
            opp.pipeline_stages?.[0]?.code !== "Won" && // Agregamos [0]
            opp.pipeline_stages?.[0]?.code !== "Lost",
        ).length || 0,

      oldOpportunities:
        opportunities?.filter(
          (opp) => new Date(opp.created_at) < thirtyDaysAgo && opp.pipeline_stages?.[0]?.code === "Pre-Lead",
        ).length || 0,

      opportunitiesWithoutValue:
        opportunities?.filter((opp) => !opp.estimated_value || opp.estimated_value === 0).length || 0,

      opportunitiesWithoutCloseDate: opportunities?.filter((opp) => !opp.estimated_close_date).length || 0,

      lostOpportunities:
        opportunities?.filter((opp) => opp.pipeline_stages?.[0]?.code === "Lost" && new Date(opp.updated_at) >= oneWeekAgo)
          .length || 0,
    }

    const totalOpportunities = opportunities?.length || 0
    const totalValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0
    const activeOpportunities =
      opportunities?.filter((opp) => opp.pipeline_stages?.[0]?.code !== "Won" && opp.pipeline_stages?.[0]?.code !== "Lost")
        .length || 0

    const analysisPrompt = `
    Analiza el estado de la TechCompany "${techCompany.name}" basándote en estos datos:
    
    Oportunidades totales: ${totalOpportunities}
    Valor total del pipeline: $${totalValue.toLocaleString()}
    Oportunidades activas: ${activeOpportunities}
    
    Indicadores positivos (última semana):
    - Oportunidades cerradas: ${goodIndicators.closedOpportunities}
    - Oportunidades que avanzaron: ${goodIndicators.movedOpportunities}
    - Nuevas oportunidades: ${goodIndicators.newOpportunities}
    
    Indicadores negativos:
    - Oportunidades estancadas (>30 días): ${badIndicators.stagnantOpportunities}
    - Oportunidades viejas en Pre-Lead: ${badIndicators.oldOpportunities}
    - Sin valor estimado: ${badIndicators.opportunitiesWithoutValue}
    - Sin fecha de cierre: ${badIndicators.opportunitiesWithoutCloseDate}
    - Perdidas esta semana: ${badIndicators.lostOpportunities}
    
    Determina el estado como:
    - VERDE: Buen rendimiento, pocas alertas
    - AMARILLO: Rendimiento moderado, algunas alertas
    - ROJO: Problemas significativos, muchas alertas
    
    Responde SOLO con un JSON en este formato:
    {
      "status": "VERDE|AMARILLO|ROJO",
      "suggestions": ["sugerencia 1", "sugerencia 2", "sugerencia 3"]
    }
    `

    let aiAnalysis = {
      status: "AMARILLO",
      suggestions: ["Revisar oportunidades estancadas", "Actualizar valores estimados", "Seguimiento más frecuente"],
    }

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: analysisPrompt,
      })

      const parsedAnalysis = JSON.parse(text)
      if (parsedAnalysis.status && parsedAnalysis.suggestions) {
        aiAnalysis = parsedAnalysis
      }
    } catch (error) {
      console.error("[v0] Error generating AI analysis:", error)
    }

    return NextResponse.json({
      techCompany,
      funnel,
      involucrados,
      goodIndicators,
      badIndicators,
      aiAnalysis,
      totalOpportunities,
      totalValue,
    })
  } catch (error) {
    console.error("Error fetching tech company status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
