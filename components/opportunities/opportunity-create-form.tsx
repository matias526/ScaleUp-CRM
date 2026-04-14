"use client"

import { useState, useEffect, useRef } from "react"
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
} from "@/lib/services/opportunity-service"
import { getTechCompanies } from "@/lib/services/tech-company-service"
import { getPartners } from "@/lib/services/partner-service"
import {
  getEndCustomers,
  createEndCustomer,
  getEndCustomersForPartner,
  searchEndCustomers,
} from "@/lib/services/end-customer-service-client"
import type { Tables } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import {
  Building2,
  FileText,
  DollarSign,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

async function getScaleUpUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "scaleup_admin")
      .order("full_name", { ascending: true })

    return error ? [] : (data || [])
  } catch (error) {
    console.error("Error en getScaleUpUsers:", error)
    return []
  }
}

const opportunitySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  pipeline_stage_id: z.string().min(1, "Debes seleccionar una etapa"),
  tech_company_id: z.string().min(1, "Debes seleccionar una empresa tecnológica"),
  partner_id: z.string().optional(),
  end_customer_id: z.string().optional(),
  estimated_value: z.number().optional(),
  estimated_close_date: z.string().optional(),
  for_new_partner: z.boolean().default(false),
  assigned_to: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

export function OpportunityCreateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const preselectedStageId = searchParams.get("stage")

  // ✅ CONTROL REFS to prevent infinite loops
  const hasInitialized = useRef(false)
  const isMounting = useRef(true)

  // ✅ STATE
  const [currentStep, setCurrentStep] = useState(1)
  const [stages, setStages] = useState<Tables<"opportunity_pipeline_stages">[]>([])
  const [techCompanies, setTechCompanies] = useState<Tables<"tech_companies">[]>([])
  const [partners, setPartners] = useState<Tables<"partners">[]>([])
  const [filteredPartners, setFilteredPartners] = useState<Tables<"partners">[]>([])
  const [endCustomers, setEndCustomers] = useState<Tables<"end_customers">[]>([])
  const [scaleUpUsers, setScaleUpUsers] = useState<any[]>([])

  const [loadingStages, setLoadingStages] = useState(false)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [loadingTechCompanies, setLoadingTechCompanies] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      name: "",
      description: "",
      pipeline_stage_id: preselectedStageId || "",
      tech_company_id: "",
      partner_id: "",
      end_customer_id: "",
      estimated_value: undefined,
      estimated_close_date: "",
      for_new_partner: false,
      assigned_to: "",
    },
  })

  // ✅ WATCH form values
  const watchTechCompanyId = form.watch("tech_company_id")
  const watchForNewPartner = form.watch("for_new_partner")

  // ✅ HELPER: Safe setValue with deduplication
  const setFormValue = (fieldName: keyof OpportunityFormData, value: any) => {
    const currentValue = form.getValues(fieldName)
    if (currentValue === value) return // Prevent redundant updates
    form.setValue(fieldName, value, { shouldValidate: false })
  }

  // ✅ INIT: Load all static data once on mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const loadInitialData = async () => {
      try {
        // Load stages
        setLoadingStages(true)
        const stagesData = await getOpportunityStages()
        setStages(stagesData || [])

        // Load tech companies
        setLoadingTechCompanies(true)
        const techCompaniesData = await getTechCompanies()
        setTechCompanies(techCompaniesData || [])

        // Load all partners
        const partnersData = await getPartners()
        setPartners(partnersData || [])

        // Load ScaleUp users
        const usersData = await getScaleUpUsers()
        setScaleUpUsers(usersData || [])

        // If there's a preselected stage, set it
        if (preselectedStageId && stagesData) {
          setFormValue("pipeline_stage_id", preselectedStageId)
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        })
      } finally {
        setLoadingStages(false)
        setLoadingTechCompanies(false)
      }
    }

    loadInitialData()
  }, [preselectedStageId])

  // ✅ WATCH: Filter partners when tech company changes
  useEffect(() => {
    if (!watchTechCompanyId) {
      setFilteredPartners(partners)
      setFormValue("partner_id", "")
      return
    }

    const filterPartners = async () => {
      setLoadingPartners(true)
      try {
        const filtered = await getPartnersByTechCompanyId(watchTechCompanyId)
        setFilteredPartners(filtered || [])
        // Reset partner selection when tech company changes
        setFormValue("partner_id", "")
      } catch (error) {
        console.error("Error filtering partners:", error)
        setFilteredPartners([])
      } finally {
        setLoadingPartners(false)
      }
    }

    filterPartners()
  }, [watchTechCompanyId])

  // ✅ SUBMIT: Create opportunity
  const onSubmit = async (data: OpportunityFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear una oportunidad",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const opportunityData = {
        name: data.name,
        description: data.description || "",
        pipeline_stage_id: data.pipeline_stage_id,
        tech_company_id: data.tech_company_id,
        partner_id: data.partner_id || null,
        end_customer_id: data.end_customer_id || null,
        estimated_value: data.estimated_value || 0,
        estimated_close_date: data.estimated_close_date || null,
        for_new_partner: data.for_new_partner,
        assigned_to: data.assigned_to || null,
        created_by: user.id,
      }

      const result = await createOpportunity(opportunityData)

      if (result) {
        toast({
          title: "Éxito",
          description: "Oportunidad creada correctamente",
        })
        router.push(`/dashboard/opportunities/${result.id}`)
      }
    } catch (error) {
      console.error("Error creating opportunity:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la oportunidad",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const progressPercentage = (currentStep / 3) * 100
  const totalSteps = 3

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Crear nueva oportunidad</h1>
        <p className="text-gray-600">Completa el formulario para crear una nueva oportunidad de negocio</p>
      </div>

      {/* Progress Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Progreso</span>
              <span className="text-sm font-semibold text-blue-600">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Indicators */}
      <div className="flex justify-between items-center gap-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-colors ${
                step === currentStep
                  ? "bg-blue-600 text-white"
                  : step < currentStep
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-600"
              }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-1 rounded transition-colors ${
                  step < currentStep ? "bg-green-600" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <CardTitle>Información básica</CardTitle>
                </div>
                <CardDescription>Información básica de la oportunidad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Implementación de solución CRM para empresa X"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Nombre descriptivo y conciso de la oportunidad</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe los detalles de esta oportunidad..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Proporciona detalles adicionales sobre la oportunidad, necesidades del cliente, etc.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stage */}
                <FormField
                  control={form.control}
                  name="pipeline_stage_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etapa *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar etapa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingStages ? (
                            <div className="p-2 text-sm text-gray-500 text-center">Cargando...</div>
                          ) : stages.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500 text-center">No hay etapas disponibles</div>
                          ) : (
                            stages.map((stage) => (
                              stage.id && (
                                <SelectItem key={stage.id} value={stage.id}>
                                  {stage.name}
                                </SelectItem>
                              )
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>Selecciona la etapa actual en el proceso de ventas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* For New Partner Toggle */}
                <FormField
                  control={form.control}
                  name="for_new_partner"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <Label>Oportunidad para nuevo partner</Label>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                      <FormDescription>Marca esta opción si la oportunidad es para incorporar un nuevo partner</FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Companies and Partners */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <CardTitle>Empresas y Partners</CardTitle>
                </div>
                <CardDescription>Selecciona la empresa tecnológica y partner relacionados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tech Company */}
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
                          {loadingTechCompanies ? (
                            <div className="p-2 text-sm text-gray-500 text-center">Cargando...</div>
                          ) : techCompanies.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500 text-center">No hay empresas disponibles</div>
                          ) : (
                            techCompanies.map((company) => (
                              company.id && (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              )
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Partner */}
                {!watchForNewPartner && (
                  <FormField
                    control={form.control}
                    name="partner_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partner</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar partner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingPartners ? (
                              <div className="p-2 text-sm text-gray-500 text-center">Cargando...</div>
                            ) : filteredPartners.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                {watchTechCompanyId
                                  ? "No hay partners disponibles para esta empresa"
                                  : "Selecciona una empresa primero"}
                              </div>
                            ) : (
                              filteredPartners.map((partner) => (
                                partner.id && (
                                  <SelectItem key={partner.id} value={partner.id}>
                                    {partner.name}
                                  </SelectItem>
                                )
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle>Detalles adicionales</CardTitle>
                </div>
                <CardDescription>Información adicional sobre la oportunidad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estimated Value */}
                <FormField
                  control={form.control}
                  name="estimated_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Estimado</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
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

                {/* Assigned To */}
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignado a</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar usuario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {scaleUpUsers.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500 text-center">No hay usuarios disponibles</div>
                          ) : (
                            scaleUpUsers.map((user) => (
                              user.id && (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name}
                                </SelectItem>
                              )
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Creando..." : "Crear oportunidad"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
