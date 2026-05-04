"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { format } from "date-fns"
import { CheckCircle, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface POGeneralTabProps {
  po: any
  canApprove: boolean
  onApprove: () => void
  onApproveClick: () => void
  getStatusBadgeColor: (status: string) => string
}

export function POGeneralTab({
  po,
  canApprove,
  onApproveClick,
  getStatusBadgeColor,
}: POGeneralTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const [showApproveDialog, setShowApproveDialog] = useState(false)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("po.tab.general")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PO Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 font-medium">{t("po.detail.status")}</div>
              <div className="mt-2">
                <Badge className={getStatusBadgeColor(po.status)}>
                  {t(`po.status.${po.status}`)}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">{t("po.detail.createdDate")}</div>
              <div className="mt-2 text-sm">
                {po.created_at ? format(new Date(po.created_at), "dd/MM/yyyy HH:mm") : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">{t("po.detail.createdBy")}</div>
              <div className="mt-2 text-sm">{po.created_by || "-"}</div>
            </div>
            {po.accepted_at && (
              <>
                <div>
                  <div className="text-sm text-gray-600 font-medium">
                    {t("po.detail.approvedDate")}
                  </div>
                  <div className="mt-2 text-sm">
                    {format(new Date(po.accepted_at), "dd/MM/yyyy HH:mm")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 font-medium">
                    {t("po.detail.approvedBy")}
                  </div>
                  <div className="mt-2 text-sm">{po.accepted_by || "-"}</div>
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
            <CardTitle className="text-green-900 text-base">{t("po.approvePO")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 mb-4">
              Aprueba esta orden de compra para proceder con el flujo. Esto marcará la oportunidad
              como "ganada" y actualizará el estado de la PO a aceptada.
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
              ¿Estás seguro de que deseas aprobar esta orden de compra? Esta acción no puede ser
              revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                onApproveClick()
                setShowApproveDialog(false)
              }}
            >
              Confirmar Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
