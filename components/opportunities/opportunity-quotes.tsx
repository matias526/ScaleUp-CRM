"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Download, FileText, Trash2, CheckCircle } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

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
const ALLOWED_ROLES_EDIT = ["Admin", "BDD", "TechUser", "PartnerUser"]
const ALLOWED_ROLES_DELETE = ["Admin", "BDD", "TechUser"]
const QUOTATION_STAGE_ID = "cea0f2b6-d55d-4d70-a730-adc5e365d928"

export function OpportunityQuotes({ opportunityId, lang, userRole }: OpportunityQuotesProps) {
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  
  console.log("[v0] OpportunityQuotes component mounted with opportunityId:", opportunityId)
  
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPOModal, setShowPOModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>([])
  const [opportunity, setOpportunity] = useState<any>(null)

  // Get role code
  const userRoleCode = typeof userRole === "object" && userRole?.code ? userRole.code : userRole
  const canRequestQuote = ALLOWED_ROLES_REQUEST.includes(userRoleCode)
  const canGenerateQuote = ALLOWED_ROLES_EDIT.includes(userRoleCode)
  const canDeleteQuote = ALLOWED_ROLES_DELETE.includes(userRoleCode)

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

  // PO modal state
  const [poFormData, setPoFormData] = useState({
    po_number: "",
    po_file: null as File | null,
    subtotal_amount: 0,
    shipping_amount: 0,
    total_amount: 0,
    selectedOpportunities: [] as string[],
  })

  // Sanitize file name to remove special characters
  const sanitizeFileName = (fileName: string): string => {
    const ext = fileName.split(".").pop() || "pdf"
    return `po_${Date.now()}.${ext}`
  }

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
    console.log("[v0] ========== useEffect START ==========")
    console.log("[v0] useEffect triggered with opportunityId:", opportunityId)
    console.log("[v0] loadQuotes function exists:", typeof loadQuotes)
    console.log("[v0] loadCurrentOpportunity function exists:", typeof loadCurrentOpportunity)
    loadQuotes()
    loadCurrentOpportunity()
    console.log("[v0] ========== useEffect END ==========")
  }, [opportunityId])

  // Load opportunities when PO modal opens
  useEffect(() => {
    console.log("[v0] ========== PO Modal useEffect START ==========")
    console.log("[v0] showPOModal changed to:", showPOModal)
    if (showPOModal) {
      console.log("[v0] Modal is open, calling loadCurrentOpportunity...")
      loadCurrentOpportunity()
    }
    console.log("[v0] ========== PO Modal useEffect END ==========")
  }, [showPOModal])

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

  const loadCurrentOpportunity = async () => {
    try {
      console.log("[v0] Loading current opportunity with ID:", opportunityId)
      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select("id, partner_id, tech_company_id, pipeline_stage_id, title, estimated_value")
        .eq("id", opportunityId)
        .single()

      if (oppError) {
        console.error("[v0] Error loading current opportunity:", oppError)
        throw oppError
      }
      
      console.log("[v0] Current opportunity loaded:", {
        id: oppData.id,
        title: oppData.title,
        partner_id: oppData.partner_id,
        tech_company_id: oppData.tech_company_id,
      })
      
      if (oppData) {
        setOpportunity(oppData)
        
        // Load other active opportunities from same partner
        console.log("[v0] Starting query to find other opportunities...")
        console.log("[v0] Query filters:")
        console.log("[v0]   - Table: opportunities")
        console.log("[v0]   - Select: id, title, estimated_value, partner_id, tech_company_id")
        console.log("[v0]   - partner_id =", oppData.partner_id)
        console.log("[v0]   - id != ", opportunityId)
        
        let query = supabase
          .from("opportunities")
          .select("id, title, estimated_value, partner_id, tech_company_id")
          .eq("partner_id", oppData.partner_id)
          .neq("id", opportunityId)

        // If tech_company_id is set, filter by it too
        if (oppData.tech_company_id) {
          console.log("[v0]   - tech_company_id =", oppData.tech_company_id)
          query = query.eq("tech_company_id", oppData.tech_company_id)
        } else {
          console.log("[v0]   - tech_company_id: NOT SET (will not filter)")
        }

        console.log("[v0] Executing query...")
        const { data: otherOpps, error: otherError } = await query
          .order("title", { ascending: true })

        console.log("[v0] Query result:")
        console.log("[v0]   - Error:", otherError?.message || "none")
        console.log("[v0]   - Count:", otherOpps?.length || 0)
        console.log("[v0]   - Data:", otherOpps)

        if (otherError) {
          console.error("[v0] Error loading other opportunities:", otherError)
        } else {
          setAvailableOpportunities(otherOpps || [])
        }
      }
    } catch (error) {
      console.error("[v0] Error loading opportunity:", error)
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
          user_id: currentUser?.id,
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
        const { error: techUploadError } = await supabase.storage
          .from("quotes")
          .upload(techPath, generateFormData.technical_file)
        if (techUploadError) throw techUploadError

        const { data: techSignedData, error: techSignedError } = await supabase.storage
          .from("quotes")
          .createSignedUrl(techPath, 604800)
        if (techSignedError) throw techSignedError
        technicalUrl = techSignedData.signedUrl
      }

      if (generateFormData.economical_file) {
        const economicalPath = `${opportunityId}/${selectedQuote.id}-economical-${Date.now()}.pdf`
        const { error: ecoUploadError } = await supabase.storage
          .from("quotes")
          .upload(economicalPath, generateFormData.economical_file)
        if (ecoUploadError) throw ecoUploadError

        const { data: ecoSignedData, error: ecoSignedError } = await supabase.storage
          .from("quotes")
          .createSignedUrl(economicalPath, 604800)
        if (ecoSignedError) throw ecoSignedError
        economicalUrl = ecoSignedData.signedUrl
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
      const { error: noteError } = await supabase.from("notes").insert([
        {
          opportunity_id: opportunityId,
          content: noteText,
          user_id: currentUser?.id,
        },
      ])

      if (noteError) {
        console.error("❌ Error específico en la nota:", noteError)
      }

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

  const handleAcceptAndUploadPO = async () => {
    try {
      if (!poFormData.po_number.trim()) {
        toast({
          title: t("common.error"),
          description: "PO number is required",
          variant: "destructive",
        })
        return
      }

      if (!poFormData.po_file) {
        toast({
          title: t("common.error"),
          description: "PO document is required",
          variant: "destructive",
        })
        return
      }

      setIsSaving(true)

      // Upload PO file to storage with sanitized name
      const sanitizedFileName = sanitizeFileName(poFormData.po_file.name)
      const poPath = `pos/${sanitizedFileName}`
      const { error: uploadError } = await supabase.storage
        .from("po_documents")
        .upload(poPath, poFormData.po_file)
      if (uploadError) throw uploadError

      // Generate signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("po_documents")
        .createSignedUrl(poPath, 604800)
      if (signedError) throw signedError

      const poFileUrl = signedData.signedUrl

      // Determine role-based status
      const isAdminOrBDD = ["Admin", "BDD"].includes(userRoleCode)
      const poStatus = isAdminOrBDD ? "accepted" : "sent"
      const docStatus = isAdminOrBDD ? "accepted" : "pending"
      const opportunityStatus = isAdminOrBDD ? "Won" : "quotation"

      // Get partner_id based on user role
      let partnerId = null
      if (userRoleCode === "PartnerUser") {
        // PartnerUser: use their own partner_id (from currentUser or opportunity)
        partnerId = currentUser?.partner_id || opportunity?.partner_id
      } else if (["Admin", "BDD"].includes(userRoleCode)) {
        // Admin/BDD: get from opportunity
        partnerId = opportunity?.partner_id
      }
      
      console.log("[v0] Partner ID determination:", { userRoleCode, partnerId, oppPartnerId: opportunity?.partner_id })
      
      if (!partnerId) {
        console.warn("[v0] No partner_id available")
        if (!isAdminOrBDD) {
          toast({
            title: t("common.error"),
            description: "Partner not assigned to this opportunity",
            variant: "destructive",
          })
          return
        }
        // For Admin/BDD, allow to continue with null partner_id (direct sales)
      }

      // Create Purchase Order
      const selectedOppIds = [opportunityId, ...poFormData.selectedOpportunities]

      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert([
          {
            po_number: poFormData.po_number,
            subtotal_amount: poFormData.subtotal_amount,
            shipping_amount: poFormData.shipping_amount,
            total_amount: poFormData.total_amount,
            status: poStatus,
            partner_id: partnerId,
            tech_company_id: opportunity?.tech_company_id,
            partner_user_id: currentUser?.id,
            accepted_by: isAdminOrBDD ? currentUser?.id : null,
            accepted_at: isAdminOrBDD ? new Date().toISOString() : null,
          } as any,
        ])
        .select()

      if (poError) throw poError
      
      // Get the created PO ID from the response
      const createdPoId = poData?.[0]?.id || poId
      console.log("[v0] Created Purchase Order with ID:", createdPoId)

      // Create document record
      const { error: docError } = await supabase
        .from("documents")
        .insert([
          {
            parent_id: createdPoId,
            parent_type: "purchase_order",
            doc_type: "po_file",
            file_url: poFileUrl,
            status: docStatus,
          } as any,
        ])

      if (docError) throw docError

      // Update current quote to accepted
      const { error: updateQuoteError } = await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", selectedQuote?.id)

      if (updateQuoteError) throw updateQuoteError

      // Decline other quotes from all selected opportunities
      const { error: declineError } = await supabase
        .from("quotes")
        .update({ status: "declined" })
        .in("opportunity_id", selectedOppIds)
        .neq("id", selectedQuote?.id)

      if (declineError) throw declineError

      // Update all selected opportunities with PO reference and new status
      for (const oppId of selectedOppIds) {
        console.log("[v0] Updating opportunity", oppId, "with purchase_order_id:", createdPoId)
        const { error: oppError } = await supabase
          .from("opportunities")
          .update({ 
            purchase_order_id: createdPoId,
            pipeline_stage_id: isAdminOrBDD ? "6ce3c904-c927-4e11-91f8-d25674d642ac" : QUOTATION_STAGE_ID
          } as any)
          .eq("id", oppId)

        if (oppError) throw oppError
      }
      console.log("[v0] All opportunities updated with purchase_order_id:", createdPoId)

      // Create note
      const { error: noteError } = await supabase
        .from("notes")
        .insert([
          {
            opportunity_id: opportunityId,
            user_id: currentUser?.id,
            content: `${currentUser?.first_name} ${currentUser?.last_name} ha cargado una PO (${poFormData.po_number})`,
          } as any,
        ])

      if (noteError) throw noteError

      toast({
        title: t("common.success"),
        description: "PO created successfully",
      })

      setShowPOModal(false)
      setPoFormData({
        po_number: "",
        po_file: null,
        subtotal_amount: 0,
        shipping_amount: 0,
        total_amount: 0,
        selectedOpportunities: [],
      })
      await loadQuotes()
    } catch (error) {
      console.error("Error creating PO:", error)
      toast({
        title: t("common.error"),
        description: "Error creating purchase order",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
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
                              className="p-0 h-8 w-8"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("opportunities.quotes.editModalTitle")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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

                    {canGenerateQuote && quote.status === "offered" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedQuote(quote)
                                setPoFormData({
                                  po_number: "",
                                  po_file: null,
                                  subtotal_amount: quote.subtotal_amount || 0,
                                  shipping_amount: quote.shipping_amount || 0,
                                  total_amount: quote.total_amount || 0,
                                  selectedOpportunities: [],
                                })
                                setShowPOModal(true)
                              }}
                              className="p-0 h-8 w-8"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Accept & Upload PO
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {canDeleteQuote && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-600 hover:text-red-700"
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

      {/* Accept & Upload PO Modal */}
      <Dialog open={showPOModal} onOpenChange={setShowPOModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("opportunities.quotes.acceptQuote")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* PO Number */}
            <div>
              <label className="text-sm font-medium">
                {t("opportunities.quotes.poNumber")} {t("opportunities.quotes.required")}
              </label>
              <Input
                placeholder={t("opportunities.quotes.poNumberPlaceholder")}
                value={poFormData.po_number}
                onChange={(e) =>
                  setPoFormData({
                    ...poFormData,
                    po_number: e.target.value,
                  })
                }
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium">
                {t("opportunities.quotes.poDocument")} {t("opportunities.quotes.required")}
              </label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPoFormData({
                      ...poFormData,
                      po_file: e.target.files[0],
                    })
                  }
                }}
              />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">{t("opportunities.quotes.subtotalAmount")}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={poFormData.subtotal_amount}
                  onChange={(e) =>
                    setPoFormData({
                      ...poFormData,
                      subtotal_amount: parseFloat(e.target.value) || 0,
                      total_amount: parseFloat(e.target.value) + poFormData.shipping_amount,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("opportunities.quotes.shippingAmount")}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={poFormData.shipping_amount}
                  onChange={(e) =>
                    setPoFormData({
                      ...poFormData,
                      shipping_amount: parseFloat(e.target.value) || 0,
                      total_amount: poFormData.subtotal_amount + parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("opportunities.quotes.totalAmount")}</label>
                <Input
                  type="number"
                  disabled
                  value={poFormData.total_amount.toFixed(2)}
                />
              </div>
            </div>

            {/* Additional Opportunities */}
            {availableOpportunities.length > 0 && (
              <div>
                <label className="text-sm font-medium">{t("opportunities.quotes.includeOtherOpportunities")}</label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {availableOpportunities.map((opp) => (
                    <div key={opp.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`opp-${opp.id}`}
                        checked={poFormData.selectedOpportunities.includes(opp.id)}
                        onCheckedChange={(checked) => {
                          let newSubtotal = poFormData.subtotal_amount
                          
                          if (checked) {
                            newSubtotal += opp.estimated_value || 0
                            setPoFormData({
                              ...poFormData,
                              selectedOpportunities: [...poFormData.selectedOpportunities, opp.id],
                              subtotal_amount: newSubtotal,
                              total_amount: newSubtotal + poFormData.shipping_amount,
                            })
                          } else {
                            newSubtotal -= opp.estimated_value || 0
                            setPoFormData({
                              ...poFormData,
                              selectedOpportunities: poFormData.selectedOpportunities.filter(
                                (id) => id !== opp.id
                              ),
                              subtotal_amount: newSubtotal,
                              total_amount: newSubtotal + poFormData.shipping_amount,
                            })
                          }
                        }}
                      />
                      <label htmlFor={`opp-${opp.id}`} className="text-sm cursor-pointer">
                        {opp.title} (${opp.estimated_value?.toFixed(2) || "0.00"})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPOModal(false)}
              disabled={isSaving}
            >
              {t("opportunities.quotes.cancel")}
            </Button>
            <Button onClick={handleAcceptAndUploadPO} disabled={isSaving}>
              {isSaving ? t("opportunities.quotes.uploading") : t("opportunities.quotes.acceptUploadPO")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
