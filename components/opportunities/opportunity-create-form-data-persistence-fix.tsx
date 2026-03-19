"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "@/hooks/use-translations"
import { createOpportunity, getOpportunityStages, getPartnerCountries } from "@/lib/services/opportunity-service"
import { getTechCompanies } from "@/lib/services/tech-company-service"
import { getPartners } from "@/lib/services/partner-service"
import { getEndCustomers, createEndCustomer } from "@/lib/services/end-customer-service"
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
  Tag,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  Plus,
  Check,
  Info,
  AlertCircle,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getOpportunityTechFieldsClient } from "@/lib/services/opportunity-tech-field-service-client"
import { getIndustries } from "@/lib/services/industry-service-client"


// Constante para el valor "Sin Partner"
const NO_PARTNER_VALUE = "no_partner"

// CLAVE: Definir el tipo de datos del formulario FUERA del componente
type FormData = {
  title: string
  description: string
  pipeline_stage_id: string
  tech_company_id: string
  partner_id: string | null
  end_customer_id: string | null
  estimated_value: number | null
  tech_field_ids: string[]
  estimated_close_date: string | null
  country: string
  assigned_to: string | null
  partner_responsible_id: string | null
}

// Función para obtener partners por tech company
async function getPartnersByTechCompanyId(techCompanyId: string): Promise<Tables<"partners">[]> {
  try {
    const { data, error } = await supabase
      .from("partner_tech_companies")
      .select(`partner_id`)
      .eq("tech_company_id", techCompanyId)

    if (error) return []
    if (data.length === 0) return []

    const partnerIds = data.map((item) => item.partner_id)

    const { data: partnersData, error: partnersError } = await supabase
      .from("partners")
      .select("id, name, logo_url, website, city, is_active")
      .in("id", partnerIds)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (partnersError) return []
    return partnersData
  } catch (error) {
    return []
  }
}

