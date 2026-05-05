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
import { MapPin, Truck, RefreshCw, Phone, Mail, Package, Calendar, Gauge } from "lucide-react"
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
      // Validate required fields
      if (!po.partner_id || !po.tech_company_id) {
        toast({
          title: "Error",
          description: "Faltan datos de partner o tech company",
          variant: "destructive",
        })
        setLoadingLastShipping(false)
        return
      }

      // First, get all POs for this partner and tech company (excluding current)
      const { data: posData, error: posError } = await supabase
        .from("purchase_orders")
        .select("id")
        .eq("partner_id", po.partner_id)
        .eq("tech_company_id", po.tech_company_id)
        .neq("id", po.id)
        .order("created_at", { ascending: false })

      if (posError) throw posError

      if (!posData || posData.length === 0) {
        toast({
          title: "Info",
          description: t("po.logistics.noLastShipping"),
        })
        setLoadingLastShipping(false)
        return
      }

      const poIds = posData.map(p => p.id)

      // Then get the latest shipping from those POs
      const { data: shippingData, error: shippingError } = await supabase
        .from("shippings")
        .select("*")
        .in("po_id", poIds)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (shippingError) throw shippingError

      if (shippingData) {
        setDestinationForm({
          street: shippingData.street || "",
          street_number: shippingData.street_number || "",
          city: shippingData.city || "",
          country: shippingData.country || "",
          zipcode: shippingData.zipcode || "",
          contact_name: shippingData.contact_name || "",
          contact_phone: shippingData.contact_phone || "",
          contact_email: shippingData.contact_email || "",
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
      {/* Shipping Status Timeline */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Estado del Envío</h3>
          <Badge className={getStatusBadgeColor(shipping?.status || "")}>
            {getStatusLabel(shipping?.status || "")}
          </Badge>
        </div>
        
        {/* Progress Timeline */}
        <div className="flex items-center justify-between">
          {["not_started", "in_process", "shipped", "delivered"].map((stage, index) => {
            const isActive = ["not_started", "in_process", "shipped", "delivered"].indexOf(shipping?.status || "not_started") >= index
            const stageName = stage === "not_started" ? "No Iniciado" : stage === "in_process" ? "En Proceso" : stage === "shipped" ? "Enviado" : "Entregado"
            
            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-xs font-semibold text-gray-600 mt-2 text-center whitespace-nowrap">
                    {stageName}
                  </div>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      isActive ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section A: Destination Data */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Datos de Destino
        </h3>
        
        <Card>
          <CardContent className="p-6">
            {canEditDestination && (isInProcess || !shipping) ? (
              <div className="space-y-5">
                {/* Address Section */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-4">Dirección</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600">{t("po.logistics.street")}</Label>
                      <Input
                        value={destinationForm.street}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, street: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600">{t("po.logistics.streetNumber")}</Label>
                      <Input
                        value={destinationForm.street_number}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, street_number: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600">{t("po.logistics.city")}</Label>
                      <Input
                        value={destinationForm.city}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, city: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600">{t("po.logistics.country")}</Label>
                      <Input
                        value={destinationForm.country}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, country: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600">{t("po.logistics.zipcode")}</Label>
                      <Input
                        value={destinationForm.zipcode}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, zipcode: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-4">Contacto</h4>
                  <div>
                    <Label className="text-xs uppercase font-bold text-gray-600">{t("po.logistics.contactName")}</Label>
                    <Input
                      value={destinationForm.contact_name}
                      onChange={(e) =>
                        setDestinationForm({ ...destinationForm, contact_name: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {t("po.logistics.contactPhone")}
                      </Label>
                      <Input
                        value={destinationForm.contact_phone}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, contact_phone: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {t("po.logistics.contactEmail")}
                      </Label>
                      <Input
                        type="email"
                        value={destinationForm.contact_email}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, contact_email: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleLoadLastShipping}
                    disabled={loadingLastShipping}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Cargar Último
                  </Button>
                  <Button onClick={handleSaveDestination} disabled={loading} size="sm">
                    Guardar Destino
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Address Display Card */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Dirección</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>
                      {destinationForm.street && destinationForm.street_number
                        ? `${destinationForm.street} ${destinationForm.street_number}`
                        : "-"}
                    </div>
                    <div>
                      {[destinationForm.zipcode, destinationForm.city, destinationForm.country]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </div>
                  </div>
                </div>

                {/* Contact Display Card */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Contacto</h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="font-semibold">{destinationForm.contact_name || "-"}</div>
                    {destinationForm.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-500" />
                        <span>{destinationForm.contact_phone}</span>
                      </div>
                    )}
                    {destinationForm.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-500" />
                        <span>{destinationForm.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isShipped && !isDelivered && canEditDestination && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full mt-2" size="sm">
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
      </div>

      {/* Section B: Dispatch Data */}
      {(isInProcess || isShipped || isDelivered) && (
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            Datos de Despacho
          </h3>
          
          <Card>
            <CardContent className="p-6">
              {canEditDispatch && isInProcess ? (
                <div className="space-y-5">
                  {/* Carrier & Tracking Section */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-4">Transportista</h4>
                    <div>
                      <Label className="text-xs uppercase font-bold text-gray-600">Transportista</Label>
                      <Input
                        value={dispatchForm.carrier}
                        onChange={(e) =>
                          setDispatchForm({ ...dispatchForm, carrier: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="mt-3">
                      <Label className="text-xs uppercase font-bold text-gray-600">Número de Seguimiento</Label>
                      <Input
                        value={dispatchForm.tracking_number}
                        onChange={(e) =>
                          setDispatchForm({ ...dispatchForm, tracking_number: e.target.value })
                        }
                        className="mt-1 font-mono"
                      />
                    </div>
                  </div>

                  {/* Package Info Section */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-4">Paquete</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs uppercase font-bold text-gray-600 flex items-center gap-1">
                          <Gauge className="h-3 w-3" /> Peso (kg)
                        </Label>
                        <Input
                          type="number"
                          value={dispatchForm.weight}
                          onChange={(e) =>
                            setDispatchForm({ ...dispatchForm, weight: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase font-bold text-gray-600">Dimensiones</Label>
                        <Input
                          value={dispatchForm.dimensions}
                          onChange={(e) =>
                            setDispatchForm({ ...dispatchForm, dimensions: e.target.value })
                          }
                          placeholder="ej: 50x30x20"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Date Section */}
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                    <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Entrega</h4>
                    <Label className="text-xs uppercase font-bold text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Fecha Estimada
                    </Label>
                    <Input
                      type="date"
                      value={dispatchForm.estimated_delivery_date}
                      onChange={(e) =>
                        setDispatchForm({
                          ...dispatchForm,
                          estimated_delivery_date: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  <Button onClick={handleSaveDispatch} disabled={loading} className="w-full">
                    Guardar Despacho
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Carrier Display Card */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Transportista</h4>
                    <div className="text-sm text-gray-700">
                      <div className="font-semibold">{dispatchForm.carrier || "-"}</div>
                      {dispatchForm.tracking_number && (
                        <div className="font-mono text-xs bg-white border border-emerald-200 p-2 rounded mt-2 text-gray-900">
                          {dispatchForm.tracking_number}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Package Display Card */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Paquete</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {dispatchForm.weight && <div>Peso: {dispatchForm.weight} kg</div>}
                      {dispatchForm.dimensions && <div>Dimensiones: {dispatchForm.dimensions}</div>}
                    </div>
                  </div>

                  {/* Delivery Display Card */}
                  {dispatchForm.estimated_delivery_date && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                      <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Entrega</h4>
                      <div className="text-sm text-gray-700 font-semibold">
                        {dispatchForm.estimated_delivery_date}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
