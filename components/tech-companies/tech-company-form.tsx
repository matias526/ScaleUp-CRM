"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from "@/components/ui/image-upload"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { type TechCompany, type TechCompanyFormData, TechCompanyService } from "@/lib/services/tech-company-service"
import { useTranslations } from "@/hooks/use-translations"

// Esquema de validación
const techCompanySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede exceder los 50 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "El código solo puede contener letras, números, guiones y guiones bajos"),
  logo: z.any().optional(),
  website: z.string().url("Ingresa una URL válida").or(z.literal("")).optional(),
  description: z.string().max(1000, "La descripción no puede exceder los 1000 caracteres").optional(),
  is_active: z.boolean().default(true),
})

interface TechCompanyFormProps {
  initialData?: TechCompany
}

export function TechCompanyForm({ initialData }: TechCompanyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData

  // Definir las claves de traducción que necesitamos
  const translationKeys = [
    "tech_companies.form.create_title",
    "tech_companies.form.edit_title",
    "tech_companies.form.create_description",
    "tech_companies.form.edit_description",
    "tech_companies.form.name",
    "tech_companies.form.name_placeholder",
    "tech_companies.form.name_description",
    "tech_companies.form.code",
    "tech_companies.form.code_placeholder",
    "tech_companies.form.code_description",
    "tech_companies.form.logo",
    "tech_companies.form.logo_description",
    "tech_companies.form.website",
    "tech_companies.form.website_placeholder",
    "tech_companies.form.website_description",
    "tech_companies.form.description",
    "tech_companies.form.description_placeholder",
    "tech_companies.form.description_help",
    "tech_companies.form.active",
    "tech_companies.form.active_description",
    "tech_companies.form.cancel",
    "tech_companies.form.create",
    "tech_companies.form.update",
    "tech_companies.form.creating",
    "tech_companies.form.updating",
  ]

  // Usar el hook de traducciones
  const { t } = useTranslations(translationKeys)

  // Inicializar el formulario
  const form = useForm<z.infer<typeof techCompanySchema>>({
    resolver: zodResolver(techCompanySchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      logo: initialData?.logo_url || undefined,
      website: initialData?.website || "",
      description: initialData?.description || "",
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    },
  })

  const onSubmit = async (values: z.infer<typeof techCompanySchema>) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData: TechCompanyFormData = {
        name: values.name,
        code: values.code,
        logo: values.logo instanceof File ? values.logo : null,
        website: values.website || null,
        description: values.description || null,
        is_active: values.is_active,
      }

      let result: TechCompany | null

      if (isEditing && initialData) {
        result = await TechCompanyService.updateTechCompany(initialData.id, formData)
      } else {
        result = await TechCompanyService.createTechCompany(formData)
      }

      if (result) {
        router.push("/dashboard/tech-companies")
        router.refresh()
      } else {
        throw new Error("No se pudo guardar la empresa tecnológica")
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar la empresa tecnológica")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? t("tech_companies.form.edit_title") : t("tech_companies.form.create_title")}</CardTitle>
        <CardDescription>
          {isEditing ? t("tech_companies.form.edit_description") : t("tech_companies.form.create_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tech_companies.form.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("tech_companies.form.name_placeholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("tech_companies.form.name_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tech_companies.form.code")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("tech_companies.form.code_placeholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("tech_companies.form.code_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        label={t("tech_companies.form.logo")}
                      />
                    </FormControl>
                    <FormDescription>{t("tech_companies.form.logo_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tech_companies.form.website")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("tech_companies.form.website_placeholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("tech_companies.form.website_description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tech_companies.form.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("tech_companies.form.description_placeholder")}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("tech_companies.form.description_help")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("tech_companies.form.active")}</FormLabel>
                    <FormDescription>{t("tech_companies.form.active_description")}</FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                {t("tech_companies.form.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? t("tech_companies.form.updating") : t("tech_companies.form.creating")}
                  </>
                ) : isEditing ? (
                  t("tech_companies.form.update")
                ) : (
                  t("tech_companies.form.create")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
