"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Building,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  FileText,
  Tag,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getCountryName, getDaysSince } from "@/lib/utils/country-utils"
import { formatCurrency } from "@/lib/utils"
import type { OpportunityWithRelations } from "@/lib/services/opportunity-service"

interface OpportunityDetailDialogProps {
  opportunity: OpportunityWithRelations | null
  open: boolean
  onClose: () => void
}

export function OpportunityDetailDialog({ opportunity, open, onClose }: OpportunityDetailDialogProps) {
  if (!opportunity) return null

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No definida"
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  // Determinar si la oportunidad ha tenido cambios recientes (última semana)
  const hasRecentChanges = (opportunity: any) => {
    if (!opportunity || !opportunity.updated_at) return false
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return new Date(opportunity.updated_at) > lastWeek
  }

  const daysSinceCreation = getDaysSince(opportunity.created_at)
  const daysSinceUpdate = getDaysSince(opportunity.updated_at)

  // Calcular días hasta la fecha estimada de cierre
  const daysUntilClose = opportunity.expected_close_date
    ? Math.ceil((new Date(opportunity.expected_close_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col space-y-1 text-sm font-medium text-gray-700">
              <span>Oportunidad abierta hace {daysSinceCreation} días</span>
              <span>Último cambio hace {daysSinceUpdate} días</span>
            </div>
            <div className="flex space-x-2">
              {hasRecentChanges(opportunity) ? (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Actualizada
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                  <Clock className="h-3 w-3 mr-1" />
                  Sin cambios
                </Badge>
              )}

              {opportunity.validation_status === "validated" ? (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Validada
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              )}

              {opportunity.stage?.code && (
                <Badge
                  variant="outline"
                  className={
                    opportunity.stage.code === "won"
                      ? "bg-green-100 text-green-800"
                      : opportunity.stage.code === "lost"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                  }
                >
                  {opportunity.stage.code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              )}
            </div>
          </div>

          <DialogTitle className="text-2xl">
            {opportunity.name || opportunity.title}
            {opportunity.end_customer && ` - ${opportunity.end_customer.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Descripción */}
          <div className="space-y-2">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <h3 className="text-lg font-semibold">Descripción</h3>
            </div>
            <div className="p-4 bg-gray-50 rounded-md text-sm">{opportunity.description || "Sin descripción"}</div>
          </div>

          {/* Detalles principales */}
          <div className="space-y-2">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <h3 className="text-lg font-semibold">Detalles</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">Cliente final:</span>
                </div>
                <div className="text-sm pl-6">
                  <span>{opportunity.end_customer?.name || "No especificado"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">País:</span>
                </div>
                <div className="text-sm pl-6">
                  <span>{getCountryName(opportunity.country) || "No especificado"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">Fecha estimada de cierre:</span>
                </div>
                <div className="text-sm pl-6">
                  <span>
                    {formatDate(opportunity.expected_close_date)}
                    {daysUntilClose !== null && daysUntilClose >= 0 && (
                      <span className="ml-1 text-gray-500">(en {daysUntilClose} días)</span>
                    )}
                    {daysUntilClose !== null && daysUntilClose < 0 && (
                      <span className="ml-1 text-red-500">(hace {Math.abs(daysUntilClose)} días)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">Responsable del Partner:</span>
                </div>
                <div className="text-sm pl-6">
                  <span>{opportunity.partner_responsible || "No asignado"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">Valor estimado:</span>
                </div>
                <div className="text-sm pl-6">
                  <span>{formatCurrency(opportunity.estimated_value)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campos técnicos - Si están disponibles */}
          {opportunity.tech_fields && opportunity.tech_fields.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold">Campos técnicos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                {opportunity.tech_fields.map((field: any) => (
                  <div key={field.id} className="space-y-1">
                    <div className="text-xs text-gray-500">{field.field_info?.field_name || "Campo"}:</div>
                    <div className="text-sm bg-white p-2 rounded">
                      {field.value_text ||
                        field.value_numeric?.toString() ||
                        (field.value_boolean !== null ? (field.value_boolean ? "Sí" : "No") : "") ||
                        (field.value_date ? formatDate(field.value_date) : "") ||
                        "No especificado"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OpportunityDetailDialog
