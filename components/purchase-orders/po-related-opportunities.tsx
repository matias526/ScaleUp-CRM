"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils/format"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"

interface RelatedOpportunitiesProps {
  opportunities: any[]
}

export function RelatedOpportunitiesSection({ opportunities }: RelatedOpportunitiesProps) {
  const router = useRouter()
  const { t } = useTranslations(DICT_LANG_PO)

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            {t("po.relatedOpportunities")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            {t("po.relatedOpportunities.noOpportunities")}
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
          {t("po.relatedOpportunities")} ({opportunities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => window.open(`/dashboard/opportunities/${opp.id}`, '_blank')}
                >
                  {t("po.relatedOpportunities.view")} →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
