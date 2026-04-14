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

async function getScaleUpUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role_id")
      .is("partner_id", null)
      .is("tech_company_id", null)
      .eq("is_active", true)
      .order("first_name", { ascending: true })

    return error ? [] : (data || [])
  } catch (error) {
    console.error("Error en getScaleUpUsers:", error)
    return []
  }
}

async function getPartnerUsers(partnerId: string): Promise<any[]> {
  try {
    if (!partnerId) return []

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role_id")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .order("first_name", { ascending: true })

    return error ? [] : (data || [])
  } catch (error) {
    console.error("Error en getPartnerUsers:", error)
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
  const totalSteps = 4

  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [techCompanies, setTechCompanies] = useState<Tables<"tech_companies">[]>([])
  const [filteredPartners, setFilteredPartners] = useState<Tables<"partners">[]>([])
  const [endCustomers, setEndCustomers] = useState<Tables<"end_customers">[]>([])
  const [techFields, setTechFields] = useState<any[]>([])
  const [partnerCountries, setPartnerCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loadingStages, setLoadingStages] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(false)
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

  const isAdmin = userInfo?.isAdmin || false
  const userRole = userInfo?.roleCode || ""
  const partnerId = userInfo?.partnerId
  const techCompanyId = userInfo?.techCompanyId
  const partnerCountriesFromUser = userInfo?.partnerCountries || []
  const isScaleUpUser = userRole.toLowerCase() !== "partneruser"

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
    mode: "onChange",
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

        // Load tech companies
        if (techCompanyId) {
          form.setValue("tech_company_id", techCompanyId, { shouldValidate: false })

          const { data: relatedTechCompanies, error } = await supabase
            .from("partner_tech_companies")
            .select("tech_company_id")
            .eq("partner_id", partnerId || "")

          if (!error && relatedTechCompanies && relatedTechCompanies.length > 0) {
            const techCompanyIds = relatedTechCompanies.map((item) => item.tech_company_id)
            const { data: techCompaniesData } = await supabase
              .from("tech_companies")
              .select("*")
              .in("id", techCompanyIds)
              .eq("is_active", true)
              .order("name", { ascending: true })

            setTechCompanies(techCompaniesData || [])
          }
        }

        // Load tech companies for Partner users
        if (partnerId && !isScaleUpUser) {
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
      setPartnerCountries([])
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
  }, [watchPartner])

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setLoadingScaleUpManager(true)
      const oppData = {
        ...data,
        created_by: user?.id,
        assigned_to: data.assigned_to || null,
      }

      const result = await createOpportunity(oppData)
      toast({
        title: "Éxito",
        description: "Oportunidad creada correctamente",
      })
      router.push(`/dashboard/opportunities/${result.id}`)
    } catch (error) {
      console.error("Error creating opportunity:", error)
      toast({
        title: "Error",
        description: "Error al crear la oportunidad",
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
          <CardDescription>{t("opportunities.form.description") || "Completa los datos de la nueva oportunidad"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la oportunidad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalles adicionales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ FIXED: Controlled Select for Pipeline Stage */}
              <FormField
                control={form.control}
                name="pipeline_stage_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("opportunities.form.stage") || "Etapa"}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("opportunities.form.select_placeholder") || "Seleccionar..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ FIXED: Controlled Select for Tech Company */}
              <FormField
                control={form.control}
                name="tech_company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("opportunities.form.tech_company") || "Empresa Tecnológica"}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("opportunities.form.select_placeholder") || "Seleccionar..."} />
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

              {/* Partner Select */}
              <FormField
                control={form.control}
                name="partner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("opportunities.form.partner") || "Partner"}</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("opportunities.form.select_placeholder") || "Seleccionar..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredPartners.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 text-center">
                            {loadingPartners ? "Cargando..." : "No hay partners disponibles"}
                          </div>
                        ) : (
                          filteredPartners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Value */}
              <FormField
                control={form.control}
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("opportunities.form.estimated_value") || "Valor Estimado"}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" disabled={loadingScaleUpManager} className="w-full">
                {loadingScaleUpManager ? "Creando..." : t("opportunities.form.submit") || "Crear Oportunidad"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
