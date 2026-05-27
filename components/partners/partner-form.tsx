"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from "@/components/ui/image-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { type Partner, type PartnerFormData, PartnerService } from "@/lib/services/partner-service"
import { PartnerTechCompanyService } from "@/lib/services/partner-tech-company-service"
import { TechCompanyService } from "@/lib/services/tech-company-service"
import { UserService } from "@/lib/services/user-service"
import { ProspectConversionService } from "@/lib/services/prospect-conversion-service"
import type { ProspectPartner } from "@/types/prospect-partner"

// Añadir importación del hook de traducciones
import { useTranslations } from "@/hooks/use-translations"

// Esquema de validación
const partnerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  logo: z.any().optional(),
  website: z.string().url("Ingresa una URL válida").or(z.literal("")).optional(),
  address: z.string().max(500, "La dirección no puede exceder los 500 caracteres").optional(),
  main_country_id: z.string().optional(),
  city: z.string().max(100, "La ciudad no puede exceder los 100 caracteres").optional(),
  postal_code: z.string().max(20, "El código postal no puede exceder los 20 caracteres").optional(),
  is_active: z.boolean().default(true),
  country_ids: z.array(z.string()).default([]),
})

interface PartnerFormProps {
  initialData?: Partner
  initialProspect?: ProspectPartner | null
}

