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
  userRole: any // Role object with id and code
}

const ALLOWED_ROLES_REQUEST = ["Admin", "BDD", "PartnerUser"]
const ALLOWED_ROLES_EDIT = ["Admin", "BDD", "TechUser"]

export function OpportunityQuotes({ opportunityId, lang, userRole }: OpportunityQuotesProps) {
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleRemoveEditItem = (index: number) => {
    setEditFormData({
      ...editFormData,
      items: editFormData.items.filter((_, i) => i !== index),
    })
  }

  const handleRemoveCreateItem = (index: number) => {
    setCreateFormData({
      ...createFormData,
      items: createFormData.items.filter((_, i) => i !== index),
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
        },
      ])

      if (error) throw error

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

    try {
      setIsSaving(true)
      const totals = calculateTotals(editFormData.items, editFormData.general_discount_amount, editFormData.shipping_amount)

      let technicalUrl = selectedQuote.technical_quote_url
      let economicalUrl = selectedQuote.economical_quote_url

      // Upload technical file if provided
      if (editFormData.technical_file) {
        const { data, error } = await supabase.storage
          .from("quotes")
          .upload(`technical/${selectedQuote.id}/${editFormData.technical_file.name}`, editFormData.technical_file)

        if (error) throw error
        technicalUrl = data.path
      }

      // Upload economical file if provided
      if (editFormData.economical_file) {
        const { data, error } = await supabase.storage
          .from("quotes")
          .upload(`economical/${selectedQuote.id}/${editFormData.economical_file.name}`, editFormData.economical_file)

        if (error) throw error
        economicalUrl = data.path
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedQuote.id)

      if (error) throw error

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
    return <div className="text-center py-4">{t("common.loading")}</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("opportunities.quotes.title")}</CardTitle>
        {canRequestQuote && (
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("opportunities.quotes.request")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t("opportunities.quotes.noQuotes")}</div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{quote.quote_number}</span>
                    {getStatusBadge(quote.status)}
                    <span className="text-sm text-gray-500">
                      {quote.quote_date ? new Date(quote.quote_date).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{t("opportunities.quotes.total")}:</span> ${quote.total_amount?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEditQuote && quote.status === "requested" && (
                    <Button
                      size="sm"
                      variant="ghost"
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
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {quote.economical_quote_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(quote.economical_quote_url, "_blank")}
                      className="h-8 w-8 p-0"
                      title={t("opportunities.quotes.downloadEconomical")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {quote.technical_quote_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(quote.technical_quote_url, "_blank")}
                      className="h-8 w-8 p-0"
                      title={t("opportunities.quotes.downloadTechnical")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {canEditQuote && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <DialogTitle>{t("opportunities.quotes.createModalTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Items Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("opportunities.quotes.itemsLabel")}</label>

              <div className="space-y-2">
                {createFormData.items.map((item, index) => (
                  <div key={index} className="border rounded p-2 flex items-center justify-between bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.description}</div>
                      <div className="text-xs text-gray-500">
                        {t("opportunities.quotes.itemQuantity")}: {item.quantity}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveCreateItem(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={t("opportunities.quotes.itemDescription")}
                  value={createFormData.itemDescription}
                  onChange={(e) => setCreateFormData({ ...createFormData, itemDescription: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder={t("opportunities.quotes.itemQuantity")}
                  value={createFormData.itemQuantity}
                  onChange={(e) => setCreateFormData({ ...createFormData, itemQuantity: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <Button onClick={handleAddItem} size="sm" variant="outline">
                  {t("opportunities.quotes.addItem")}
                </Button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("opportunities.quotes.notesLabel")}</label>
              <Textarea
                placeholder={t("opportunities.quotes.notesPlaceholder")}
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                rows={3}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("opportunities.quotes.editModalTitle")}</DialogTitle>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4">
              {/* Items Table */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.quotes.itemsLabel")}</label>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="text-left p-2">{t("opportunities.quotes.itemDescription")}</th>
                        <th className="text-center p-2 w-20">{t("opportunities.quotes.itemQuantity")}</th>
                        <th className="text-right p-2 w-24">{t("opportunities.quotes.unitPrice")}</th>
                        <th className="text-right p-2 w-20">{t("opportunities.quotes.discountPercent")}</th>
                        <th className="text-right p-2 w-24">{t("opportunities.quotes.lineTotal")}</th>
                        <th className="text-center p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editFormData.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{item.description}</td>
                          <td className="text-center p-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const updated = [...editFormData.items]
                                updated[index].quantity = parseInt(e.target.value) || 1
                                setEditFormData({ ...editFormData, items: updated })
                              }}
                              className="w-full text-center"
                            />
                          </td>
                          <td className="text-right p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => {
                                const updated = [...editFormData.items]
                                updated[index].unit_price = parseFloat(e.target.value) || 0
                                updated[index].line_subtotal = updated[index].quantity * updated[index].unit_price
                                updated[index].line_discount_amount = (updated[index].line_subtotal * updated[index].discount_percent) / 100
                                updated[index].line_total = updated[index].line_subtotal - updated[index].line_discount_amount
                                setEditFormData({ ...editFormData, items: updated })
                              }}
                              className="w-full text-right"
                            />
                          </td>
                          <td className="text-right p-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={item.discount_percent}
                              onChange={(e) => {
                                const updated = [...editFormData.items]
                                updated[index].discount_percent = parseFloat(e.target.value) || 0
                                updated[index].line_discount_amount = (updated[index].line_subtotal * updated[index].discount_percent) / 100
                                updated[index].line_total = updated[index].line_subtotal - updated[index].line_discount_amount
                                setEditFormData({ ...editFormData, items: updated })
                              }}
                              className="w-full text-right"
                            />
                          </td>
                          <td className="text-right p-2 font-medium">${item.line_total?.toFixed(2) || "0.00"}</td>
                          <td className="text-center p-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveEditItem(index)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              {(() => {
                const totals = calculateTotals(
                  editFormData.items,
                  editFormData.general_discount_amount,
                  editFormData.shipping_amount
                )
                return (
                  <div className="border rounded p-4 space-y-2 bg-gray-50">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm">{t("opportunities.quotes.generalDiscount")}:</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editFormData.general_discount_amount}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, general_discount_amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-24"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm">{t("opportunities.quotes.shipping")}:</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editFormData.shipping_amount}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, shipping_amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-24"
                      />
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>{t("opportunities.quotes.total")}:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })()}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.quotes.notesLabel")}</label>
                <Textarea
                  placeholder={t("opportunities.quotes.notesPlaceholder")}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              {/* File Uploads */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("opportunities.quotes.technicalAttachment")}</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, technical_file: e.target.files?.[0] || null })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-600">
                    {t("opportunities.quotes.economicalQuote")}
                  </label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, economical_file: e.target.files?.[0] || null })
                    }
                    required
                  />
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
    </Card>
  )
}