// Función para obtener usuarios ScaleUp
async function getScaleUpUsers(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role_id")
      .is("partner_id", null)
      .is("tech_company_id", null)
      .eq("is_active", true)
      .order("first_name", { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    return []
  }
}

// Función para obtener usuarios del partner
async function getPartnerUsers(partnerId: string): Promise<any[]> {
  try {
    if (!partnerId) return []

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role_id")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .order("first_name", { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    return []
  }
}

export function OpportunityCreateFormDataPersistenceFix() {
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
    "opportunities.form.submit",
    "opportunities.form.cancel",
    "opportunities.form.select_placeholder",
    "opportunities.form.new_end_customer",
    "opportunities.form.estimated_close_date",
    "opportunities.form.country",
    "opportunities.form.assigned_to",
    "opportunities.form.partner_responsible",
    "opportunities.form.no_partner",
  ])

  // CLAVE: Estado persistente de los datos del formulario
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    pipeline_stage_id: preselectedStageId || "",
    tech_company_id: userInfo?.techCompanyId || "",
    partner_id: userInfo?.partnerId || null,
    end_customer_id: null,
    estimated_value: null,
    tech_field_ids: [],
    estimated_close_date: null,
    country: "",
    assigned_to: null,
    partner_responsible_id: null,
  })

  // Estado para el paso actual del formulario
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Estados de datos
  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [techCompanies, setTechCompanies] = useState<Tables<"tech_companies">[]>([])
  const [partners, setPartners] = useState<Tables<"partners">[]>([])
  const [filteredPartners, setFilteredPartners] = useState<Tables<"partners">[]>([])
  const [endCustomers, setEndCustomers] = useState<Tables<"end_customers">[]>([])
  const [techFields, setTechFields] = useState<any[]>([])
  const [partnerCountries, setPartnerCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [scaleUpUsers, setScaleUpUsers] = useState<any[]>([])
  const [partnerUsers, setPartnerUsers] = useState<any[]>([])
  const [industries, setIndustries] = useState<any[]>([])

  // Estados de loading
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStages, setLoadingStages] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingScaleUpUsers, setLoadingScaleUpUsers] = useState(false)
  const [loadingPartnerUsers, setLoadingPartnerUsers] = useState(false)
  const [loadingTechFields, setLoadingTechFields] = useState(false)
  const [loadingIndustries, setLoadingIndustries] = useState(false)

  // Estados de UI
  const [newEndCustomerDialogOpen, setNewEndCustomerDialogOpen] = useState(false)
  const [isCreatingEndCustomer, setIsCreatingEndCustomer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formProgress, setFormProgress] = useState(25)
  const [techFieldValues, setTechFieldValues] = useState<Record<string, any>>({})
  const [techFieldValidation, setTechFieldValidation] = useState<Record<string, boolean>>({})
  const [newEndCustomerData, setNewEndCustomerData] = useState({
    name: "",
    industry_id: "",
    website: "",
    tax_id: "",
    country_id: "",
  })

  // Información del usuario
  const isAdmin = userInfo?.isAdmin || false
  const userRole = userInfo?.roleCode || ""
  const partnerId = userInfo?.partnerId
  const techCompanyId = userInfo?.techCompanyId
  const isScaleUpUser = userRole.toLowerCase() !== "partneruser"

  // Schema de validación
  const formSchema = z.object({
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional(),
    pipeline_stage_id: z.string().min(1, "La etapa es obligatoria"),
    tech_company_id: z.string().min(1, "La empresa tecnológica es obligatoria"),
    partner_id: z.string().optional().nullable(),
    end_customer_id: isScaleUpUser
      ? z.string().optional().nullable()
      : z.string().min(1, "El cliente final es obligatorio"),
    estimated_value: z.coerce.number().optional().nullable(),
    tech_field_ids: z.array(z.string()).optional(),
    estimated_close_date: z.string().optional().nullable(),
    country: z.string().optional(),
    assigned_to: z.string().optional().nullable(),
    partner_responsible_id: z.string().optional().nullable(),
  })

  type FormValues = z.infer<typeof formSchema>

  // CLAVE: Inicializar el formulario con los datos persistentes
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
    mode: "onChange", // Validar en tiempo real
  })

  // CLAVE: Sincronizar el estado del formulario con nuestro estado persistente
  const syncFormData = useCallback(() => {
    const currentValues = form.getValues()
    console.log("🔄 Sincronizando datos del formulario:", currentValues)
    setFormData(currentValues)
  }, [form])

  // CLAVE: Actualizar datos cuando cambian los valores del formulario
  useEffect(() => {
    const subscription = form.watch((values) => {
      console.log("👀 Valores del formulario cambiaron:", values)
      setFormData((prev) => ({ ...prev, ...values }))
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Cargar datos iniciales
  useEffect(() => {
    async function loadInitialData() {
      try {
        console.log("📥 Cargando datos iniciales...")
        setLoadingStages(true)

        // Cargar etapas
        const stagesData = await getOpportunityStages()
        console.log("📊 Etapas cargadas:", stagesData.length)
        setStages(stagesData)

        // Establecer etapa por defecto
        if (!isScaleUpUser) {
          const leadStage = stagesData.find((stage) => stage.code.toLowerCase() === "lead")
          if (leadStage) {
            console.log("🎯 Asignando etapa Lead para usuario Partner:", leadStage.id)
            form.setValue("pipeline_stage_id", leadStage.id)
            setFormData((prev) => ({ ...prev, pipeline_stage_id: leadStage.id }))
          }
        } else if (stagesData.length > 0 && !preselectedStageId) {
          console.log("🎯 Asignando primera etapa:", stagesData[0].id)
          form.setValue("pipeline_stage_id", stagesData[0].id)
          setFormData((prev) => ({ ...prev, pipeline_stage_id: stagesData[0].id }))
        }

        setLoadingStages(false)

        // Cargar tech companies
        const techCompaniesData = await getTechCompanies()
        console.log("🏢 Tech companies cargadas:", techCompaniesData.length)
        setTechCompanies(techCompaniesData)

        // Cargar partners
        const partnersData = await getPartners()
        console.log("🤝 Partners cargados:", partnersData.length)
        setPartners(partnersData.sort((a, b) => a.name.localeCompare(b.name)))

        // Cargar end customers
        const endCustomersData = await getEndCustomers()
        console.log("👥 End customers cargados:", endCustomersData.length)
        setEndCustomers(endCustomersData)

        // Cargar usuarios ScaleUp
        setLoadingScaleUpUsers(true)
        const scaleUpUsersData = await getScaleUpUsers()
        console.log("👨‍💼 Usuarios ScaleUp cargados:", scaleUpUsersData.length)
        setScaleUpUsers(scaleUpUsersData)
        setLoadingScaleUpUsers(false)

        // Cargar industrias
        setLoadingIndustries(true)
        const industriesData = await getIndustries()
        console.log("🏭 Industrias cargadas:", industriesData.length)
        setIndustries(industriesData)
        setLoadingIndustries(false)

        console.log("✅ Datos iniciales cargados correctamente")
      } catch (error) {
        console.error("❌ Error loading initial data:", error)
        setError("Error al cargar los datos del formulario")
      }
    }

    loadInitialData()
  }, [])

  // Cargar partners cuando cambia tech company
  const loadPartnersForTechCompany = useCallback(
    async (techCompanyId: string) => {
      if (!techCompanyId) {
        setFilteredPartners(partners)
        return
      }

      try {
        console.log("🔍 Cargando partners para tech company:", techCompanyId)
        setLoadingPartners(true)

        if (partnerId) {
          const currentPartner = partners.find((p) => p.id === partnerId)
          setFilteredPartners(currentPartner ? [currentPartner] : [])
        } else {
          const relatedPartners = await getPartnersByTechCompanyId(techCompanyId)
          const partnersWithNoPartner = [
            {
              id: NO_PARTNER_VALUE,
              name: "Sin Partner",
              is_active: true,
              logo_url: null,
              website: null,
              city: null,
            },
            ...relatedPartners,
          ]
          setFilteredPartners(partnersWithNoPartner)
        }
        console.log("✅ Partners cargados para tech company")
      } catch (error) {
        console.error("❌ Error loading partners:", error)
      } finally {
        setLoadingPartners(false)
      }
    },
    [partners, partnerId],
  )

  // Cargar países cuando cambia partner
  const loadCountriesForPartner = useCallback(
    async (partnerId: string | null) => {
      if (!partnerId || partnerId === NO_PARTNER_VALUE) {
        try {
          console.log("🌍 Cargando todos los países")
          setLoadingCountries(true)
          const { data, error } = await supabase
            .from("countries")
            .select("id, name, code")
            .order("name", { ascending: true })

          if (!error && data) {
            setPartnerCountries(data)
            console.log("✅ Países cargados:", data.length)
          }
        } catch (error) {
          console.error("❌ Error loading countries:", error)
        } finally {
          setLoadingCountries(false)
        }
        return
      }

      try {
        console.log("🌍 Cargando países para partner:", partnerId)
        setLoadingCountries(true)
        const countriesData = await getPartnerCountries(partnerId)
        setPartnerCountries(countriesData)

        if (countriesData.length === 1) {
          console.log("🎯 Auto-seleccionando único país:", countriesData[0].code)
          form.setValue("country", countriesData[0].code)
          setFormData((prev) => ({ ...prev, country: countriesData[0].code }))
        }
        console.log("✅ Países del partner cargados:", countriesData.length)
      } catch (error) {
        console.error("❌ Error loading partner countries:", error)
      } finally {
        setLoadingCountries(false)
      }
    },
    [form],
  )

  // Cargar usuarios del partner
  const loadUsersForPartner = useCallback(
    async (partnerId: string | null) => {
      if (!partnerId || partnerId === NO_PARTNER_VALUE) {
        setPartnerUsers([])
        form.setValue("partner_responsible_id", null)
        setFormData((prev) => ({ ...prev, partner_responsible_id: null }))
        return
      }

      try {
        console.log("👥 Cargando usuarios para partner:", partnerId)
        setLoadingPartnerUsers(true)
        const users = await getPartnerUsers(partnerId)
        setPartnerUsers(users)

        if (users.length > 0) {
          console.log("🎯 Auto-asignando primer usuario del partner:", users[0].id)
          form.setValue("partner_responsible_id", users[0].id)
          setFormData((prev) => ({ ...prev, partner_responsible_id: users[0].id }))
        }
        console.log("✅ Usuarios del partner cargados:", users.length)
      } catch (error) {
        console.error("❌ Error loading partner users:", error)
      } finally {
        setLoadingPartnerUsers(false)
      }
    },
    [form],
  )

  // Cargar tech fields
  const loadTechFields = useCallback(
    async (techCompanyId: string) => {
      if (!techCompanyId) {
        setTechFields([])
        setTechFieldValues({})
        setTechFieldValidation({})
        return
      }

      try {
        console.log("🔧 Cargando tech fields para:", techCompanyId)
        setLoadingTechFields(true)
        const techFieldsData = await getOpportunityTechFieldsClient(techCompanyId)
        setTechFields(techFieldsData)

        const initialValues = {}
        const initialValidation = {}

        techFieldsData.forEach((field) => {
          switch (field.field_type) {
            case "boolean":
              initialValues[field.id] = false
              break
            case "multiselect":
              initialValues[field.id] = []
              break
            default:
              initialValues[field.id] = ""
          }
          initialValidation[field.id] = !field.is_required
        })

        setTechFieldValues(initialValues)
        setTechFieldValidation(initialValidation)

        const fieldIds = techFieldsData.map((field) => field.id)
        form.setValue("tech_field_ids", fieldIds)
        setFormData((prev) => ({ ...prev, tech_field_ids: fieldIds }))

        console.log("✅ Tech fields cargados:", techFieldsData.length)
      } catch (error) {
        console.error("❌ Error loading tech fields:", error)
      } finally {
        setLoadingTechFields(false)
      }
    },
    [form],
  )

  // Handlers para cambios de valores
  const handleTechCompanyChange = useCallback(
    (value: string) => {
      console.log("🏢 Tech company cambiado a:", value)
      form.setValue("tech_company_id", value)
      form.setValue("partner_id", null)
      setFormData((prev) => ({ ...prev, tech_company_id: value, partner_id: null }))

      loadPartnersForTechCompany(value)
      loadTechFields(value)
    },
    [form, loadPartnersForTechCompany, loadTechFields],
  )

  const handlePartnerChange = useCallback(
    (value: string | null) => {
      console.log("🤝 Partner cambiado a:", value)
      form.setValue("partner_id", value)
      form.setValue("country", "")
      setFormData((prev) => ({ ...prev, partner_id: value, country: "" }))

      loadCountriesForPartner(value)
      loadUsersForPartner(value)
    },
    [form, loadCountriesForPartner, loadUsersForPartner],
  )

  const handleEndCustomerChange = useCallback(
    (value: string | null) => {
      console.log("👥 End customer cambiado a:", value)
      form.setValue("end_customer_id", value)
      setFormData((prev) => ({ ...prev, end_customer_id: value }))
    },
    [form],
  )

  // Handle form submission
  async function onSubmit(values: FormValues) {
    console.log("📤 Enviando formulario con valores:", values)
    console.log("📤 Estado persistente:", formData)

    setIsLoading(true)
    setError(null)

    try {
      if (!user || !user.id) {
        setError("No hay usuario autenticado")
        return
      }

      // CLAVE: Usar los datos del estado persistente, no solo los valores del formulario
      const finalData = { ...formData, ...values }
      console.log("📤 Datos finales para envío:", finalData)

      const opportunityData = {
        title: finalData.title,
        description: finalData.description || null,
        pipeline_stage_id: finalData.pipeline_stage_id,
        tech_company_id: finalData.tech_company_id,
        partner_id: finalData.partner_id === NO_PARTNER_VALUE ? null : finalData.partner_id || null,
        end_customer_id: finalData.end_customer_id || null,
        estimated_value: finalData.estimated_value || null,
        created_by: user.id,
        estimated_close_date: finalData.estimated_close_date || null,
        country: finalData.country || null,
        assigned_to: finalData.assigned_to || user.id,
        partner_responsible_id:
          finalData.partner_id === NO_PARTNER_VALUE ? null : finalData.partner_responsible_id || null,
      }

      console.log("💾 Creando oportunidad con datos:", opportunityData)
      const result = await createOpportunity(opportunityData, finalData.tech_field_ids || [], userRole)

      // Guardar valores de campos técnicos si existen
      if (result && result.id && Object.keys(techFieldValues).length > 0) {
        console.log("🔧 Guardando tech field values:", techFieldValues)
        const techValuesToInsert = Object.entries(techFieldValues).map(([fieldId, value]) => {
          const field = techFields.find((f) => f.id === fieldId)
          const insertData: any = {
            opportunity_id: result.id,
            opportunity_tech_field_id: fieldId,
          }

          switch (field?.field_type) {
            case "text":
            case "select":
            case "file":
              insertData.value_text = value
              break
            case "number":
              insertData.value_numeric = value !== "" ? Number(value) : null
              break
            case "boolean":
              insertData.value_boolean = value === true
              break
            case "date":
              insertData.value_date = value || null
              break
            case "multiselect":
              insertData.value_json = Array.isArray(value) ? value : []
              break
            default:
              insertData.value =
                typeof value === "boolean" ? String(value) : Array.isArray(value) ? JSON.stringify(value) : value || ""
          }

          return insertData
        })

        await supabase.from("opportunity_tech_values").insert(techValuesToInsert)
        console.log("✅ Tech field values guardados")
      }

      toast({
        title: "Oportunidad creada",
        description: "La oportunidad se ha creado correctamente",
      })

      console.log("✅ Oportunidad creada exitosamente, redirigiendo...")
      router.push("/dashboard/opportunities")
    } catch (error: any) {
      console.error("❌ Error creating opportunity:", error)
      setError(error.message || "Ha ocurrido un error al crear la oportunidad")
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al crear la oportunidad",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle creating a new end customer
  async function handleCreateEndCustomer() {
    if (!newEndCustomerData.name.trim()) return

    setIsCreatingEndCustomer(true)

    try {
      const customerData = {
        name: newEndCustomerData.name.trim(),
        industry_id: newEndCustomerData.industry_id || null,
        website: newEndCustomerData.website || null,
        tax_id: newEndCustomerData.tax_id || null,
        country_id: newEndCustomerData.country_id || null,
      }

      const newEndCustomer = await createEndCustomer(customerData)
      setEndCustomers((prev) => [...prev, newEndCustomer])
      handleEndCustomerChange(newEndCustomer.id)

      setNewEndCustomerData({
        name: "",
        industry_id: "",
        website: "",
        tax_id: "",
        country_id: "",
      })
      setNewEndCustomerDialogOpen(false)

      toast({
        title: "Cliente creado",
        description: `El cliente "${newEndCustomer.name}" ha sido creado correctamente`,
      })
    } catch (error) {
      console.error("Error creating end customer:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el cliente final",
        variant: "destructive",
      })
    } finally {
      setIsCreatingEndCustomer(false)
    }
  }

  // Funciones de navegación
  const nextStep = () => {
    console.log("➡️ Avanzando al siguiente paso. Datos actuales:", formData)
    syncFormData() // CLAVE: Sincronizar antes de cambiar de paso

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setFormProgress((currentStep + 1) * (100 / totalSteps))
    }
  }

  const prevStep = () => {
    console.log("⬅️ Retrocediendo al paso anterior. Datos actuales:", formData)
    syncFormData() // CLAVE: Sincronizar antes de cambiar de paso

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setFormProgress((currentStep - 1) * (100 / totalSteps))
    }
  }

  // Verificar si el paso está completo
  const isStepComplete = () => {
    // CLAVE: Usar los datos persistentes para validar
    const currentData = { ...formData, ...form.getValues() }
    console.log("🔍 Validando paso", currentStep, "con datos:", currentData)

    switch (currentStep) {
      case 1:
        return !!currentData.title && !!currentData.pipeline_stage_id
      case 2:
        return !!currentData.tech_company_id && (isScaleUpUser || !!currentData.partner_id)
      case 3:
        return isScaleUpUser || !!currentData.end_customer_id
      case 4:
        return techFields.filter((field) => field.is_required).every((field) => techFieldValidation[field.id])
      default:
        return false
    }
  }

  // Renderizar pasos (simplificado para enfocarse en la persistencia de datos)
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Información básica de la oportunidad</h3>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Título <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Implementación de solución CRM para empresa X"
                      onChange={(e) => {
                        field.onChange(e)
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }}
                    />
                  </FormControl>
                  <FormDescription>Nombre descriptivo y conciso de la oportunidad</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Describe los detalles de esta oportunidad..."
                      className="min-h-[120px]"
                      onChange={(e) => {
                        field.onChange(e)
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }}
                    />
                  </FormControl>
                  <FormDescription>Proporciona detalles adicionales sobre la oportunidad</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isScaleUpUser && (
              <FormField
                control={form.control}
                name="pipeline_stage_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Etapa <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setFormData((prev) => ({ ...prev, pipeline_stage_id: value }))
                      }}
                      value={field.value}
                      disabled={loadingStages}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingStages ? "Cargando..." : "Seleccionar etapa"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Selecciona la etapa actual en el proceso de ventas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Debug info */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Debug Paso 1:</strong>
              <br />
              Title: {formData.title || "vacío"}
              <br />
              Stage: {formData.pipeline_stage_id || "vacío"}
              <br />
              Completo: {isStepComplete() ? "✅" : "❌"}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Empresas involucradas</h3>
            </div>

            <FormField
              control={form.control}
              name="tech_company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Empresa tecnológica <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={handleTechCompanyChange}
                    value={field.value || undefined}
                    disabled={!!techCompanyId}
                  >
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
                  <FormDescription>Empresa tecnológica relacionada con esta oportunidad</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isScaleUpUser && (
              <FormField
                control={form.control}
                name="partner_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner</FormLabel>
                    <Select
                      onValueChange={handlePartnerChange}
                      value={field.value || undefined}
                      disabled={!!partnerId || loadingPartners}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingPartners ? "Cargando..." : "Seleccionar partner"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredPartners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Partner que gestiona esta oportunidad</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Debug info */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Debug Paso 2:</strong>
              <br />
              Tech Company: {formData.tech_company_id || "vacío"}
              <br />
              Partner: {formData.partner_id || "vacío"}
              <br />
              Completo: {isStepComplete() ? "✅" : "❌"}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Cliente y detalles financieros</h3>
            </div>

            <FormField
              control={form.control}
              name="end_customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente final {!isScaleUpUser && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={handleEndCustomerChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {endCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setNewEndCustomerDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>Cliente final para quien se desarrollará esta oportunidad</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isScaleUpUser && (
              <FormField
                control={form.control}
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor estimado</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          type="number"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number.parseFloat(e.target.value)
                            field.onChange(value)
                            setFormData((prev) => ({ ...prev, estimated_value: value }))
                          }}
                          className="pl-10"
                          placeholder="0.00"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Valor monetario estimado de esta oportunidad</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Debug info */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Debug Paso 3:</strong>
              <br />
              End Customer: {formData.end_customer_id || "vacío"}
              <br />
              Estimated Value: {formData.estimated_value || "vacío"}
              <br />
              Completo: {isStepComplete() ? "✅" : "❌"}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Finalización</h3>
            </div>

            <div className="p-4 border rounded-md bg-blue-50 border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Resumen de la oportunidad
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                <p>
                  <strong>Título:</strong> {formData.title || "No especificado"}
                </p>
                <p>
                  <strong>Empresa tecnológica:</strong>{" "}
                  {techCompanies.find((c) => c.id === formData.tech_company_id)?.name || "No especificada"}
                </p>
                <p>
                  <strong>Partner:</strong>{" "}
                  {filteredPartners.find((p) => p.id === formData.partner_id)?.name || "No especificado"}
                </p>
                <p>
                  <strong>Cliente final:</strong>{" "}
                  {endCustomers.find((c) => c.id === formData.end_customer_id)?.name || "No especificado"}
                </p>
                <p>
                  <strong>Valor estimado:</strong> {formData.estimated_value || "No especificado"}
                </p>
              </div>
            </div>

            {/* Debug info completo */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Debug Datos Finales:</strong>
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(formData, null, 2)}</pre>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="text-2xl">Crear nueva oportunidad (Data Persistence Fix)</CardTitle>
        <CardDescription>Versión con persistencia de datos mejorada</CardDescription>

        <div className="mt-4">
          <div className="flex justify-between mb-2 text-sm">
            <span>Progreso</span>
            <span>{formProgress}%</span>
          </div>
          <Progress value={formProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm">
                {currentStep}
              </span>
              <span>
                {currentStep === 1 && "Información básica"}
                {currentStep === 2 && "Empresas involucradas"}
                {currentStep === 3 && "Cliente y detalles financieros"}
                {currentStep === 4 && "Finalización"}
              </span>
            </h2>

            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i + 1 === currentStep ? "bg-primary" : i + 1 < currentStep ? "bg-primary/60" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard/opportunities")}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} disabled={!isStepComplete()} className="gap-2">
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading || !isStepComplete()} className="gap-2">
                    {isLoading ? (
                      <>Guardando...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>

        {/* Dialog para crear nuevo cliente */}
        <Dialog open={newEndCustomerDialogOpen} onOpenChange={setNewEndCustomerDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo cliente final</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <FormLabel>
                  Nombre del cliente <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <Input
                  value={newEndCustomerData.name}
                  onChange={(e) => setNewEndCustomerData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del nuevo cliente"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Industria</FormLabel>
                <Select
                  value={newEndCustomerData.industry_id}
                  onValueChange={(value) => setNewEndCustomerData((prev) => ({ ...prev, industry_id: value }))}
                  disabled={loadingIndustries}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingIndustries ? "Cargando..." : "Seleccionar industria"} />
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

              <Button
                onClick={handleCreateEndCustomer}
                disabled={!newEndCustomerData.name.trim() || isCreatingEndCustomer}
                className="w-full gap-2"
              >
                {isCreatingEndCustomer ? (
                  <>Creando...</>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Crear cliente
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
