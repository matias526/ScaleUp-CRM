"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PROSPECT_PARTNERS } from "@/lib/constants/dict-lang-prospect-partners"
import { ProspectPartnerService, type ProspectPartner } from "@/lib/services/prospect-partner-service"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProspectPartnerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ProspectPartner
  onSuccess?: () => void
}

export function ProspectPartnerFormModal({ open, onOpenChange, initialData, onSuccess }: ProspectPartnerFormModalProps) {
  const { t } = useTranslations(DICT_LANG_PROSPECT_PARTNERS)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    website: "",
    address: "",
    lead_source: "",
    main_country_id: "",
  })
  const [countries, setCountries] = useState<any[]>([])

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        website: initialData.website || "",
        address: initialData.address || "",
        lead_source: initialData.lead_source || "",
        main_country_id: initialData.main_country_id || "",
      })
    } else {
      setFormData({
        name: "",
        code: "",
        website: "",
        address: "",
        lead_source: "",
        main_country_id: "",
      })
    }
  }, [initialData, open])

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const { data, error } = await (window as any).supabase
          .from("countries")
          .select("id, name")
          .order("name")

        if (error) throw error
        setCountries(data || [])
      } catch (error) {
        console.error("Error loading countries:", error)
      }
    }

    if (open) {
      loadCountries()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        description: "El nombre es requerido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (initialData?.id) {
        await ProspectPartnerService.updateProspectPartner(initialData.id, formData)
      } else {
        await ProspectPartnerService.createProspectPartner(formData)
      }

      toast({
        description: t("prospect_partners.form.success"),
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error saving partner:", error)
      toast({
        description: t("prospect_partners.form.error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t("prospect_partners.form.edit") : t("prospect_partners.form.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("prospect_partners.form.name")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="code">{t("prospect_partners.form.code")}</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="website">{t("prospect_partners.form.website")}</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="country">{t("prospect_partners.form.country")}</Label>
            <Select value={formData.main_country_id} onValueChange={(value) => setFormData({ ...formData, main_country_id: value })}>
              <SelectTrigger id="country">
                <SelectValue placeholder={t("prospect_partners.form.country")} />
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

          <div>
            <Label htmlFor="address">{t("prospect_partners.form.address")}</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="leadSource">{t("prospect_partners.form.leadSource")}</Label>
            <Input
              id="leadSource"
              value={formData.lead_source}
              onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("prospect_partners.form.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "..." : t("prospect_partners.form.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
