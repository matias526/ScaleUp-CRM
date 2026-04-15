"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "@/hooks/use-translations"
import {
  createOpportunity,
  getOpportunityStages,
  getPartnerCountries,
  getScaleUpManager,
  getPartnerUsers,
  getScaleUpUsers,
  getOpportunityTechFields,
  createOpportunityTechValues,
  getAllCountries,
  getEndCustomers,
  createEndCustomer,
} from "@/lib/services/opportunity-service"
import type { Tables } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Tag,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  Plus,
  Check,
  Info,
  AlertCircle,
  UserCheck,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getOpportunityTechFieldsClient } from "@/lib/services/opportunity-tech-field-service-client"
import { FileUpload } from "@/components/file-upload"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getIndustries } from "@/lib/services/industry-service-client"

const DEFAULT_ALLOWED_FILE_TYPES = [
  "jpg", "jpeg", "png", "gif", "svg",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
  "zip", "rar",
]

const NO_PARTNER_VALUE = "no_partner"

async function getPartnersByTechCompanyId(techCompanyId: string): Promise<Tables<"partners">[]> {
  try {
    if (!techCompanyId) return []

    const { data, error } = await supabase
      .from("partner_tech_companies")
      .select(`partner_id`)
      .eq("tech_company_id", techCompanyId)

    if (error || !data || data.length === 0) return []

    const partnerIds = [...new Set(data.map((item) => item.partner_id))]

    const { data: partnersData, error: partnersError } = await supabase
      .from("partners")
      .select("id, name, logo_url, website, city, is_active")
      .in("id", partnerIds)
      .eq("is_active", true)
      .order("name", { ascending: true })

    return partnersError ? [] : (partnersData || [])
  } catch (error) {
    console.error("Error en getPartnersByTechCompanyId:", error)
    return []
  }
}

