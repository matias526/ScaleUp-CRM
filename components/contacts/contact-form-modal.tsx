"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { type Contact, type ContactFormData, ContactService } from "@/lib/services/contact-service"
import { UserService } from "@/lib/services/user-service"
import { TechCompanyService } from "@/lib/services/tech-company-service"
import { PartnerService } from "@/lib/services/partner-service"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"
import { useEffect } from "react"

const contactModalSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  department: z.string().min(1, "Selecciona un departamento"),
  preferred_language: z.string().default("es"),
  tech_company_id: z.string().optional().or(z.literal("")),
  partner_id: z.string().optional().or(z.literal("")),
  end_customer_id: z.string().optional().or(z.literal("")),
  user_id: z.string().optional().or(z.literal("")),
  linkedin_url: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

interface ContactFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (contact: Contact) => void
  initialData?: {
    tech_company_id?: string
    partner_id?: string
    end_customer_id?: string
    first_name?: string
    last_name?: string
    email?: string
  }
}

const DEPARTMENTS = [
  { value: "sales", label: "contacts.department.sales" },
  { value: "technical", label: "contacts.department.technical" },
  { value: "marketing", label: "contacts.department.marketing" },
  { value: "operations", label: "contacts.department.operations" },
  { value: "finance", label: "contacts.department.finance" },
  { value: "hr", label: "contacts.department.hr" },
  { value: "executive", label: "contacts.department.executive" },
  { value: "other", label: "contacts.department.other" },
]

const LANGUAGES = [
  { value: "es", label: "contacts.language.spanish" },
  { value: "en", label: "contacts.language.english" },
  { value: "pt", label: "contacts.language.portuguese" },
]

export function ContactFormModal({ open, onOpenChange, onSuccess, initialData }: ContactFormModalProps) {
  const { t } = useTranslations(DICT_LANG_CONTACTS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRelationships, setShowRelationships] = useState(false)
  const [users, setUsers] = useState<{ id: string; label: string }[]>([])
  const [techCompanies, setTechCompanies] = useState<{ id: string; label: string }[]>([])
  const [partners, setPartners] = useState<{ id: string; label: string }[]>([])

  // Load relationship options
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allUsers, companies, partnersRes] = await Promise.all([
          UserService.getUsers(),
          TechCompanyService.getTechCompanies(),
          PartnerService.getPartners(1, 100),
        ])

        if (Array.isArray(allUsers)) {
          setUsers(
            allUsers.map((u) => ({
              id: u.id,
              label: `${u.first_name} ${u.last_name} (${u.email})`,
            })),
          )
        }

        if (Array.isArray(companies)) {
          setTechCompanies(companies.map((c) => ({ id: c.id, label: c.name })))
        }

        if (partnersRes?.data && Array.isArray(partnersRes.data)) {
          setPartners(partnersRes.data.map((p) => ({ id: p.id, label: p.name })))
        }
      } catch (err) {
        console.error("Error loading relationships:", err)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  const form = useForm<z.infer<typeof contactModalSchema>>({
    resolver: zodResolver(contactModalSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      phone: "",
      position: "",
      department: "",
      preferred_language: "es",
      tech_company_id: initialData?.tech_company_id || "",
      partner_id: initialData?.partner_id || "",
      end_customer_id: initialData?.end_customer_id || "",
      user_id: "",
      linkedin_url: "",
      notes: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof contactModalSchema>) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const contactData: ContactFormData = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || null,
        position: values.position || null,
        department: values.department,
        preferred_language: values.preferred_language,
        tech_company_id: values.tech_company_id || null,
        partner_id: values.partner_id || null,
        end_customer_id: values.end_customer_id || null,
        user_id: values.user_id || null,
        linkedin_url: values.linkedin_url || null,
        notes: values.notes || null,
      }

      const result = await ContactService.createContact(contactData)

      if (result) {
        onSuccess?.(result)
        onOpenChange(false)
        form.reset()
      } else {
        throw new Error("No se pudo crear el contacto")
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al crear el contacto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("contacts.modal.title")}</DialogTitle>
          <DialogDescription>
            {t("contacts.modal.description")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Relationships - Collapsible */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRelationships(!showRelationships)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-sm font-semibold">{t("contacts.form.section.relationships")}</h3>
                {showRelationships ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showRelationships && (
                <div className="p-3 space-y-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="tech_company_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t("contacts.form.techCompany")}</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder={t("contacts.filter.all")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {techCompanies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="partner_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t("contacts.form.partner")}</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder={t("contacts.filter.all")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {partners.map((partner) => (
                                <SelectItem key={partner.id} value={partner.id}>
                                  {partner.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">{t("contacts.form.linkedUser")}</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={t("contacts.filter.all")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t("contacts.form.section.basic")}</h3>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{t("contacts.form.firstName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("contacts.placeholder.enterFirstName")}
                          className="h-8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{t("contacts.form.lastName")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("contacts.placeholder.enterLastName")}
                          className="h-8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{t("contacts.form.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("contacts.placeholder.enterEmail")}
                        className="h-8"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{t("contacts.form.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t("contacts.placeholder.enterPhone")}
                        className="h-8"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{t("contacts.form.preferredLanguage")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {t(lang.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Professional Information */}
            <div className="space-y-3 border-t pt-3">
              <h3 className="text-sm font-semibold">{t("contacts.form.section.professional")}</h3>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{t("contacts.form.position")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("contacts.placeholder.enterPosition")}
                          className="h-8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{t("contacts.form.department")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {t(dept.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

              )}
            </div>

            {/* LinkedIn and Notes - Optional Footer */}
            <div className="border-t pt-2 space-y-2">
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{t("contacts.form.linkedin")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        className="h-8"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{t("contacts.form.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("contacts.placeholder.enterNotes")}
                        className="min-h-16 resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("contacts.modal.cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("contacts.modal.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
