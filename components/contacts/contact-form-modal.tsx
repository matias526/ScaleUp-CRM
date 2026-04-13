"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { type Contact, type ContactFormData, ContactService } from "@/lib/services/contact-service"
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
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t(DICT_LANG_CONTACTS["contacts.form.section.basic"]["es"])}</h3>

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
              <h3 className="text-sm font-semibold">{t(DICT_LANG_CONTACTS["contacts.form.section.professional"]["es"])}</h3>

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
