"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface LogisticsStatusWidgetProps {
  shipping: any | null
  onViewClick: () => void
}

export function LogisticsStatusWidget({ shipping, onViewClick }: LogisticsStatusWidgetProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      not_started: { label: "No Iniciado", variant: "secondary" },
      in_process: { label: "En Proceso", variant: "default" },
      shipped: { label: "Enviado", variant: "outline" },
      delivered: { label: "Entregado", variant: "default" },
    }
    return statusMap[status] || { label: "Desconocido", variant: "secondary" }
  }

  const status = shipping?.status || "not_started"
  const statusInfo = getStatusBadge(status)

  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onViewClick}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Logística
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Estado</span>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {shipping ? (
          <>
            {shipping.carrier && (
              <div className="text-sm">
                <div className="text-xs text-gray-500">Transportista</div>
                <div className="font-medium">{shipping.carrier}</div>
              </div>
            )}

            {shipping.tracking_number && (
              <div className="text-sm">
                <div className="text-xs text-gray-500">Seguimiento</div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                  {shipping.tracking_number}
                </div>
              </div>
            )}

            {shipping.estimated_delivery_date && (
              <div className="flex items-start gap-2 text-sm pt-2">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-500">Entrega Estimada</div>
                  <div className="font-medium">
                    {format(new Date(shipping.estimated_delivery_date), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            Sin información de envío
          </div>
        )}
      </CardContent>
    </Card>
  )
}
