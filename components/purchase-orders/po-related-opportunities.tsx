"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils/format"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface RelatedOpportunitiesProps {
  opportunities: any[]
}

export function RelatedOpportunitiesSection({ opportunities }: RelatedOpportunitiesProps) {
  const router = useRouter()

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Oportunidades Relacionadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No hay oportunidades relacionadas con esta orden de compra
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Oportunidades Relacionadas ({opportunities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{opp.title}</h4>
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    {opp.amount && <span>{formatCurrency(opp.amount)}</span>}
                  </div>
                  {opp.created_at && (
                    <div className="text-xs text-gray-400 mt-1">
                      {format(new Date(opp.created_at), "dd MMM yyyy", { locale: es })}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="ml-2">
                  Ver →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
