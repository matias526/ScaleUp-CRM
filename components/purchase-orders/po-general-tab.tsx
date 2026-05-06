"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle, Download, FileText, Calendar, User, Tabs as TabsIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MilestonesStatusWidget } from "./po-milestones-status-widget"
import { LogisticsStatusWidget } from "./po-logistics-status-widget"
import { RelatedOpportunitiesSection } from "./po-related-opportunities"
import { formatCurrency } from "@/lib/utils/format"

interface POGeneralTabProps {
  po: any
  milestones: any[]
  shipping: any | null
  opportunities: any[]
  canApprove: boolean
  onApproveClick: () => void
  onMilestonesTabClick: () => void
  onLogisticsTabClick: () => void
  getStatusBadgeColor: (status: string) => string
  approverName?: string
}

export function POGeneralTab({
  po,
  milestones,
  shipping,
  opportunities,
  canApprove,
  onApproveClick,
  onMilestonesTabClick,
  onLogisticsTabClick,
  getStatusBadgeColor,
  approverName,
}: POGeneralTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const [showApproveDialog, setShowApproveDialog] = useState(false)

  // Calculate PO status summary
  const poAmount = po.total_amount || 0
  const poStatusLabel = t(`po.status.${po.status}`) || po.status

  return (
    <div className="space-y-6">
      {/* Top Row: 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: PO Status & Total */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("po.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("po.status")}</span>
              <Badge className={getStatusBadgeColor(po.status)}>{poStatusLabel}</Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">{t("po.totalAmount")}</div>
              <div className="text-2xl font-bold">{formatCurrency(poAmount)}</div>
            </div>
            <div className="text-xs text-gray-500">
              PO #{po.purchase_order_number || po.id.slice(0, 8)}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Milestones Status */}
        <MilestonesStatusWidget milestones={milestones} onViewClick={onMilestonesTabClick} />

        {/* Card 3: Logistics Status */}
        <LogisticsStatusWidget shipping={shipping} onViewClick={onLogisticsTabClick} />
      </div>

      {/* Related Opportunities Section */}
      {opportunities && opportunities.length > 0 && (
        <RelatedOpportunitiesSection opportunities={opportunities} />
      )}

      {/* Metadata Section - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("po.detail.detailedInfo") || "Información Detallada"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Created Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="h-3.5 w-3.5" />
                {t("po.detail.createdDate") || "Fecha de Creación"}
              </div>
              <div className="font-medium text-sm">
                {po.created_at
                  ? format(new Date(po.created_at), "dd MMM yyyy", { locale: es })
                  : "-"}
              </div>
              <div className="text-xs text-gray-500">
                {po.created_at
                  ? formatDistanceToNow(new Date(po.created_at), {
                      addSuffix: true,
                      locale: es,
                    })
                  : ""}
              </div>
            </div>

            {/* Created By */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <User className="h-3.5 w-3.5" />
                Creado Por
              </div>
              <div className="font-medium text-sm">{po.created_by || "-"}</div>
            </div>

            {/* Approval Info - if exists */}
            {po.accepted_at && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    Aprobado En
                  </div>
                  <div className="font-medium text-sm">
                    {format(new Date(po.accepted_at), "dd MMM yyyy", { locale: es })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(po.accepted_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <User className="h-3.5 w-3.5" />
                    Aprobado Por
                  </div>
                  <div className="font-medium text-sm">{approverName || "-"}</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approve Section */}
      {canApprove && po.status === "sent" && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t("po.approvePO")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 mb-4">
              {t("po.detail.approveDescription") || "Revisa los detalles de la orden y apruébala para proceder con los hitos y logística."}
            </p>
            <Button
              onClick={() => setShowApproveDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("po.approvePO")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("po.approvePO")}</DialogTitle>
            <DialogDescription>
              {t("po.general.confirmApprove")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                onApproveClick()
                setShowApproveDialog(false)
              }}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
