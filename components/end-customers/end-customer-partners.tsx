import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, TrendingUp, TrendingDown, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { PartnerOpportunity } from "@/lib/services/end-customer-partners-service"

interface EndCustomerPartnersProps {
  partners: PartnerOpportunity[]
}

export function EndCustomerPartners({ partners }: EndCustomerPartnersProps) {
  if (partners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Partners Relacionados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay partners con oportunidades registradas para este cliente.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Partners Relacionados ({partners.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {partners.map((partnerData) => (
          <div key={partnerData.partner.id} className="border rounded-lg p-4 space-y-4">
            {/* Header del Partner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {partnerData.partner.logo_url ? (
                  <img
                    src={partnerData.partner.logo_url || "/placeholder.svg"}
                    alt={partnerData.partner.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{partnerData.partner.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {partnerData.active_opportunities.length + partnerData.inactive_opportunities.length} oportunidades
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/partners/${partnerData.partner.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Partner
                </Link>
              </Button>
            </div>

            {/* Resumen de valores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Oportunidades Activas</p>
                  <p className="font-semibold text-green-600">{formatCurrency(partnerData.total_active_value)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Oportunidades Inactivas</p>
                  <p className="font-semibold text-gray-600">{formatCurrency(partnerData.total_inactive_value)}</p>
                </div>
              </div>
            </div>

            {/* Oportunidades Activas */}
            {partnerData.active_opportunities.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Oportunidades Activas ({partnerData.active_opportunities.length})
                </h4>
                <div className="space-y-2">
                  {partnerData.active_opportunities.map((opp) => (
                    <div key={opp.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div>
                        <Link href={`/dashboard/opportunities/${opp.id}`} className="font-medium hover:underline">
                          {opp.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {opp.stage} • {opp.probability}% probabilidad
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {formatCurrency(opp.estimated_value)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Oportunidades Inactivas */}
            {partnerData.inactive_opportunities.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Oportunidades Inactivas ({partnerData.inactive_opportunities.length})
                </h4>
                <div className="space-y-2">
                  {partnerData.inactive_opportunities.map((opp) => (
                    <div key={opp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <Link href={`/dashboard/opportunities/${opp.id}`} className="font-medium hover:underline">
                          {opp.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {opp.stage} • {opp.probability}% probabilidad
                        </p>
                      </div>
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        {formatCurrency(opp.estimated_value)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
