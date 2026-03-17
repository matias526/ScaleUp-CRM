"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

export default function DebugInfo({ userId, techCompanyId }: { userId?: string; techCompanyId?: string }) {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    if (!userId || !techCompanyId) {
      setDebugData({ error: "Missing userId or techCompanyId" })
      return
    }

    setLoading(true)
    try {
      // Verificar el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, role_id, roles(id, name, code)")
        .eq("id", userId)
        .single()

      if (userError) {
        setDebugData({ error: "Error fetching user data", details: userError })
        return
      }

      // Verificar las relaciones partner_tech_companies
      const { data: relationData, error: relationError } = await supabase
        .from("partner_tech_companies")
        .select(`
          id,
          tech_company_id,
          partner_id,
          scaleup_manager_id,
          partners(id, name),
          tech_companies(id, name)
        `)
        .eq("tech_company_id", techCompanyId)

      if (relationError) {
        setDebugData({
          user: userData,
          error: "Error fetching relation data",
          details: relationError,
        })
        return
      }

      // Verificar las relaciones donde el usuario es manager
      const userManagedRelations = relationData.filter((rel) => rel.scaleup_manager_id === userId)

      setDebugData({
        user: userData,
        allRelations: relationData,
        userManagedRelations,
      })
    } catch (error) {
      setDebugData({ error: "Unexpected error", details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p>User ID: {userId || "Not provided"}</p>
            <p>Tech Company ID: {techCompanyId || "Not provided"}</p>
          </div>

          <Button onClick={fetchDebugData} disabled={loading} size="sm" variant="outline">
            {loading ? "Loading..." : "Fetch Debug Data"}
          </Button>

          {debugData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