export function OpportunityCreateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStageId = searchParams.get("stage")

  const { user, userInfo } = useAuth()
  const { t, language, isLoaded } = useTranslations([
    "opportunities.create_title",
    "opportunities.form.title",
    "opportunities.form.description",
    "opportunities.form.stage",
    "opportunities.form.tech_company",
    "opportunities.form.partner",
    "opportunities.form.end_customer",
    "opportunities.form.estimated_value",
    "opportunities.form.tech_fields",
    "opportunities.form.submit",
    "opportunities.form.cancel",
    "opportunities.form.select_placeholder",
    "opportunities.form.new_end_customer",
    "opportunities.form.new_end_customer_name",
    "opportunities.form.create_end_customer",
    "opportunities.form.estimated_close_date",
    "opportunities.form.country",
    "opportunities.form.assigned_to",
    "opportunities.form.partner_responsible",
    "opportunities.form.no_countries",
    "opportunities.form.loading",
    "opportunities.form.responsible_persons",
    "opportunities.form.no_partner",
  ])

  // ✅ FIXED: Removed setForceUpdate and persistentData ref - using form.watch() instead
  const hasInitialized = useRef(false)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [techCompanies, setTechCompanies] = useState<Tables<"tech_companies">[]>([])
  const [filteredPartners, setFilteredPartners] = useState<Tables<"partners">[]>([])
  const [endCustomers, setEndCustomers] = useState<Tables<"end_customers">[]>([])
  const [techFields, setTechFields] = useState<any[]>([])
  const [allCountries, setAllCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [partnerCountries, setPartnerCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loadingStages, setLoadingStages] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingPartnerUsers, setLoadingPartnerUsers] = useState(false)
  const [scaleUpManager, setScaleUpManager] = useState<string | null>(null)
  const [loadingScaleUpManager, setLoadingScaleUpManager] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formProgress, setFormProgress] = useState(25)
  const [loadingTechFields, setLoadingTechFields] = useState(false)
  const [scaleUpUsers, setScaleUpUsers] = useState<any[]>([])
  const [partnerUsers, setPartnerUsers] = useState<any[]>([])
  const [newEndCustomerDialogOpen, setNewEndCustomerDialogOpen] = useState(false)
  const [isCreatingEndCustomer, setIsCreatingEndCustomer] = useState(false)
  const [endCustomerSearchQuery, setEndCustomerSearchQuery] = useState("")
  const [searchingEndCustomers, setSearchingEndCustomers] = useState(false)
  const [searchResults, setSearchResults] = useState<Tables<"end_customers">[]>([])
  const [industries, setIndustries] = useState<any[]>([])
  const [newEndCustomerData, setNewEndCustomerData] = useState({
    name: "",
    industry_id: "",
    website: "",
    tax_id: "",
    country_id: "",
  })

  // totalSteps es dinámico: 5 si hay campos técnicos, 4 si no
  const hasTechFields = techFields.length > 0
  const totalSteps = hasTechFields ? 5 : 4
  
  // Cuando se carga una tech company sin campos técnicos, saltar Paso 4
  useEffect(() => {
    if (currentStep === 4 && !hasTechFields) {
      setCurrentStep(5)
    }
  }, [hasTechFields, currentStep])

  const isAdmin = userInfo?.isAdmin || false
  const userRole = userInfo?.roleCode || ""
  const partnerId = userInfo?.partnerId
  const techCompanyId = userInfo?.techCompanyId
  const partnerCountriesFromUser = userInfo?.partnerCountries || []
  const isScaleUpUser = userRole.toLowerCase() !== "partneruser"

  // ✅ HELPER: safeSet function with deduplication to prevent infinite loops
  const safeSet = (field: keyof FormValues, value: any) => {
    const currentValue = form.getValues(field)
    if (currentValue === value) {
      return
    }
    form.setValue(field, value, { shouldValidate: false, shouldDirty: true })
  }

  // ✅ Validate only fields for current step
  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate: (keyof FormValues)[] = []

    if (currentStep === 1) {
      fieldsToValidate.push("title", "pipeline_stage_id", "tech_company_id")
    } else if (currentStep === 2) {
      fieldsToValidate.push("tech_company_id", "pipeline_stage_id")
      if (form.watch("partner_id")) {
        fieldsToValidate.push("partner_responsible_id")
      }
    } else if (currentStep === 3) {
      if (!isScaleUpUser && !form.watch("end_customer_id")) {
        form.setError("end_customer_id", { message: "El cliente final es obligatorio para usuarios Partner" })
        return false
      }
    }

    // Validate only the fields for this step
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate)
      console.log("[v0] Step", currentStep, "validation result:", isValid, "Fields validated:", fieldsToValidate)
      return isValid
    }

    return true
  }

  // ✅ SIMPLIFIED: Cleaner validation schema
  const formSchema = z.object({
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional(),
    pipeline_stage_id: z.string().min(1, "La etapa es obligatoria"),
    tech_company_id: z.string().min(1, "La empresa tecnológica es obligatoria"),
    partner_id: z.string().optional().nullable(),
    end_customer_id: z.string().optional().nullable(),
    estimated_value: z.coerce.number().optional().nullable(),
    tech_field_ids: z.array(z.string()).optional(),
    estimated_close_date: z.string().optional().nullable(),
    country: z.string().optional(),
    assigned_to: z.string().optional().nullable(),
    partner_responsible_id: z.string().optional().nullable(),
    is_new_partner: z.boolean().optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      title: "",
      description: "",
      pipeline_stage_id: preselectedStageId || "",
      tech_company_id: techCompanyId || "",
      partner_id: partnerId || null,
      end_customer_id: null,
      estimated_value: null,
      tech_field_ids: [],
      estimated_close_date: null,
      country: "",
      assigned_to: null,
      partner_responsible_id: null,
      is_new_partner: false,
    },
  })

  // ✅ FIXED: Use form.watch() instead of manual state
  const watchTechCompany = form.watch("tech_company_id")
  const watchPartner = form.watch("partner_id")

  // ✅ FIXED: Initialize form data ONCE on component mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    async function loadData() {
      try {
        setLoadingStages(true)

        // Load stages
        const stagesData = await getOpportunityStages()
        setStages(stagesData)

        // Set default stage for Partner users
        if (!isScaleUpUser) {
          const leadStage = stagesData.find((stage) => stage.code.toLowerCase() === "lead")
          if (leadStage) {
            form.setValue("pipeline_stage_id", leadStage.id, { shouldValidate: false })
          } else if (stagesData.length > 0) {
            form.setValue("pipeline_stage_id", stagesData[0].id, { shouldValidate: false })
          }
        } else if (stagesData.length > 0 && !preselectedStageId) {
          form.setValue("pipeline_stage_id", stagesData[0].id, { shouldValidate: false })
        } else if (preselectedStageId) {
          const stageExists = stagesData.some((stage) => stage.id === preselectedStageId)
          if (stageExists) {
            form.setValue("pipeline_stage_id", preselectedStageId, { shouldValidate: false })
          }
        }

        setLoadingStages(false)

        // Load tech companies - para ScaleUp users carga todas, para Partner users solo las asociadas
        if (isScaleUpUser) {
          // Para usuarios ScaleUp, cargar todas las tech companies activas
          const { data: techCompaniesData } = await supabase
            .from("tech_companies")
            .select("*")
            .eq("is_active", true)
            .order("name", { ascending: true })
          setTechCompanies(techCompaniesData || [])
        } else if (partnerId) {
          // Para usuarios Partner, cargar solo las asociadas a su partner
          const { data: relatedTechCompanies } = await supabase
            .from("partner_tech_companies")
            .select("tech_company_id")
            .eq("partner_id", partnerId)

          if (relatedTechCompanies && relatedTechCompanies.length > 0) {
            const techCompanyIds = relatedTechCompanies.map((item) => item.tech_company_id)
            const { data: techCompaniesData } = await supabase
              .from("tech_companies")
              .select("*")
              .in("id", techCompanyIds)
              .eq("is_active", true)
              .order("name", { ascending: true })

            setTechCompanies(techCompaniesData || [])

            if (techCompaniesData && techCompaniesData.length === 1) {
              form.setValue("tech_company_id", techCompaniesData[0].id, { shouldValidate: false })
            }
          }
        }

        // Load scale up users
        const users = await getScaleUpUsers()
        setScaleUpUsers(users)

        // Load all countries (para usarlos en el selector de país)
        const countries = await getAllCountries()
        setAllCountries(countries)

        // Load all end customers
        const customers = await getEndCustomers()
        setEndCustomers(customers)

        // Load industries for the modal
        const industriesData = await getIndustries()
        setIndustries(industriesData || [])
      } catch (error) {
        console.error("Error loading form data:", error)
        setError("Error al cargar los datos del formulario")
        setLoadingStages(false)
      }
    }

    loadData()
  }, [isScaleUpUser, techCompanyId, partnerId, preselectedStageId, form])

  // ✅ FIXED: Load partners when tech company changes
  useEffect(() => {
    if (!watchTechCompany) {
      setFilteredPartners([])
      return
    }

    const loadPartners = async () => {
      setLoadingPartners(true)
      try {
        const partners = await getPartnersByTechCompanyId(watchTechCompany)
        setFilteredPartners(partners)
      } catch (error) {
        console.error("Error loading partners:", error)
        setFilteredPartners([])
      } finally {
        setLoadingPartners(false)
      }
    }

    loadPartners()
  }, [watchTechCompany])

  // ✅ FIXED: Load partner users when partner changes
  useEffect(() => {
    if (!watchPartner) {
      setPartnerUsers([])
      return
    }

    const loadUsers = async () => {
      try {
        const users = await getPartnerUsers(watchPartner)
        setPartnerUsers(users)
      } catch (error) {
        console.error("Error loading partner users:", error)
        setPartnerUsers([])
      }
    }

    loadUsers()
  }, [watchPartner])

  // ✅ FIXED: Load partner countries when partner changes
  useEffect(() => {
    if (!watchPartner) {
      // Si no hay partner, mostrar todos los países
      setPartnerCountries(allCountries)
      return
    }

    const loadCountries = async () => {
      setLoadingCountries(true)
      try {
        const countries = await getPartnerCountries(watchPartner)
        setPartnerCountries(countries || [])
      } catch (error) {
        console.error("Error loading partner countries:", error)
        setPartnerCountries([])
      } finally {
        setLoadingCountries(false)
      }
    }

    loadCountries()
  }, [watchPartner, allCountries])

  // Handle form submission - Now only on Step 5 (Confirmation)
  const onSubmit = async (data: FormValues) => {
    try {
      console.log("[v0] onSubmit triggered - currentStep:", currentStep, "totalSteps:", totalSteps)
      console.log("[v0] Form data:", data)

      // Validate only the fields for the current step
      const isStepValid = await validateCurrentStep()
      console.log("[v0] Current step valid:", isStepValid)

      if (!isStepValid) {
        console.log("[v0] Step validation failed, not advancing")
        return
      }

      // If not on the final step, just advance to next step
      if (currentStep < totalSteps) {
        console.log("[v0] Moving to next step from", currentStep, "to", currentStep + 1)
        setCurrentStep(currentStep + 1)
        return
      }

      // Only create opportunity on the final step (Step 5)
      console.log("[v0] Creating opportunity with data:", data)
      setLoadingScaleUpManager(true)

      // Obtener el manager de ScaleUp que maneja la relación entre Tech Company y Partner (solo si hay Partner)
      let assignedToUserId = data.assigned_to || null
      
      if (data.partner_id && data.tech_company_id && isScaleUpUser) {
        try {
          const manager = await getScaleUpManager(data.tech_company_id, data.partner_id)
          if (manager) {
            assignedToUserId = manager.id
          }
        } catch (error) {
          console.error("Error al obtener el manager de ScaleUp:", error)
        }
      }

      // Preparar datos de la oportunidad
      const opportunityData: any = {
        name: data.title,
        description: data.description || null,
        pipeline_stage_id: data.pipeline_stage_id,
        tech_company_id: data.tech_company_id,
        partner_id: data.partner_id || null,
        end_customer_id: data.end_customer_id || null,
        estimated_value: data.estimated_value || null,
        estimated_close_date: data.estimated_close_date || null,
        country: data.country || null,
        is_new_partner: data.is_new_partner || false,
        assigned_to: assignedToUserId,
        partner_responsible_id: data.partner_responsible_id || null,
        created_by: user?.id,
      }

      // Preparar tech values si existen
      const techValues: Array<{ opportunity_tech_field_id: string; value: any; valueType: string }> = []
      
      if (data.tech_field_ids && data.tech_field_ids.length > 0) {
        // Los valores técnicos se recopilarían aquí si hay UI para ello
      }

      // Crear la oportunidad
      const result = await createOpportunity(opportunityData, techValues, userRole)
      
      toast({
        title: "Éxito",
        description: "Oportunidad creada correctamente",
      })
      router.push(`/dashboard/opportunities/${result.id}`)
    } catch (error) {
      console.error("Error creating opportunity:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la oportunidad",
        variant: "destructive",
      })
    } finally {
      setLoadingScaleUpManager(false)
    }
  }

  if (!isLoaded) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("opportunities.form.title") || "Crear Oportunidad"}</CardTitle>
          <CardDescription>
            Paso {currentStep} de {totalSteps} - {
              currentStep === 1 ? "Información básica"
              : currentStep === 2 ? "Empresas involucradas"
              : currentStep === 3 ? "Cliente y detalles financieros"
              : currentStep === 4 ? "Campos técnicos"
              : "Confirmación"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ===== PASO 1: INFORMACIÓN BÁSICA ===== */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-blue-600">Paso 1: Información Básica</div>
                  
                  {/* Título */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre descriptivo de la oportunidad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Descripción */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detalles adicionales sobre la oportunidad" className="min-h-24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Es oportunidad de nuevo partner */}
                  <FormField
                    control={form.control}
                    name="is_new_partner"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base cursor-pointer">¿Oportunidad para nuevo partner?</FormLabel>
                          <p className="text-sm text-gray-500">Marca si esta oportunidad es para incorporar un nuevo partner</p>
                        </div>
                        <FormControl>
                          <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Etapa del Pipeline */}
                  <FormField
                    control={form.control}
                    name="pipeline_stage_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etapa del Pipeline *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar etapa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ===== PASO 2: EMPRESAS INVOLUCRADAS ===== */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-blue-600">Paso 2: Empresas Involucradas</div>

                  {/* Empresa Tecnológica */}
                  <FormField
                    control={form.control}
                    name="tech_company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa Tecnológica *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {techCompanies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Partner - Oculto si es new_partner */}
                  {!form.watch("is_new_partner") && (
                    <FormField
                      control={form.control}
                      name="partner_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner (Opcional)</FormLabel>
                          <Select value={field.value || "null"} onValueChange={(value) => {
                            if (value === "null") {
                              field.onChange(null)
                            } else {
                              field.onChange(value)
                            }
                          }}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar partner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">
                                Sin Partner
                              </SelectItem>
                              {filteredPartners.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {loadingPartners ? "Cargando..." : "No hay partners disponibles"}
                                </div>
                              ) : (
                                filteredPartners.map((partner) => (
                                  <SelectItem key={partner.id} value={partner.id}>
                                    {String(partner.name || partner.id)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* País - Siempre visible, filtrado por partner si existe */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País {form.watch("partner_id") && "*"}</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar país" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {partnerCountries.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                {loadingCountries ? "Cargando..." : "No hay países disponibles"}
                              </div>
                            ) : (
                              partnerCountries.map((country) => (
                                <SelectItem key={country.id} value={country.code}>
                                  {String(country.name || country.code || country.id)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Manager de ScaleUp - Solo si es usuario ScaleUp */}
                  {isScaleUpUser && (
                    <FormField
                      control={form.control}
                      name="assigned_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager de ScaleUp *</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar manager" />
                              </SelectTrigger>
                            </FormControl>
                          <SelectContent>
                            {scaleUpUsers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.first_name} {manager.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Partner Responsible - Solo si hay partner seleccionado */}
                  {form.watch("partner_id") && (
                    <FormField
                      control={form.control}
                      name="partner_responsible_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsable del Partner *</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar responsable" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {partnerUsers.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {loadingPartnerUsers ? "Cargando..." : "No hay usuarios disponibles"}
                                </div>
                              ) : (
                                partnerUsers.map((user) => {
                                  const firstName = typeof user?.first_name === 'string' ? user.first_name : ''
                                  const lastName = typeof user?.last_name === 'string' ? user.last_name : ''
                                  const displayName = `${firstName} ${lastName}`.trim() || user?.id
                                  return (
                                    <SelectItem key={user.id} value={user.id}>
                                      {displayName}
                                    </SelectItem>
                                  )
                                })
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* ===== PASO 3: CLIENTE Y DETALLES FINANCIEROS ===== */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-blue-600">Paso 3: Cliente y Detalles Financieros</div>

                  {/* End Customer - AUTOCOMPLETE CON BÚSQUEDA */}
                  <FormField
                    control={form.control}
                    name="end_customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente Final {!isScaleUpUser && "*"}</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              placeholder="Buscar cliente..."
                              value={endCustomerSearchQuery}
                              onChange={(e) => {
                                setEndCustomerSearchQuery(e.target.value)
                                // Filtrar endCustomers en base a la búsqueda
                                const filtered = endCustomers.filter(c =>
                                  String(c.name || "").toLowerCase().includes(e.target.value.toLowerCase())
                                )
                                setSearchResults(filtered)
                              }}
                              onFocus={() => {
                                setSearchResults(endCustomers)
                              }}
                            />
                            
                            {/* Resultados de búsqueda */}
                            {endCustomerSearchQuery && (
                              <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                                {searchResults.length === 0 ? (
                                  <div className="text-sm text-gray-500 p-2">
                                    No se encontraron clientes con "{endCustomerSearchQuery}"
                                  </div>
                                ) : (
                                  searchResults.map((customer) => (
                                    <button
                                      key={customer.id}
                                      type="button"
                                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                                      onClick={() => {
                                        field.onChange(customer.id)
                                        setEndCustomerSearchQuery(customer.name)
                                        setSearchResults([])
                                      }}
                                    >
                                      {customer.name}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}

                            {/* Botón Crear Cliente */}
                            {endCustomerSearchQuery && searchResults.length === 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setNewEndCustomerData({
                                    ...newEndCustomerData,
                                    name: endCustomerSearchQuery
                                  })
                                  setNewEndCustomerDialogOpen(true)
                                }}
                              >
                                + Crear "{endCustomerSearchQuery}"
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        {!isScaleUpUser && <p className="text-sm text-red-600">Campo obligatorio para usuarios Partner</p>}
                      </FormItem>
                    )}
                  />

                  {/* Estimated Value */}
                  <FormField
                    control={form.control}
                    name="estimated_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Estimated Close Date */}
                  <FormField
                    control={form.control}
                    name="estimated_close_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Estimada de Cierre</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ===== PASO 4: CAMPOS TÉCNICOS ===== */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-blue-600">Paso 4: Campos Técnicos</div>
                  {techFields.length === 0 ? (
                    <p className="text-gray-500">No hay campos técnicos definidos para esta empresa</p>
                  ) : (
                    <p className="text-sm text-gray-600">Completa los campos técnicos específicos de la empresa seleccionada (se mostrarían aquí)</p>
                  )}
                </div>
              )}

              {/* ===== PASO 5: CONFIRMACIÓN ===== */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-green-600">Paso 5: Confirmación</div>
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold">Resumen de la Oportunidad</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-medium">Título:</span> {form.watch("title") || "N/A"}</div>
                      <div><span className="font-medium">Etapa:</span> {stages.find(s => s.id === form.watch("pipeline_stage_id"))?.code || "N/A"}</div>
                      <div><span className="font-medium">Empresa Tech:</span> {techCompanies.find(c => c.id === form.watch("tech_company_id"))?.name || "N/A"}</div>
                      <div><span className="font-medium">Partner:</span> {form.watch("partner_id") ? (filteredPartners.find(p => p.id === form.watch("partner_id"))?.name || "N/A") : "N/A"}</div>
                      <div><span className="font-medium">País:</span> {form.watch("country") || "N/A"}</div>
                      <div><span className="font-medium">Cliente:</span> {form.watch("end_customer_id") ? (endCustomers.find(c => c.id === form.watch("end_customer_id"))?.name || "N/A") : "N/A"}</div>
                      <div><span className="font-medium">Valor Estimado:</span> USD {form.watch("estimated_value") || "0"}</div>
                      <div><span className="font-medium">Fecha Cierre:</span> {form.watch("estimated_close_date") || "N/A"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    let newStep = Math.max(1, currentStep - 1)
                    // Saltar Paso 4 si no hay campos técnicos
                    if (newStep === 4 && !hasTechFields) {
                      newStep = 3
                    }
                    setCurrentStep(newStep)
                  }}
                  disabled={currentStep === 1}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    disabled={loadingScaleUpManager}
                    onClick={() => {
                      console.log("[v0] Botón Siguiente clickeado - currentStep:", currentStep)
                      let newStep = currentStep + 1
                      // Saltar Paso 4 si no hay campos técnicos
                      if (newStep === 4 && !hasTechFields) {
                        newStep = 5
                      }
                      setCurrentStep(newStep)
                    }}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loadingScaleUpManager}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loadingScaleUpManager ? "Creando..." : "Crear Oportunidad"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Modal: Crear Nuevo Cliente Final */}
      <Dialog open={newEndCustomerDialogOpen} onOpenChange={setNewEndCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo cliente final</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del cliente *</label>
              <Input
                placeholder="Nombre del nuevo cliente"
                value={newEndCustomerData.name}
                onChange={(e) => setNewEndCustomerData({ ...newEndCustomerData, name: e.target.value })}
              />
            </div>

            {/* Industria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Industria</label>
              <Select value={newEndCustomerData.industry_id} onValueChange={(value) => {
                setNewEndCustomerData({ ...newEndCustomerData, industry_id: value })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar industria" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sitio Web */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sitio web</label>
              <Input
                placeholder="https://ejemplo.com"
                value={newEndCustomerData.website}
                onChange={(e) => setNewEndCustomerData({ ...newEndCustomerData, website: e.target.value })}
              />
            </div>

            {/* ID Fiscal */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Fiscal</label>
              <Input
                placeholder="Número de identificación fiscal"
                value={newEndCustomerData.tax_id}
                onChange={(e) => setNewEndCustomerData({ ...newEndCustomerData, tax_id: e.target.value })}
              />
            </div>

            {/* País */}
            <div className="space-y-2">
              <label className="text-sm font-medium">País</label>
              <Select value={newEndCustomerData.country_id} onValueChange={(value) => {
                setNewEndCustomerData({ ...newEndCustomerData, country_id: value })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  {allCountries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón Crear */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!newEndCustomerData.name || isCreatingEndCustomer}
              onClick={async () => {
                try {
                  setIsCreatingEndCustomer(true)
                  const newCustomer = await createEndCustomer({
                    name: newEndCustomerData.name,
                    industry_id: newEndCustomerData.industry_id || undefined,
                    website: newEndCustomerData.website || undefined,
                    tax_id: newEndCustomerData.tax_id || undefined,
                    country_id: newEndCustomerData.country_id || undefined,
                  })

                  if (newCustomer) {
                    // Agregar el nuevo cliente a la lista
                    setEndCustomers([...endCustomers, newCustomer])
                    
                    // Seleccionar automáticamente el nuevo cliente
                    form.setValue("end_customer_id", newCustomer.id, { shouldValidate: false })
                    setEndCustomerSearchQuery(newCustomer.name)

                    // Cerrar modal y resetear datos
                    setNewEndCustomerDialogOpen(false)
                    setNewEndCustomerData({
                      name: "",
                      industry_id: "",
                      website: "",
                      tax_id: "",
                      country_id: "",
                    })

                    toast({
                      title: "Éxito",
                      description: "Cliente final creado correctamente",
                    })
                  } else {
                    toast({
                      title: "Error",
                      description: "No se pudo crear el cliente final",
                      variant: "destructive",
                    })
                  }
                } catch (error) {
                  console.error("Error creating end customer:", error)
                  toast({
                    title: "Error",
                    description: "Error al crear el cliente final",
                    variant: "destructive",
                  })
                } finally {
                  setIsCreatingEndCustomer(false)
                }
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Crear Nuevo Cliente Final
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
