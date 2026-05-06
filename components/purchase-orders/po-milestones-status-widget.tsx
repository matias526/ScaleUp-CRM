"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"

interface MilestonesStatusWidgetProps {
  milestones: any[]
  onViewClick: () => void
}

export function MilestonesStatusWidget({ milestones, onViewClick }: MilestonesStatusWidgetProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  
  const totalMilestones = milestones?.length || 0
  const paidMilestones = milestones?.filter(m => m.status === "paid")?.length || 0
  const totalAmount = milestones?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0
  const collectedAmount = milestones
    ?.filter(m => m.status === "paid")
    ?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0
  const percentage = totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0

  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onViewClick}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t("po.milestone.milestonesWidget")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("po.milestone.progress")}</span>
            <span className="font-semibold">{paidMilestones}/{totalMilestones} {t("po.milestone.paid")}</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded text-sm">
            <div className="text-xs text-gray-500">{t("po.milestone.collected")}</div>
            <div className="font-semibold">{formatCurrency(collectedAmount)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-sm">
            <div className="text-xs text-gray-500">{t("po.milestone.totalAmount")}</div>
            <div className="font-semibold">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2">
          {percentage}% {t("po.milestone.percentageCollected")}
        </div>
      </CardContent>
    </Card>
  )
}
