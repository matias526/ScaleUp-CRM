"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Download, Edit2, Trash2 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"

interface Quote {
  id: string
  opportunity_id: string
  quote_number: string
  quote_date: string | null
  status: string | null
  items: any[] | null
  notes: string | null
  subtotal_amount: number | null
  general_discount_amount: number | null
  shipping_amount: number | null
  total_amount: number | null
  technical_quote_url: string | null
  economical_quote_url: string | null
  expiration_date: string | null
  version: number | null
  created_at: string | null
  updated_at: string | null
}

interface QuoteItem {
  sku: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  line_subtotal: number
  line_discount_amount: number
  line_total: number
}

interface OpportunityQuotesProps {
  opportunityId: string
  lang: "es" | "en" | "pt"
  userRole: string
}

const ALLOWED_ROLES_REQUEST = ["Admin", "BDD", "PartnerUser"]
const ALLOWED_ROLES_EDIT = ["Admin", "BDD", "TechUser"]
const QUOTE_STATUS_BADGE: Record<string, { label: string; bgColor: string; textColor: string }> = {
  requested: { label: "Solicitada", bgColor: "bg-blue-100", textColor: "text-blue-800" },
  offered: { label: "Ofertada", bgColor: "bg-green-100", textColor: "text-green-800" },
  accepted: { label: "Aceptada", bgColor: "bg-purple-100", textColor: "text-purple-800" },
  rejected: { label: "Rechazada", bgColor: "bg-red-100", textColor: "text-red-800" },
}

