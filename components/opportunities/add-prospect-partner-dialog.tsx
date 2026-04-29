"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useTranslations } from "@/hooks/use-translations"
import { createBrowserClient } from "@/lib/supabase/client"
import { ProspectPartnerService } from "@/lib/services/prospect-partner-service"
import { LEAD_SOURCES } from "@/lib/constants/lead-sources"

const LEAD_SOURCES_LIST = [
  "internationalFair",
  "linkedinCampaign",
  "emailCampaign",
  "academy",
  "israelVisit",
  "website",
  "referral",
  "other",
]

interface AddProspectPartnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId: string
  onSuccess?: () => void
}

export function AddProspectPartnerDialog({ open, onOpenChange, opportunityId, onSuccess }: AddProspectPartnerDialogProps) {
  const t = useTranslations()
  const supabase = createBrowserClient()
  const [step, setStep] = useState(1) // 1: Company, 2: Contact
  const [isSaving, setIsSaving] = useState(false)
  const [existingProspectPartners, setExistingProspectPartners] = useState<any[]>([])
  const [prospectSearchQuery, setProspectSearchQuery] = useState("")
  const [prospectSearchResults, setProspectSearchResults] = useState<any[]>([])
  const [showProspectResults, setShowProspectResults] = useState(false)
  const [selectedProspectPartner, setSelectedProspectPartner] = useState<any>(null)
  const [prospectPartnerContacts, setProspectPartnerContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // New prospect partner data
  const [newProspectData, setNewProspectData] = useState({
    name: "",
    website: "",
    main_country_id: "",
    lead_source: "",
  })

  // New contact data
  const [newContactData, setNewContactData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    preferred_language: "es" as "es" | "en" | "pt",
  })

  const [countries, setCountries] = useState<any[]>([])

  // Load prospect partners and countries
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: prospects } = await ProspectPartnerService.getProspectPartners(1, 1000)
        if (prospects && Array.isArray(prospects)) {
          setExistingProspectPartners(prospects)
        }

        const { data: countriesData } = await supabase.from("countries").select("id, name")
        if (countriesData) {
          setCountries(countriesData)
        }
      } catch (err) {
        console.error("Error loading data:", err)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // Search prospect partners
  useEffect(() => {
    if (!prospectSearchQuery.trim()) {
      setProspectSearchResults([])
      setShowProspectResults(false)
      return
    }

    const query = prospectSearchQuery.toLowerCase()
    const filtered = existingProspectPartners.filter((p) => p.name.toLowerCase().includes(query))
    setProspectSearchResults(filtered)
    setShowProspectResults(true)
  }, [prospectSearchQuery, existingProspectPartners])

  const handleSelectExistingProspect = async (prospect: any) => {
    setSelectedProspectPartner(prospect)
    setProspectSearchQuery("")
    setShowProspectResults(false)
    setIsCreatingNew(false)

    // Load contacts for this prospect
    try {
      const { data: contacts } = await supabase.from("contacts").select("*").eq("prospect_id", prospect.id)

      if (contacts && contacts.length > 0) {
        setProspectPartnerContacts(contacts)
        setSelectedContact(contacts[0])
      }
    } catch (err) {
      console.error("Error loading contacts:", err)
    }

    setStep(2)
  }

  const handleCreateNewProspect = () => {
    setIsCreatingNew(true)
    setSelectedProspectPartner(null)
    setStep(2)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      let prospectPartnerId = selectedProspectPartner?.id
      let contactId = selectedContact?.id

      // If creating new prospect partner
      if (isCreatingNew) {
        if (!newProspectData.name || !newProspectData.main_country_id || !newProspectData.lead_source) {
          toast({
            title: t("common.error"),
            description: t("opportunities.form.requiredField"),
            variant: "destructive",
          })
          return
        }

        const { data: prospectData, error: prospectError } = await supabase
          .from("prospect_partners")
          .insert([
            {
              name: newProspectData.name,
              website: newProspectData.website || null,
              main_country_id: newProspectData.main_country_id,
              lead_source: newProspectData.lead_source,
            },
          ])
          .select("id")

        if (prospectError) throw prospectError
        prospectPartnerId = prospectData?.[0]?.id

        // Create contact if provided
        if (newContactData.first_name || newContactData.email) {
          const { data: contactData, error: contactError } = await supabase
            .from("contacts")
            .insert([
              {
                first_name: newContactData.first_name,
                last_name: newContactData.last_name,
                email: newContactData.email,
                phone: newContactData.phone || null,
                preferred_language: newContactData.preferred_language,
                prospect_id: prospectPartnerId,
              },
            ])
            .select("id")

          if (contactError) throw contactError
          contactId = contactData?.[0]?.id
        }
      }

      // Update opportunity with prospect_id and primary_contact_id
      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          prospect_id: prospectPartnerId,
          primary_contact_id: contactId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunityId)

      if (updateError) throw updateError

      toast({
        title: t("common.success"),
        description: t("opportunities.prospect.relationshipSaved"),
      })

      onOpenChange(false)
      handleReset()
      onSuccess?.()
    } catch (err) {
      console.error("Error saving:", err)
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setProspectSearchQuery("")
    setShowProspectResults(false)
    setSelectedProspectPartner(null)
    setProspectPartnerContacts([])
    setSelectedContact(null)
    setIsCreatingNew(false)
    setNewProspectData({ name: "", website: "", main_country_id: "", lead_source: "" })
    setNewContactData({ first_name: "", last_name: "", email: "", phone: "", preferred_language: "es" })
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) handleReset()
      onOpenChange(newOpen)
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? t("opportunities.prospect.selectPartner") : t("opportunities.prospect.selectContact")}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? t("opportunities.prospect.selectPartnerDescription")
              : t("opportunities.prospect.selectContactDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Select or create prospect partner */}
          {step === 1 && (
            <>
              {!isCreatingNew ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("opportunities.prospect.name")}</Label>
                    <div className="relative">
                      <Input
                        placeholder={t("opportunities.prospect.searchOrCreate")}
                        value={prospectSearchQuery}
                        onChange={(e) => setProspectSearchQuery(e.target.value)}
                        onFocus={() => prospectSearchQuery && setShowProspectResults(true)}
                        className="text-base"
                      />
                      {showProspectResults && prospectSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50 max-h-48 overflow-y-auto">
                          {prospectSearchResults.map((prospect) => (
                            <button
                              key={prospect.id}
                              type="button"
                              onClick={() => handleSelectExistingProspect(prospect)}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-sm">{prospect.name}</div>
                              <div className="text-xs text-gray-500">{prospect.website || "Sin website"}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleCreateNewProspect}>
                      {t("opportunities.prospect.createNew")}
                    </Button>
                  </div>
                </>
              ) : (
                // Create new prospect form
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("opportunities.prospect.name")} *</Label>
                    <Input
                      placeholder="Nombre de la empresa"
                      value={newProspectData.name}
                      onChange={(e) => setNewProspectData({ ...newProspectData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("opportunities.prospect.website")}</Label>
                    <Input
                      placeholder="https://example.com"
                      value={newProspectData.website}
                      onChange={(e) => setNewProspectData({ ...newProspectData, website: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("opportunities.prospect.country")} *</Label>
                    <Select value={newProspectData.main_country_id} onValueChange={(value) => {
                      setNewProspectData({ ...newProspectData, main_country_id: value })
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("opportunities.prospect.leadSource")} *</Label>
                    <Select value={newProspectData.lead_source} onValueChange={(value) => {
                      setNewProspectData({ ...newProspectData, lead_source: value })
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCES_LIST.map((source) => (
                          <SelectItem key={source} value={source}>
                            {t(`opportunities.leadSource.${source}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" onClick={() => setIsCreatingNew(false)} className="w-full">
                    {t("common.cancel")}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Select contact or create new */}
          {step === 2 && (
            <>
              {prospectPartnerContacts.length > 0 && !isCreatingNew ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t("opportunities.prospect.selectContact")}</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {prospectPartnerContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-green-50 transition-colors ${
                          selectedContact?.id === contact.id ? "bg-green-100" : ""
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{contact.email}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Create new contact form
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">{t("opportunities.prospect.createContact")}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("contacts.form.firstName")}</Label>
                      <Input
                        value={newContactData.first_name}
                        onChange={(e) => setNewContactData({ ...newContactData, first_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("contacts.form.lastName")}</Label>
                      <Input
                        value={newContactData.last_name}
                        onChange={(e) => setNewContactData({ ...newContactData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("contacts.form.email")}</Label>
                    <Input
                      type="email"
                      value={newContactData.email}
                      onChange={(e) => setNewContactData({ ...newContactData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("contacts.form.phone")}</Label>
                    <Input
                      value={newContactData.phone}
                      onChange={(e) => setNewContactData({ ...newContactData, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => {
            if (step === 2) {
              setStep(1)
              setIsCreatingNew(false)
            } else {
              onOpenChange(false)
              handleReset()
            }
          }}>
            {step === 2 ? t("common.back") : t("common.cancel")}
          </Button>
          <Button
            disabled={step === 1 ? !selectedProspectPartner && !isCreatingNew : !selectedContact}
            onClick={() => {
              if (step === 1 && isCreatingNew) {
                setStep(2)
              } else {
                handleSave()
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {step === 2 ? (isSaving ? t("common.saving") : t("common.save")) : t("common.next")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
