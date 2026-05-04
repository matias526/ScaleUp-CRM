"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { format } from "date-fns"
import { Check, Clock } from "lucide-react"

interface POMilestonesTabProps {
  po: any
  milestones: any[]
  subtotal: number
}

export function POMilestonesTab({ po, milestones, subtotal }: POMilestonesTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)

  // Calculate milestone amounts
  const getMilestoneAmount = (percentageOrAmount: number, isPercentage: boolean) => {
    if (isPercentage) {
      return (subtotal * percentageOrAmount) / 100
    }
    return percentageOrAmount
  }

  const totalMilestoneAmount = milestones.reduce((sum, milestone) => {
    return sum + getMilestoneAmount(milestone.amount || 0, milestone.amount_type === "percentage")
  }, 0)

  const collectedAmount = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, milestone) => {
      return sum + getMilestoneAmount(milestone.amount || 0, milestone.amount_type === "percentage")
    }, 0)

  const pendingAmount = totalMilestoneAmount - collectedAmount

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.milestone.totalAmount") || "Monto Total Hitos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMilestoneAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">
              {t("po.milestone.collected") || "Recaudado"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${collectedAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-900">
              {t("po.milestone.pending") || "Pendiente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("po.detail.milestones")}</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("po.detail.noMilestones")}
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => {
                const amount = getMilestoneAmount(
                  milestone.amount || 0,
                  milestone.amount_type === "percentage"
                )
                const isCompleted = milestone.status === "paid"

                return (
                  <div
                    key={milestone.id}
                    className="border rounded-lg p-4 flex items-start justify-between"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full mt-0.5 ${
                          isCompleted
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{milestone.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {milestone.scheduled_date
                            ? format(new Date(milestone.scheduled_date), "dd/MM/yyyy")
                            : "-"}
                        </div>
                        {milestone.description && (
                          <div className="text-sm text-gray-600 mt-1">{milestone.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold">${amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {milestone.amount_type === "percentage"
                          ? `${milestone.amount}%`
                          : "Fijo"}
                      </div>
                      <div
                        className={`text-xs mt-2 px-2 py-1 rounded ${
                          isCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {isCompleted ? "Pagado" : "Pendiente"}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