export function OpportunityQuotes({ opportunityId, lang, userRole }: OpportunityQuotesProps) {
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Create modal state
  const [createFormData, setCreateFormData] = useState({
    notes: "",
    items: [] as QuoteItem[],
    itemDescription: "",
    itemQuantity: 1,
  })

  // Edit modal state
  const [editFormData, setEditFormData] = useState({
    items: [] as QuoteItem[],
    notes: "",
    general_discount_amount: 0,
    shipping_amount: 0,
    technical_file: null as File | null,
    economical_file: null as File | null,
  })

  // Load quotes
  useEffect(() => {
    loadQuotes()
  }, [opportunityId])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setQuotes(data || [])
    } catch (err) {
      console.error("Error loading quotes:", err)
      toast({
        title: "Error",
        description: "No se pudieron cargar las quotes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateLineTotal = (item: Partial<QuoteItem>): number => {
    if (!item.quantity || !item.unit_price) return 0
    const subtotal = item.quantity * item.unit_price
    const discountPercent = item.discount_percent || 0
    return subtotal * (1 - discountPercent / 100)
  }

  const calculateTotals = (items: QuoteItem[], discountAmount: number, shippingAmount: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0)
    return {
      subtotal_amount: subtotal,
      general_discount_amount: discountAmount,
      shipping_amount: shippingAmount,
      total_amount: subtotal - discountAmount + shippingAmount,
    }
  }

  const handleAddQuoteItem = () => {
    if (!createFormData.itemDescription.trim()) {
      toast({
        title: "Error",
        description: "Debes ingresar una descripción",
        variant: "destructive",
      })
      return
    }

    const newItem: QuoteItem = {
      sku: `SKU-${Date.now()}`,
      description: createFormData.itemDescription,
      quantity: createFormData.itemQuantity,
      unit_price: 0,
      discount_percent: 0,
      line_subtotal: 0,
      line_discount_amount: 0,
      line_total: 0,
    }

    setCreateFormData({
      ...createFormData,
      items: [...createFormData.items, newItem],
      itemDescription: "",
      itemQuantity: 1,
    })
  }

  const handleRemoveQuoteItem = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData({
        ...editFormData,
        items: editFormData.items.filter((_, i) => i !== index),
      })
    } else {
      setCreateFormData({
        ...createFormData,
        items: createFormData.items.filter((_, i) => i !== index),
      })
    }
  }

  const handleSaveQuote = async () => {
    if (createFormData.items.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un item",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const quoteNumber = `Q-${Date.now()}`
      const totals = calculateTotals(createFormData.items, 0, 0)

      const { error } = await supabase.from("quotes").insert([
        {
          id: uuidv4(),
          opportunity_id: opportunityId,
          quote_number: quoteNumber,
          quote_date: new Date().toISOString(),
          status: "requested",
          items: createFormData.items,
          notes: createFormData.notes,
          ...totals,
          version: 1,
        },
      ])

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Quote solicitada correctamente",
      })

      setShowCreateModal(false)
      setCreateFormData({
        notes: "",
        items: [],
        itemDescription: "",
        itemQuantity: 1,
      })
      await loadQuotes()
    } catch (err) {
      console.error("Error saving quote:", err)
      toast({
        title: "Error",
        description: "No se pudo guardar la quote",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveEditQuote = async () => {
    if (!selectedQuote) return

    try {
      setIsSaving(true)

      let technicalUrl = selectedQuote.technical_quote_url
      let economicalUrl = selectedQuote.economical_quote_url

      // Upload technical file if provided
      if (editFormData.technical_file) {
        const { data, error } = await supabase.storage
          .from("quotes")
          .upload(
            `${opportunityId}/${selectedQuote.id}/technical_${Date.now()}.pdf`,
            editFormData.technical_file,
            { upsert: true }
          )

        if (error) throw error
        const { data: signedUrl } = await supabase.storage
          .from("quotes")
          .createSignedUrl(data.path, 86400 * 7) // 7 days

        technicalUrl = signedUrl.signedUrl
      }

      // Upload economical file if provided
      if (editFormData.economical_file) {
        const { data, error } = await supabase.storage
          .from("quotes")
          .upload(
            `${opportunityId}/${selectedQuote.id}/economical_${Date.now()}.pdf`,
            editFormData.economical_file,
            { upsert: true }
          )

        if (error) throw error
        const { data: signedUrl } = await supabase.storage
          .from("quotes")
          .createSignedUrl(data.path, 86400 * 7) // 7 days

        economicalUrl = signedUrl.signedUrl
      }

      if (!economicalUrl) {
        toast({
          title: "Error",
          description: "La Oferta Económica es obligatoria",
          variant: "destructive",
        })
        return
      }

      const totals = calculateTotals(
        editFormData.items,
        editFormData.general_discount_amount,
        editFormData.shipping_amount
      )

      const { error } = await supabase
        .from("quotes")
        .update({
          items: editFormData.items,
          notes: editFormData.notes,
          ...totals,
          technical_quote_url: technicalUrl,
          economical_quote_url: economicalUrl,
          status: "offered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedQuote.id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Quote actualizada correctamente",
      })

      setShowEditModal(false)
      await loadQuotes()
    } catch (err) {
      console.error("Error updating quote:", err)
      toast({
        title: "Error",
        description: "No se pudo actualizar la quote",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta quote?")) return

    try {
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Quote eliminada correctamente",
      })

      await loadQuotes()
    } catch (err) {
      console.error("Error deleting quote:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar la quote",
        variant: "destructive",
      })
    }
  }

  const handleDownloadFile = async (fileUrl: string | null) => {
    if (!fileUrl) return

    try {
      window.open(fileUrl, "_blank")
    } catch (err) {
      console.error("Error downloading file:", err)
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0.00"
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("es-AR")
  }

  const canRequestQuote = ALLOWED_ROLES_REQUEST.includes(userRole)
  const canEditQuote = ALLOWED_ROLES_EDIT.includes(userRole)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">Cargando quotes...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quotes</CardTitle>
        {canRequestQuote && (
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Solicitar Quote
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay quotes disponibles</div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{quote.quote_number}</span>
                    <Badge className={`${QUOTE_STATUS_BADGE[quote.status || "requested"]?.bgColor || "bg-gray-100"} ${QUOTE_STATUS_BADGE[quote.status || "requested"]?.textColor || "text-gray-800"}`}>
                      {QUOTE_STATUS_BADGE[quote.status || "requested"]?.label || quote.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 flex gap-4">
                    <span>Fecha: {formatDate(quote.quote_date)}</span>
                    <span>Total: {formatCurrency(quote.total_amount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(quote.status === "offered" || quote.status === "accepted") && (
                    <>
                      {quote.technical_quote_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(quote.technical_quote_url)}
                          title="Descargar Anexo Técnico"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {quote.economical_quote_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(quote.economical_quote_url)}
                          title="Descargar Oferta Económica"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {quote.status === "requested" && canEditQuote && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedQuote(quote)
                          setEditFormData({
                            items: quote.items || [],
                            notes: quote.notes || "",
                            general_discount_amount: quote.general_discount_amount || 0,
                            shipping_amount: quote.shipping_amount || 0,
                            technical_file: null,
                            economical_file: null,
                          })
                          setShowEditModal(true)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteQuote(quote.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Quote Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Quote</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Items</label>
              <div className="space-y-2 mt-2">
                {createFormData.items.map((item, index) => (
                  <div key={index} className="border rounded p-2 flex items-center justify-between bg-gray-50">
                    <span className="text-sm">{item.description}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuoteItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Descripción del item"
                  value={createFormData.itemDescription}
                  onChange={(e) => setCreateFormData({ ...createFormData, itemDescription: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Cantidad"
                  value={createFormData.itemQuantity}
                  onChange={(e) => setCreateFormData({ ...createFormData, itemQuantity: parseInt(e.target.value) || 1 })}
                  className="w-24"
                />
                <Button onClick={handleAddQuoteItem}>Agregar</Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                placeholder="Notas de la quote..."
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuote} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Solicitar Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quote Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Completar Datos de Quote</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Items</label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {editFormData.items.map((item, index) => (
                  <div key={index} className="border rounded p-2 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">{item.description}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuoteItem(index, true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-gray-600">Precio Unit.</label>
                        <Input
                          type="number"
                          value={item.unit_price || 0}
                          onChange={(e) => {
                            const updated = [...editFormData.items]
                            updated[index].unit_price = parseFloat(e.target.value) || 0
                            updated[index].line_total = calculateLineTotal(updated[index])
                            setEditFormData({ ...editFormData, items: updated })
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Descuento %</label>
                        <Input
                          type="number"
                          value={item.discount_percent || 0}
                          onChange={(e) => {
                            const updated = [...editFormData.items]
                            updated[index].discount_percent = parseFloat(e.target.value) || 0
                            updated[index].line_total = calculateLineTotal(updated[index])
                            setEditFormData({ ...editFormData, items: updated })
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Total Línea</label>
                        <div className="p-2 bg-white border rounded text-sm font-medium">
                          {formatCurrency(item.line_total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Descuento General</label>
                <Input
                  type="number"
                  value={editFormData.general_discount_amount}
                  onChange={(e) => setEditFormData({ ...editFormData, general_discount_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Envío</label>
                <Input
                  type="number"
                  value={editFormData.shipping_amount}
                  onChange={(e) => setEditFormData({ ...editFormData, shipping_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Anexo Técnico (PDF - Opcional)</label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setEditFormData({ ...editFormData, technical_file: e.target.files?.[0] || null })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Oferta Económica (PDF - Obligatorio)</label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setEditFormData({ ...editFormData, economical_file: e.target.files?.[0] || null })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditQuote} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
