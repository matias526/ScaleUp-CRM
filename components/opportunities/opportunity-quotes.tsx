"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Download, FileText, Trash2 } from "lucide-react"
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
  const [showGenerateModal, setShowGenerateModal] = useState(false)
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

  // Generate modal state
  const [generateFormData, setGenerateFormData] = useState({
    items: [] as QuoteItem[],
    notes: "",
    general_discount_amount: 0,
    shipping_amount: 0,
    technical_file: null as File | null,
    economical_file: null as File | null,
    subtotal_amount: 0,
    total_amount: 0,
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
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setQuotes(data || [])
    } catch (error) {
      console.error("[v0] Error loading quotes:", error)
    } finally {
      setLoading(false)
    }
  }

  const canRequestQuote = ALLOWED_ROLES_REQUEST.includes(userRoleCode)
  const canGenerateQuote = ALLOWED_ROLES_EDIT.includes(userRoleCode)

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
      sku: "",
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

  const handleRemoveItem = (index: number) => {
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

      // Create quote
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert([
          {
            opportunity_id: opportunityId,
            quote_number: `Q-${Date.now()}`,
            status: "requested",
            items: createFormData.items,
            notes: createFormData.notes,
            requested_by: currentUser?.id,
            quote_date: new Date().toISOString(),
          },
        ])
        .select()

      if (quoteError) throw quoteError

      // Change opportunity stage to Quotation
      const { error: stageError } = await supabase
        .from("opportunities")
        .update({ stage_id: QUOTATION_STAGE_ID })
        .eq("id", opportunityId)

      if (stageError) console.error("[v0] Error updating opportunity stage:", stageError)

      // Create note
      const noteText = `${currentUser?.first_name} ${currentUser?.last_name} ha solicitado una quote`
      const { error: noteError } = await supabase.from("notes").insert([
        {
          opportunity_id: opportunityId,
          description: noteText,
          created_by: currentUser?.id,
        },
      ])

      if (noteError) console.error("[v0] Error creating note:", noteError)

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successCreate"),
      })

      setCreateFormData({
        notes: "",
        items: [],
        itemDescription: "",
        itemQuantity: 1,
      })
      setShowCreateModal(false)
      await loadQuotes()
    } catch (error: any) {
      console.error("[v0] Error creating quote:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("opportunities.quotes.errorCreate"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenGenerateModal = (quote: Quote) => {
    setSelectedQuote(quote)
    setGenerateFormData({
      items: quote.items || [],
      notes: quote.notes || "",
      general_discount_amount: quote.general_discount_amount || 0,
      shipping_amount: quote.shipping_amount || 0,
      technical_file: null,
      economical_file: null,
      subtotal_amount: quote.subtotal_amount || 0,
      total_amount: quote.total_amount || 0,
    })
    setShowGenerateModal(true)
  }

  // Calculate totals whenever prices change
  useEffect(() => {
    if (showGenerateModal) {
      calculateTotals()
    }
  }, [generateFormData.items, generateFormData.general_discount_amount, generateFormData.shipping_amount, showGenerateModal])

  const calculateTotals = () => {
    const subtotal = generateFormData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const afterDiscount = subtotal - generateFormData.general_discount_amount
    const total = afterDiscount + generateFormData.shipping_amount

    setGenerateFormData((prev) => ({
      ...prev,
      subtotal_amount: subtotal,
      total_amount: Math.max(0, total),
    }))
  }

  const handleUpdateItemPrice = (index: number, unitPrice: number) => {
    const updatedItems = [...generateFormData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      unit_price: unitPrice,
      line_subtotal: updatedItems[index].quantity * unitPrice,
      line_discount_amount: (updatedItems[index].quantity * unitPrice * updatedItems[index].discount_percent) / 100,
      line_total: (updatedItems[index].quantity * unitPrice) - ((updatedItems[index].quantity * unitPrice * updatedItems[index].discount_percent) / 100),
    }
    setGenerateFormData({
      ...generateFormData,
      items: updatedItems,
    })
  }

  const handleSaveGenerateQuote = async () => {
    if (!generateFormData.economical_file && !selectedQuote?.economical_quote_url) {
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorMissingEconomical"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      let technicalUrl = selectedQuote?.technical_quote_url
      let economicalUrl = selectedQuote?.economical_quote_url

      // Upload technical file if provided
      if (generateFormData.technical_file) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("quotes-attachments")
          .upload(`${opportunityId}/${uuidv4()}-technical.pdf`, generateFormData.technical_file)

        if (uploadError) throw uploadError
        technicalUrl = uploadData?.path || null
      }

      // Upload economical file if provided
      if (generateFormData.economical_file) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("quotes-attachments")
          .upload(`${opportunityId}/${uuidv4()}-economical.pdf`, generateFormData.economical_file)

        if (uploadError) throw uploadError
        economicalUrl = uploadData?.path || null
      }

      // Update quote
      const { error: updateError } = await supabase
        .from("quotes")
        .update({
          status: "offered",
          items: generateFormData.items,
          notes: generateFormData.notes,
          subtotal_amount: generateFormData.subtotal_amount,
          general_discount_amount: generateFormData.general_discount_amount,
          shipping_amount: generateFormData.shipping_amount,
          total_amount: generateFormData.total_amount,
          technical_quote_url: technicalUrl,
          economical_quote_url: economicalUrl,
          answered_by: currentUser?.id,
          quote_date: new Date().toISOString(),
        })
        .eq("id", selectedQuote?.id)

      if (updateError) throw updateError

      // Update opportunity estimated_value
      const { error: oppError } = await supabase
        .from("opportunities")
        .update({ estimated_value: generateFormData.total_amount })
        .eq("id", opportunityId)

      if (oppError) console.error("[v0] Error updating opportunity:", oppError)

      // Create note
      const noteText = `${currentUser?.first_name} ${currentUser?.last_name} ha generado una quote`
      const { error: noteError } = await supabase.from("notes").insert([
        {
          opportunity_id: opportunityId,
          description: noteText,
          created_by: currentUser?.id,
        },
      ])

      if (noteError) console.error("[v0] Error creating note:", noteError)

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successUpdate"),
      })

      setShowGenerateModal(false)
      setSelectedQuote(null)
      await loadQuotes()
    } catch (error: any) {
      console.error("[v0] Error updating quote:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("opportunities.quotes.errorUpdate"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm(t("common.confirmDelete"))) return

    try {
      setIsSaving(true)
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId)

      if (error) throw error

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successDelete"),
      })

      await loadQuotes()
    } catch (error: any) {
      console.error("[v0] Error deleting quote:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("opportunities.quotes.errorDelete"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "requested":
        return "secondary"
      case "offered":
        return "default"
      case "accepted":
        return "outline"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500">{t("common.loading")}</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{t("opportunities.quotes.title")}</CardTitle>
          {canRequestQuote && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("opportunities.quotes.request")}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {quotes.length === 0 ? (
            <p className="text-center text-gray-500">{t("opportunities.quotes.noQuotes")}</p>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">
                      {quote.quote_number}
                      <Badge className="ml-2" variant={getStatusBadgeVariant(quote.status)}>
                        {quote.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {quote.quote_date && new Date(quote.quote_date).toLocaleDateString()}
                      {quote.total_amount && ` - ${quote.total_amount.toLocaleString()}`}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {quote.technical_quote_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/api/download-quote/${quote.id}?file=technical`)}
                        title={t("opportunities.quotes.downloadTechnical")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {quote.economical_quote_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/api/download-quote/${quote.id}?file=economical`)}
                        title={t("opportunities.quotes.downloadEconomical")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {canGenerateQuote && quote.status === "requested" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenGenerateModal(quote)}
                        title={t("opportunities.quotes.requestQuote")}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Quote Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("opportunities.quotes.createModalTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Items List */}
            <div>
              <label className="text-sm font-medium">{t("opportunities.quotes.itemsLabel")}</label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {createFormData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        {t("opportunities.quotes.itemQuantity")}: {item.quantity}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Item Form */}
            <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
              <Input
                placeholder={t("opportunities.quotes.itemDescription")}
                value={createFormData.itemDescription}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    itemDescription: e.target.value,
                  })
                }
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={createFormData.itemQuantity}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      itemQuantity: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-24"
                  placeholder={t("opportunities.quotes.itemQuantity")}
                />
                <Button onClick={handleAddItem}>{t("opportunities.quotes.addItem")}</Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">{t("opportunities.quotes.notesLabel")}</label>
              <Textarea
                placeholder={t("opportunities.quotes.notesPlaceholder")}
                value={createFormData.notes}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    notes: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t("opportunities.quotes.cancel")}
            </Button>
            <Button onClick={handleCreateQuote} disabled={isSaving}>
              {isSaving ? t("opportunities.quotes.saving") : t("opportunities.quotes.requestQuote")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Quote Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("opportunities.quotes.editModalTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Items Section (Read-only) */}
            <div>
              <label className="text-sm font-medium">{t("opportunities.quotes.itemsLabel")}</label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {generateFormData.items.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <p className="font-medium text-sm">{item.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{t("opportunities.quotes.itemQuantity")}: {item.quantity}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">{t("opportunities.quotes.unitPrice")}</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price || ""}
                          onChange={(e) => handleUpdateItemPrice(index, parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">{t("opportunities.quotes.lineTotal")}</label>
                        <div className="p-2 bg-white border rounded text-sm font-medium">
                          {item.line_total?.toLocaleString() || "0.00"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="space-y-2 p-3 border rounded-lg bg-blue-50">
              <div className="flex justify-between text-sm">
                <span>{t("opportunities.quotes.subtotal")}:</span>
                <span className="font-medium">{generateFormData.subtotal_amount?.toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium">{t("opportunities.quotes.generalDiscount")}</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={generateFormData.general_discount_amount || ""}
                    onChange={(e) =>
                      setGenerateFormData({
                        ...generateFormData,
                        general_discount_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium">{t("opportunities.quotes.shipping")}</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={generateFormData.shipping_amount || ""}
                    onChange={(e) =>
                      setGenerateFormData({
                        ...generateFormData,
                        shipping_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>{t("opportunities.quotes.total")}:</span>
                <span>{generateFormData.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">{t("opportunities.quotes.notesLabel")}</label>
              <Textarea
                value={generateFormData.notes}
                onChange={(e) =>
                  setGenerateFormData({
                    ...generateFormData,
                    notes: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{t("opportunities.quotes.technicalAttachment")}</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setGenerateFormData({
                      ...generateFormData,
                      technical_file: e.target.files?.[0] || null,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("opportunities.quotes.economicalQuote")}</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setGenerateFormData({
                      ...generateFormData,
                      economical_file: e.target.files?.[0] || null,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              {t("opportunities.quotes.cancel")}
            </Button>
            <Button onClick={handleSaveGenerateQuote} disabled={isSaving}>
              {isSaving ? t("opportunities.quotes.saving") : t("opportunities.quotes.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
