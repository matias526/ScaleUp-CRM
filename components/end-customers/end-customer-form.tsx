"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useTranslations } from "@/hooks/use-translations"
import { getIndustries } from "@/lib/services/industry-service"
import { debugIndustries } from "@/lib/services/industry-service-debug"
import type { EndCustomer } from "@/lib/services/end-customer-service"
import { createEndCustomer, updateEndCustomer } from "@/lib/services/end-customer-service"
import type { Industry } from "@/lib/services/industry-service"

interface EndCustomerFormProps {
  customer?: EndCustomer
  countries: { id: string; name: string; code: string }[]
}

export function EndCustomerForm({ customer, countries }: EndCustomerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loadingIndustries, setLoadingIndustries] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const formSchema = z.object({
    name: z.string().min(1, t("validation.required", "El nombre es requerido")),
    industry_id: z.string().optional(),
    website: z.string().optional(),
    country_id: z.string().optional(),
    city: z.string().optional(),
    primary_contact_name: z.string().optional(),
    primary_contact_email: z
      .string()
      .email(t("validation.invalid_email", "Email inválido"))
      .optional()
      .or(z.literal("")),
    primary_contact_phone: z.string().optional(),
    tax_id: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || "",
      industry_id: customer?.industry_id || "",
      website: customer?.website || "",
      country_id: customer?.country_id || "",
      city: customer?.city || "",
      primary_contact_name: customer?.primary_contact_name || "",
      primary_contact_email: customer?.primary_contact_email || "",
      primary_contact_phone: customer?.primary_contact_phone || "",
      tax_id: customer?.tax_id || "",
    },
  })

  // Cargar industrias con debug
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        console.log("🚀 Loading industries...")

        // Debug primero
        const debug = await debugIndustries()
        setDebugInfo(debug)
        console.log("🔍 Debug result:", debug)

        // Luego el servicio normal
        const industriesData = await getIndustries()
        console.log("📋 Industries data:", industriesData)
        setIndustries(industriesData)
      } catch (error) {
        console.error("💥 Error loading industries:", error)
      } finally {
        setLoadingIndustries(false)
      }
    }

    loadIndustries()
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const cleanedValues = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value === "" ? null : value]),
      )

      if (customer) {
        await updateEndCustomer(customer.id, cleanedValues)
        toast({
          title: t("end_customers.updated_success", "Cliente actualizado"),
          description: t("end_customers.updated_success_message", "El cliente final ha sido actualizado correctamente"),
        })
      } else {
        await createEndCustomer(cleanedValues)
        toast({
          title: t("end_customers.created_success", "Cliente creado"),
          description: t("end_customers.created_success_message", "El cliente final ha sido creado correctamente"),
        })
      }
      router.push("/dashboard/end-customers")
      router.refresh()
    } catch (error) {
      console.error("Error al guardar cliente final:", error)
      toast({
        title: t("common.error", "Error"),
        description: t("end_customers.save_error", "Ocurrió un error al guardar el cliente final"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>
            {customer
              ? t("end_customers.edit_title", "Editar Cliente Final")
              : t("end_customers.create_title", "Crear Cliente Final")}
          </CardTitle>
          <CardDescription>
            {t("end_customers.form_description", "Complete la información del cliente final")}
          </CardDescription>
          {/* Debug info */}
          {debugInfo && (
            <div className="text-xs bg-gray-100 p-2 rounded">
              <strong>Debug:</strong> All: {debugInfo.all?.length || 0}, Active: {debugInfo.active?.length || 0}
              {debugInfo.errors?.allError && (
                <div className="text-red-500">Error: {JSON.stringify(debugInfo.errors.allError)}</div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("end_customers.name", "Nombre")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder={t("end_customers.name_placeholder", "Nombre del cliente final")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">
                {t("end_customers.industry", "Industria")}
                <span className="text-xs text-gray-500 ml-2">({industries.length} disponibles)</span>
              </Label>
              <Select
                value={form.watch("industry_id") || ""}
                onValueChange={(value) => form.setValue("industry_id", value)}
                disabled={loadingIndustries}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingIndustries
                        ? t("common.loading", "Cargando...")
                        : t("end_customers.select_industry", "Seleccionar industria")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none", "Ninguna")}</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">{t("end_customers.website", "Sitio web")}</Label>
              <Input
                id="website"
                {...form.register("website")}
                placeholder={t("end_customers.website_placeholder", "https://www.ejemplo.com")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">{t("end_customers.tax_id", "ID Fiscal")}</Label>
              <Input
                id="tax_id"
                {...form.register("tax_id")}
                placeholder={t("end_customers.tax_id_placeholder", "NIF, CIF, RFC, etc.")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t("end_customers.country", "País")}</Label>
              <Select
                value={form.watch("country_id") || ""}
                onValueChange={(value) => form.setValue("country_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("end_customers.select_country", "Seleccionar país")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none", "Ninguno")}</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t("end_customers.city", "Ciudad")}</Label>
              <Input id="city" {...form.register("city")} placeholder={t("end_customers.city_placeholder", "Ciudad")} />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">{t("end_customers.contact_info", "Información de contacto")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_name">{t("end_customers.contact_name", "Nombre de contacto")}</Label>
                <Input
                  id="primary_contact_name"
                  {...form.register("primary_contact_name")}
                  placeholder={t("end_customers.contact_name_placeholder", "Nombre completo")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_email">{t("end_customers.contact_email", "Email de contacto")}</Label>
                <Input
                  id="primary_contact_email"
                  type="email"
                  {...form.register("primary_contact_email")}
                  placeholder={t("end_customers.contact_email_placeholder", "email@ejemplo.com")}
                />
                {form.formState.errors.primary_contact_email && (
                  <p className="text-sm text-destructive">{form.formState.errors.primary_contact_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_phone">
                  {t("end_customers.contact_phone", "Teléfono de contacto")}
                </Label>
                <Input
                  id="primary_contact_phone"
                  {...form.register("primary_contact_phone")}
                  placeholder={t("end_customers.contact_phone_placeholder", "+1 234 567 890")}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/end-customers")}
            disabled={isSubmitting}
          >
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>{t("common.saving", "Guardando...")}</>
            ) : customer ? (
              <>{t("common.save", "Guardar")}</>
            ) : (
              <>{t("common.create", "Crear")}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
