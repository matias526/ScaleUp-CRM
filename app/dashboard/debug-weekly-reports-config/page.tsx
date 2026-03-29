import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function WeeklyReportDebugPage() {
  const supabase = createServerClient()

  try {
    // 1. Obtener tech companies
    const { data: techCompanies, error: techError } = await supabase
      .from("tech_companies")
      .select("id, name")

    // 2. Obtener destinatarios activos
    const { data: activeRecipients, error: recipientsError } = await supabase
      .from("weekly_report_recipients")
      .select(`
        id,
        tech_company_id,
        user_id,
        is_active,
        tech_companies (id, name),
        users (id, email, first_name, last_name)
      `)
      .eq("is_active", true)

    // 3. Obtener TODOS los destinatarios (activos e inactivos)
    const { data: allRecipients, error: allRecipientsError } = await supabase
      .from("weekly_report_recipients")
      .select(`
        id,
        tech_company_id,
        user_id,
        is_active,
        tech_companies (id, name)
      `)

    // 4. Contar por tech company
    const recipientsByTechCompany: Record<string, { active: number; inactive: number }> = {}
    allRecipients?.forEach((r) => {
      const tcId = r.tech_company_id
      if (!recipientsByTechCompany[tcId]) {
        recipientsByTechCompany[tcId] = { active: 0, inactive: 0 }
      }
      if (r.is_active) {
        recipientsByTechCompany[tcId].active++
      } else {
        recipientsByTechCompany[tcId].inactive++
      }
    })

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Debug: Weekly Reports Configuration</h1>
            <p className="text-gray-600">Estado actual de la configuración de reportes semanales</p>
          </div>

          {/* Tech Companies */}
          <Card>
            <CardHeader>
              <CardTitle>Tech Companies ({techCompanies?.length || 0})</CardTitle>
              <CardDescription>Todas las tech companies en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {techCompanies?.map((tc) => (
                  <div key={tc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{tc.name}</span>
                    <div className="text-xs">
                      {recipientsByTechCompany[tc.id] && (
                        <>
                          <span className="text-green-600">
                            {recipientsByTechCompany[tc.id].active} activos
                          </span>
                          {recipientsByTechCompany[tc.id].inactive > 0 && (
                            <span className="text-gray-500 ml-2">
                              {recipientsByTechCompany[tc.id].inactive} inactivos
                            </span>
                          )}
                        </>
                      )}
                      {!recipientsByTechCompany[tc.id] && <span className="text-red-600">Sin destinatarios</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                Destinatarios ACTIVOS ({activeRecipients?.length || 0})
              </CardTitle>
              <CardDescription>Estos recibirán los reportes semanales</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeRecipients || activeRecipients.length === 0 ? (
                <div className="p-4 bg-red-50 text-red-700 rounded">
                  ⚠️ NO HAY DESTINATARIOS ACTIVOS CONFIGURADOS
                </div>
              ) : (
                <div className="space-y-3">
                  {activeRecipients.map((r) => (
                    <div key={r.id} className="p-3 bg-green-50 border border-green-200 rounded">
                      <p className="font-semibold">{r.tech_companies?.name}</p>
                      <p className="text-sm text-gray-600">
                        {r.users?.email} ({r.users?.first_name} {r.users?.last_name})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inactive Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-600">Destinatarios INACTIVOS</CardTitle>
              <CardDescription>Estos NO recibirán reportes (is_active = false)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allRecipients
                  ?.filter((r) => !r.is_active)
                  .map((r) => (
                    <div key={r.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-semibold">{r.tech_companies?.name}</p>
                      <p className="text-gray-600">Usuario: {r.user_id}</p>
                    </div>
                  ))}
                {!allRecipients?.some((r) => !r.is_active) && (
                  <p className="text-gray-500">No hay destinatarios inactivos</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Información Técnica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm space-y-2">
                <p>
                  Tech Companies total: <span className="font-bold">{techCompanies?.length || 0}</span>
                </p>
                <p>
                  Destinatarios activos: <span className="font-bold text-green-600">{activeRecipients?.length || 0}</span>
                </p>
                <p>
                  Destinatarios inactivos:{" "}
                  <span className="font-bold text-gray-600">{(allRecipients?.length || 0) - (activeRecipients?.length || 0)}</span>
                </p>
                <p>
                  Total destinatarios: <span className="font-bold">{allRecipients?.length || 0}</span>
                </p>
                {recipientsError && (
                  <p className="text-red-600">Error al obtener destinatarios: {recipientsError.message}</p>
                )}
                {techError && <p className="text-red-600">Error al obtener tech companies: {techError.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
