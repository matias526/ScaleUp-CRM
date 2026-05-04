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

  // Get role code
  const userRoleCode = typeof userRole === "object" && userRole?.code ? userRole.code : userRole
  const canRequestQuote = ALLOWED_ROLES_REQUEST.includes(userRoleCode)
  const canGenerateQuote = ALLOWED_ROLES_EDIT.includes(userRoleCode)

  // Create modal state
  const [createFormData, setCreateFormData] = useState({
    notes: "",
    items: [] as QuoteItem[],
    itemDescription: "",
    itemQuantity: 1,
  })

  // Generate modal state
  const [generateFormData, setGenerateFormData] = useState({
    subtotal_amount: 0,
    shipping_amount: 0,
    notes: "",
    technical_file: null as File | null,
    economical_file: null as File | null,
  })

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("id, first_name, last_name, email")
            .eq("id", user.id)
            .single()
          if (userData) {
            setCurrentUser(userData)
          }
        }
      } catch (error) {
        console.error("Error loading current user:", error)
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
      console.error("Error loading quotes:", error)
    } finally {
      setLoading(false)
    }
  }

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
      sku: `SKU-${Date.now()}`,
      description: createFormData.itemDescription,
      quantity: createFormData.itemQuantity,
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
    try {
      if (createFormData.items.length === 0) {
        toast({
          title: t("common.error"),
          description: t("opportunities.quotes.errorEmptyItems"),
          variant: "destructive",
        })
        return
      }

      setIsSaving(true)

      const quoteNumber = `QT-${Date.now()}`
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert([
          {
            opportunity_id: opportunityId,
            quote_number: quoteNumber,
            quote_date: new Date().toISOString(),
            status: "requested",
            items: createFormData.items,
            notes: createFormData.notes,
            requested_by: currentUser?.id,
            version: 1,
          },
        ])
        .select()

      if (quoteError) throw quoteError

      // Update opportunity stage to Quotation
      const { error: stageError } = await supabase
        .from("opportunities")
        .update({
          pipeline_stage_id: QUOTATION_STAGE_ID,
        })
        .eq("id", opportunityId)

      if (stageError) throw stageError

      // Create note in notes table
      const noteText = `${currentUser?.first_name} ${currentUser?.last_name} ha solicitado una quote`
      await supabase.from("notes").insert([
        {
          opportunity_id: opportunityId,
          content: noteText,
          created_by: currentUser?.id,
        },
      ])

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
    } catch (error) {
      console.error("Error creating quote:", error)
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorCreate"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateQuote = async () => {
    try {
      if (!selectedQuote) return

      if (!generateFormData.economical_file) {
        toast({
          title: t("common.error"),
          description: t("opportunities.quotes.errorMissingEconomical"),
          variant: "destructive",
        })
        return
      }

      setIsSaving(true)

      const total = generateFormData.subtotal_amount + generateFormData.shipping_amount

      // Upload files if provided
      let technicalUrl = selectedQuote.technical_quote_url
      let economicalUrl = selectedQuote.economical_quote_url

      if (generateFormData.technical_file) {
        const techPath = `${opportunityId}/${selectedQuote.id}-technical-${Date.now()}.pdf`
        const { error: techError } = await supabase.storage
          .from("quotes")
          .upload(techPath, generateFormData.technical_file)
        if (techError) throw techError
        const { data: techData } = supabase.storage.from("quotes").getPublicUrl(techPath)
        technicalUrl = techData.publicUrl
      }

      if (generateFormData.economical_file) {
        const economicalPath = `${opportunityId}/${selectedQuote.id}-economical-${Date.now()}.pdf`
        const { error: ecoError } = await supabase.storage
          .from("quotes")
          .upload(economicalPath, generateFormData.economical_file)
        if (ecoError) throw ecoError
        const { data: ecoData } = supabase.storage.from("quotes").getPublicUrl(economicalPath)
        economicalUrl = ecoData.publicUrl
      }

      // Update quote
      const { error: updateError } = await supabase
        .from("quotes")
        .update({
          status: "offered",
          subtotal_amount: generateFormData.subtotal_amount,
          shipping_amount: generateFormData.shipping_amount,
          total_amount: total,
          notes: generateFormData.notes,
          technical_quote_url: technicalUrl,
          economical_quote_url: economicalUrl,
          answered_by: currentUser?.id,
        })
        .eq("id", selectedQuote.id)

      if (updateError) throw updateError

      // Update opportunity estimated_value
      const { error: oppError } = await supabase
        .from("opportunities")
        .update({
          estimated_value: total,
        })
        .eq("id", opportunityId)

      if (oppError) throw oppError

      // Create note
      const noteText = `${currentUser?.first_name} ${currentUser?.last_name} ha generado una quote`
      await supabase.from("notes").insert([
        {
          opportunity_id: opportunityId,
          content: noteText,
          created_by: currentUser?.id,
        },
      ])

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successUpdate"),
      })

      setGenerateFormData({
        subtotal_amount: 0,
        shipping_amount: 0,
        notes: "",
        technical_file: null,
        economical_file: null,
      })
      setShowGenerateModal(false)
      setSelectedQuote(null)
      await loadQuotes()
    } catch (error) {
      console.error("Error generating quote:", error)
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
    try {
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId)
      if (error) throw error

      toast({
        title: t("common.success"),
        description: t("opportunities.quotes.successDelete"),
      })

      await loadQuotes()
    } catch (error) {
      console.error("Error deleting quote:", error)
      toast({
        title: t("common.error"),
        description: t("opportunities.quotes.errorDelete"),
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case "requested":
        return "bg-blue-100 text-blue-800"
      case "offered":
        return "bg-green-100 text-green-800"
      case "accepted":
        return "bg-emerald-100 text-emerald-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const total = generateFormData.subtotal_amount + generateFormData.shipping_amount

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("opportunities.quotes.title")}</CardTitle>
          {canRequestQuote && (
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("opportunities.quotes.request")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t("common.loading")}</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t("opportunities.quotes.noQuotes")}</div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{quote.quote_number}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(quote.created_at || "").toLocaleDateString(lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US")}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusBadgeColor(quote.status)}>
                      {t(`opportunities.quotes.status.${quote.status || "requested"}`)}
                    </Badge>
                  </div>

                  {quote.total_amount && (
                    <div className="text-sm font-medium text-gray-700">
                      {t("opportunities.quotes.total")}: ${quote.total_amount.toFixed(2)}
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    {canGenerateQuote && quote.status === "requested" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedQuote(quote)
                          setGenerateFormData({
                            subtotal_amount: 0,
                            shipping_amount: 0,
                            notes: quote.notes || "",
                            technical_file: null,
                            economical_file: null,
                          })
                          setShowGenerateModal(true)
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {t("opportunities.quotes.requestQuote")}
                      </Button>
                    )}

                    {quote.technical_quote_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(quote.technical_quote_url, "_blank")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t("opportunities.quotes.downloadTechnical")}
                      </Button>
                    )}

                    {quote.economical_quote_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(quote.economical_quote_url, "_blank")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t("opportunities.quotes.downloadEconomical")}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="text-red-600 hover:text-red-700"
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
            {/* Items section */}
            <div className="space-y-3">
              <label className="text-sm font-medium">{t("opportunities.quotes.itemsLabel")}</label>
              <div className="space-y-2">
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
                    placeholder={t("opportunities.quotes.itemQuantity")}
                    value={createFormData.itemQuantity}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        itemQuantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-32"
                  />
                  <Button onClick={handleAddItem}>{t("opportunities.quotes.addItem")}</Button>
                </div>
              </div>

              {createFormData.items.length > 0 && (
                <div className="space-y-2 bg-gray-50 p-3 rounded">
                  {createFormData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span>
                        {item.description} (Qty: {item.quantity})
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Generate Quote Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("opportunities.quotes.editModalTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Items display (read-only) */}
            {selectedQuote?.items && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.quotes.itemsLabel")}</label>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  {selectedQuote.items.map((item: QuoteItem, idx: number) => (
                    <div key={idx} className="text-sm text-gray-700">
                      • {item.description} (Qty: {item.quantity})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t("opportunities.quotes.subtotal")} *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={generateFormData.subtotal_amount}
                  onChange={(e) =>
                    setGenerateFormData({
                      ...generateFormData,
                      subtotal_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t("opportunities.quotes.shipping")}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={generateFormData.shipping_amount}
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

            {/* Total display */}
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-lg font-bold text-blue-900">
                {t("opportunities.quotes.total")}: ${total.toFixed(2)}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium block mb-2">{t("opportunities.quotes.notesLabel")}</label>
              <Textarea
                value={generateFormData.notes}
                onChange={(e) =>
                  setGenerateFormData({
                    ...generateFormData,
                    notes: e.target.value,
                  })
                }
                placeholder={t("opportunities.quotes.notesPlaceholder")}
              />
            </div>

            {/* File uploads */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t("opportunities.quotes.technicalAttachment")}
                </label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setGenerateFormData({
                      ...generateFormData,
                      technical_file: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t("opportunities.quotes.economicalQuote")} *
                </label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setGenerateFormData({
                      ...generateFormData,
                      economical_file: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              {t("opportunities.quotes.cancel")}
            </Button>
            <Button onClick={handleGenerateQuote} disabled={isSaving}>
              {isSaving ? t("opportunities.quotes.saving") : t("opportunities.quotes.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
