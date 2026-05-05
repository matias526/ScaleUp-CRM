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
    <div className="space-y-3">
      {/* Shipping Status Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Estado del Envío</h3>
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
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-[10px] font-semibold text-gray-600 mt-1 text-center whitespace-nowrap">
                    {stageName}
                  </div>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-1.5 rounded ${
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
        <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-gray-600" />
          Datos de Destino
        </h3>
        
        <Card>
          <CardContent className="p-3">
            {canEditDestination && (isInProcess || !shipping) ? (
              <div className="space-y-2">
                {/* Address Row */}
                <div className="border border-gray-200 rounded p-2">
                  <div className="font-semibold text-xs text-gray-900 uppercase tracking-wider mb-2">Dirección</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">{t("po.logistics.street")}</Label>
                      <Input
                        value={destinationForm.street}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, street: e.target.value })
                        }
                        className="mt-0.5 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">Nº</Label>
                      <Input
                        value={destinationForm.street_number}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, street_number: e.target.value })
                        }
                        className="mt-0.5 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">{t("po.logistics.city")}</Label>
                      <Input
                        value={destinationForm.city}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, city: e.target.value })
                        }
                        className="mt-0.5 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">CP</Label>
                      <Input
                        value={destinationForm.zipcode}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, zipcode: e.target.value })
                        }
                        className="mt-0.5 h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-1.5">
                    <Label className="text-xs font-semibold text-gray-600">{t("po.logistics.country")}</Label>
                    <Input
                      value={destinationForm.country}
                      onChange={(e) =>
                        setDestinationForm({ ...destinationForm, country: e.target.value })
                      }
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Contact Row */}
                <div className="border border-gray-200 rounded p-2">
                  <div className="font-semibold text-xs text-gray-900 uppercase tracking-wider mb-2">Contacto</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs font-semibold text-gray-600">{t("po.logistics.contactName")}</Label>
                      <Input
                        value={destinationForm.contact_name}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, contact_name: e.target.value })
                        }
                        className="mt-0.5 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" /> Teléfono
                      </Label>
                      <Input
                        value={destinationForm.contact_phone}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, contact_phone: e.target.value })
                        }
                        className="mt-0.5 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5" /> Email
                      </Label>
                      <Input
                        type="email"
                        value={destinationForm.contact_email}
                        onChange={(e) =>
                          setDestinationForm({ ...destinationForm, contact_email: e.target.value })
                        }
                        className="mt-0.5 h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <Button
                    onClick={handleLoadLastShipping}
                    disabled={loadingLastShipping}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                  >
                    <RefreshCw className="h-2.5 w-2.5 mr-1" />
                    Cargar
                  </Button>
                  <Button onClick={handleSaveDestination} disabled={loading} size="sm" className="text-xs h-7">
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                {/* Address Display */}
                <div className="border border-gray-200 rounded p-2">
                  <div className="font-semibold text-gray-900 uppercase tracking-wider mb-1">Dirección</div>
                  <div className="text-gray-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Calle:</span> {destinationForm.street && destinationForm.street_number
                        ? `${destinationForm.street} ${destinationForm.street_number}`
                        : "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">Ciudad:</span> {destinationForm.city || "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">CP:</span> {destinationForm.zipcode || "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">País:</span> {destinationForm.country || "-"}
                    </div>
                  </div>
                </div>

                {/* Contact Display */}
                <div className="border border-gray-200 rounded p-2">
                  <div className="font-semibold text-gray-900 uppercase tracking-wider mb-1">Contacto</div>
                  <div className="text-gray-800 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="font-semibold">{destinationForm.contact_name || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5 text-gray-500" />
                      <span>{destinationForm.contact_phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-2.5 w-2.5 text-gray-500" />
                      <span>{destinationForm.contact_email || "-"}</span>
                    </div>
                  </div>
                </div>

                {isShipped && !isDelivered && canEditDestination && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full mt-2" size="sm" className="text-xs h-7">
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
          <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-gray-600" />
            Datos de Despacho
          </h3>
          
          <Card>
            <CardContent className="p-3">
              {canEditDispatch && isInProcess ? (
                <div className="space-y-2">
                  {/* Carrier Row */}
                  <div className="border border-gray-200 rounded p-2">
                    <div className="font-semibold text-xs text-gray-900 uppercase tracking-wider mb-2">Transportista</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs font-semibold text-gray-600">Transportista</Label>
                        <Input
                          value={dispatchForm.carrier}
                          onChange={(e) =>
                            setDispatchForm({ ...dispatchForm, carrier: e.target.value })
                          }
                          className="mt-0.5 h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-600">Nº Seguimiento</Label>
                        <Input
                          value={dispatchForm.tracking_number}
                          onChange={(e) =>
                            setDispatchForm({ ...dispatchForm, tracking_number: e.target.value })
                          }
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-600">Fecha Estimada</Label>
                        <Input
                          type="date"
                          value={dispatchForm.estimated_delivery_date}
                          onChange={(e) =>
                            setDispatchForm({
                              ...dispatchForm,
                              estimated_delivery_date: e.target.value,
                            })
                          }
                          className="mt-0.5 h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveDispatch} disabled={loading} className="w-full text-xs h-7">
                    Guardar
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {/* Carrier Display */}
                  <div className="border border-gray-200 rounded p-2">
                    <div className="font-semibold text-gray-900 uppercase tracking-wider mb-1">Transportista</div>
                    <div className="text-gray-800 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Transportista:</span> {dispatchForm.carrier || "-"}
                      </div>
                      <div>
                        <span className="text-gray-600">Seguimiento:</span>
                        <div className="font-mono text-xs bg-gray-50 border border-gray-200 p-1 rounded mt-0.5 text-gray-900">
                          {dispatchForm.tracking_number || "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Entrega Est.:</span> {dispatchForm.estimated_delivery_date || "-"}
                      </div>
                    </div>
                  </div>

                  {/* Package Display */}
                  <div className="border border-gray-200 rounded p-2">
                    <div className="font-semibold text-gray-900 uppercase tracking-wider mb-1">Paquete</div>
                    <div className="text-gray-800 grid grid-cols-2 gap-2 text-xs">
                      {dispatchForm.weight && <div><span className="text-gray-600">Peso:</span> {dispatchForm.weight} kg</div>}
                      {dispatchForm.dimensions && <div><span className="text-gray-600">Dimensiones:</span> {dispatchForm.dimensions}</div>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
