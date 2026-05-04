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
  requested_by: string | null
  answered_by: string | null
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
  userRole: any
}

const ALLOWED_ROLES_REQUEST = ["Admin", "BDD", "PartnerUser"]
const ALLOWED_ROLES_EDIT = ["Admin", "BDD", "TechUser"]
const QUOTATION_STAGE_ID = "cea0f2b6-d55d-4d70-a730-adc5e365d928"

export function OpportunityQuotes({ opportunityId, lang, userRole }: OpportunityQuotesProps) {
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Get role code from userRole object
  const userRoleCode = typeof userRole === "object" && userRole?.code ? userRole.code : userRole

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

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("id", user.id)
            .single()

          setCurrentUser(userData)
        }
      } catch (error) {
        console.error("[v0] Error loading current user:", error)
      }
    }

    loadCurrentUser()
  }, [])

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
    } catch (error) {
      console.error("[v0] Error loading quotes:", error)
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorCreate"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = (items: QuoteItem[], discountAmount: number, shippingAmount: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0)
    const total = subtotal - discountAmount + shippingAmount
    return { subtotal, total }
  }

  const addNoteForAction = async (action: string) => {
    if (!currentUser) return

    try {
      const userName = `${currentUser.first_name} ${currentUser.last_name}`
      const noteContent = action === "request" 
        ? `${userName} ha solicitado una quote`
        : `${userName} ha generado una quote`

      await supabase.from("notes").insert([
        {
          opportunity_id: opportunityId,
          content: noteContent,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("[v0] Error adding note:", error)
    }
  }

  const updateOpportunityStage = async () => {
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({
          stage_id: QUOTATION_STAGE_ID,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunityId)

      if (error) throw error
      console.log("[v0] Opportunity stage updated to Quotation")
    } catch (error) {
      console.error("[v0] Error updating opportunity stage:", error)
    }
  }

  const canRequestQuote = ALLOWED_ROLES_REQUEST.includes(userRoleCode)
  const canEditQuote = ALLOWED_ROLES_EDIT.includes(userRoleCode)

  const handleAddItem = () => {
    if (!createFormData.itemDescription.trim()) {
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorEmptyDescription"),
        variant: "destructive",
      })
      return
    }

    const newItem: QuoteItem = {
      sku: uuidv4(),
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

  const handleRemoveItem = (sku: string) => {
    setCreateFormData({
      ...createFormData,
      items: createFormData.items.filter((item) => item.sku !== sku),
    })
  }

  const handleCreateQuote = async () => {
    if (createFormData.items.length === 0) {
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorEmptyItems"),
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: t("common.error"),
        description: "Usuario no autenticado",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const totals = calculateTotals(createFormData.items, 0, 0)

      const { error } = await supabase.from("quotes").insert([
        {
          opportunity_id: opportunityId,
          quote_number: `Q-${Date.now()}`,
          status: "requested",
          items: createFormData.items,
          notes: createFormData.notes,
          subtotal_amount: totals.subtotal,
          total_amount: totals.total,
          version: 1,
          requested_by: currentUser.id,
        },
      ])

      if (error) throw error

      // Add note for quote request
      await addNoteForAction("request")

      // Update opportunity stage to Quotation
      await updateOpportunityStage()

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successCreate"),
      })

      setShowCreateModal(false)
      setCreateFormData({ notes: "", items: [], itemDescription: "", itemQuantity: 1 })
      await loadQuotes()
    } catch (error) {
      console.error("[v0] Error creating quote:", error)
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorCreate"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditQuote = async () => {
    if (!selectedQuote) return

    if (editFormData.items.length === 0) {
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorEmptyItems"),
        variant: "destructive",
      })
      return
    }

    if (!editFormData.economical_file && !selectedQuote.economical_quote_url) {
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorMissingEconomical"),
        variant: "destructive",
      })
      return
    }

    if (!currentUser) {
      toast({
        title: t("common.error"),
        description: "Usuario no autenticado",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const totals = calculateTotals(editFormData.items, editFormData.general_discount_amount, editFormData.shipping_amount)

      let technicalUrl = selectedQuote.technical_quote_url
      let economicalUrl = selectedQuote.economical_quote_url

      // Upload technical file if provided
      if (editFormData.technical_file) {
        const { data, error } = await supabase.storage
          .from("quotes")
          .upload(`${opportunityId}/${Date.now()}-technical.pdf`, editFormData.technical_file)

        if (error) throw error
        technicalUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quotes/${data.path}`
      }

      // Upload economical file if provided
      if (editFormData.economical_file) {
        const { data, error } = await supabase.storage
          .from("quotes")
          .upload(`${opportunityId}/${Date.now()}-economical.pdf`, editFormData.economical_file)

        if (error) throw error
        economicalUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/quotes/${data.path}`
      }

      const { error } = await supabase
        .from("quotes")
        .update({
          status: "offered",
          items: editFormData.items,
          notes: editFormData.notes,
          subtotal_amount: totals.subtotal,
          general_discount_amount: editFormData.general_discount_amount,
          shipping_amount: editFormData.shipping_amount,
          total_amount: totals.total,
          technical_quote_url: technicalUrl,
          economical_quote_url: economicalUrl,
          version: (selectedQuote.version || 0) + 1,
          answered_by: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedQuote.id)

      if (error) throw error

      // Add note for quote generation
      await addNoteForAction("answer")

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successUpdate"),
      })

      setShowEditModal(false)
      setSelectedQuote(null)
      await loadQuotes()
    } catch (error) {
      console.error("[v0] Error updating quote:", error)
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorUpdate"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm(t("common.confirmDelete") || "¿Estás seguro?")) return

    try {
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId)

      if (error) throw error

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successDelete"),
      })

      await loadQuotes()
    } catch (error) {
      console.error("[v0] Error deleting quote:", error)
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorDelete"),
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, string> = {
      requested: t("opportunities.quotes.status.requested"),
      offered: t("opportunities.quotes.status.offered"),
      accepted: t("opportunities.quotes.status.accepted"),
      rejected: t("opportunities.quotes.status.rejected"),
    }

    const badgeColors: Record<string, { bg: string; text: string }> = {
      requested: { bg: "bg-blue-100", text: "text-blue-800" },
      offered: { bg: "bg-green-100", text: "text-green-800" },
      accepted: { bg: "bg-purple-100", text: "text-purple-800" },
      rejected: { bg: "bg-red-100", text: "text-red-800" },
    }

    const colors = badgeColors[status || "requested"] || { bg: "bg-gray-100", text: "text-gray-800" }

    return (
      <Badge className={`${colors.bg} ${colors.text} border-0`}>
        {statusMap[status || "requested"] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("opportunities.quotes.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">{t("common.loading")}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("opportunities.quotes.title")}</CardTitle>
          {canRequestQuote && (
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("opportunities.quotes.request")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t("opportunities.quotes.noQuotes")}</div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{quote.quote_number}</span>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(quote.created_at || "").toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t("opportunities.quotes.total")}: <span className="font-bold">${quote.total_amount?.toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canEditQuote && quote.status === "requested" && (
                        <Button
                          size="sm"
                          variant="outline"
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
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          {t("common.edit")}
                        </Button>
                      )}
                      {quote.technical_quote_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(quote.technical_quote_url)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {t("opportunities.quotes.downloadTechnical")}
                        </Button>
                      )}
                      {quote.economical_quote_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(quote.economical_quote_url)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {t("opportunities.quotes.downloadEconomical")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Quote Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("opportunities.quotes.createModalTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Items Section */}
            <div>
              <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.itemsLabel")}</label>
              <div className="space-y-3">
                {createFormData.items.map((item) => (
                  <div key={item.sku} className="flex gap-2 items-center bg-gray-50 p-3 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-600">{t("opportunities.quotes.itemQuantity")}: {item.quantity}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveItem(item.sku)}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <Input
                  placeholder={t("opportunities.quotes.itemDescription")}
                  value={createFormData.itemDescription}
                  onChange={(e) => setCreateFormData({ ...createFormData, itemDescription: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={t("opportunities.quotes.itemQuantity")}
                    value={createFormData.itemQuantity}
                    onChange={(e) => setCreateFormData({ ...createFormData, itemQuantity: parseInt(e.target.value) || 1 })}
                    className="w-32"
                  />
                  <Button onClick={handleAddItem}>{t("opportunities.quotes.addItem")}</Button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.notesLabel")}</label>
              <Textarea
                placeholder={t("opportunities.quotes.notesPlaceholder")}
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t("opportunities.quotes.cancel")}
            </Button>
            <Button onClick={handleCreateQuote} disabled={isSaving}>
              {isSaving ? t("opportunities.quotes.saving") : t("opportunities.quotes.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quote Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("opportunities.quotes.editModalTitle")}</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              {/* Items Section */}
              <div>
                <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.itemsLabel")}</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editFormData.items.map((item) => (
                    <div key={item.sku} className="grid grid-cols-6 gap-2 items-center bg-gray-50 p-2 rounded text-sm">
                      <div>{item.description}</div>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = editFormData.items.map((i) =>
                            i.sku === item.sku ? { ...i, quantity: parseInt(e.target.value) || 0 } : i
                          )
                          setEditFormData({ ...editFormData, items: updated })
                        }}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0
                          const updated = editFormData.items.map((i) =>
                            i.sku === item.sku
                              ? {
                                  ...i,
                                  unit_price: price,
                                  line_subtotal: price * i.quantity,
                                  line_total: (price * i.quantity) * (1 - i.discount_percent / 100),
                                }
                              : i
                          )
                          setEditFormData({ ...editFormData, items: updated })
                        }}
                        className="h-8"
                        placeholder="Precio"
                      />
                      <Input
                        type="number"
                        value={item.discount_percent}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0
                          const updated = editFormData.items.map((i) =>
                            i.sku === item.sku
                              ? {
                                  ...i,
                                  discount_percent: discount,
                                  line_discount_amount: (i.line_subtotal * discount) / 100,
                                  line_total: i.line_subtotal * (1 - discount / 100),
                                }
                              : i
                          )
                          setEditFormData({ ...editFormData, items: updated })
                        }}
                        className="h-8"
                        placeholder="%"
                      />
                      <div className="text-right font-semibold">${item.line_total?.toFixed(2)}</div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setEditFormData({ ...editFormData, items: editFormData.items.filter((i) => i.sku !== item.sku) })}
                        className="h-8"
                      >
                        X
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts and Shipping */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.generalDiscount")}</label>
                  <Input
                    type="number"
                    value={editFormData.general_discount_amount}
                    onChange={(e) => setEditFormData({ ...editFormData, general_discount_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.shipping")}</label>
                  <Input
                    type="number"
                    value={editFormData.shipping_amount}
                    onChange={(e) => setEditFormData({ ...editFormData, shipping_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.notesLabel")}</label>
                <Textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.technicalAttachment")}</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEditFormData({ ...editFormData, technical_file: e.target.files?.[0] || null })}
                  />
                  {selectedQuote.technical_quote_url && !editFormData.technical_file && (
                    <p className="text-xs text-gray-500 mt-1">{t("opportunities.quotes.downloadTechnical")}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">{t("opportunities.quotes.economicalQuote")}</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEditFormData({ ...editFormData, economical_file: e.target.files?.[0] || null })}
                  />
                  {selectedQuote.economical_quote_url && !editFormData.economical_file && (
                    <p className="text-xs text-gray-500 mt-1">{t("opportunities.quotes.downloadEconomical")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t("opportunities.quotes.cancel")}
            </Button>
            <Button onClick={handleEditQuote} disabled={isSaving}>
              {isSaving ? t("opportunities.quotes.saving") : t("opportunities.quotes.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
