"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "@/hooks/use-translations"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MapPin, Truck, RefreshCw } from "lucide-react"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"

interface POLogisticsTabProps {
  po: any
  userRole: string
  currentUserId: string
}

export function POLogisticsTab({
  po,
  userRole,
  currentUserId,
}: POLogisticsTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const supabase = createClient()
  const { userInfo } = useAuth()

  // State
  const [shipping, setShipping] = useState<any>(null)
  const [destinationForm, setDestinationForm] = useState({
    street: "",
    street_number: "",
    city: "",
    country: "",
    zipcode: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  })
  const [dispatchForm, setDispatchForm] = useState({
    carrier: "",
    tracking_number: "",
    weight: "",
    dimensions: "",
    estimated_delivery_date: "",
  })
  const [loading, setLoading] = useState(false)
  const [loadingLastShipping, setLoadingLastShipping] = useState(false)

  // Permissions
  const canEditDestination = ["PartnerUser", "Admin", "BDD"].includes(userRole)
  const canEditDispatch = ["TechUser", "TechLogistic", "Admin", "BDD"].includes(userRole)
  const isPartner = userRole === "PartnerUser"

  // Load shipping on mount
  useEffect(() => {
    loadShipping()
  }, [po.id])

  const loadShipping = async () => {
    try {
      const { data } = await supabase
        .from("shippings")
        .select("*")
        .eq("po_id", po.id)
        .maybeSingle()

      if (data) {
        setShipping(data)
        setDestinationForm({
          street: data.street || "",
          street_number: data.street_number || "",
          city: data.city || "",
          country: data.country || "",
          zipcode: data.zipcode || "",
          contact_name: data.contact_name || "",
          contact_phone: data.contact_phone || "",
          contact_email: data.contact_email || "",
        })
        setDispatchForm({
          carrier: data.carrier || "",
          tracking_number: data.tracking_number || "",
          weight: data.total_weight || "",
          dimensions: data.dimensions || "",
          estimated_delivery_date: data.estimated_delivery_date || "",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading shipping:", error)
    }
  }

  // Create note for shipping updates
  const createShippingNote = async (noteType: "destination" | "dispatch", dataChanges: any) => {
    try {
      const userName = userInfo ? `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim() : "Usuario"
      const noteTypeLabel = noteType === "destination" ? "Destino" : "Despacho"
      
      let content = `${userName} ha cargado datos de ${noteTypeLabel}`
      
      // Add data summary
      const dataEntries = Object.entries(dataChanges)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
      
      if (dataEntries) {
        content += `\n${dataEntries}`
      }

      const { error } = await supabase
        .from("notes")
        .insert([
          {
            purchase_order_id: po.id,
            user_id: currentUserId,
            content: content,
            is_private: false,
          },
        ])

      if (error) {
        console.error("[v0] Error creating note:", error)
      }
    } catch (error) {
      console.error("[v0] Error in createShippingNote:", error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "preparing":
      case "in_process":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    if (!status) return t("po.logistics.notStarted")
    switch (status.toLowerCase()) {
      case "preparing":
      case "in_process":
        return t("po.logistics.inProcess")
      case "shipped":
        return t("po.logistics.shipped")
      case "delivered":
        return t("po.logistics.delivered")
      default:
        return status
    }
  }

  const handleLoadLastShipping = async () => {
    setLoadingLastShipping(true)
    try {
      const { data } = await supabase
        .from("shippings")
        .select("*")
        .eq("po_id", po.id)
        .neq("id", shipping?.id || "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setDestinationForm({
          street: data.street || "",
          street_number: data.street_number || "",
          city: data.city || "",
          country: data.country || "",
          zipcode: data.zipcode || "",
          contact_name: data.contact_name || "",
          contact_phone: data.contact_phone || "",
          contact_email: data.contact_email || "",
        })
        toast({
          title: t("common.success"),
          description: t("po.logistics.lastShippingLoaded"),
        })
      } else {
        toast({
          title: "Info",
          description: t("po.logistics.noLastShipping"),
        })
      }
    } catch (error) {
      console.error("[v0] Error loading last shipping:", error)
      toast({
        title: t("common.error"),
        description: "Error al cargar último envío",
        variant: "destructive",
      })
    } finally {
      setLoadingLastShipping(false)
    }
  }

  const handleSaveDestination = async () => {
    setLoading(true)
    try {
      if (!shipping) {
        // Create new shipping record
        const { data: newShipping, error } = await supabase
          .from("shippings")
          .insert([
            {
              po_id: po.id,
              ...destinationForm,
              status: "in_process",
            },
          ])
          .select()
          .single()

        if (error) throw error

        setShipping(newShipping)
        toast({
          title: t("common.success"),
          description: t("po.logistics.destinationDataSaved"),
        })
      } else if (shipping.status !== "shipped") {
        // Update existing record if not shipped
        const { error } = await supabase
          .from("shippings")
          .update(destinationForm)
          .eq("id", shipping.id)

      if (error) throw error

      setShipping({ ...shipping, ...destinationForm })
      
      // Create note
      await createShippingNote("destination", {
        "Calle": destinationForm.street,
        "Número": destinationForm.street_number,
        "Ciudad": destinationForm.city,
        "País": destinationForm.country,
        "CP": destinationForm.zipcode,
        "Contacto": destinationForm.contact_name,
      })
      
      toast({
        title: t("common.success"),
        description: t("po.logistics.destinationDataSaved"),
      })
      }
    } catch (error) {
      console.error("[v0] Error saving destination:", error)
      toast({
        title: t("common.error"),
        description: "Error al guardar datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDispatch = async () => {
    if (!shipping || shipping.status !== "in_process") {
      toast({
        title: "Info",
        description: "Solo puedes guardar despacho si el envío está en proceso",
      })
      return
    }

    setLoading(true)
    try {
      const newStatus = dispatchForm.tracking_number ? "shipped" : "in_process"

      const { error } = await supabase
        .from("shippings")
        .update({
          carrier: dispatchForm.carrier,
          tracking_number: dispatchForm.tracking_number,
          total_weight: dispatchForm.weight,
          dimensions: dispatchForm.dimensions,
          estimated_delivery_date: dispatchForm.estimated_delivery_date,
          status: newStatus,
          actual_shipped_at: newStatus === "shipped" ? new Date().toISOString() : null,
        })
        .eq("id", shipping.id)

      if (error) throw error

      const updatedShipping = { ...shipping, ...dispatchForm, status: newStatus }
      setShipping(updatedShipping)

      // Create note
      await createShippingNote("dispatch", {
        "Transportista": dispatchForm.carrier,
        "Número de Seguimiento": dispatchForm.tracking_number,
        "Peso": dispatchForm.weight,
        "Dimensiones": dispatchForm.dimensions,
        "Entrega Estimada": dispatchForm.estimated_delivery_date,
      })

      toast({
        title: t("common.success"),
        description: t("po.logistics.dispatchDataSaved"),
      })
    } catch (error) {
      console.error("[v0] Error saving dispatch:", error)
      toast({
        title: t("common.error"),
        description: "Error al guardar despacho",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsReceived = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("shippings")
        .update({
          status: "delivered",
        })
        .eq("id", shipping.id)

      if (error) throw error

      setShipping({ ...shipping, status: "delivered" })
      
      // Create note for mark as received
      const userName = userInfo ? `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim() : "Usuario"
      const { error: noteError } = await supabase
        .from("notes")
        .insert([
          {
            purchase_order_id: po.id,
            user_id: currentUserId,
            content: `${userName} ha marcado el envío como recibido`,
            is_private: false,
          },
        ])
      
      if (noteError) {
        console.error("[v0] Error creating note:", noteError)
      }
      
      toast({
        title: t("common.success"),
        description: t("po.logistics.markedAsReceived"),
      })
    } catch (error) {
      console.error("[v0] Error marking as received:", error)
      toast({
        title: t("common.error"),
        description: "Error al marcar como recibido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isShipped = shipping?.status === "shipped"
  const isInProcess = shipping?.status === "in_process"
  const isDelivered = shipping?.status === "delivered"

  return (
    <div className="space-y-6">
      {/* Shipping Status Legend */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{t("po.logistics.shippingStatus")}:</span>
        <Badge className={getStatusBadgeColor(shipping?.status || "")}>
          {getStatusLabel(shipping?.status || "")}
        </Badge>
      </div>

      {/* Section A: Destination Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("po.logistics.destinationData")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canEditDestination && isInProcess ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("po.logistics.street")}</Label>
                  <Input
                    value={destinationForm.street}
                    onChange={(e) =>
                      setDestinationForm({ ...destinationForm, street: e.target.value })
                    }
                    placeholder={t("po.logistics.street")}
                  />
                </div>
                <div>
                  <Label>{t("po.logistics.streetNumber")}</Label>
                  <Input
                    value={destinationForm.street_number}
                    onChange={(e) =>
                      setDestinationForm({ ...destinationForm, street_number: e.target.value })
                    }
                    placeholder={t("po.logistics.streetNumber")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("po.logistics.city")}</Label>
                  <Input
                    value={destinationForm.city}
                    onChange={(e) =>
                      setDestinationForm({ ...destinationForm, city: e.target.value })
                    }
                    placeholder={t("po.logistics.city")}
                  />
                </div>
                <div>
                  <Label>{t("po.logistics.country")}</Label>
                  <Input
                    value={destinationForm.country}
                    onChange={(e) =>
                      setDestinationForm({ ...destinationForm, country: e.target.value })
                    }
                    placeholder={t("po.logistics.country")}
                  />
                </div>
              </div>

              <div>
                <Label>{t("po.logistics.zipcode")}</Label>
                <Input
                  value={destinationForm.zipcode}
                  onChange={(e) =>
                    setDestinationForm({ ...destinationForm, zipcode: e.target.value })
                  }
                  placeholder={t("po.logistics.zipcode")}
                />
              </div>

              <hr />

              <div>
                <Label>{t("po.logistics.contactName")}</Label>
                <Input
                  value={destinationForm.contact_name}
                  onChange={(e) =>
                    setDestinationForm({ ...destinationForm, contact_name: e.target.value })
                  }
                  placeholder={t("po.logistics.contactName")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("po.logistics.contactPhone")}</Label>
                  <Input
                    value={destinationForm.contact_phone}
                    onChange={(e) =>
                      setDestinationForm({ ...destinationForm, contact_phone: e.target.value })
                    }
                    placeholder={t("po.logistics.contactPhone")}
                  />
                </div>
                <div>
                  <Label>{t("po.logistics.contactEmail")}</Label>
                  <Input
                    type="email"
                    value={destinationForm.contact_email}
                    onChange={(e) =>
                      setDestinationForm({ ...destinationForm, contact_email: e.target.value })
                    }
                    placeholder={t("po.logistics.contactEmail")}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleLoadLastShipping}
                  disabled={loadingLastShipping}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("po.logistics.loadLastShipping")}
                </Button>
                <Button onClick={handleSaveDestination} disabled={loading}>
                  {t("po.logistics.saveDestinationData")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">{t("po.logistics.street")}:</span> {destinationForm.street || "-"}
              </div>
              <div>
                <span className="font-semibold">{t("po.logistics.streetNumber")}:</span> {destinationForm.street_number || "-"}
              </div>
              <div>
                <span className="font-semibold">{t("po.logistics.city")}:</span> {destinationForm.city || "-"}
              </div>
              <div>
                <span className="font-semibold">{t("po.logistics.country")}:</span> {destinationForm.country || "-"}
              </div>
              <div>
                <span className="font-semibold">{t("po.logistics.zipcode")}:</span> {destinationForm.zipcode || "-"}
              </div>
              <hr />
              <div>
                <span className="font-semibold">{t("po.logistics.contactName")}:</span> {destinationForm.contact_name || "-"}
              </div>
              <div>
                <span className="font-semibold">{t("po.logistics.contactPhone")}:</span> {destinationForm.contact_phone || "-"}
              </div>
              <div>
                <span className="font-semibold">{t("po.logistics.contactEmail")}:</span> {destinationForm.contact_email || "-"}
              </div>

              {isShipped && canEditDestination && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="mt-4">
                      {t("po.logistics.markAsReceived")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("po.logistics.markAsReceived")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Confirmar que el envío ha sido recibido? Esto cambiará el estado a Finalizado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleMarkAsReceived} disabled={loading}>
                        {t("common.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B: Dispatch Data */}
      {(isInProcess || isShipped || isDelivered) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t("po.logistics.dispatchData")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canEditDispatch && isInProcess ? (
              <div className="space-y-4">
                <div>
                  <Label>{t("po.logistics.carrier")}</Label>
                  <Input
                    value={dispatchForm.carrier}
                    onChange={(e) =>
                      setDispatchForm({ ...dispatchForm, carrier: e.target.value })
                    }
                    placeholder={t("po.logistics.carrier")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("po.logistics.weight")}</Label>
                    <Input
                      type="number"
                      value={dispatchForm.weight}
                      onChange={(e) =>
                        setDispatchForm({ ...dispatchForm, weight: e.target.value })
                      }
                      placeholder={t("po.logistics.weight")}
                    />
                  </div>
                  <div>
                    <Label>{t("po.logistics.dimensions")}</Label>
                    <Input
                      value={dispatchForm.dimensions}
                      onChange={(e) =>
                        setDispatchForm({ ...dispatchForm, dimensions: e.target.value })
                      }
                      placeholder="ej: 50x30x20 cm"
                    />
                  </div>
                </div>

                <div>
                  <Label>{t("po.logistics.trackingNumber")}</Label>
                  <Input
                    value={dispatchForm.tracking_number}
                    onChange={(e) =>
                      setDispatchForm({ ...dispatchForm, tracking_number: e.target.value })
                    }
                    placeholder={t("po.logistics.trackingNumber")}
                  />
                </div>

                <div>
                  <Label>{t("po.logistics.estimatedDeliveryDate")}</Label>
                  <Input
                    type="date"
                    value={dispatchForm.estimated_delivery_date}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        estimated_delivery_date: e.target.value,
                      })
                    }
                  />
                </div>

                <Button onClick={handleSaveDispatch} disabled={loading} className="w-full">
                  {t("po.logistics.saveDispatchData")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">{t("po.logistics.carrier")}:</span> {dispatchForm.carrier || "-"}
                </div>
                <div>
                  <span className="font-semibold">{t("po.logistics.weight")}:</span> {dispatchForm.weight || "-"}
                </div>
                <div>
                  <span className="font-semibold">{t("po.logistics.dimensions")}:</span> {dispatchForm.dimensions || "-"}
                </div>
                <div>
                  <span className="font-semibold">{t("po.logistics.trackingNumber")}:</span> {dispatchForm.tracking_number || "-"}
                </div>
                <div>
                  <span className="font-semibold">{t("po.logistics.estimatedDeliveryDate")}:</span> {dispatchForm.estimated_delivery_date || "-"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
