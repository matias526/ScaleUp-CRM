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


// Tipos de archivos permitidos por defecto (extensiones)
const DEFAULT_ALLOWED_FILE_TYPES = [
  // Imágenes
  "jpg",
  "jpeg",
  "png",
  "gif",
  "svg",
  // Documentos
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  // Comprimidos
  "zip",
  "rar",
]

// Constante para el valor "Sin Partner"
const NO_PARTNER_VALUE = "no_partner"

// Modificar la función getPartnersByTechCompanyId para ordenar los partners alfabéticamente
async function getPartnersByTechCompanyId(techCompanyId: string): Promise<Tables<"partners">[]> {
  try {
    console.log(`🔧 getPartnersByTechCompanyId - Obteniendo partners para tech company ID: ${techCompanyId}`)

    if (!techCompanyId) {
      console.log(`🔧 getPartnersByTechCompanyId - No se proporcionó tech company ID`)
      return []
    }

    // Primero verificamos si hay relaciones en la tabla partner_tech_companies
    const { data, error } = await supabase
      .from("partner_tech_companies")
      .select(`partner_id`)
      .eq("tech_company_id", techCompanyId)

    if (error) {
      console.error("🔧 getPartnersByTechCompanyId - Error al obtener relaciones partner-tech company:", error)
      return []
    }

    console.log(
      `🔧 getPartnersByTechCompanyId - Se encontraron ${data?.length || 0} relaciones para tech company ${techCompanyId}`,
    )

    if (!data || data.length === 0) {
      console.log(`🔧 getPartnersByTechCompanyId - No hay relaciones para esta tech company`)
      return []
    }

    // Extraer los IDs de partners únicos
    const partnerIds = [...new Set(data.map((item) => item.partner_id))]
    console.log("🔧 getPartnersByTechCompanyId - IDs de partners únicos encontrados:", partnerIds)

    // Obtener los detalles de los partners
    const { data: partnersData, error: partnersError } = await supabase
      .from("partners")
      .select("id, name, logo_url, website, city, is_active")
      .in("id", partnerIds)
      .eq("is_active", true)
      .order("name", { ascending: true }) // Ordenar alfabéticamente por nombre

    if (partnersError) {
      console.error("🔧 getPartnersByTechCompanyId - Error al obtener detalles de partners:", partnersError)
      return []
    }

    console.log(
      `🔧 getPartnersByTechCompanyId - Se obtuvieron ${partnersData?.length || 0} partners activos:`,
      partnersData?.map((p) => ({ id: p.id, name: p.name })),
    )
    return partnersData || []
  } catch (error) {
    console.error("🔧 getPartnersByTechCompanyId - Error inesperado:", error)
    return []
  }
}

// Modificar la función getScaleUpUsers para filtrar también por tech_company_id IS NULL
async function getScaleUpUsers(): Promise<any[]> {
  try {
    console.log("Obteniendo usuarios de ScaleUp")

    // Mostrar la consulta que se está ejecutando
    console.log(
      "CONSULTA SCALEUP USERS: ",
      "SELECT id, first_name, last_name, email, role_id FROM users WHERE partner_id IS NULL AND tech_company_id IS NULL AND is_active = true ORDER BY first_name ASC",
    )

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role_id")
      .is("partner_id", null) // Usuarios que no pertenecen a ningún partner
      .is("tech_company_id", null) // Usuarios que no pertenecen a ninguna tech company
      .eq("is_active", true)
      .order("first_name", { ascending: true })

    if (error) {
      console.error("Error al obtener usuarios de ScaleUp:", error)
      return []
    }

    // Mostrar los resultados de la consulta
    console.log(`Se obtuvieron ${data?.length || 0} usuarios de ScaleUp:`, data)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener usuarios de ScaleUp:", error)
    return []
  }
}

// Modificar la función getPartnerUsers para usar role_id en lugar de role_code
async function getPartnerUsers(partnerId: string): Promise<any[]> {
  try {
    if (!partnerId) return []

    console.log(`Obteniendo usuarios para el partner ID: ${partnerId}`)

    // Mostrar la consulta que se está ejecutando
    console.log(
      "CONSULTA PARTNER USERS: ",
      `SELECT id, first_name, last_name, email, role_id FROM users WHERE partner_id = '${partnerId}' AND is_active = true ORDER BY first_name ASC`,
    )

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role_id")
      .eq("partner_id", partnerId)
      .eq("is_active", true)
      .order("first_name", { ascending: true })

    if (error) {
      console.error("Error al obtener usuarios del partner:", error)
      return []
    }

    // Mostrar los resultados de la consulta
    console.log(`Se obtuvieron ${data?.length || 0} usuarios para el partner:`, data)
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener usuarios del partner:", error)
    return []
  }
}

