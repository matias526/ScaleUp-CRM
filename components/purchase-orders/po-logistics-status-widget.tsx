"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, CheckCircle, Clock, Package } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface LogisticsStatusWidgetProps {
  shipping: any | null
  onViewClick: () => void
}

export function LogisticsStatusWidget({ shipping, onViewClick }: LogisticsStatusWidgetProps) {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: any; bgColor: string }
    > = {
      not_started: {
        label: "No Iniciado",
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        icon: Package,
      },
      in_process: {
        label: "En Proceso",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        icon: Clock,
      },
      shipped: { label: "Enviado", color: "text-amber-600", bgColor: "bg-amber-100", icon: Truck },
      delivered: {
        label: "Entregado",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
        icon: CheckCircle,
      },
    }
    return statusMap[status] || statusMap["not_started"]
  }

  const status = shipping?.status || "not_started"
  const statusConfig = getStatusConfig(status)
  const StatusIcon = statusConfig.icon

  // Progress visualization
  const statusSequence = ["not_started", "in_process", "shipped", "delivered"]
  const currentIndex = statusSequence.indexOf(status)
  const progressPercent = ((currentIndex + 1) / statusSequence.length) * 100

  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onViewClick}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Logística
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase font-bold">Progreso</span>
            <span className="text-xs font-semibold text-gray-600">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                status === "delivered"
                  ? "bg-emerald-500"
                  : status === "shipped"
                    ? "bg-amber-500"
                    : status === "in_process"
                      ? "bg-blue-500"
                      : "bg-gray-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Status Badge with Icon */}
        <div className="flex items-center gap-3">
          <div className={`${statusConfig.bgColor} p-2.5 rounded-lg`}>
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Estado</div>
            <div className={`text-sm font-semibold ${statusConfig.color}`}>{statusConfig.label}</div>
          </div>
        </div>

        {shipping ? (
          <>
            {shipping.carrier && (
              <div className="text-sm border-t pt-3">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Transportista</div>
                <div className="font-semibold text-gray-900">{shipping.carrier}</div>
              </div>
            )}

            {shipping.tracking_number && (
              <div className="text-sm">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Número de Seguimiento</div>
                <div className="font-mono text-xs bg-gray-50 border border-gray-200 p-2 rounded font-semibold text-gray-700">
                  {shipping.tracking_number}
                </div>
              </div>
            )}

            {shipping.estimated_delivery_date && (
              <div className="text-sm bg-gradient-to-r from-blue-50 to-transparent p-3 rounded-lg border border-blue-100">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Entrega Estimada</div>
                <div className="font-semibold text-gray-900">
                  {format(new Date(shipping.estimated_delivery_date), "dd MMM yyyy", {
                    locale: es,
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500 text-center py-6 border-t">
            Sin información de envío
          </div>
        )}
      </CardContent>
    </Card>
  )
}
