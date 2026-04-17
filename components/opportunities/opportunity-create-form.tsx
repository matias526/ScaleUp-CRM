"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslation } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities" // <--- AGREGAR ESTA
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
import { getEndCustomersForPartner } from "@/lib/services/end-customer-service-client"
import type { Tables } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
//import { toast } from "@/components/ui/use-toast"
import { useToast } from "@/components/ui/use-toast"
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
  Lock,
  Pencil,
  Layout,
  Layers,
  Globe,
  User,
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

    const partnerIds = [...new Set(data.map((item: any) => item.partner_id))]

    const { data: partnersData, error: partnersError } = await supabase
      .from("partners")
      .select("id, name, logo_url, website, city, is_active")
      .in("id", partnerIds)
      .eq("is_active", true)
      .order("name", { ascending: true })

    return partnersError ? [] : (partnersData as any || [])
  } catch (error) {
    console.error("Error en getPartnersByTechCompanyId:", error)
    return []
  }
}

export default function OpportunityCreateForm() {
  const [isConfirming, setIsConfirming] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStageId = searchParams.get("stage")

  const { user, userInfo, loading } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation(DICT_LANG_OPPORTUNITIES)

  // ✅ FIXED: Removed setForceUpdate and persistentData ref - using form.watch() instead
  const hasInitialized = useRef(false)

  const [currentStep, setCurrentStep] = useState(1)
  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [techCompanies, setTechCompanies] = useState<Tables<"tech_companies">[]>([])
  const [filteredPartners, setFilteredPartners] = useState<Tables<"partners">[]>([])
  const [endCustomers, setEndCustomers] = useState<Tables<"end_customers">[]>([])
  const [filteredEndCustomers, setFilteredEndCustomers] = useState<Tables<"end_customers">[]>([])
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

  // Prospect Partner States
  const [prospectDialogOpen, setProspectDialogOpen] = useState(false)
  const [prospectStep, setProspectStep] = useState(1) // 1: Company, 2: Contact
  const [prospectPartnerData, setProspectPartnerData] = useState({
    name: "",
    website: "",
    main_country_id: "",
  })
  const [prospectContactData, setProspectContactData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    preferred_language: "es" as "es" | "en" | "pt",
  })

  // totalSteps es siempre 5: Paso 1 (Info básica) -> Paso 2 (Empresas) -> Paso 3 (Cliente) -> Paso 4 (Técnico, opcional) -> Paso 5 (Confirmación)
  // El Paso 4 se salta si no hay campos técnicos, pero Paso 5 siempre es el resumen
  const hasTechFields = techFields.length > 0
  const totalSteps = 5 // Siempre 5 pasos: el último es siempre confirmación

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
      fieldsToValidate.push("tech_company_id", "assigned_to", "country")

      // Require partner_id only if NOT a prospect
      const isProspect = form.watch("is_prospect")
      if (!isProspect && !form.watch("partner_id")) {
        form.setError("partner_id", { message: t("opportunities.form.requiredField") })
        return false
      }

      // If there is a partner, validate responsible
      if (form.watch("partner_id")) {
        fieldsToValidate.push("partner_responsible_id")
      }
    } else if (currentStep === 3) {
      if (!isScaleUpUser && !form.watch("end_customer_id")) {
        form.setError("end_customer_id", { message: t("opportunities.form.requiredField") })
        return false
      }
    } else if (currentStep === 4 && hasTechFields) {
      // Validar que todos los campos técnicos obligatorios estén completos
      const requiredFields = techFields.filter((field: any) => field.is_required)
      let hasError = false

      requiredFields.forEach((field: any) => {
        const value = form.getValues(`opportunity_tech_fields.${field.id}` as any)
        if (!value || (Array.isArray(value) && value.length === 0)) {
          form.setError(`opportunity_tech_fields.${field.id}` as any, {
            type: "manual",
            message: t("opportunities.form.mandatoryField")
          })
          hasError = true
        }
      })

      if (hasError) {
        return false
      }
    }

    // Validate only the fields for this step
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate)
      return isValid
    }

    return true
  }

  // ✅ SIMPLIFIED: Cleaner validation schema
  const formSchema = z.object({
    title: z.string().min(1, t("opportunities.form.titleRequired")),
    description: z.string().optional(),
    pipeline_stage_id: z.string().min(1, t("error.stageRequired")),
    tech_company_id: z.string().min(1, t("opportunities.form.techCompanyRequired")),
    is_prospect: z.boolean().optional(),
    partner_id: z.string().optional().nullable(),
    prospect_partner_data: z.object({
      name: z.string().optional(),
      website: z.string().optional(),
      main_country_id: z.string().optional(),
    }).optional(),
    prospect_contact_data: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      preferred_language: z.enum(["es", "en", "pt"]).optional(),
    }).optional(),
    end_customer_id: z.string().optional().nullable(),
    estimated_value: z.coerce.number().optional().nullable(),
    estimated_close_date: z.string().optional().nullable(),
    country: z.string().optional(),
    assigned_to: z.string().optional().nullable(),
    partner_responsible_id: z.string().optional().nullable(),
    is_prospect: z.boolean().optional(),
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
      is_prospect: false,
      partner_id: partnerId || null,
      prospect_partner_data: {
        name: "",
        website: "",
        main_country_id: "",
      },
      prospect_contact_data: {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        preferred_language: "es",
      },
      end_customer_id: null,
      estimated_value: null,
      estimated_close_date: null,
      country: "",
      assigned_to: null,
      partner_responsible_id: null,
      opportunity_tech_fields: {},
    },
  })

  // ✅ Helper function to initialize tech field values in form state (wrapped in useCallback)
  const setTechFieldValues = useCallback((techFieldsConfig: any[]) => {
    const currentValues = form.getValues('opportunity_tech_fields' as any) || {}
    const newValues = { ...currentValues }
    techFieldsConfig.forEach((field: any) => {
      if (newValues[field.id] === undefined) {
        newValues[field.id] = field.field_type === 'multiselect' ? [] : ""
      }
    })
    form.setValue('opportunity_tech_fields' as any, newValues)
  }, [form])

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
            const techCompanyIds = relatedTechCompanies.map((item: any) => item.tech_company_id)
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

          // Set partner_id automatically for Partner users
          if (partnerId) {
            form.setValue("partner_id", partnerId, { shouldValidate: false })
          }
        }

        // Load scale up users
        const users = await getScaleUpUsers()
        setScaleUpUsers(users)

        // Load all countries (para usarlos en el selector de país)
        const countries = await getAllCountries()
        setAllCountries(countries)

        // Load all end customers - usar getEndCustomersForPartner para Partner users
        const customers = isScaleUpUser ? await getEndCustomers() : await getEndCustomersForPartner(partnerId)
        setEndCustomers(customers)

        // Load industries for the modal
        const industriesData = await getIndustries()
        setIndustries(industriesData || [])
      } catch (error) {
        console.error("Error loading form data:", error)
        setError(t("opportunities.form.savingError"))
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

  // ✅ Load tech fields when tech company changes
  useEffect(() => {
    if (!watchTechCompany) {
      setTechFields([])
      return
    }
    const loadTechFields = async () => {
      setLoadingTechFields(true)
      try {
        const fields = await getOpportunityTechFields(watchTechCompany)
        setTechFields(fields || [])
        // Call it here AFTER setting fields
        if (fields) setTechFieldValues(fields)
      } catch (error) {
        console.error("Error loading tech fields:", error)
        setTechFields([])
      } finally {
        setLoadingTechFields(false)
      }
    }
    loadTechFields()
  }, [watchTechCompany, setTechFieldValues])

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

  // ✅ FIXED: Load partner countries when partner changes (or for Partner users on initial load)
  useEffect(() => {
    // Para Partner users, siempre cargar los países del partner
    const partnerIdToUse = isScaleUpUser ? watchPartner : partnerId

    if (!partnerIdToUse) {
      // Si no hay partner, mostrar todos los países
      setPartnerCountries(allCountries)
      return
    }

    const loadCountries = async () => {
      setLoadingCountries(true)
      try {
        const countries = await getPartnerCountries(partnerIdToUse)
        setPartnerCountries(countries || [])
      } catch (error) {
        console.error("Error loading partner countries:", error)
        setPartnerCountries([])
      } finally {
        setLoadingCountries(false)
      }
    }

    loadCountries()
  }, [watchPartner, allCountries, isScaleUpUser, partnerId])

  // ✅ Filter end customers - Simply use endCustomers as filteredEndCustomers since it's already filtered
  useEffect(() => {
    setFilteredEndCustomers(endCustomers)
  }, [endCustomers])

  // Handle form submission - Now only on Step 5 (Confirmation)
  const onSubmit = async (data: FormValues) => {
    try {
      // Validate only the fields for the current step
      const isStepValid = await validateCurrentStep()

      if (!isStepValid) {
        return
      }

      // If not on the final step, just advance to next step
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        return
      }

      // Only create opportunity on the final step (Step 5)
      setLoadingScaleUpManager(true)

      let prospectPartnerId: string | null = null
      let prospectContactId: string | null = null

      // ✅ ATOMIC INSERTION: If is_prospect is true, insert prospect partner and contact first
      if (data.is_prospect && data.prospect_partner_data && data.prospect_contact_data) {
        try {
          // 1. INSERT into prospect_partners
          const { data: prospectPartnerResult, error: prospectError } = await supabase
            .from("prospect_partners")
            .insert([
              {
                name: data.prospect_partner_data.name,
                website: data.prospect_partner_data.website || null,
                main_country_id: data.prospect_partner_data.main_country_id,
              },
            ])
            .select("id")

          if (prospectError || !prospectPartnerResult || prospectPartnerResult.length === 0) {
            throw new Error("Error creando partner prospecto: " + prospectError?.message)
          }

          prospectPartnerId = prospectPartnerResult[0].id

          // 2. INSERT into contacts with prospect_id
          const { data: contactResult, error: contactError } = await supabase
            .from("contacts")
            .insert([
              {
                first_name: data.prospect_contact_data.first_name,
                last_name: data.prospect_contact_data.last_name,
                email: data.prospect_contact_data.email,
                phone: data.prospect_contact_data.phone || null,
                preferred_language: data.prospect_contact_data.preferred_language || "es",
                prospect_id: prospectPartnerId,
              },
            ])
            .select("id")

          if (contactError || !contactResult || contactResult.length === 0) {
            throw new Error("Error creando contacto prospecto: " + contactError?.message)
          }

          prospectContactId = contactResult[0].id

        } catch (error) {
          console.error("[v0] Error in atomic insertion:", error)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al crear partner prospecto",
            variant: "destructive",
          })
          setLoadingScaleUpManager(false)
          return
        }
      }

      // Obtener el manager de ScaleUp que maneja la relación entre Tech Company y Partner (solo si hay Partner y no es prospecto)
      let assignedToUserId = data.assigned_to || null

      if (data.partner_id && data.tech_company_id && isScaleUpUser && !data.is_prospect) {
        try {
          const manager = await getScaleUpManager(data.tech_company_id, data.partner_id)
          if (manager) {
            assignedToUserId = manager
          }
        } catch (error) {
          console.error("Error al obtener el manager de ScaleUp:", error)
        }
      }

      // Preparar datos de la oportunidad
      const opportunityData: any = {
        title: data.title,
        description: data.description || null,
        pipeline_stage_id: data.pipeline_stage_id,
        tech_company_id: data.tech_company_id,
        partner_id: data.is_prospect ? null : (data.partner_id || null),
        prospect_id: prospectPartnerId,
        end_customer_id: data.end_customer_id || null,
        estimated_value: data.estimated_value || null,
        estimated_close_date: data.estimated_close_date || null,
        country: data.country || null,
        assigned_to: assignedToUserId,
        partner_responsible_id: data.partner_responsible_id || null,
        created_by: user?.id,
      }

      // Preparar tech values desde form.getValues() en lugar de techFieldValues state
      const techValuesToSave: Array<{
        opportunity_tech_field_id: string
        value_text?: string | null
        value_numeric?: number | null
        value_boolean?: boolean | null
        value_date?: string | null
        value_json?: any | null
      }> = []

      // Iterar sobre los campos técnicos y extraer sus valores del form
      techFields.forEach((field: any) => {
        const fieldKey = `opportunity_tech_fields.${field.id}`
        const value = form.getValues(fieldKey as any)

        console.log("[v0] Tech field:", field.field_name, "Type:", field.field_type, "Value:", value)

        if (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)) {
          const techValue: any = {
            opportunity_tech_field_id: field.id,
          }

          // Mapear el valor según el tipo de campo
          switch (field.field_type) {
            case "text":
              techValue.value_text = String(value)
              break
            case "number":
              techValue.value_numeric = typeof value === "number" ? value : parseFloat(value)
              break
            case "date":
              techValue.value_date = String(value)
              break
            case "boolean":
              techValue.value_boolean = Boolean(value)
              break
            case "select":
              techValue.value_text = String(value)
              break
            case "multiselect":
              techValue.value_json = Array.isArray(value) ? value : [value]
              break
            case "file":
              // Los archivos se manejarán de forma especial (subir a storage)
              techValue.value_json = { fileName: value?.name || null }
              break
          }

          console.log("[v0] Tech value to save:", techValue)
          techValuesToSave.push(techValue)
        }
      })

      console.log("[v0] All tech values to save:", techValuesToSave)

      // 3. INSERT into opportunities
      const result = await createOpportunity(opportunityData, techValuesToSave, userRole)

      // 4. INSERT into opportunity_tech_values (si hay valores técnicos)
      if (techValuesToSave.length > 0) {
        try {
          console.log("[v0] Saving tech values for opportunity:", result.id)
          await createOpportunityTechValues(result.id, techValuesToSave)
          console.log("[v0] Tech values saved successfully")
        } catch (error) {
          console.error("[v0] Error al guardar valores técnicos:", error)
          // No fallar la creación de la oportunidad si hay error en tech values
        }
      }

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

  if (loading) {
    return <div>{t("opportunities.form.loading")}</div>
  }

  return (
    <div className="space-y-6">
      {/* Narrow Container for Entire Form */}
      <div className="max-w-2xl mx-auto w-full">
        <Card>
        <CardHeader className="pb-6 bg-blue-50">
          {/* Header Title and Description */}
          <div className="mb-6">
            <CardTitle className="text-2xl mb-2 text-gray-900">{t("opportunities.header.title") || "Crear nueva oportunidad"}</CardTitle>
            <p className="text-gray-600 text-sm">{t("opportunities.header.description") || "Completa el formulario para crear una nueva oportunidad de negocio"}</p>
          </div>

          {/* Progress Bar Section */}
          <div className="mb-6">
            {/* Progress bar with percentage */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">{t("opportunities.header.progress") || "Progreso"}</span>
              <span className="text-sm font-semibold text-blue-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            
            {/* Linear Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step Title and Dots Indicator */}
          <div className="flex items-center justify-between">
            {/* Step Title with Circle Number */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm">
                {currentStep}
              </div>
              <span className="text-base font-semibold text-gray-900">
                {currentStep === 1 ? t("opportunities.step.1_name") || "Información básica"
                  : currentStep === 2 ? t("opportunities.step.2_name") || "Empresas involucradas"
                    : currentStep === 3 ? t("opportunities.step.3_name") || "Cliente y detalles financieros"
                      : currentStep === 4 ? t("opportunities.step.4_name") || "Campos técnicos"
                        : t("opportunities.step.5_name") || "Confirmación"}
              </span>
            </div>

            {/* Dots Indicator for Total Steps */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index + 1 <= currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => {
              e.preventDefault(); // Evita el envío automático del navegador
              if (currentStep === 5 && isConfirming) {
                form.handleSubmit(onSubmit)(e);
                setIsConfirming(false); // Lo reseteamos por seguridad
              }
            }}
              className="space-y-6">
              
              {/* Centered Content Container */}
              <div className="max-w-2xl mx-auto px-4 w-full">
              {/* ===== PASO 1: INFORMACIÓN BÁSICA ===== */}
              {currentStep === 1 && (
                <div className="space-y-6 mt-6">

                  {/* Título */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("opportunities.form.title")} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t("opportunities.form.title")} className="border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors" {...field} />
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
                        <FormLabel className="text-sm font-medium">{t("opportunities.form.description")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t("opportunities.form.description")} className="min-h-24 border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Es Partner Prospecto (Solo para ScaleUp) */}
                  {isScaleUpUser && (
                    <FormField
                      control={form.control}
                      name="is_prospect"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-white hover:border-gray-300 transition-colors">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base cursor-pointer font-medium">{t("opportunities.prospect.is_prospect")}</FormLabel>
                            <p className="text-sm text-gray-500">{t("opportunities.prospect.markProspect")}</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (checked) {
                                  setProspectDialogOpen(true)
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Resumen del Partner Prospecto */}
                  {form.watch("is_prospect") && form.watch("prospect_partner_data")?.name && (
                    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-900">{t("opportunities.prospect.savedData")}</span>
                      </div>

                      {/* Grid con datos de empresa */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white rounded p-3">
                          <p className="text-gray-600 font-medium text-xs">Empresa</p>
                          <p className="text-gray-900 font-semibold">{form.watch("prospect_partner_data")?.name}</p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-gray-600 font-medium text-xs">País</p>
                          <p className="text-gray-900 font-semibold">
                            {allCountries.find(c => c.id === form.watch("prospect_partner_data")?.main_country_id)?.name || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Datos de contacto */}
                      <div className="bg-white rounded p-3">
                        <p className="text-gray-600 font-medium text-xs mb-1">Contacto Principal</p>
                        <p className="text-gray-900">
                          {form.watch("prospect_contact_data")?.first_name} {form.watch("prospect_contact_data")?.last_name}
                        </p>
                        <p className="text-gray-600 text-xs">{form.watch("prospect_contact_data")?.email}</p>
                      </div>

                      {/* Botón para editar */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setProspectDialogOpen(true)}
                      >
                        Editar {t("opportunities.prospect.savedData").toLowerCase()}
                      </Button>
                    </div>
                  )}

                  {/* Etapa del Pipeline - OCULTA para usuarios Partner */}
                  {isScaleUpUser && (
                    <FormField
                      control={form.control}
                      name="pipeline_stage_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("opportunities.form.stage")} *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
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
                  )}
                </div>
              )}

              {/* ===== PASO 2: EMPRESAS INVOLUCRADAS ===== */}
              {currentStep === 2 && (
                <div className="space-y-6 mt-6">

                  {/* Section Title: Company Data */}
                  <div className="border-b pb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Datos de la Empresa</h3>
                  </div>

                  {/* Empresa Tecnológica */}
                  <FormField
                    control={form.control}
                    name="tech_company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("opportunities.form.tech_company")} *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
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

                  {/* Partner - Oculto si es prospect o si es usuario Partner */}
                  {!form.watch("is_prospect") && isScaleUpUser && (
                    <FormField
                      control={form.control}
                      name="partner_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("opportunities.form.partner")} ({t("common.optional")})</FormLabel>
                          <Select value={field.value || "null"} onValueChange={(value) => {
                            if (value === "null") {
                              field.onChange(null)
                            } else {
                              field.onChange(value)
                            }
                          }}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">
                                {t("opportunities.form.no_partner")}
                              </SelectItem>
                              {filteredPartners.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {loadingPartners ? t("opportunities.form.loading") : t("opportunities.form.noPartnersAvailable")}
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
                        <FormLabel>{t("opportunities.form.country")} {form.watch("partner_id") && "*"}</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {partnerCountries.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                {loadingCountries ? t("opportunities.form.loading") : t("opportunities.form.noCountriesAvailable")}
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

                  {/* Section Title: Assignment */}
                  {(isScaleUpUser || form.watch("partner_id")) && (
                    <div className="border-b pb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Asignación y Responsables</h3>
                    </div>
                  )}

                  {/* Manager de ScaleUp - Solo si es usuario ScaleUp */}
                  {isScaleUpUser && (
                    <FormField
                      control={form.control}
                      name="assigned_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("opportunities.form.assigned_to")} *</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
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
                          <FormLabel>{t("opportunities.form.partner_responsible")} *</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {partnerUsers.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {loadingPartnerUsers ? t("opportunities.form.loading") : t("opportunities.form.noUsersAvailable")}
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
                <div className="space-y-6 mt-6">

                  {/* End Customer - AUTOCOMPLETE CON BÚSQUEDA */}
                  <FormField
                    control={form.control}
                    name="end_customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("opportunities.form.end_customer")} {!isScaleUpUser && "*"}</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              placeholder={t("opportunities.form.searchPlaceholder")}
                              value={endCustomerSearchQuery}
                              onChange={(e) => {
                                setEndCustomerSearchQuery(e.target.value)
                                // Filtrar en base a la búsqueda
                                const filtered = filteredEndCustomers.filter(c =>
                                  String(c.name || "").toLowerCase().includes(e.target.value.toLowerCase())
                                )
                                setSearchResults(filtered)
                              }}
                              onFocus={() => {
                                setSearchResults(filteredEndCustomers)
                              }}
                            />

                            {/* Resultados de búsqueda */}
                            {endCustomerSearchQuery && (
                              <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
                                {searchResults.length === 0 ? (
                                  <div className="text-sm text-gray-500 p-2">
                                    {t("opportunities.form.noCustomersFound").replace("{query}", endCustomerSearchQuery)}
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
                        <FormLabel>{t("opportunities.form.estimated_value")} (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" step="0.01" {...field} value={field.value ?? ""} />
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
                        <FormLabel>{t("opportunities.form.estimated_close_date")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ===== PASO 4: CAMPOS TÉCNICOS ===== */}
              {currentStep === 4 && (
                <div className="space-y-6 mt-6">

                  {loadingTechFields ? (
                    <p className="text-gray-500">{t("opportunities.form.loading")}</p>
                  ) : techFields.length === 0 ? (
                    <p className="text-gray-500">No hay campos técnicos definidos para esta empresa</p>
                  ) : (
                    <div className="space-y-5">
                      {techFields.map((field: any) => {
                        const fieldKey = `opportunity_tech_fields.${field.id}`
                        const { register, watch, formState: { errors } } = form
                        const fieldValue = watch(fieldKey as any)
                        const hasError = Boolean((errors as any)?.opportunity_tech_fields?.[field.id])

                        return (
                          <div key={field.id} className={`border rounded-lg p-4 space-y-2 ${field.is_required ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                            <label className="text-sm font-medium flex items-center gap-2">
                              {field.field_name}
                              {field.is_required && <span className="text-red-600 font-bold">*</span>}
                            </label>
                            <p className="text-xs text-gray-500">{field.field_type}</p>

                            {/* TEXT FIELD */}
                            {field.field_type === "text" && (
                              <>
                                <Input
                                  placeholder={t("opportunities.form.inputPlaceholder").replace("{field}", field.field_name.toLowerCase())}
                                  {...register(fieldKey as any, {
                                    required: field.is_required ? t("opportunities.form.mandatoryField") : false,
                                  })}
                                  className={hasError ? "border-red-500" : ""}
                                />
                                {hasError && <p className="text-xs text-red-600">{(errors as any)?.opportunity_tech_fields?.[field.id]?.message}</p>}
                              </>
                            )}

                            {/* NUMBER FIELD */}
                            {field.field_type === "number" && (
                              <>
                                <Input
                                  type="number"
                                  placeholder={t("opportunities.form.inputPlaceholder").replace("{field}", field.field_name.toLowerCase())}
                                  {...register(fieldKey as any, {
                                    required: field.is_required ? t("opportunities.form.mandatoryField") : false,
                                    valueAsNumber: true,
                                  })}
                                  className={hasError ? "border-red-500" : ""}
                                />
                                {hasError && <p className="text-xs text-red-600">{(errors as any)?.opportunity_tech_fields?.[field.id]?.message}</p>}
                              </>
                            )}

                            {/* DATE FIELD */}
                            {field.field_type === "date" && (
                              <>
                                <Input
                                  type="date"
                                  {...register(fieldKey as any, {
                                    required: field.is_required ? `${field.field_name} es obligatorio` : false,
                                  })}
                                  className={hasError ? "border-red-500" : ""}
                                />
                                {hasError && <p className="text-xs text-red-600">{(errors as any)?.opportunity_tech_fields?.[field.id]?.message}</p>}
                              </>
                            )}

                            {/* BOOLEAN FIELD */}
                            {field.field_type === "boolean" && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`field-${field.id}`}
                                  {...register(fieldKey as any, {
                                    required: false,
                                  })}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`field-${field.id}`} className="text-sm cursor-pointer">
                                  {field.field_name}
                                </label>
                              </div>
                            )}

                            {/* SELECT FIELD */}
                            {field.field_type === "select" && field.options && (
                              <div className="space-y-2">
                                <select
                                  {...register(fieldKey as any, {
                                    required: field.is_required ? t("opportunities.form.mandatoryField") : false,
                                  })}
                                  className={`w-full px-3 py-2 border rounded-md text-sm ${hasError ? "border-red-500" : "border-gray-300"}`}
                                >
                                  <option value="">{t("opportunities.form.selectOption").replace("{field}", field.field_name.toLowerCase())}</option>
                                  {field.options.map((option: any, idx: number) => {
                                    const optionValue = typeof option === 'string' ? option : option.value
                                    const optionLabel = typeof option === 'string' ? option : option.label
                                    return (
                                      <option key={`${field.id}-${idx}-${optionValue}`} value={optionValue}>
                                        {optionLabel}
                                      </option>
                                    )
                                  })}
                                </select>
                                {hasError && <p className="text-xs text-red-600">{(errors as any)?.opportunity_tech_fields?.[field.id]?.message}</p>}
                              </div>
                            )}

                            {/* MULTISELECT FIELD */}
                            {field.field_type === "multiselect" && field.options && (
                              <div className="space-y-2">
                                {field.options.map((option: any, idx: number) => {
                                  const optionValue = typeof option === 'string' ? option : option.value
                                  const optionLabel = typeof option === 'string' ? option : option.label
                                  const isChecked = Array.isArray(fieldValue) ? fieldValue.includes(optionValue) : false

                                  return (
                                    <div key={`${field.id}-${idx}-${optionValue}`} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`multiselect-${field.id}-${idx}`}
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const currentValues = Array.isArray(fieldValue) ? [...fieldValue] : []
                                          if (e.target.checked) {
                                            currentValues.push(optionValue)
                                          } else {
                                            const index = currentValues.indexOf(optionValue)
                                            if (index > -1) currentValues.splice(index, 1)
                                          }
                                          form.setValue(fieldKey as any, currentValues)
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <label htmlFor={`multiselect-${field.id}-${idx}`} className="text-sm cursor-pointer">
                                        {optionLabel}
                                      </label>
                                    </div>
                                  )
                                })}
                                {hasError && <p className="text-xs text-red-600">{(errors as any)?.opportunity_tech_fields?.[field.id]?.message}</p>}
                              </div>
                            )}

                            {/* FILE FIELD */}
                            {field.field_type === "file" && (
                              <>
                                <Input
                                  type="file"
                                  {...register(fieldKey as any, {
                                    required: field.is_required ? `${field.field_name} es obligatorio` : false,
                                  })}
                                  className={hasError ? "border-red-500" : ""}
                                />
                                {hasError && <p className="text-xs text-red-600">{(errors as any)?.opportunity_tech_fields?.[field.id]?.message}</p>}
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===== PASO 5: CONFIRMACIÓN ===== */}
              {currentStep === 5 && (
                <div className="space-y-3 mt-6">
                  {/* Summary Title */}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t("opportunities.form.summaryTitle")}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Revisa los datos antes de crear la oportunidad</p>
                  </div>

                  {/* Main Data Grid - 3 Columns, Compact */}
                  <div className="grid grid-cols-3 gap-3 pb-4 border-b border-gray-100">
                    {/* Title */}
                    <div className="flex items-center gap-2 py-2">
                      <Layout className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{t("opportunities.form.summary.title")}</p>
                        <p className="text-xs font-medium text-slate-800 truncate">{form.watch("title") || <span className="text-gray-400">N/A</span>}</p>
                      </div>
                    </div>

                    {/* Stage */}
                    <div className="flex items-center gap-2 py-2">
                      <Layers className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{t("opportunities.form.summary.stage")}</p>
                        <p className="text-xs font-medium text-slate-800 truncate">{stages.find(s => s.id === form.watch("pipeline_stage_id"))?.code || <span className="text-gray-400">N/A</span>}</p>
                      </div>
                    </div>

                    {/* Tech Company */}
                    <div className="flex items-center gap-2 py-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{t("opportunities.form.summary.techCompany")}</p>
                        <p className="text-xs font-medium text-slate-800 truncate">{techCompanies.find(c => c.id === form.watch("tech_company_id"))?.name || <span className="text-gray-400">N/A</span>}</p>
                      </div>
                    </div>

                    {/* Partner */}
                    <div className="flex items-center gap-2 py-2">
                      <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{t("opportunities.form.summary.partner")}</p>
                        <p className="text-xs font-medium text-slate-800 truncate">{form.watch("partner_id") ? (filteredPartners.find(p => p.id === form.watch("partner_id"))?.name || <span className="text-gray-400">N/A</span>) : <span className="text-gray-400">N/A</span>}</p>
                      </div>
                    </div>

                    {/* Country */}
                    <div className="flex items-center gap-2 py-2">
                      <Globe className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{t("opportunities.form.summary.country")}</p>
                        <p className="text-xs font-medium text-slate-800 truncate">{form.watch("country") || <span className="text-gray-400">N/A</span>}</p>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 py-2">
                      <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{t("opportunities.form.summary.customer")}</p>
                        <p className="text-xs font-medium text-slate-800 truncate">{form.watch("end_customer_id") ? (filteredEndCustomers.find(c => c.id === form.watch("end_customer_id"))?.name || <span className="text-gray-400">N/A</span>) : <span className="text-gray-400">N/A</span>}</p>
                      </div>
                    </div>
                  </div>

                  {/* Value and Close Date Row */}
                  <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-100">
                    {/* Estimated Value */}
                    <div className="bg-emerald-50 rounded p-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-emerald-700 font-semibold">{t("opportunities.form.summary.value")}</p>
                        <p className="text-sm font-bold text-emerald-900">USD {form.watch("estimated_value") || "0"}</p>
                      </div>
                    </div>

                    {/* Close Date */}
                    <div className="flex items-center gap-2 py-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">{t("opportunities.form.summary.closeDate")}</p>
                        <p className="text-xs font-medium text-slate-800 truncate">{form.watch("estimated_close_date") || <span className="text-gray-400">N/A</span>}</p>
                      </div>
                    </div>
                  </div>

                  {/* Prospect Section - Compact */}
                  {form.watch("is_prospect") && form.watch("prospect_partner_data")?.name && (
                    <div className="border-l-4 border-blue-500 bg-blue-50 rounded p-3 space-y-2">
                      <h4 className="font-semibold text-xs flex items-center gap-1.5 text-blue-900">
                        <Building2 className="h-3.5 w-3.5" />
                        {t("opportunities.prospect.title")}
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="uppercase tracking-widest text-blue-700 font-semibold text-[7px]">Nombre</p>
                          <p className="font-medium text-blue-900 truncate mt-0.5">{form.watch("prospect_partner_data")?.name}</p>
                        </div>
                        {form.watch("prospect_partner_data")?.website && (
                          <div>
                            <p className="uppercase tracking-widest text-blue-700 font-semibold text-[7px]">Website</p>
                            <p className="font-medium text-blue-900 truncate mt-0.5">{form.watch("prospect_partner_data")?.website}</p>
                          </div>
                        )}
                        <div>
                          <p className="uppercase tracking-widest text-blue-700 font-semibold text-[7px]">País</p>
                          <p className="font-medium text-blue-900 truncate mt-0.5">{allCountries.find(c => c.id === form.watch("prospect_partner_data")?.main_country_id)?.name || "N/A"}</p>
                        </div>
                      </div>

                      {/* Contact Row */}
                      <div className="pt-1 border-t border-blue-200">
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 text-blue-900 mb-1">
                          <Users className="h-3.5 w-3.5" />
                          Contacto
                        </h5>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <p className="uppercase tracking-widest text-blue-700 font-semibold text-[7px]">Nombre</p>
                            <p className="font-medium text-blue-900 truncate mt-0.5">{form.watch("prospect_contact_data")?.first_name} {form.watch("prospect_contact_data")?.last_name}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-widest text-blue-700 font-semibold text-[7px]">Email</p>
                            <p className="font-medium text-blue-900 truncate mt-0.5">{form.watch("prospect_contact_data")?.email}</p>
                          </div>
                          <div>
                            <p className="uppercase tracking-widest text-blue-700 font-semibold text-[7px]">Idioma</p>
                            <p className="font-medium text-blue-900 truncate mt-0.5">{form.watch("prospect_contact_data")?.preferred_language?.toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tech Fields Section - Compact */}
                  {hasTechFields && techFields.some((field: any) => {
                    const fieldKey = `opportunity_tech_fields.${field.id}`
                    const value = form.getValues(fieldKey as any)
                    return value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)
                  }) && (
                    <div className="border-l-4 border-purple-500 bg-purple-50 rounded p-3">
                      <h4 className="font-semibold text-xs flex items-center gap-1.5 text-purple-900 mb-2">
                        <FileText className="h-3.5 w-3.5" />
                        {t("opportunities.form.tech_fields")}
                      </h4>
                      <div className="space-y-1">
                        {techFields.map((field: any) => {
                          const fieldKey = `opportunity_tech_fields.${field.id}`
                          const value = form.getValues(fieldKey as any)
                          if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return null

                          let displayValue = Array.isArray(value) ? value.join(", ") : String(value)

                          return (
                            <div key={field.id} className="flex justify-between items-start text-[11px]">
                              <p className="uppercase tracking-widest text-purple-700 font-semibold text-[7px]">{field.field_name}</p>
                              <p className="font-medium text-purple-900 text-right">{displayValue}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
              {/* End Centered Content Container */}

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
                  {t("common.previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  {t("common.cancel")}
                </Button>
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    disabled={loadingScaleUpManager}
                    onClick={async () => {
                      // Definir campos a validar por paso
                      const fieldsToValidate: any[] = []
                      if (currentStep === 1) fieldsToValidate.push("title", "pipeline_stage_id")
                      if (currentStep === 2) {
                        fieldsToValidate.push("tech_company_id", "country")
                        if (isScaleUpUser) fieldsToValidate.push("assigned_to")
                      }
                      if (currentStep === 3 && isScaleUpUser) fieldsToValidate.push("end_customer_id")

                      const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true

                      if (isValid) {
                        // ✅ MANUAL VALIDATION: End Customer obligatorio solo para Partner users en Paso 3
                        if (currentStep === 3 && !isScaleUpUser) {
                          const endCustomerId = form.getValues("end_customer_id")
                          if (!endCustomerId) {
                            form.setError("end_customer_id", {
                              type: "manual",
                              message: t("common.errors.required") || "Este campo es obligatorio"
                            })
                            return
                          }
                        }

                        // SI ES EL PASO DE TECH FIELDS (Paso 4) -> Validar manualmente
                        if (currentStep === 4 && hasTechFields) {
                          let hasTechError = false
                          techFields.forEach((field: any) => {
                            if (field.is_required) {
                              const val = form.getValues(`opportunity_tech_fields.${field.id}` as any)
                              if (!val || (Array.isArray(val) && val.length === 0)) {
                                form.setError(`opportunity_tech_fields.${field.id}` as any, {
                                  type: "manual",
                                  message: t("opportunities.form.mandatoryField")
                                })
                                hasTechError = true
                              }
                            }
                          })
                          if (hasTechError) return
                        }

                        // SOLO AVANZAR EL PASO. No llamar a handleSubmit aquí.
                        let nextStep = currentStep + 1
                        // Si no hay campos técnicos, saltar del 3 directamente al 5 (Resumen)
                        if (currentStep === 3 && !hasTechFields) nextStep = 5

                        setCurrentStep(nextStep)
                      }
                    }}
                  >
                    {t("common.next")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loadingScaleUpManager}
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setIsConfirming(true)}
                  >
                    {loadingScaleUpManager ? t("opportunities.form.creating") : t("opportunities.form.submit")}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
      {/* End Narrow Container */}

      {/* Modal: Crear Nuevo Cliente Final */}
      <Dialog open={newEndCustomerDialogOpen} onOpenChange={setNewEndCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("opportunities.form.new_end_customer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("opportunities.form.new_end_customer_name")} *</label>
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
                  <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
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
                  <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
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
                      title: t("common.error"),
                      description: t("opportunities.form.creatingFailed"),
                      variant: "destructive",
                    })
                  }
                } catch (error) {
                  console.error("Error creating end customer:", error)
                  toast({
                    title: t("common.error"),
                    description: t("opportunities.form.creatingError"),
                    variant: "destructive",
                  })
                } finally {
                  setIsCreatingEndCustomer(false)
                }
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              {t("opportunities.form.create_end_customer")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Nuevo Partner Prospecto - Improved UX/UI */}
      <Dialog open={prospectDialogOpen} onOpenChange={(open) => {
        setProspectDialogOpen(open)
        if (!open) {
          setProspectStep(1) // Reset step when closing
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t("opportunities.prospect.title")}</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t(prospectStep === 1 ? "opportunities.prospect.step1" : "opportunities.prospect.step2")}
              </p>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full transition-colors ${prospectStep >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className={`flex-1 h-1 rounded-full transition-colors ${prospectStep >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
          </div>

          {/* Step 1: Company Info */}
          {prospectStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">{t("opportunities.prospect.name")}</h3>
                    <p className="text-sm text-blue-700">{t("opportunities.prospect.step1Description")}</p>
                  </div>
                </div>
              </div>

              {/* Nombre del Partner */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.prospect.name")} *</label>
                <Input
                  placeholder="Nombre de la empresa"
                  value={prospectPartnerData.name}
                  onChange={(e) => setProspectPartnerData({ ...prospectPartnerData, name: e.target.value })}
                  className="text-base"
                />
              </div>

              {/* Sitio Web */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.prospect.website")}</label>
                <Input
                  placeholder="https://ejemplo.com"
                  value={prospectPartnerData.website}
                  onChange={(e) => setProspectPartnerData({ ...prospectPartnerData, website: e.target.value })}
                  className="text-base"
                />
              </div>

              {/* País Principal */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.prospect.country")} *</label>
                <Select value={prospectPartnerData.main_country_id} onValueChange={(value) => {
                  setProspectPartnerData({ ...prospectPartnerData, main_country_id: value })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setProspectDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                <Button
                  disabled={!prospectPartnerData.name || !prospectPartnerData.main_country_id}
                  onClick={() => setProspectStep(2)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {t("common.next")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {prospectStep === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">{t("opportunities.prospect.contact_title")}</h3>
                    <p className="text-sm text-green-700">{t("opportunities.prospect.contact_info_description")}</p>
                  </div>
                </div>
              </div>

              {/* Nombre y Apellido en grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("opportunities.prospect.first_name")} *</label>
                  <Input
                    placeholder={t("opportunities.prospect.first_name_placeholder")}
                    value={prospectContactData.first_name}
                    onChange={(e) => setProspectContactData({ ...prospectContactData, first_name: e.target.value })}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("opportunities.prospect.last_name")} *</label>
                  <Input
                    placeholder={t("opportunities.prospect.last_name_placeholder")}
                    value={prospectContactData.last_name}
                    onChange={(e) => setProspectContactData({ ...prospectContactData, last_name: e.target.value })}
                    className="text-base"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.prospect.email")} *</label>
                <Input
                  placeholder={t("opportunities.prospect.email_placeholder")}
                  type="email"
                  value={prospectContactData.email}
                  onChange={(e) => setProspectContactData({ ...prospectContactData, email: e.target.value })}
                  className="text-base"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.prospect.phone")}</label>
                <Input
                  placeholder={t("opportunities.prospect.phone_placeholder")}
                  value={prospectContactData.phone}
                  onChange={(e) => setProspectContactData({ ...prospectContactData, phone: e.target.value })}
                  className="text-base"
                />
              </div>

              {/* Idioma Preferido */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.prospect.preferred_language")}</label>
                <Select value={prospectContactData.preferred_language} onValueChange={(value: any) => {
                  setProspectContactData({ ...prospectContactData, preferred_language: value })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("opportunities.form.select_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setProspectStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("opportunities.prospect.back")}
                </Button>
                <Button
                  disabled={
                    !prospectContactData.first_name ||
                    !prospectContactData.last_name ||
                    !prospectContactData.email
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    // Guardar datos en el form state
                    form.setValue("prospect_partner_data", prospectPartnerData, { shouldValidate: false })
                    form.setValue("prospect_contact_data", prospectContactData, { shouldValidate: false })
                    setProspectDialogOpen(false)
                    setProspectStep(1)
                    toast({
                      title: t("opportunities.prospect.success_title"),
                      description: t("opportunities.prospect.success_message"),
                    })
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {t("opportunities.prospect.save")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