export function OpportunityCreateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStageId = searchParams.get("stage")

  // Usar el contexto de autenticación para obtener la información del usuario
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

  // 🔧 SOLUCIÓN: useRef para mantener datos persistentes
  const persistentData = useRef<any>({})
  const [forceUpdate, setForceUpdate] = useState(0)

  // Estado para el paso actual del formulario
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const [stages, setStages] = useState<Tables<"pipeline_stages">[]>([])
  const [techCompanies, setTechCompanies] = useState<Tables<"tech_companies">[]>([])
  const [partners, setPartners] = useState<Tables<"partners">[]>([])
  const [filteredPartners, setFilteredPartners] = useState<Tables<"partners">[]>([])
  const [endCustomers, setEndCustomers] = useState<Tables<"end_customers">[]>([])
  const [techFields, setTechFields] = useState<any[]>([])
  const [partnerCountries, setPartnerCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newEndCustomerDialogOpen, setNewEndCustomerDialogOpen] = useState(false)
  const [isCreatingEndCustomer, setIsCreatingEndCustomer] = useState(false)
  const [loadingStages, setLoadingStages] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [scaleUpManager, setScaleUpManager] = useState<string | null>(null)
  const [loadingScaleUpManager, setLoadingScaleUpManager] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [formProgress, setFormProgress] = useState(25)
  const [techFieldValues, setTechFieldValues] = useState<Record<string, any>>({})
  const [techFieldsDebugInfo, setTechFieldsDebugInfo] = useState<any>(null)
  const [loadingTechFields, setLoadingTechFields] = useState(false)
  const [techFieldValidation, setTechFieldValidation] = useState<Record<string, boolean>>({})
  const [scaleUpUsers, setScaleUpUsers] = useState<any[]>([])
  const [partnerUsers, setPartnerUsers] = useState<any[]>([])
  const [loadingScaleUpUsers, setLoadingScaleUpUsers] = useState(false)
  const [loadingPartnerUsers, setLoadingPartnerUsers] = useState(false)
  const [endCustomerSearchQuery, setEndCustomerSearchQuery] = useState("")
  const [endCustomerPopoverOpen, setEndCustomerPopoverOpen] = useState(false)
  const [industries, setIndustries] = useState<any[]>([])
  const [loadingIndustries, setLoadingIndustries] = useState(false)
  const [newEndCustomerData, setNewEndCustomerData] = useState({
    name: "",
    industry_id: "",
    website: "",
    tax_id: "",
    country_id: "",
  })

  const [searchingEndCustomers, setSearchingEndCustomers] = useState(false)
  const [searchResults, setSearchResults] = useState<Tables<"end_customers">[]>([])

  // Obtener información del usuario directamente del contexto de autenticación
  const isAdmin = userInfo?.isAdmin || false
  const userRole = userInfo?.roleCode || ""
  const partnerId = userInfo?.partnerId
  const techCompanyId = userInfo?.techCompanyId
  const partnerCountriesFromUser = userInfo?.partnerCountries || []

  // Determinar si el usuario es de ScaleUp (Admin, BDD o cualquier rol que no sea Partner)
  const isScaleUpUser = userRole.toLowerCase() !== "partneruser"

  // 🔧 ARREGLO CRÍTICO: Esquema de validación más simple y permisivo
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

  // Inicializar el formulario con valores por defecto
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // 🔧 Cambiar a onChange para validación en tiempo real
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
      is_new_partner: false, // Initialize is_new_partner
    },
  })

  // 🔧 ARREGLO CRÍTICO: Función mejorada para setValue que sincroniza con react-hook-form
  const setFormValue = (key: string, value: any) => {
    console.log(`🔧 Setting form value: ${key} = ${value}`)
    persistentData.current[key] = value
    form.setValue(key as any, value, { shouldValidate: true, shouldDirty: true })
    //setForceUpdate((prev) => prev + 1)
  }

  // 🔧 NUEVO: Función para sincronizar todos los datos persistentes con el formulario
  const syncPersistentDataToForm = () => {
    console.log("🔧 Sincronizando datos persistentes con el formulario:", persistentData.current)
    Object.keys(persistentData.current).forEach((key) => {
      if (persistentData.current[key] !== undefined && persistentData.current[key] !== null) {
        form.setValue(key as any, persistentData.current[key], { shouldValidate: true, shouldDirty: true })
      }
    })
  }

  // Función para obtener datos actuales
  const getCurrentData = () => {
    const formValues = form.getValues()
    return {
      ...persistentData.current,
      ...formValues,
      techFieldValues,
      newEndCustomerData,
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingStages(true)
        console.log("Cargando etapas del pipeline...")

        // Cargar etapas primero
        const stagesData = await getOpportunityStages()
        console.log("Etapas del pipeline cargadas:", stagesData)
        setStages(stagesData)

        // Para usuarios Partner, buscar y asignar automáticamente la etapa "Lead"
        if (!isScaleUpUser) {
          const leadStage = stagesData.find((stage) => stage.code.toLowerCase() === "lead")
          if (leadStage) {
            console.log("Asignando automáticamente etapa Lead para usuario Partner:", leadStage.id)
            setFormValue("pipeline_stage_id", leadStage.id)
          } else if (stagesData.length > 0) {
            // Si no encuentra "Lead", usar la primera etapa
            console.log("Etapa Lead no encontrada, usando la primera etapa:", stagesData[0].id)
            setFormValue("pipeline_stage_id", stagesData[0].id)
          }
        }
        // Para usuarios ScaleUp, mantener la lógica original
        else if (stagesData.length > 0 && !preselectedStageId) {
          console.log("Estableciendo etapa por defecto:", stagesData[0].id)
          setFormValue("pipeline_stage_id", stagesData[0].id)
        } else if (preselectedStageId) {
          // Verificar que la etapa preseleccionada existe
          const stageExists = stagesData.some((stage) => stage.id === preselectedStageId)
          if (stageExists) {
            console.log("Usando etapa preseleccionada:", preselectedStageId)
            setFormValue("pipeline_stage_id", preselectedStageId)
          } else {
            console.log("Etapa preseleccionada no encontrada, usando la primera etapa")
            setFormValue("pipeline_stage_id", stagesData[0].id)
          }
        }

        setLoadingStages(false)

        // 🔧 Lógica de carga de tech companies actualizada
        if (techCompanyId) {
          console.log("Usuario con Tech Company ID: cargando tech companies relacionadas")
          setFormValue("tech_company_id", techCompanyId) // Establecer por defecto

          try {
            const { data: relatedTechCompanies, error } = await supabase
              .from("partner_tech_companies")
              .select("tech_company_id")
              .eq("partner_id", partnerId) // Asumiendo que si tiene techCompanyId, también tiene partnerId

            if (error) {
              console.error("Error al obtener tech companies relacionadas:", error)
              throw error
            }

            if (relatedTechCompanies && relatedTechCompanies.length > 0) {
              const techCompanyIds = relatedTechCompanies.map((item) => item.tech_company_id)
              console.log("IDs de tech companies relacionadas:", techCompanyIds)

              const { data: techCompaniesData, error: techError } = await supabase
                .from("tech_companies")
                .select("*")
                .in("id", techCompanyIds)
                .eq("is_active", true) // 🔧 Solo tech companies activas
                .order("name", { ascending: true })

              if (techError) {
                console.error("Error al obtener detalles de tech companies:", techError)
                throw techError
              }

              console.log("Tech companies relacionadas cargadas:", techCompaniesData)
              setTechCompanies(techCompaniesData || [])

              // Si solo hay una tech company, seleccionarla automáticamente
              if (techCompaniesData && techCompaniesData.length === 1) {
                console.log("Solo hay una tech company, seleccionándola automáticamente:", techCompaniesData[0].id)
                setFormValue("tech_company_id", techCompaniesData[0].id)
              }
            } else {
              console.log("No se encontraron tech companies relacionadas con este partner")
              setTechCompanies([])
            }
          } catch (error) {
            console.error("Error al cargar tech companies relacionadas:", error)
            // Cargar todas las tech companies activas como fallback
            const techCompaniesData = await getTechCompanies()
            const activeTechCompanies = techCompaniesData.filter((company) => company.is_active)
            setTechCompanies(activeTechCompanies)
          }
        } else if (partnerId && !isScaleUpUser) {
          // 🔧 NUEVO: Para usuarios Partner sin techCompanyId específico, cargar solo las tech companies relacionadas
          console.log("Usuario Partner: cargando tech companies relacionadas")

          try {
            const { data: relatedTechCompanies, error } = await supabase
              .from("partner_tech_companies")
              .select("tech_company_id")
              .eq("partner_id", partnerId)

            if (error) {
              console.error("Error al obtener tech companies relacionadas:", error)
              throw error
            }

            if (relatedTechCompanies && relatedTechCompanies.length > 0) {
              const techCompanyIds = relatedTechCompanies.map((item) => item.tech_company_id)
              console.log("IDs de tech companies relacionadas:", techCompanyIds)

              const { data: techCompaniesData, error: techError } = await supabase
                .from("tech_companies")
                .select("*")
                .in("id", techCompanyIds)
                .eq("is_active", true)
                .order("name", { ascending: true })

              if (techError) {
                console.error("Error al obtener detalles de tech companies:", techError)
                throw techError
              }

              console.log("Tech companies relacionadas cargadas:", techCompaniesData)
              setTechCompanies(techCompaniesData || [])

              // Si solo hay una tech company, seleccionarla automáticamente
              if (techCompaniesData && techCompaniesData.length === 1) {
                console.log("Solo hay una tech company, seleccionándola automáticamente:", techCompaniesData[0].id)
                setFormValue("tech_company_id", techCompaniesData[0].id)
              }
            } else {
              console.log("No se encontraron tech companies relacionadas con este partner")
              setTechCompanies([])
            }
          } catch (error) {
            console.error("Error al cargar tech companies relacionadas:", error)
            // Como fallback para usuarios Partner, no cargar nada
            setTechCompanies([])
          }
        } else {
          // Para usuarios ScaleUp, cargar todas las tech companies activas
          console.log("Usuario ScaleUp: cargando todas las tech companies activas")
          const techCompaniesData = await getTechCompanies()
          const activeTechCompanies = techCompaniesData.filter((company) => company.is_active)
          console.log(
            `Se cargaron ${activeTechCompanies.length} tech companies activas de ${techCompaniesData.length} totales`,
          )
          setTechCompanies(activeTechCompanies)
        }

        // Cargar el resto de datos
        const [allPartnersData, endCustomersData] = await Promise.all([
          getPartners(),
          // Si es un usuario Partner, cargar solo sus clientes finales
          partnerId ? getEndCustomersForPartner(partnerId) : getEndCustomers(),
        ])

        // Ordenar los partners alfabéticamente por nombre
        const sortedPartners = [...allPartnersData].sort((a, b) => a.name.localeCompare(b.name))
        setPartners(sortedPartners)
        setEndCustomers(endCustomersData)

        // Si el usuario pertenece a una tech company, cargar partners relacionados
        if (techCompanyId) {
          setLoadingPartners(true)
          const relatedPartners = await getPartnersByTechCompanyId(techCompanyId)

          // Si es usuario ScaleUp, agregar opción "Sin Partner"
          if (isScaleUpUser) {
            const partnersWithNoPartnerOption = [
              {
                id: NO_PARTNER_VALUE,
                name: t("opportunities.form.no_partner", "Sin Partner"),
                is_active: true,
                logo_url: null,
                website: null,
                city: null,
              },
              ...relatedPartners,
            ]
            setFilteredPartners(partnersWithNoPartnerOption)
          } else {
            setFilteredPartners(relatedPartners)
          }
          setLoadingPartners(false)
        } else {
          // Si no hay tech company seleccionada, mostrar todos los partners ordenados
          if (isScaleUpUser) {
            const partnersWithNoPartnerOption = [
              {
                id: NO_PARTNER_VALUE,
                name: t("opportunities.form.no_partner", "Sin Partner"),
                is_active: true,
                logo_url: null,
                website: null,
                city: null,
              },
              ...sortedPartners,
            ]
            setFilteredPartners(partnersWithNoPartnerOption)
          } else {
            setFilteredPartners(sortedPartners)
          }
        }

        // Si el usuario pertenece a un partner, establecerlo por defecto
        if (partnerId) {
          setFormValue("partner_id", partnerId)
          persistentData.current.partner_id = partnerId
        }

        // Cargar usuarios de ScaleUp para asignación
        setLoadingScaleUpUsers(true)
        const scaleUpUsersData = await getScaleUpUsers()
        setScaleUpUsers(scaleUpUsersData)
        setLoadingScaleUpUsers(false)

        // 🔧 NUEVO: Sincronizar datos después de cargar todo
        //setTimeout(() => {
        //  syncPersistentDataToForm()
        //}, 100)
      } catch (error) {
        console.error("Error loading form data:", error)
        setLoadingStages(false)
        setError("Error al cargar los datos del formulario")
      }
    }

    loadData()
  }, []) // 🔧 Removemos dependencias que causaban loops

  // Cargar industrias para el diálogo de nuevo cliente
  useEffect(() => {
    async function loadIndustries() {
      try {
        setLoadingIndustries(true)
        const industriesData = await getIndustries()
        setIndustries(industriesData)
      } catch (error) {
        console.error("Error loading industries:", error)
      } finally {
        setLoadingIndustries(false)
      }
    }

    loadIndustries()
  }, [])

  // Watch para los campos dependientes - 🔧 Simplificado
  const watchTechCompany = form.watch("tech_company_id")
  const watchPartner = form.watch("partner_id")
  const watchEndCustomer = form.watch("end_customer_id")

  // 🔧 Efecto mejorado para partners
  useEffect(() => {
    async function loadPartnersForTechCompany() {
      console.log(
        `🔧 PARTNERS - watchTechCompany: ${watchTechCompany}, persistentData: ${persistentData.current.tech_company_id}`,
      )

      if (watchTechCompany && watchTechCompany !== persistentData.current.prev_tech_company_for_partners) {
        persistentData.current.prev_tech_company_for_partners = watchTechCompany
        persistentData.current.tech_company_id = watchTechCompany

        try {
          setLoadingPartners(true)
          console.log(`🔧 Cargando partners para tech company ID: ${watchTechCompany}`)

          if (partnerId) {
            // Si el usuario es Partner, solo mostrar su partner
            const currentPartner = partners.find((p) => p.id === partnerId)
            if (currentPartner) {
              console.log(`🔧 Usuario Partner - mostrando solo su partner:`, currentPartner.name)
              setFilteredPartners([currentPartner])
            } else {
              console.log(`🔧 Usuario Partner - no se encontró su partner en la lista`)
              setFilteredPartners([])
            }
          } else {
            // Si es usuario ScaleUp, limpiar partner seleccionado y cargar partners relacionados
            console.log(`🔧 Usuario ScaleUp - limpiando partner seleccionado`)
            setFormValue("partner_id", null)

            // Obtener partners relacionados con esta tech company
            console.log(`🔧 Llamando a getPartnersByTechCompanyId con ID: ${watchTechCompany}`)
            const relatedPartners = await getPartnersByTechCompanyId(watchTechCompany)
            console.log(
              `🔧 Partners relacionados obtenidos:`,
              relatedPartners.map((p) => ({ id: p.id, name: p.name })),
            )

            // Para usuarios ScaleUp, agregar la opción "Sin Partner" al inicio
            const partnersWithNoPartnerOption = [
              {
                id: NO_PARTNER_VALUE,
                name: t("opportunities.form.no_partner", "Sin Partner"),
                is_active: true,
                logo_url: null,
                website: null,
                city: null,
              },
              ...relatedPartners,
            ]

            console.log(
              `🔧 Partners finales con opción Sin Partner:`,
              partnersWithNoPartnerOption.map((p) => ({ id: p.id, name: p.name })),
            )
            setFilteredPartners(partnersWithNoPartnerOption)
          }
        } catch (error) {
          console.error("🔧 Error al cargar partners para tech company:", error)
          // En caso de error, mostrar todos los partners con opción "Sin Partner"
          if (!partnerId) {
            const partnersWithNoPartnerOption = [
              {
                id: NO_PARTNER_VALUE,
                name: t("opportunities.form.no_partner", "Sin Partner"),
                is_active: true,
                logo_url: null,
                website: null,
                city: null,
              },
              ...partners,
            ]
            console.log(`🔧 Error - usando todos los partners como fallback`)
            setFilteredPartners(partnersWithNoPartnerOption)
          }
        } finally {
          setLoadingPartners(false)
        }
      }
    }

    // Solo ejecutar si hay una tech company seleccionada
    if (watchTechCompany) {
      loadPartnersForTechCompany()
    } else {
      // Si no hay tech company seleccionada, limpiar partners filtrados
      console.log(`🔧 No hay tech company seleccionada, limpiando partners filtrados`)
      if (!partnerId) {
        // Para usuarios ScaleUp sin tech company, mostrar todos los partners
        const partnersWithNoPartnerOption = [
          {
            id: NO_PARTNER_VALUE,
            name: t("opportunities.form.no_partner", "Sin Partner"),
            is_active: true,
            logo_url: null,
            website: null,
            city: null,
          },
          ...partners,
        ]
        setFilteredPartners(partnersWithNoPartnerOption)
      } else {
        // Para usuarios Partner, mostrar solo su partner
        const currentPartner = partners.find((p) => p.id === partnerId)
        setFilteredPartners(currentPartner ? [currentPartner] : [])
      }
    }
  }, [watchTechCompany, partners, partnerId, t])

  // 🔧 Efecto mejorado para ScaleUp Manager
  useEffect(() => {
    async function loadScaleUpManager() {
      if (
        watchTechCompany &&
        watchPartner &&
        (watchTechCompany !== persistentData.current.prev_tech_company_id ||
          watchPartner !== persistentData.current.prev_partner_id)
      ) {
        persistentData.current.prev_tech_company_id = watchTechCompany
        persistentData.current.prev_partner_id = watchPartner

        try {
          setLoadingScaleUpManager(true)
          console.log(`Buscando ScaleUp Manager para Tech Company ${watchTechCompany} y Partner ${watchPartner}`)

          const managerId = await getScaleUpManager(watchTechCompany, watchPartner)
          setScaleUpManager(managerId)

          if (managerId) {
            console.log(`ScaleUp Manager encontrado: ${managerId}, asignando automáticamente`)
            setFormValue("assigned_to", managerId)
          } else {
            console.log("No se encontró ScaleUp Manager, asignando al usuario actual")
            setFormValue("assigned_to", user?.id || null)
          }
        } catch (error) {
          console.error("Error al cargar ScaleUp Manager:", error)
          setFormValue("assigned_to", user?.id || null)
        } finally {
          setLoadingScaleUpManager(false)
        }
      }
    }

    loadScaleUpManager()
  }, [watchTechCompany, watchPartner, user])

  // 🔧 Efecto mejorado para usuarios del partner
  useEffect(() => {
    async function loadPartnerUsers() {
      if (watchPartner && watchPartner !== persistentData.current.prev_partner_for_users) {
        persistentData.current.prev_partner_for_users = watchPartner

        try {
          setLoadingPartnerUsers(true)
          console.log(`Cargando usuarios para el partner ID: ${watchPartner}`)

          const users = await getPartnerUsers(watchPartner)
          setPartnerUsers(users)

          if (users.length > 0) {
            setFormValue("partner_responsible_id", users[0].id)
          } else {
            setFormValue("partner_responsible_id", null)
          }
        } catch (error) {
          console.error("Error al cargar usuarios del partner:", error)
          setPartnerUsers([])
          setFormValue("partner_responsible_id", null)
        } finally {
          setLoadingPartnerUsers(false)
        }
      } else if (!watchPartner) {
        setPartnerUsers([])
        setFormValue("partner_responsible_id", null)
      }
    }

    loadPartnerUsers()
  }, [watchPartner])

  // 🔧 ARREGLO CRÍTICO: Efecto mejorado para tech fields
  useEffect(() => {
    async function loadTechFields() {
      // 🔧 Usar tanto watchTechCompany como persistentData para asegurar que se carguen
      const currentTechCompany = watchTechCompany || persistentData.current.tech_company_id

      console.log("🔧 TECH FIELDS - Checking:", {
        currentTechCompany,
        watchTechCompany,
        persistentTechCompany: persistentData.current.tech_company_id,
        previousTechCompany: persistentData.current.prev_tech_company_for_fields,
      })

      if (currentTechCompany && currentTechCompany !== persistentData.current.prev_tech_company_for_fields) {
        persistentData.current.prev_tech_company_for_fields = currentTechCompany

        try {
          setLoadingTechFields(true)
          console.log(`🔧 Cargando campos técnicos para tech company ID: ${currentTechCompany}`)

          const techFieldsData = await getOpportunityTechFieldsClient(currentTechCompany)
          console.log(`🔧 Campos técnicos obtenidos:`, techFieldsData)

          setTechFields(techFieldsData)

          // Inicializar valores para todos los campos técnicos
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

          setFormValue(
            "tech_field_ids",
            techFieldsData.map((field) => field.id),
          )
        } catch (error) {
          console.error("🔧 Error loading tech fields:", error)
          setTechFieldsDebugInfo({
            techCompanyId: currentTechCompany,
            error: error.message || "Error desconocido",
            stack: error.stack,
            timestamp: new Date().toISOString(),
          })
        } finally {
          setLoadingTechFields(false)
        }
      } else if (!currentTechCompany) {
        console.log("🔧 No tech company selected, clearing tech fields")
        setTechFields([])
        setTechFieldsDebugInfo(null)
        setTechFieldValues({})
        setTechFieldValidation({})
        setFormValue("tech_field_ids", [])
      }
    }

    loadTechFields()
  }, [watchTechCompany]) // 🔧 Agregar persistentData como dependencia

  // 🔧 ARREGLO CRÍTICO: Efecto mejorado para países
  useEffect(() => {
    async function loadPartnerCountries() {
      // 🔧 Usar tanto watchPartner como persistentData
      const currentPartner = watchPartner || persistentData.current.partner_id

      console.log(
        `🔧 PAÍSES - Partner actual: ${currentPartner}, Partner anterior: ${persistentData.current.prev_partner_for_countries}`,
      )

      if (currentPartner !== persistentData.current.prev_partner_for_countries) {
        persistentData.current.prev_partner_for_countries = currentPartner

        try {
          setLoadingCountries(true)
          setPartnerCountries([])
          setDebugInfo(null)

          if (!currentPartner || currentPartner === NO_PARTNER_VALUE) {
            console.log("🔧 Cargando todos los países (Sin Partner seleccionado)...")

            const { data: allCountriesData, error: allCountriesError } = await supabase
              .from("countries")
              .select("id, name, code")
              .order("name", { ascending: true })

            if (allCountriesError) {
              console.error("Error al obtener todos los países:", allCountriesError)
              setDebugInfo({
                error: allCountriesError.message || "Error al obtener todos los países",
                details: allCountriesError,
              })
            } else {
              console.log(`🔧 Se encontraron ${allCountriesData?.length || 0} países en total`)
              setPartnerCountries(allCountriesData || [])

              // 🔧 Restaurar el país persistente si existe
              if (persistentData.current.country) {
                const countryExists = allCountriesData?.some((c) => c.code === persistentData.current.country)
                if (countryExists) {
                  setFormValue("country", persistentData.current.country)
                } else {
                  // Si el país persistente no existe en todos los países, limpiar
                  setFormValue("country", "")
                  persistentData.current.country = ""
                }
              }
            }
          } else {
            console.log(`🔧 Cargando países para el partner ${currentPartner}...`)

            const countriesData = await getPartnerCountries(currentPartner)
            console.log(`🔧 Países cargados para el partner ${currentPartner}:`, countriesData)

            if (countriesData && countriesData.length > 0) {
              setPartnerCountries(countriesData)

              // 🔧 Solo establecer país automáticamente si no hay uno persistente
              if (!persistentData.current.country) {
                if (countriesData.length === 1) {
                  console.log(`🔧 Solo un país disponible, seleccionándolo automáticamente: ${countriesData[0].code}`)
                  setFormValue("country", countriesData[0].code)
                }

                if (partnerCountriesFromUser.length > 0) {
                  const userCountryCode = partnerCountriesFromUser[0].code
                  const countryExists = countriesData.some((c) => c.code === userCountryCode)
                  if (countryExists) {
                    console.log(`🔧 Seleccionando país del usuario: ${userCountryCode}`)
                    setFormValue("country", userCountryCode)
                  }
                }
              } else {
                // 🔧 Restaurar el país persistente si existe en la lista
                const countryExists = countriesData.some((c) => c.code === persistentData.current.country)
                if (countryExists) {
                  console.log(`🔧 Restaurando país persistente: ${persistentData.current.country}`)
                  setFormValue("country", persistentData.current.country)
                } else {
                  // Si el país persistente no está en la lista del nuevo partner, limpiar
                  console.log(`🔧 País persistente no disponible para este partner, limpiando`)
                  setFormValue("country", "")
                  persistentData.current.country = ""
                }
              }
            } else {
              console.log("🔧 No se encontraron países específicos para el partner, limpiando")
              // Limpiar país si el partner no tiene países asignados
              setFormValue("country", "")
              persistentData.current.country = ""
            }
          }
        } catch (error) {
          console.error("🔧 Error loading countries:", error)
          setDebugInfo({
            error: error.message || "Error desconocido al cargar países",
            stack: error.stack,
          })
        } finally {
          setLoadingCountries(false)
        }
      }
    }

    loadPartnerCountries()
  }, [watchPartner, partnerCountriesFromUser?.length])

  // Actualizar validación de campos técnicos cuando cambian los valores
  useEffect(() => {
    const newValidation = { ...techFieldValidation }

    techFields.forEach((field) => {
      if (field.is_required) {
        const value = techFieldValues[field.id]

        switch (field.field_type) {
          case "boolean":
            newValidation[field.id] = true
            break
          case "multiselect":
            newValidation[field.id] = Array.isArray(value) && value.length > 0
            break
          case "file":
            newValidation[field.id] = !!value && value.trim() !== ""
            break
          default:
            newValidation[field.id] = !!value && value.trim() !== ""
        }
      } else {
        newValidation[field.id] = true
      }
    })

    setTechFieldValidation(newValidation)
  }, [techFieldValues, techFields])

  // Función para buscar clientes finales en tiempo real
  const searchEndCustomersInRealTime = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchingEndCustomers(true)

      if (isScaleUpUser) {
        const results = await searchEndCustomers(query)
        setSearchResults(results)
      } else {
        const filtered = endCustomers.filter((customer) => customer.name.toLowerCase().includes(query.toLowerCase()))
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error("Error searching end customers:", error)
      setSearchResults([])
    } finally {
      setSearchingEndCustomers(false)
    }
  }

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (endCustomerSearchQuery) {
        searchEndCustomersInRealTime(endCustomerSearchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [endCustomerSearchQuery, endCustomers, isScaleUpUser])

  // 🔧 ARREGLO CRÍTICO: Handle form submission completamente reescrito
  const handleSubmit = async (values: FormValues) => {
    console.log("🔧 SUBMIT INICIADO - handleSubmit llamado")
    console.log("- Form values recibidos:", values)
    console.log("- Persistent data:", persistentData.current)
    console.log("- Tech field values:", techFieldValues)
    console.log("- Form errors:", form.formState.errors)
    console.log("- Form is valid:", form.formState.isValid)

    setIsLoading(true)
    setError(null)

    try {
      if (!user || !user.id) {
        console.error("No hay usuario autenticado")
        setError("No hay usuario autenticado. Por favor, inicia sesión nuevamente.")
        return
      }

      // 🔧 Combinar datos del formulario con datos persistentes
      const finalValues = {
        ...persistentData.current,
        ...values,
        // Asegurar que tenemos los valores críticos
        title: values.title || persistentData.current.title,
        tech_company_id: values.tech_company_id || persistentData.current.tech_company_id,
        pipeline_stage_id: values.pipeline_stage_id || persistentData.current.pipeline_stage_id,
        country: values.country || persistentData.current.country, // 🔧 Incluir país
        is_new_partner:
          values.is_new_partner !== undefined ? values.is_new_partner : persistentData.current.is_new_partner || false,
      }

      console.log("🔧 Final values para envío:", finalValues)

      // Validaciones básicas
      if (!finalValues.title) {
        throw new Error("El título es obligatorio")
      }
      if (!finalValues.tech_company_id) {
        throw new Error("La empresa tecnológica es obligatoria")
      }
      if (!finalValues.pipeline_stage_id) {
        throw new Error("La etapa es obligatoria")
      }

      // 🔧 NUEVO: Procesar valores de campos técnicos
      const techFieldData = []
      if (techFields.length > 0) {
        for (const field of techFields) {
          const value = techFieldValues[field.id]
          if (value !== undefined && value !== null && value !== "") {
            techFieldData.push({
              field_id: field.id,
              value: typeof value === "object" ? JSON.stringify(value) : String(value),
            })
          }
        }
      }

      // Crear la oportunidad
      const opportunityData = {
        title: finalValues.title,
        description: finalValues.description || null,
        pipeline_stage_id: finalValues.pipeline_stage_id,
        tech_company_id: finalValues.tech_company_id,
        partner_id: finalValues.partner_id === NO_PARTNER_VALUE ? null : finalValues.partner_id || null,
        end_customer_id: finalValues.end_customer_id || null,
        estimated_value: finalValues.estimated_value || null,
        created_by: user.id,
        estimated_close_date: finalValues.estimated_close_date || null,
        country: finalValues.country || null, // 🔧 Incluir país
        assigned_to: finalValues.assigned_to || user.id,
        partner_responsible_id:
          finalValues.partner_id === NO_PARTNER_VALUE ? null : finalValues.partner_responsible_id || null,
        is_new_partner: finalValues.is_new_partner || false,
      }

      console.log("🔧 Datos de oportunidad a crear:", opportunityData)
      console.log("🔧 Tech field data:", techFieldData)

      const result = await createOpportunity(opportunityData, finalValues.tech_field_ids || [], userRole)

      console.log("🔧 Resultado de la creación:", result)

      toast({
        title: "Oportunidad creada",
        description: "La oportunidad se ha creado correctamente",
      })

      // Navegar a la lista de oportunidades
      router.push("/dashboard/opportunities")
    } catch (error: any) {
      console.error("🔧 Error creating opportunity:", error)
      const errorMessage = error.message || "Ha ocurrido un error al crear la oportunidad"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 🔧 ARREGLO CRÍTICO: Función para manejar submit manual mejorada
  const handleManualSubmit = async () => {
    console.log("🔧 MANUAL SUBMIT INICIADO")

    // 🔧 NUEVO: Sincronizar datos persistentes antes de validar
    syncPersistentDataToForm()

    // Esperar un poco para que se actualice el formulario
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Obtener valores actuales del formulario
    const formValues = form.getValues()
    console.log("🔧 Form values:", formValues)
    console.log("🔧 Form errors:", form.formState.errors)
    console.log("🔧 Persistent data:", persistentData.current)

    // Validar manualmente
    const isValid = await form.trigger()
    console.log("🔧 Form is valid after trigger:", isValid)

    if (isValid) {
      await handleSubmit(formValues)
    } else {
      console.log("🔧 Form validation failed:", form.formState.errors)
      setError("Por favor, completa todos los campos obligatorios")

      // 🔧 NUEVO: Mostrar errores específicos
      const errors = form.formState.errors
      const errorMessages = []
      if (errors.title) errorMessages.push("Título es obligatorio")
      if (errors.pipeline_stage_id) errorMessages.push("Etapa es obligatoria")
      if (errors.tech_company_id) errorMessages.push("Empresa tecnológica es obligatoria")

      if (errorMessages.length > 0) {
        setError(`Campos faltantes: ${errorMessages.join(", ")}`)
      }
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
      setFormValue("end_customer_id", newEndCustomer.id)
      setNewEndCustomerData({
        name: "",
        industry_id: "",
        website: "",
        tax_id: "",
        country_id: "",
      })
      setEndCustomerSearchQuery("")
      setNewEndCustomerDialogOpen(false)
      setEndCustomerPopoverOpen(false)

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

  // Función para obtener traducciones con fallback
  const getTranslation = (key: string, fallback: string): string => {
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  // 🔧 Función mejorada para avanzar al siguiente paso
  const nextStep = () => {
    if (currentStep < totalSteps) {
      // Guardar datos del paso actual antes de avanzar
      const currentData = form.getValues()
      Object.keys(currentData).forEach((key) => {
        if (currentData[key] !== undefined && currentData[key] !== null) {
          persistentData.current[key] = currentData[key]
        }
      })

      if (!isScaleUpUser) {
        persistentData.current.is_new_partner = false
      }

      setCurrentStep(currentStep + 1)
      setFormProgress((currentStep + 1) * (100 / totalSteps))
      window.scrollTo(0, 0)
    }
  }

  // Función para volver al paso anterior
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setFormProgress((currentStep - 1) * (100 / totalSteps))
      window.scrollTo(0, 0)
    }
  }

  // 🔧 ARREGLO CRÍTICO: Verificar si el paso actual está completo - más permisivo
  const isStepComplete = () => {
    const values = form.getValues()
    const currentData = getCurrentData()

    switch (currentStep) {
      case 1: // Información básica
        const hasBasicInfo = !!(currentData.title && currentData.pipeline_stage_id)
        // For ScaleUp users, is_new_partner is optional (has default false)
        // For Partner users, is_new_partner should be false by default and not block progression
        return hasBasicInfo
      case 2: // Empresas
        return !!(currentData.tech_company_id && (isScaleUpUser || currentData.partner_id))
      case 3: // Cliente y detalles financieros
        return isScaleUpUser || !!currentData.end_customer_id
      case 4: // Campos técnicos y finalización - 🔧 Más permisivo
        // Si no hay campos técnicos, permitir continuar
        if (techFields.length === 0) {
          return true
        }

        // Si hay campos técnicos, verificar solo los requeridos
        const requiredFieldsValid = techFields
          .filter((field) => field.is_required)
          .every((field) => techFieldValidation[field.id])

        return requiredFieldsValid
      default:
        return false
    }
  }

  // Renderizar el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep()
      case 2:
        return renderCompaniesStep()
      case 3:
        return renderCustomerAndFinancialsStep()
      case 4:
        return renderTechFieldsStep()
      default:
        return null
    }
  }

  // 🔧 Debug mejorado - Mostrar datos de pasos anteriores
  const renderDebugInfo = () => {
    const currentData = getCurrentData()

    return (
      <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
        <strong>🔍 DEBUG - Paso {currentStep}:</strong>
        <div className="mt-1">
          <div>
            <strong>Title (del paso 1):</strong> {currentData.title || "No definido"}
          </div>
          <div>
            <strong>Tech Company (del paso 2):</strong> {currentData.tech_company_id || "No definido"}
          </div>
          <div>
            <strong>Partner (del paso 2):</strong> {currentData.partner_id || "No definido"}
          </div>
          <div>
            <strong>Is New Partner (del paso 1):</strong>{" "}
            {currentData.is_new_partner !== undefined ? String(currentData.is_new_partner) : "No definido"}
          </div>
          <div>
            <strong>Pipeline Stage:</strong> {currentData.pipeline_stage_id || "No definido"}
          </div>
          <div>
            <strong>Country:</strong> {currentData.country || "No definido"}
          </div>
          <div>
            <strong>End Customer:</strong> {currentData.end_customer_id || "No definido"}
          </div>
          <div>
            <strong>Persistent Data Keys:</strong> {Object.keys(persistentData.current).join(", ")}
          </div>
        </div>
      </div>
    )
  }

  // Paso 1: Información básica
  const renderBasicInfoStep = () => {
    return (
      <div className="space-y-6">
        {/* {renderDebugInfo()} */}

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
                {getTranslation("opportunities.form.title", "Título")}
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Implementación de solución CRM para empresa X"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => {
                    field.onChange(e)
                    persistentData.current.title = e.target.value
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
              <FormLabel>{getTranslation("opportunities.form.description", "Descripción")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="Describe los detalles de esta oportunidad..."
                  className="min-h-[120px] transition-all focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => {
                    field.onChange(e)
                    persistentData.current.description = e.target.value
                  }}
                />
              </FormControl>
              <FormDescription>
                Proporciona detalles adicionales sobre la oportunidad, necesidades del cliente, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isScaleUpUser && (
          <FormField
            control={form.control}
            name="is_new_partner"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Oportunidad para nuevo partner</FormLabel>
                  <FormDescription>
                    Marca esta opción si la oportunidad es para incorporar un nuevo partner
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      persistentData.current.is_new_partner = checked
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Mostrar el campo de etapa solo para usuarios ScaleUp */}
        {isScaleUpUser && (
          <FormField
            control={form.control}
            name="pipeline_stage_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {getTranslation("opportunities.form.stage", "Etapa")}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    persistentData.current.pipeline_stage_id = value
                  }}
                  value={field.value || persistentData.current.pipeline_stage_id || ""}
                  disabled={loadingStages}
                >
                  <FormControl>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                      <SelectValue
                        placeholder={
                          loadingStages
                            ? getTranslation("opportunities.form.loading", "Cargando...")
                            : getTranslation("opportunities.form.select_placeholder", "Seleccionar etapa")
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stages.length === 0 && !loadingStages && (
                      <div className="p-2 text-sm text-gray-500">No hay etapas disponibles.</div>
                    )}
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
      </div>
    )
  }

  // Paso 2: Empresas
  const renderCompaniesStep = () => {
    return (
      <div className="space-y-6">
        {/* {renderDebugInfo()} */}

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
                {getTranslation("opportunities.form.tech_company", "Empresa tecnológica")}
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  persistentData.current.tech_company_id = value
                }}
                value={field.value || persistentData.current.tech_company_id || ""}
                disabled={!!techCompanyId}
              >
                <FormControl>
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue
                      placeholder={getTranslation("opportunities.form.select_placeholder", "Seleccionar empresa")}
                    />
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

        {/* Mostrar el campo de partner solo para usuarios ScaleUp */}
        {isScaleUpUser && (
          <FormField
            control={form.control}
            name="partner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {getTranslation("opportunities.form.partner", "Partner")}
                  {!isScaleUpUser && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    persistentData.current.partner_id = value
                  }}
                  value={field.value || persistentData.current.partner_id || ""}
                  disabled={!!partnerId || loadingPartners}
                >
                  <FormControl>
                    <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                      <SelectValue
                        placeholder={
                          loadingPartners
                            ? getTranslation("opportunities.form.loading", "Cargando...")
                            : getTranslation("opportunities.form.select_placeholder", "Seleccionar partner")
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredPartners.length === 0 && !loadingPartners && (
                      <div className="p-2 text-sm text-gray-500">
                        No hay partners disponibles para esta empresa tecnológica.
                      </div>
                    )}
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

        {/* Campo de país - Ahora siempre visible */}
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                <span>{getTranslation("opportunities.form.country", "País")}</span>
                <Badge variant="outline" className="ml-2 font-normal">
                  {partnerCountries.length} países disponibles
                </Badge>
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  persistentData.current.country = value // 🔧 Persistir país
                }}
                value={field.value || persistentData.current.country || ""} // 🔧 Usar valor persistente
                disabled={loadingCountries}
              >
                <FormControl>
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue
                      placeholder={
                        loadingCountries
                          ? getTranslation("opportunities.form.loading", "Cargando...")
                          : getTranslation("opportunities.form.select_placeholder", "Seleccionar país")
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingCountries ? (
                    <div className="p-2 text-sm text-gray-500">
                      {getTranslation("opportunities.form.loading", "Cargando...")}
                    </div>
                  ) : partnerCountries.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      {watchPartner && watchPartner !== NO_PARTNER_VALUE
                        ? getTranslation("opportunities.form.no_countries", "Este partner no tiene países asignados.")
                        : "No hay países disponibles."}
                    </div>
                  ) : (
                    partnerCountries.map((country) => (
                      <SelectItem key={country.id} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                {watchPartner && watchPartner !== NO_PARTNER_VALUE
                  ? "País donde se desarrollará esta oportunidad (limitado a los países del partner)"
                  : "País donde se desarrollará esta oportunidad"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sección de personas responsables - Solo para usuarios ScaleUp */}
        {(isScaleUpUser || (!isScaleUpUser && watchPartner)) && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center space-x-2 mb-6">
              <UserCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">
                {getTranslation("opportunities.form.responsible_persons", "Personas responsables")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Responsable de ScaleUp - Solo para usuarios ScaleUp */}
              {isScaleUpUser && (
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {getTranslation("opportunities.form.assigned_to", "Responsable de ScaleUp")}
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          persistentData.current.assigned_to = value
                        }}
                        value={field.value || persistentData.current.assigned_to || ""}
                        disabled={loadingScaleUpUsers}
                      >
                        <FormControl>
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue
                              placeholder={
                                loadingScaleUpUsers
                                  ? getTranslation("opportunities.form.loading", "Cargando...")
                                  : getTranslation("opportunities.form.select_placeholder", "Seleccionar responsable")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingScaleUpUsers ? (
                            <div className="p-2 text-sm text-gray-500">
                              {getTranslation("opportunities.form.loading", "Cargando...")}
                            </div>
                          ) : scaleUpUsers.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">No hay usuarios de ScaleUp disponibles.</div>
                          ) : (
                            scaleUpUsers.map((scaleUpUser) => (
                              <SelectItem key={scaleUpUser.id} value={scaleUpUser.id}>
                                {`${scaleUpUser.first_name} ${scaleUpUser.last_name}`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>Persona de ScaleUp responsable de esta oportunidad</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Responsable del Partner */}
              {watchPartner && watchPartner !== NO_PARTNER_VALUE && (
                <FormField
                  control={form.control}
                  name="partner_responsible_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {getTranslation("opportunities.form.partner_responsible", "Responsable del Partner")}
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          persistentData.current.partner_responsible_id = value
                        }}
                        value={field.value || persistentData.current.partner_responsible_id || ""}
                        disabled={loadingPartnerUsers}
                      >
                        <FormControl>
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue
                              placeholder={
                                loadingPartnerUsers
                                  ? getTranslation("opportunities.form.loading", "Cargando...")
                                  : getTranslation("opportunities.form.select_placeholder", "Seleccionar responsable")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingPartnerUsers ? (
                            <div className="p-2 text-sm text-gray-500">
                              {getTranslation("opportunities.form.loading", "Cargando...")}
                            </div>
                          ) : partnerUsers.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              No hay usuarios disponibles para este partner.
                            </div>
                          ) : (
                            partnerUsers.map((partnerUser) => (
                              <SelectItem key={partnerUser.id} value={partnerUser.id}>
                                {`${partnerUser.first_name} ${partnerUser.last_name}`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>Persona del partner responsable de esta oportunidad</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Paso 3: Cliente y detalles financieros
  const renderCustomerAndFinancialsStep = () => {
    // Obtener el cliente seleccionado para mostrar en el botón
    const selectedCustomer = endCustomers.find((c) => c.id === watchEndCustomer)

    return (
      <div className="space-y-6">
        {/* {renderDebugInfo()} */}

        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Cliente y detalles financieros</h3>
        </div>

        <FormField
          control={form.control}
          name="end_customer_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center justify-between">
                <span>
                  {getTranslation("opportunities.form.end_customer", "Cliente final")}
                  {!isScaleUpUser && <span className="text-red-500 ml-1">*</span>}
                </span>
              </FormLabel>
              <div className="relative">
                <Popover open={endCustomerPopoverOpen} onOpenChange={setEndCustomerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                          "transition-all focus:ring-2 focus:ring-primary/20",
                        )}
                      >
                        {field.value && selectedCustomer
                          ? selectedCustomer.name
                          : getTranslation("opportunities.form.select_placeholder", "Buscar cliente...")}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2">
                      <Input
                        placeholder={getTranslation("opportunities.form.select_placeholder", "Buscar cliente...")}
                        value={endCustomerSearchQuery}
                        onChange={(e) => setEndCustomerSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {searchingEndCustomers ? (
                          <div className="p-2 text-sm text-gray-500">Buscando...</div>
                        ) : (
                          (() => {
                            // Determinar qué lista mostrar
                            let customersToShow = []

                            if (endCustomerSearchQuery.trim()) {
                              // Si hay búsqueda, mostrar resultados de búsqueda
                              customersToShow = searchResults
                            } else {
                              // Si no hay búsqueda, mostrar todos los clientes disponibles
                              customersToShow = endCustomers
                            }

                            if (customersToShow.length === 0 && endCustomerSearchQuery.trim()) {
                              return (
                                <div className="p-2 text-sm text-gray-500">
                                  No se encontraron clientes con "{endCustomerSearchQuery}"
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 w-full gap-1 bg-transparent"
                                    onClick={() => {
                                      setNewEndCustomerData((prev) => ({ ...prev, name: endCustomerSearchQuery }))
                                      setNewEndCustomerDialogOpen(true)
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Crear "{endCustomerSearchQuery}"
                                  </Button>
                                </div>
                              )
                            }

                            return (
                              <div className="space-y-1">
                                {customersToShow.map((customer) => (
                                  <div
                                    key={customer.id}
                                    className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                                    onClick={() => {
                                      form.setValue("end_customer_id", customer.id)
                                      persistentData.current.end_customer_id = customer.id
                                      setEndCustomerPopoverOpen(false)
                                      setEndCustomerSearchQuery("")
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{customer.name}</span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          customer.id === field.value ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                    </div>
                                  </div>
                                ))}
                                <div className="border-t pt-2 mt-2">
                                  <div
                                    className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center"
                                    onClick={() => {
                                      setNewEndCustomerData({
                                        name: "",
                                        industry_id: "",
                                        website: "",
                                        tax_id: "",
                                        country_id: "",
                                      })
                                      setNewEndCustomerDialogOpen(true)
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {getTranslation("opportunities.form.new_end_customer", "Crear nuevo cliente")}
                                  </div>
                                </div>
                              </div>
                            )
                          })()
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <FormDescription>Cliente final para quien se desarrollará esta oportunidad</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Dialog open={newEndCustomerDialogOpen} onOpenChange={setNewEndCustomerDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{getTranslation("opportunities.form.new_end_customer", "Nuevo cliente final")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <FormLabel>
                  {getTranslation("opportunities.form.new_end_customer_name", "Nombre del cliente")}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <Input
                  value={newEndCustomerData.name}
                  onChange={(e) => setNewEndCustomerData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del nuevo cliente"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Industria</FormLabel>
                <Select
                  value={newEndCustomerData.industry_id}
                  onValueChange={(value) => setNewEndCustomerData((prev) => ({ ...prev, industry_id: value }))}
                  disabled={loadingIndustries}
                >
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
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

              <div className="space-y-2">
                <FormLabel>Sitio web</FormLabel>
                <Input
                  value={newEndCustomerData.website}
                  onChange={(e) => setNewEndCustomerData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://ejemplo.com"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>ID Fiscal</FormLabel>
                <Input
                  value={newEndCustomerData.tax_id}
                  onChange={(e) => setNewEndCustomerData((prev) => ({ ...prev, tax_id: e.target.value }))}
                  placeholder="Número de identificación fiscal"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <FormLabel>País</FormLabel>
                <Select
                  value={newEndCustomerData.country_id}
                  onValueChange={(value) => setNewEndCustomerData((prev) => ({ ...prev, country_id: value }))}
                  disabled={loadingCountries}
                >
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder={loadingCountries ? "Cargando..." : "Seleccionar país"} />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerCountries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
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
                    {getTranslation("opportunities.form.create_end_customer", "Crear cliente")}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mostrar el valor estimado solo para usuarios ScaleUp */}
          {isScaleUpUser && (
            <FormField
              control={form.control}
              name="estimated_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getTranslation("opportunities.form.estimated_value", "Valor estimado")}</FormLabel>
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
                          persistentData.current.estimated_value = value
                        }}
                        className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
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

          <FormField
            control={form.control}
            name="estimated_close_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {getTranslation("opportunities.form.estimated_close_date", "Fecha estimada de cierre")}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e)
                        persistentData.current.estimated_close_date = e.target.value
                      }}
                      className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </FormControl>
                <FormDescription>Fecha estimada para cerrar esta oportunidad</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    )
  }

  // Paso 4: Campos técnicos y finalización
  const renderTechFieldsStep = () => {
    return (
      <div className="space-y-6">
        {/* {renderDebugInfo()} */}

        <div className="flex items-center space-x-2 mb-6">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Campos técnicos y finalización</h3>
        </div>

        {loadingTechFields ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando campos técnicos...</p>
            </div>
          </div>
        ) : techFields.length > 0 ? (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">
                {getTranslation("opportunities.form.tech_fields", "Campos tecnológicos")}
              </h4>
              <p className="text-sm text-gray-500">Complete los campos específicos para esta tecnología</p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-4 border rounded-md bg-gray-50">
              {techFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">
                      {field.field_name}
                      {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>

                  <div>
                    {/* Renderizar el campo según su tipo */}
                    {(() => {
                      switch (field.field_type) {
                        case "text":
                          return (
                            <Input
                              value={techFieldValues[field.id] || ""}
                              onChange={(e) => {
                                setTechFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }}
                              placeholder={`Ingrese ${field.field_name}`}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          )
                        case "number":
                          return (
                            <Input
                              type="number"
                              value={techFieldValues[field.id] || ""}
                              onChange={(e) => {
                                setTechFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }}
                              placeholder={`Ingrese ${field.field_name}`}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          )
                        case "textarea":
                          return (
                            <Textarea
                              value={techFieldValues[field.id] || ""}
                              onChange={(e) => {
                                setTechFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }}
                              placeholder={`Ingrese ${field.field_name}`}
                              className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          )
                        case "select":
                          const options = field.options
                            ? typeof field.options === "string"
                              ? JSON.parse(field.options)
                              : field.options
                            : []
                          return (
                            <Select
                              value={techFieldValues[field.id] || ""}
                              onValueChange={(value) => {
                                setTechFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: value,
                                }))
                              }}
                            >
                              <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                                <SelectValue placeholder={`Seleccione ${field.field_name}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(options) &&
                                  options.map((option, index) => (
                                    <SelectItem key={index} value={option.value || option}>
                                      {option.label || option}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )
                        case "multiselect":
                          // Implementación simplificada de multiselect
                          const multiOptions = field.options
                            ? typeof field.options === "string"
                              ? JSON.parse(field.options)
                              : field.options
                            : []
                          return (
                            <div className="border rounded-md p-2">
                              {Array.isArray(multiOptions) &&
                                multiOptions.map((option, index) => {
                                  const optionValue = option.value || option
                                  const optionLabel = option.label || option
                                  const isSelected = Array.isArray(techFieldValues[field.id])
                                    ? techFieldValues[field.id].includes(optionValue)
                                    : false

                                  return (
                                    <div key={index} className="flex items-center space-x-2 py-1">
                                      <input
                                        type="checkbox"
                                        id={`option-${field.id}-${index}`}
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const currentValues = Array.isArray(techFieldValues[field.id])
                                            ? [...techFieldValues[field.id]]
                                            : []
                                          const newValues = e.target.checked
                                            ? [...currentValues, optionValue]
                                            : currentValues.filter((v) => v !== optionValue)
                                          setTechFieldValues((prev) => ({
                                            ...prev,
                                            [field.id]: newValues,
                                          }))
                                        }}
                                      />
                                      <label htmlFor={`option-${field.id}-${index}`}>{optionLabel}</label>
                                    </div>
                                  )
                                })}
                            </div>
                          )
                        case "date":
                          return (
                            <Input
                              type="date"
                              value={techFieldValues[field.id] || ""}
                              onChange={(e) => {
                                setTechFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          )
                        case "boolean":
                          return (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`boolean-${field.id}`}
                                checked={techFieldValues[field.id] === true}
                                onCheckedChange={(checked) => {
                                  setTechFieldValues((prev) => ({
                                    ...prev,
                                    [field.id]: checked,
                                  }))
                                }}
                              />
                              <Label htmlFor={`boolean-${field.id}`}>
                                {techFieldValues[field.id] === true ? "Sí" : "No"}
                              </Label>
                            </div>
                          )
                        case "file":
                          return (
                            <FileUpload
                              value={techFieldValues[field.id] || ""}
                              onChange={(value) => {
                                setTechFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: value,
                                }))
                              }}
                              opportunityId="temp"
                              fieldId={field.id}
                              maxSizeMB={field.file_config?.max_size_mb || 5}
                              allowedFileTypes={
                                field.file_config?.allowed_mime_types
                                  ? field.file_config.allowed_mime_types
                                    .split(",")
                                    .map((type) => type.trim().replace(/^\./, ""))
                                  : DEFAULT_ALLOWED_FILE_TYPES
                              }
                            />
                          )
                        default:
                          return (
                            <Input
                              value={techFieldValues[field.id] || ""}
                              onChange={(e) => {
                                setTechFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }}
                              placeholder={`Ingrese ${field.field_name}`}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          )
                      }
                    })()}

                    {field.is_required && !techFieldValidation[field.id] && (
                      <p className="text-xs text-red-500 mt-1">Este campo es obligatorio</p>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 italic">
                    {field.description || `Campo de tipo ${field.field_type}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Campos técnicos no disponibles</AlertTitle>
            <AlertDescription>No hay campos técnicos definidos para esta empresa tecnológica.</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 p-4 border rounded-md bg-blue-50 border-blue-100">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Resumen de la oportunidad
          </h4>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>Título:</strong> {persistentData.current.title || form.getValues("title") || "No especificado"}
            </p>
            <p>
              <strong>Etapa:</strong>{" "}
              {stages
                .find((s) => s.id === (persistentData.current.pipeline_stage_id || form.getValues("pipeline_stage_id")))
                ?.code.replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()) || "No especificada"}
            </p>
            <p>
              <strong>Empresa tecnológica:</strong>{" "}
              {techCompanies.find(
                (c) => c.id === (persistentData.current.tech_company_id || form.getValues("tech_company_id")),
              )?.name || "No especificada"}
            </p>
            <p>
              <strong>Partner:</strong>{" "}
              {partners.find((p) => p.id === (persistentData.current.partner_id || form.getValues("partner_id")))
                ?.name || "No especificado"}
            </p>
            <p>
              <strong>País:</strong>{" "}
              {partnerCountries.find((c) => c.code === (persistentData.current.country || form.getValues("country")))
                ?.name || "No especificado"}
            </p>
            <p>
              <strong>Cliente final:</strong>{" "}
              {endCustomers.find(
                (c) => c.id === (persistentData.current.end_customer_id || form.getValues("end_customer_id")),
              )?.name || "No especificado"}
            </p>
            <p>
              <strong>Valor estimado:</strong>{" "}
              {persistentData.current.estimated_value || form.getValues("estimated_value")
                ? `${persistentData.current.estimated_value || form.getValues("estimated_value")}`
                : "No especificado"}
            </p>
            <p>
              <strong>Fecha estimada de cierre:</strong>{" "}
              {persistentData.current.estimated_close_date ||
                form.getValues("estimated_close_date") ||
                "No especificada"}
            </p>
            <p>
              <strong>Responsable ScaleUp:</strong>{" "}
              {scaleUpUsers.find((u) => u.id === (persistentData.current.assigned_to || form.getValues("assigned_to")))
                ? `${scaleUpUsers.find((u) => u.id === (persistentData.current.assigned_to || form.getValues("assigned_to")))?.first_name} ${scaleUpUsers.find((u) => u.id === (persistentData.current.assigned_to || form.getValues("assigned_to")))?.last_name}`
                : "No especificado"}
            </p>
            <p>
              <strong>Responsable Partner:</strong>{" "}
              {partnerUsers.find(
                (u) =>
                  u.id === (persistentData.current.partner_responsible_id || form.getValues("partner_responsible_id")),
              )
                ? `${partnerUsers.find((u) => u.id === (persistentData.current.partner_responsible_id || form.getValues("partner_responsible_id")))?.first_name} ${partnerUsers.find((u) => u.id === (persistentData.current.partner_responsible_id || form.getValues("partner_responsible_id")))?.last_name}`
                : "No especificado"}
            </p>
          </div>
        </div>

        {/* Campo oculto para assigned_to - No se muestra en la UI pero mantiene el valor */}
        <input type="hidden" {...form.register("assigned_to")} />
        <input type="hidden" {...form.register("partner_responsible_id")} />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="text-2xl">
          {getTranslation("opportunities.create_title", "Crear nueva oportunidad")}
        </CardTitle>
        <CardDescription>Completa el formulario para crear una nueva oportunidad de negocio</CardDescription>

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
                {currentStep === 4 && "Campos técnicos y finalización"}
              </span>
            </h2>

            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i + 1 === currentStep ? "bg-primary" : i + 1 < currentStep ? "bg-primary/60" : "bg-gray-200"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  {getTranslation("opportunities.form.cancel", "Cancelar")}
                </Button>

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} disabled={!isStepComplete()} className="gap-2">
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          disabled={isLoading || !isStepComplete()}
                          className="gap-2"
                          onClick={handleManualSubmit}
                        >
                          {isLoading ? (
                            <>Guardando...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              {getTranslation("opportunities.form.submit", "Guardar")}
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Guardar y crear la oportunidad</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
