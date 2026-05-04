"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { MapPin, Truck, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

interface POLogisticsTabProps {
  po: any
  shippings: any[]
  userRole: string
  currentUserId: string
}

export function POLogisticsTab({
  po,
  shippings,
  userRole,
  currentUserId,
}: POLogisticsTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const [loadingLastShipping, setLoadingLastShipping] = useState(false)

  const canEditDestination = ["PartnerUser", "Admin", "BDD"].includes(userRole)
  const canEditDispatch = ["TechLogistic", "Admin", "BDD"].includes(userRole)

  const handleLoadLastShipping = async () => {
    setLoadingLastShipping(true)
    try {
      // Get last shipping from this partner
      const { data } = await supabase
        .from("shippings")
        .select("*")
        .eq("partner_id", po.partner_id)
        .order("created_at", { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        toast({
          title: "Éxito",
          description: "Datos del último envío cargados",
        })
      } else {
        toast({
          title: "Info",
          description: "No hay envíos anteriores para este partner",
        })
      }
    } catch (error) {
      console.error("Error loading last shipping:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el último envío",
        variant: "destructive",
      })
    } finally {
      setLoadingLastShipping(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Destination Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("po.logistics.destination") || "Destino"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canEditDestination ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Dirección de Destino</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border rounded"
                  defaultValue={po.destination_address || ""}
                  placeholder="Ingrese la dirección"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Ciudad</label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 border rounded"
                    defaultValue={po.destination_city || ""}
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">País</label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 border rounded"
                    defaultValue={po.destination_country || ""}
                    placeholder="País"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Contacto</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border rounded"
                  defaultValue={po.destination_contact || ""}
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Dirección:</span> {po.destination_address || "-"}
              </div>
              <div>
                <span className="font-medium">Ciudad:</span> {po.destination_city || "-"}
              </div>
              <div>
                <span className="font-medium">País:</span> {po.destination_country || "-"}
              </div>
              <div>
                <span className="font-medium">Contacto:</span> {po.destination_contact || "-"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispatch Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t("po.logistics.dispatch") || "Despacho"}
            </CardTitle>
            {canEditDispatch && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLoadLastShipping}
                disabled={loadingLastShipping}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Cargar Último Envío
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {canEditDispatch ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Transportista</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border rounded"
                  defaultValue={po.carrier_name || ""}
                  placeholder="Nombre del transportista"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Número de Seguimiento</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border rounded"
                  defaultValue={po.tracking_number || ""}
                  placeholder="Número de seguimiento"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Fecha de Despacho</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 border rounded"
                    defaultValue={po.dispatch_date || ""}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha Estimada de Entrega</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 border rounded"
                    defaultValue={po.estimated_delivery_date || ""}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Transportista:</span> {po.carrier_name || "-"}
              </div>
              <div>
                <span className="font-medium">Número de Seguimiento:</span>{" "}
                {po.tracking_number || "-"}
              </div>
              <div>
                <span className="font-medium">Fecha de Despacho:</span> {po.dispatch_date || "-"}
              </div>
              <div>
                <span className="font-medium">Entrega Estimada:</span>{" "}
                {po.estimated_delivery_date || "-"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipments History */}
      {shippings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("po.detail.shipments") || "Historial de Envíos"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shippings.map((shipping) => (
                <div key={shipping.id} className="border rounded-lg p-3 text-sm">
                  <div className="font-medium">{shipping.tracking_number}</div>
                  <div className="text-gray-600">{shipping.carrier_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Estado: {shipping.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
