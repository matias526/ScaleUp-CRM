//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"

export interface PartnerOpportunity {
  partner: {
    id: string
    name: string
    logo_url?: string
  }
  active_opportunities: {
    id: string
    title: string
    stage: string
    estimated_value: number
    probability: number
  }[]
  inactive_opportunities: {
    id: string
    title: string
    stage: string
    estimated_value: number
    probability: number
  }[]
  total_active_value: number
  total_inactive_value: number
}

export async function getEndCustomerPartners(endCustomerId: string): Promise<PartnerOpportunity[]> {
  try {
    const supabase = createServerClient()

    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select(`
        id,
        title,
        estimated_value,
        probability,
        partner_id,
        partners!inner (
          id,
          name,
          logo_url
        ),
        pipeline_stages!inner (
          code
        )
      `)
      .eq("end_customer_id", endCustomerId)
      .not("partner_id", "is", null)

    if (error) {
      console.error("Error fetching end customer partners:", error)
      return []
    }

    if (!opportunities || opportunities.length === 0) {
      return []
    }

    // Agrupar oportunidades por partner
    const partnerMap = new Map<string, PartnerOpportunity>()

    opportunities.forEach((opp) => {
      if (!opp.partners) return

      const partnerId = opp.partners.id
      const stageCode = opp.pipeline_stages?.code || ""

      // Determinar si la oportunidad está activa o inactiva
      const isActive = !["freeze", "won", "lost"].includes(stageCode.toLowerCase())

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partner: {
            id: opp.partners.id,
            name: opp.partners.name,
            logo_url: opp.partners.logo_url,
          },
          active_opportunities: [],
          inactive_opportunities: [],
          total_active_value: 0,
          total_inactive_value: 0,
        })
      }

      const partnerData = partnerMap.get(partnerId)!
      const opportunityData = {
        id: opp.id,
        title: opp.title,
        stage: stageCode, // Usamos directamente el code como stage
        estimated_value: opp.estimated_value || 0,
        probability: opp.probability || 0,
      }

      if (isActive) {
        partnerData.active_opportunities.push(opportunityData)
        partnerData.total_active_value += opportunityData.estimated_value
      } else {
        partnerData.inactive_opportunities.push(opportunityData)
        partnerData.total_inactive_value += opportunityData.estimated_value
      }
    })

    return Array.from(partnerMap.values()).sort((a, b) => b.total_active_value - a.total_active_value)
  } catch (error) {
    console.error("Unexpected error fetching end customer partners:", error)
    return []
  }
}
