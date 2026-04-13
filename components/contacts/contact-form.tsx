"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { type Contact, type ContactFormData, ContactService } from "@/lib/services/contact-service"
import { UserService } from "@/lib/services/user-service"
import { TechCompanyService } from "@/lib/services/tech-company-service"
import { PartnerService } from "@/lib/services/partner-service"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"

// Validation schema
const contactSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  department: z.string().min(1, "Selecciona un departamento"),
  preferred_language: z.string().default("es"),
  user_id: z.string().optional().or(z.literal("")),
  tech_company_id: z.string().optional().or(z.literal("")),
  partner_id: z.string().optional().or(z.literal("")),
  end_customer_id: z.string().optional().or(z.literal("")),
  linkedin_url: z.string().url("URL inválida").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

interface ContactFormProps {
  initialData?: Contact
  onSuccess?: (contact: Contact) => void
  showCancel?: boolean
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

export function ContactForm({ initialData, onSuccess, showCancel = true }: ContactFormProps) {
  const router = useRouter()
  const { t } = useTranslations(DICT_LANG_CONTACTS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<{ id: string; label: string }[]>([])
  const [techCompanies, setTechCompanies] = useState<{ id: string; label: string }[]>([])
  const [partners, setPartners] = useState<{ id: string; label: string }[]>([])
  const isEditing = !!initialData

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      position: initialData?.position || "",
      department: initialData?.department || "",
      preferred_language: initialData?.preferred_language || "es",
      user_id: initialData?.user_id || "",
      tech_company_id: initialData?.tech_company_id || "",
      partner_id: initialData?.partner_id || "",
      end_customer_id: initialData?.end_customer_id || "",
      linkedin_url: initialData?.linkedin_url || "",
      notes: initialData?.notes || "",
    },
  })

  // Load users for combobox
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await UserService.getUsers()
        if (Array.isArray(allUsers)) {
          const formattedUsers = allUsers.map((user) => ({
            id: user.id,
            label: `${user.first_name} ${user.last_name} (${user.email})`,
          }))
          setUsers(formattedUsers)
        } else {
          console.error("Error loading users: users is not an array")
          setUsers([])
        }
      } catch (err) {
        console.error("Error loading users:", err)
        setUsers([])
      }
    }

    loadUsers()
  }, [])

  // Load tech companies
  useEffect(() => {
    const loadTechCompanies = async () => {
      try {
        const companies = await TechCompanyService.getTechCompanies()
        if (Array.isArray(companies)) {
          const formattedCompanies = companies.map((company) => ({
            id: company.id,
            label: company.name,
          }))
          setTechCompanies(formattedCompanies)
        } else {
          console.error("Error loading tech companies: not an array")
          setTechCompanies([])
        }
      } catch (err) {
        console.error("Error loading tech companies:", err)
        setTechCompanies([])
      }
    }

    loadTechCompanies()
  }, [])

  // Load partners
  useEffect(() => {
    const loadPartners = async () => {
      try {
        const response = await PartnerService.getPartners(1, 100)
        let partners_array = []
        if (response && response.data && Array.isArray(response.data)) {
          partners_array = response.data
        } else if (Array.isArray(response)) {
          partners_array = response
        }

        const formattedPartners = partners_array.map((partner) => ({
          id: partner.id,
          label: partner.name,
        }))
        setPartners(formattedPartners)
      } catch (err) {
        console.error("Error loading partners:", err)
        setPartners([])
      }
    }

    loadPartners()
  }, [])

  const onSubmit = useCallback(
    async (values: z.infer<typeof contactSchema>) => {
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
          user_id: values.user_id || null,
          tech_company_id: values.tech_company_id || null,
          partner_id: values.partner_id || null,
          end_customer_id: values.end_customer_id || null,
          linkedin_url: values.linkedin_url || null,
          notes: values.notes || null,
        }

        let result: Contact | null

        if (isEditing && initialData) {
          result = await ContactService.updateContact(initialData.id, contactData)
          if (result) {
            onSuccess?.(result)
            router.push("/dashboard/contacts")
            router.refresh()
          }
        } else {
          result = await ContactService.createContact(contactData)
          if (result) {
            onSuccess?.(result)
            router.push("/dashboard/contacts")
            router.refresh()
          }
        }

        if (!result) {
          throw new Error("No se pudo guardar el contacto")
        }
      } catch (err: any) {
        setError(err.message || "Ocurrió un error al guardar el contacto")
      } finally {
        setIsSubmitting(false)
      }
    },
    [isEditing, initialData, router, onSuccess],
  )

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.form.section.basic")}</CardTitle>
              <CardDescription>
                {t("contacts.form.section.basicDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contacts.form.firstName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("contacts.placeholder.enterFirstName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contacts.form.lastName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("contacts.placeholder.enterLastName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contacts.form.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("contacts.placeholder.enterEmail")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contacts.form.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t("contacts.placeholder.enterPhone")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contacts.form.preferredLanguage")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("contacts.form.preferredLanguage")} />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.form.section.professional")}</CardTitle>
              <CardDescription>
                {t("contacts.form.section.professionalDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contacts.form.position")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("contacts.placeholder.enterPosition")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contacts.form.department")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("contacts.form.department")} />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contacts.form.linkedinUrl")}</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder={t("contacts.placeholder.enterLinkedinUrl")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contacts.form.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("contacts.placeholder.enterNotes")}
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 3: Relationships */}
          <Card>
            <CardHeader>
              <CardTitle>{t("contacts.form.section.relationships")}</CardTitle>
              <CardDescription>
                {t("contacts.form.section.relationshipsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("contacts.form.linkedUser")}</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("contacts.userCombobox.placeholder")} />
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
                    <FormDescription>{t("contacts.form.optional")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tech_company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contacts.form.techCompany")}</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("contacts.userCombobox.placeholder")} />
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
                      <FormDescription>{t("contacts.form.optional")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partner_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("contacts.form.partner")}</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("contacts.userCombobox.placeholder")} />
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
                      <FormDescription>{t("contacts.form.optional")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-between gap-3">
            {showCancel && (
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                {t("contacts.modal.cancel")}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="ml-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t("contacts.form.save") || "Guardar" : t("contacts.modal.save") || "Crear"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