export function PartnerForm({ initialData, initialProspect }: PartnerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [availableCountries, setAvailableCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const isEditing = !!initialData
  const [techCompanies, setTechCompanies] = useState<{ id: string; name: string }[]>([])
  const [scaleupManagers, setScaleupManagers] = useState<{ id: string; name: string }[]>([])
  const [selectedTechCompany, setSelectedTechCompany] = useState<string | undefined>(undefined)
  const [selectedManager, setSelectedManager] = useState<string | undefined>(undefined)
  const [showTechCompanySection, setShowTechCompanySection] = useState(false)
  const { t } = useTranslations()

  // Cargar países
  useEffect(() => {
    const loadCountries = async () => {
      const countriesData = await PartnerService.getCountries()
      setCountries(countriesData)
      setAvailableCountries(countriesData)
    }

    loadCountries()
  }, [])

  // Cargar empresas tecnológicas y gestores de ScaleUp
  useEffect(() => {
    const loadTechCompaniesAndManagers = async () => {
      if (!isEditing) {
        try {
          // Cargar empresas tecnológicas
          const techCompaniesData = await TechCompanyService.getTechCompaniesBasic()
          setTechCompanies(techCompaniesData)

          // Cargar usuarios de ScaleUp (filtrar por roles BDD o Admin)
          const { data: usersData } = await UserService.getUsers(1, 100)
          const scaleupUsers = usersData.filter((user) => user.role_code === "BDD" || user.role_code === "Admin")

          setScaleupManagers(
            scaleupUsers.map((user) => ({
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
            })),
          )
        } catch (err) {
          console.error("Error al cargar datos:", err)
        }
      }
    }

    loadTechCompaniesAndManagers()
  }, [isEditing])

  // Cargar países del partner si estamos editando
  useEffect(() => {
    const loadPartnerCountries = async () => {
      if (isEditing && initialData?.id) {
        const countryIds = await PartnerService.getPartnerCountryIds(initialData.id)
        setSelectedCountries(countryIds)
      }
    }

    loadPartnerCountries()
  }, [isEditing, initialData?.id])

  // Actualizar valores del form cuando initialProspect cambia
  useEffect(() => {
    if (initialProspect) {
      form.reset({
        name: initialProspect.name || "",
        logo: undefined,
        website: initialProspect.website || "",
        address: initialProspect.address || "",
        main_country_id: initialProspect.main_country_id || undefined,
        city: "",
        postal_code: "",
        is_active: true,
        country_ids: [],
      })
    }
  }, [initialProspect, form])
        setSelectedCountries(countryIds)

        // Actualizar el formulario con los países seleccionados
        form.setValue("country_ids", countryIds)
      }
    }

    loadPartnerCountries()
  }, [isEditing, initialData])

  // Inicializar el formulario
  const form = useForm<z.infer<typeof partnerSchema>>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: initialData?.name || initialProspect?.name || "",
      logo: initialData?.logo_url || undefined,
      website: initialData?.website || initialProspect?.website || "",
      address: initialData?.address || initialProspect?.address || "",
      main_country_id: initialData?.main_country_id || initialProspect?.main_country_id || undefined,
      city: initialData?.city || "",
      postal_code: initialData?.postal_code || "",
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
      country_ids: [],
    },
  })

  const onSubmit = useCallback(
    async (values: z.infer<typeof partnerSchema>) => {
      setIsSubmitting(true)
      setError(null)

      try {
        const formData: PartnerFormData = {
          name: values.name,
          logo: values.logo || null,
          website: values.website || null,
          address: values.address || null,
          main_country_id: values.main_country_id || null,
          city: values.city || null,
          postal_code: values.postal_code || null,
          is_active: values.is_active,
          country_ids: values.country_ids,
        }

        let result: Partner | null

        if (isEditing && initialData) {
          result = await PartnerService.updatePartner(initialData.id, formData)
        } else {
          result = await PartnerService.createPartner(formData)

          // Si se creó el partner y se seleccionó una tech company, crear la relación
          if (result && selectedTechCompany && showTechCompanySection) {
            try {
              await PartnerTechCompanyService.createPartnerTechCompany({
                partner_id: result.id,
                tech_company_id: selectedTechCompany,
                scaleup_manager_id: selectedManager === "null" ? null : selectedManager || null,
              })
            } catch (err: any) {
              console.error("Error al crear la relación partner-tech:", err)
              // No interrumpimos el flujo si falla la creación de la relación
            }
          }
        }

        if (result) {
          // Si se creó el partner desde un prospect, actualizar el prospect y sus contacts
          if (initialProspect && initialProspect.id) {
            const conversionResult = await ProspectConversionService.convertProspectToPartner(
              initialProspect.id,
              result.id,
            )

            if (!conversionResult.success) {
              console.error("Error en conversión de prospect:", conversionResult.error)
              // No interrumpimos el flujo, el partner fue creado correctamente
            }
          }

          router.push("/dashboard/partners")
          router.refresh()
        } else {
          throw new Error("No se pudo guardar el partner")
        }
      } catch (err: any) {
        setError(err.message || "Ocurrió un error al guardar el partner")
      } finally {
        setIsSubmitting(false)
      }
    },
    [router, isEditing, initialData, selectedTechCompany, selectedManager, showTechCompanySection],
  )

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  // Manejar la selección de países
  const handleCountrySelect = (countryId: string) => {
    const currentCountries = form.getValues("country_ids")

    // Si ya está seleccionado, lo quitamos
    if (currentCountries.includes(countryId)) {
      const updatedCountries = currentCountries.filter((id) => id !== countryId)
      form.setValue("country_ids", updatedCountries)
      setSelectedCountries(updatedCountries)
    } else {
      // Si no está seleccionado, lo agregamos
      const updatedCountries = [...currentCountries, countryId]
      form.setValue("country_ids", updatedCountries)
      setSelectedCountries(updatedCountries)
    }
  }

  // Obtener el nombre de un país por su ID
  const getCountryName = (countryId: string) => {
    const country = countries.find((c) => c.id === countryId)
    return country ? country.name : "País desconocido"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? t("edit_partner") : t("create_partner")}</CardTitle>
        <CardDescription>{isEditing ? t("update_partner_info") : t("enter_partner_data")}</CardDescription>
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
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("partner_name_placeholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("partner_full_name")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && initialData?.code && (
                <div className="space-y-2">
                  <FormLabel>{t("code")}</FormLabel>
                  <Input value={initialData.code} disabled />
                  <FormDescription>{t("partner_code_description")}</FormDescription>
                </div>
              )}

              {!isEditing && (
                <div className="space-y-2">
                  <FormLabel>{t("code")}</FormLabel>
                  <Input value={t("code_auto_generated")} disabled />
                  <FormDescription>{t("code_generated_from_name")}</FormDescription>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload value={field.value} onChange={field.onChange} label={t("logo")} />
                    </FormControl>
                    <FormDescription>{t("partner_logo_optional")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("website")}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://ejemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>{t("partner_website_optional")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("partner_address")} className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormDescription>{t("partner_address_optional")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="main_country_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("main_country")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_country")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("partner_main_country")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("city")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("postal_code")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("postal_code")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Selector de países donde opera */}
            <FormField
              control={form.control}
              name="country_ids"
              render={() => (
                <FormItem>
                  <FormLabel>{t("operating_countries")}</FormLabel>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedCountries.length > 0 ? (
                        selectedCountries.map((countryId) => (
                          <Badge key={countryId} variant="secondary" className="flex items-center gap-1">
                            {getCountryName(countryId)}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleCountrySelect(countryId)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("no_countries_selected")}</p>
                      )}
                    </div>

                    <div className="border rounded-md p-4">
                      <div className="text-sm font-medium mb-2">{t("select_countries")}:</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {countries.map((country) => (
                          <div key={country.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`country-${country.id}`}
                              checked={selectedCountries.includes(country.id)}
                              onCheckedChange={() => handleCountrySelect(country.id)}
                            />
                            <label htmlFor={`country-${country.id}`} className="text-sm cursor-pointer">
                              {country.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <FormDescription>{t("select_all_operating_countries")}</FormDescription>
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
                    <FormLabel>{t("active")}</FormLabel>
                    <FormDescription>{t("partner_active_description")}</FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <div className="space-y-4 border rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-tech-company"
                    checked={showTechCompanySection}
                    onCheckedChange={(checked) => setShowTechCompanySection(checked === true)}
                  />
                  <label htmlFor="show-tech-company" className="text-sm font-medium cursor-pointer">
                    {t("associate_tech_company")}
                  </label>
                </div>

                {showTechCompanySection && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("tech_company")}</label>
                      <Select onValueChange={setSelectedTechCompany} value={selectedTechCompany}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_tech_company")} />
                        </SelectTrigger>
                        <SelectContent>
                          {techCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">{t("select_tech_company_description")}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("scaleup_manager")}</label>
                      <Select onValueChange={setSelectedManager} value={selectedManager}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_scaleup_manager")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">{t("no_manager")}</SelectItem>
                          {scaleupManagers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">{t("select_scaleup_manager_description")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? t("updating") : t("creating")}
                  </>
                ) : isEditing ? (
                  t("update")
                ) : (
                  t("create")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default PartnerForm
