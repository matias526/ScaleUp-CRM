"use client"

import { OpportunitiesPageWithHardcodedTranslations } from "@/components/opportunities/opportunities-page-with-hardcoded-translations"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

export default function OpportunitiesHardcodedPage() {
  const [opportunities, setOpportunities] = useState([])
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Cargar oportunidades
        const { data: opportunitiesData, error: opportunitiesError } = await supabase
          .from("opportunities")
          .select("*")
          .order("created_at", { ascending: false })

        if (opportunitiesError) {
          console.error("Error loading opportunities:", opportunitiesError)
        } else {
          setOpportunities(opportunitiesData || [])
        }

        // Cargar etapas
        const { data: stagesData, error: stagesError } = await supabase
          .from("pipeline_stages")
          .select("*")
          .order("order", { ascending: true })

        if (stagesError) {
          console.error("Error loading stages:", stagesError)
        } else {
          setStages(stagesData || [])
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div>Cargando...</div>
  }

  return <OpportunitiesPageWithHardcodedTranslations opportunities={opportunities} stages={stages} />
}
