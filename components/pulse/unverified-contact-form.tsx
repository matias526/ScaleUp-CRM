"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DICT_LANG_UNVERIFIED_CONTACTS } from "@/lib/translations/unverified-contacts"

interface UnverifiedContact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company_name: string
  position?: string
  industry_id?: string
  country_id?: string
  source: string
  status: string
}

interface UnverifiedContactFormProps {
  contact?: UnverifiedContact
  industries: Array<{ id: string; name: string }>
  onSuccess: () => void
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name: string
  position: string
  industry_id: string
  country_id: string
  source: string
  status: string
}

export function UnverifiedContactForm({ contact, industries, onSuccess }: UnverifiedContactFormProps) {
  const { t, language } = useTranslations()
  const dict = DICT_LANG_UNVERIFIED_CONTACTS
  const { register, handleSubmit, formState: { isSubmitting }, reset, setValue, watch } = useForm<FormData>({
    defaultValues: contact
      ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone || "",
          company_name: contact.company_name,
          position: contact.position || "",
          industry_id: contact.industry_id || "",
          country_id: contact.country_id || "",
          source: contact.source,
          status: contact.status,
        }
      : {
          source: "WEB_FORM",
          status: "NEW",
        },
  })

  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([])
  const sourceValue = watch("source")
  const statusValue = watch("status")

  useEffect(() => {
    loadCountries()
  }, [])

  const loadCountries = async () => {
    try {
      const { data } = await supabase.from("countries").select("id, name").eq("is_active", true)
      setCountries(data || [])
    } catch (error) {
      console.error("[v0] Error loading countries:", error)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (contact) {
        // Update
        const { error } = await supabase
          .from("unverified_contacts")
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            company_name: data.company_name,
            position: data.position || null,
            industry_id: data.industry_id || null,
            country_id: data.country_id || null,
            source: data.source,
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", contact.id)

        if (error) throw error
        toast({
          title: dict["unverified_contacts.success.updated"][language],
        })
      } else {
        // Create
        const { error } = await supabase.from("unverified_contacts").insert([
          {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            company_name: data.company_name,
            position: data.position || null,
            industry_id: data.industry_id || null,
            country_id: data.country_id || null,
            source: data.source,
            status: data.status,
          },
        ])

        if (error) throw error
        toast({
          title: dict["unverified_contacts.success.created"][language],
        })
      }

      reset()
      onSuccess()
    } catch (error) {
      console.error("[v0] Error saving contact:", error)
      toast({
        title: contact
          ? dict["unverified_contacts.error.updating"][language]
          : dict["unverified_contacts.error.creating"][language],
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">{dict["unverified_contacts.form.first_name"][language]}</Label>
          <Input {...register("first_name", { required: true })} placeholder="John" />
        </div>
        <div>
          <Label htmlFor="last_name">{dict["unverified_contacts.form.last_name"][language]}</Label>
          <Input {...register("last_name", { required: true })} placeholder="Doe" />
        </div>
      </div>

      {/* Contact Fields */}
      <div>
        <Label htmlFor="email">{dict["unverified_contacts.form.email"][language]}</Label>
        <Input {...register("email", { required: true })} type="email" placeholder="john@example.com" />
      </div>

      <div>
        <Label htmlFor="phone">{dict["unverified_contacts.form.phone"][language]}</Label>
        <Input {...register("phone")} placeholder="+1 (555) 000-0000" />
      </div>

      {/* Company Fields */}
      <div>
        <Label htmlFor="company_name">{dict["unverified_contacts.form.company_name"][language]}</Label>
        <Input {...register("company_name", { required: true })} placeholder="Acme Corp" />
      </div>

      <div>
        <Label htmlFor="position">{dict["unverified_contacts.form.position"][language]}</Label>
        <Input {...register("position")} placeholder="CEO" />
      </div>

      {/* Select Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{dict["unverified_contacts.form.industry"][language]}</Label>
          <Select value={watch("industry_id")} onValueChange={(value) => setValue("industry_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind.id} value={ind.id}>
                  {ind.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{dict["unverified_contacts.form.country"][language]}</Label>
          <Select value={watch("country_id")} onValueChange={(value) => setValue("country_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
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
      </div>

      {/* Source and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{dict["unverified_contacts.form.source"][language]}</Label>
          <Select value={sourceValue} onValueChange={(value) => setValue("source", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BULK_IMPORT">{dict["unverified_contacts.source.bulk_import"][language]}</SelectItem>
              <SelectItem value="WEB_FORM">{dict["unverified_contacts.source.web_form"][language]}</SelectItem>
              <SelectItem value="EVENT">{dict["unverified_contacts.source.event"][language]}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{dict["unverified_contacts.form.status"][language]}</Label>
          <Select value={statusValue} onValueChange={(value) => setValue("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">{dict["unverified_contacts.status.new"][language]}</SelectItem>
              <SelectItem value="CONTACTED">{dict["unverified_contacts.status.contacted"][language]}</SelectItem>
              <SelectItem value="GRADUATED">{dict["unverified_contacts.status.graduated"][language]}</SelectItem>
              <SelectItem value="DISCARDED">{dict["unverified_contacts.status.discarded"][language]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {contact ? "Guardar Cambios" : dict["unverified_contacts.button.new"][language]}
      </Button>
    </form>
  )
}
