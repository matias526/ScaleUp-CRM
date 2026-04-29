"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Trash,
  Calendar,
  Check,
  X,
  Bug,
  Building2,
  DollarSign,
  MapPin,
  Tag,
  User,
  Edit,
  Save,
  Pencil,
} from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { getOpportunityStages } from "@/lib/services/opportunity-service"
import { ProspectPartnerService } from "@/lib/services/prospect-partner-service"
import {
  createStageChangeNote,
  createOpportunityValidationNote,
  createOpportunityRejectionNote,
  isScaleUpMember,
} from "@/lib/services/notes-service"
import { OpportunityNotesFixed } from "./opportunity-notes-fixed"
import { createNote } from "@/lib/services/notes-service"
import { OpportunityTechFields } from "./opportunity-tech-fields"
import { OrganizationAvatar } from "./organization-avatar"
import { supabase } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RelatedTasksList } from "@/components/tasks/related-tasks-list"
import { OpportunityContactsSection } from "./opportunity-contacts-section"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format as formatDate } from "date-fns"
// Reemplazar la importación de getLocale
import { getLocale as getLocaleString } from "@/lib/utils"
import { es as esLocale, enUS, pt } from "date-fns/locale"
import { EndCustomerInfoDialog } from "./end-customer-info-dialog"
import { PulseMessageSenderOpportunity } from "@/components/pulse/pulse-message-sender-opportunity"



// Función para obtener el objeto locale de date-fns
const getDateFnsLocale = () => {
  const localeString = getLocaleString()
  switch (localeString) {
    case "es":
      return esLocale
    case "en":
      return enUS
    case "pt":
      return pt
    default:
      return esLocale
  }
}

// Función para formatear moneda en dólares
const formatDollarValue = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Componente simple para mostrar logs en pantalla
function DebugPanel({ logs = [] }) {
  const [localLogs, setLocalLogs] = useState(logs)
  const [isVisible, setIsVisible] = useState(true)

  // Función para añadir un log
  const addLog = (message) => {
    console.log(message) // También mostrar en consola
    setLocalLogs((prev) => [...prev, { message, timestamp: new Date() }])
  }

  // Exponer la función addLog globalmente
  useEffect(() => {
    // @ts-ignore
    window.addDebugLog = addLog

    // Añadir un log inicial
    addLog("Panel de depuración inicializado")

    return () => {
      // @ts-ignore
      delete window.addDebugLog
    }
  }, [])

  if (!isVisible) {
    return (
      <Button className="fixed bottom-4 right-4 z-50" onClick={() => setIsVisible(true)} variant="outline" size="sm">
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[400px] max-w-[90vw] z-50 shadow-lg">
      <CardHeader className="p-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">Logs de Depuración</CardTitle>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={() => setLocalLogs([])} className="h-6 text-xs">
            Limpiar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="h-6 text-xs">
            Cerrar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="h-[200px] overflow-auto text-xs border rounded p-2">
          {localLogs.length === 0 ? (
            <div className="text-center text-muted-foreground">No hay logs</div>
          ) : (
            localLogs.map((log, i) => (
              <div key={i} className="mb-1 pb-1 border-b last:border-0">
                <span className="text-muted-foreground mr-2">{log.timestamp.toLocaleTimeString()}:</span>
                {log.message}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para edición inline de texto
function InlineEdit({
  value,
  onSave,
  isEditing,
  onEdit,
  onCancel,
  type = "text",
  options = [],
  placeholder = "",
  multiline = false,
  className = "",
  formatter = (val) => val, // Añadir esta línea
}) {
  const [editValue, setEditValue] = useState(value)
  const [date, setDate] = useState(value ? new Date(value) : new Date())
  const inputRef = useRef(null)

  // Enfocar el input cuando se activa la edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // Actualizar el valor cuando cambia externamente
  useEffect(() => {
    setEditValue(value)
    if (type === "date" && value) {
      setDate(new Date(value))
    }
  }, [value, type])

  const handleSave = () => {
    if (type === "date") {
      onSave(date.toISOString())
    } else if (type === "number") {
      onSave(Number.parseFloat(editValue))
    } else {
      onSave(editValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) {
      handleSave()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  if (!isEditing) {
    return (
      <div className={`flex items-center group ${className}`}>
        <div className="flex-grow">
          {type === "date" && value
            ? format(new Date(value), "PPP", { locale: es })
            : type === "number" && value
              ? formatDollarValue(value)
              : type === "select"
                ? formatter(value) || placeholder || "No especificado"
                : formatter(value) || placeholder || "No especificado"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onEdit}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (type === "select") {
    return (
      <div className="flex items-center space-x-2">
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder || "Seleccionar..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex space-x-1">
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (type === "date") {
    return (
      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
              <Calendar className="mr-2 h-4 w-4" />
              {date ? formatDate(date, "PPP", { locale: getDateFnsLocale() }) : <span>Seleccionar fecha...</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
        <div className="flex space-x-1">
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (multiline) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={inputRef}
          value={editValue || ""}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full"
          rows={3}
        />
        <div className="flex justify-end space-x-1">
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        ref={inputRef}
        type={type}
        value={editValue || ""}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full"
      />
      <div className="flex space-x-1">
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
          <Save className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface OpportunityDetailProps {
  opportunity: any
}

export function OpportunityDetail({ opportunity: initialOpportunity }: OpportunityDetailProps) {
  const router = useRouter()
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [opportunity, setOpportunity] = useState<any>(initialOpportunity)
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})
  const [stages, setStages] = useState<any[]>([])
  const [assignedUser, setAssignedUser] = useState<any>(null)
  const [partnerResponsible, setPartnerResponsible] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notesKey, setNotesKey] = useState(0) // Clave para forzar la recarga del componente de notas
  const [showDebug, setShowDebug] = useState(false) // Estado para mostrar/ocultar el depurador
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugLogs, setDebugLogs] = useState<{ message: string; timestamp: Date }[]>([])
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isPartnerResponsibleDialogOpen, setIsPartnerResponsibleDialogOpen] = useState(false)
  const [scaleupUsers, setScaleupUsers] = useState<any[]>([])
  const [partnerUsers, setPartnerUsers] = useState<any[]>([])
  const [selectedScaleupUser, setSelectedScaleupUser] = useState<string>("")
  const [selectedPartnerUser, setSelectedPartnerUser] = useState<string>("")
  const [partnerCountries, setPartnerCountries] = useState<{ id: string; name: string; code: string }[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [showEndCustomerInfo, setShowEndCustomerInfo] = useState(false)
  const [availablePartners, setAvailablePartners] = useState<any[]>([])
  const [isLoadingPartners, setIsLoadingPartners] = useState(false)
  const [isPartnerAssignDialogOpen, setIsPartnerAssignDialogOpen] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")
  const [showPulseMessageSender, setShowPulseMessageSender] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [dateEditValue, setDateEditValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false)
  const [existingProspectPartners, setExistingProspectPartners] = useState<any[]>([])
  const [selectedProspectPartner, setSelectedProspectPartner] = useState<any>(null)
  const [prospectPartnerContacts, setProspectPartnerContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [prospectStep, setProspectStep] = useState(1) // 1: Company, 2: Contact
  const [prospectPartnerData, setProspectPartnerData] = useState({
    name: "",
    website: "",
    main_country_id: "",
    lead_source: "",
  })
  const [prospectContactData, setProspectContactData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    preferred_language: "es" as "es" | "en" | "pt",
  })
  const [prospectSearchQuery, setProspectSearchQuery] = useState("")
  const [prospectSearchResults, setProspectSearchResults] = useState<any[]>([])
  const [showProspectResults, setShowProspectResults] = useState(false)
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [showCreateNew, setShowCreateNew] = useState(false)



  // Load countries for prospect partner form
  useEffect(() => {
    if (!isNewPartnerModalOpen) return

    const loadCountries = async () => {
      try {
        const { data } = await supabase.from("countries").select("id, name").order("name")
        if (data) setCountries(data)
      } catch (err) {
        console.error("Error loading countries:", err)
      }
    }

    loadCountries()
  }, [isNewPartnerModalOpen])

  // Search prospect partners
  useEffect(() => {
    if (!prospectSearchQuery.trim()) {
      setProspectSearchResults([])
      setShowProspectResults(false)
      return
    }

    const query = prospectSearchQuery.toLowerCase()
    const filtered = existingProspectPartners.filter((p) => p.name.toLowerCase().includes(query))
    setProspectSearchResults(filtered)
    setShowProspectResults(true)
  }, [prospectSearchQuery, existingProspectPartners])

  // Handle selecting an existing prospect partner
  const handleSelectExistingProspect = async (prospect: any) => {
    setSelectedProspectPartner(prospect)
    setProspectPartnerData({
      name: prospect.name,
      website: prospect.website || "",
      main_country_id: prospect.main_country_id || "",
      lead_source: prospect.lead_source || "",
    })
    setProspectSearchQuery("")
    setShowProspectResults(false)
    setShowCreateNew(false)

    // Load contacts for this prospect partner
    try {
      const { data: contacts } = await supabase.from("contacts").select("*").eq("prospect_id", prospect.id)

      if (contacts && contacts.length > 0) {
        setProspectPartnerContacts(contacts)
        setSelectedContact(contacts[0])
      } else {
        setProspectPartnerContacts([])
        setSelectedContact(null)
      }
    } catch (err) {
      console.error("Error loading contacts:", err)
    }

    // Move to step 2 automatically
    setProspectStep(2)
  }

  const handleDateStartEditing = (field, value) => {
    setEditingField(field)
    setDateEditValue(value)
  }

  const handleDateCancelEditing = () => {
    setEditingField(null)
    setDateEditValue("")
  }

  const handleDateSaveChanges = async () => {
    setIsSubmitting(true)
    try {
      await updateField("estimated_close_date", dateEditValue)
      handleDateCancelEditing()
    } catch (error) {
      console.error("Error al guardar los cambios:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para añadir logs de depuración
  const logDebug = (message: string) => {
    console.log(message)
    setDebugLogs((prev) => [...prev, { message, timestamp: new Date() }])
    // Si la función global está disponible, usarla
    if (typeof window !== "undefined" && window.addDebugLog) {
      // @ts-ignore
      window.addDebugLog(message)
    }
  }

  // Función para cargar los países del partner
  const loadPartnerCountries = async (partnerId: string) => {
    if (!partnerId) return

    try {
      setLoadingCountries(true)
      logDebug(`Cargando países para el partner ${partnerId}...`)

      const { data, error } = await supabase.from("partner_countries").select("country_id").eq("partner_id", partnerId)

      if (error) {
        logDebug(`Error al obtener IDs de países: ${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        logDebug(`No se encontraron países para el partner ${partnerId}`)
        setPartnerCountries([])
        return
      }

      const countryIds = data.map((item) => item.country_id)
      logDebug(`IDs de países encontrados: ${countryIds.join(", ")}`)

      const { data: countriesData, error: countriesError } = await supabase
        .from("countries")
        .select("id, name, code")
        .in("id", countryIds)

      if (countriesError) {
        logDebug(`Error al obtener detalles de países: ${countriesError.message}`)
        return
      }

      logDebug(`Países cargados: ${countriesData.length}`)
      setPartnerCountries(countriesData || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logDebug(`Error inesperado al cargar países: ${errorMessage}`)
    } finally {
      setLoadingCountries(false)
    }
  }

  // Función para cargar partners que trabajan con la tech company
  const loadAvailablePartners = async (techCompanyId: string) => {
    if (!techCompanyId) {
      logDebug("No se proporcionó tech company ID para cargar partners")
      return
    }

    try {
      setIsLoadingPartners(true)
      logDebug(`Cargando partners disponibles para tech company: ${techCompanyId}`)

      // Obtener partners que trabajan con esta tech company
      const { data: partnerTechData, error: partnerTechError } = await supabase
        .from("partner_tech_companies")
        .select("partner_id")
        .eq("tech_company_id", techCompanyId)

      if (partnerTechError) {
        logDebug(`Error al obtener relaciones partner-tech: ${partnerTechError.message}`)
        throw partnerTechError
      }

      if (!partnerTechData || partnerTechData.length === 0) {
        logDebug("No se encontraron partners asociados con esta tech company")
        setAvailablePartners([])
        return
      }

      const partnerIds = partnerTechData.map((item) => item.partner_id)
      logDebug(`Partner IDs encontrados: ${partnerIds.join(", ")}`)

      // Obtener detalles de los partners
      const { data: partnersData, error: partnersError } = await supabase
        .from("partners")
        .select("id, name, logo_url, is_active")
        .in("id", partnerIds)
        .eq("is_active", true)
        .order("name", { ascending: true })

      if (partnersError) {
        logDebug(`Error al obtener detalles de partners: ${partnersError.message}`)
        throw partnersError
      }

      logDebug(`Partners disponibles cargados: ${partnersData?.length || 0}`)
      setAvailablePartners(partnersData || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logDebug(`Error al cargar partners disponibles: ${errorMessage}`)
      setAvailablePartners([])
    } finally {
      setIsLoadingPartners(false)
    }
  }

  // Cargar las etapas del pipeline, el usuario asignado y el usuario actual
  useEffect(() => {
    logDebug("Componente OpportunityDetail montado")
    logDebug(`ID de oportunidad recibido: ${opportunity?.id}`)

    const loadData = async () => {
      try {
        logDebug("Cargando datos iniciales para detalle de oportunidad")

        // Cargar etapas
        logDebug("Cargando etapas del pipeline...")
        const stagesData = await getOpportunityStages()
        setStages(stagesData)
        logDebug(`Etapas cargadas: ${stagesData.length}`)

        // Cargar usuario actual
        logDebug("Cargando usuario actual...")
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          logDebug(`Usuario autenticado encontrado: ${user.id}`)
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single()

          if (userError) {
            logDebug(`Error al cargar datos del usuario: ${userError.message}`)
          } else {
            setCurrentUser(userData)
            logDebug(`Usuario actual cargado: ${userData?.id}`)
          }
        } else {
          logDebug("No se pudo obtener el usuario actual")
        }

        // Cargar usuario asignado si existe
        if (opportunity?.assigned_to) {
          logDebug(`Cargando usuario asignado: ${opportunity.assigned_to}`)
          setIsLoadingUser(true)
          try {
            const { data, error } = await supabase
              .from("users")
              .select("id, first_name, last_name, email, role_id")
              .eq("id", opportunity.assigned_to)
              .single()

            if (error) {
              logDebug(`Error al cargar usuario asignado: ${error.message}`)
              throw error
            }
            setAssignedUser(data)
            logDebug(`Usuario asignado cargado: ${data?.id}`)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logDebug(`Error al cargar usuario asignado: ${errorMessage}`)
          } finally {
            setIsLoadingUser(false)
          }
        } else {
          logDebug("No hay usuario asignado para esta oportunidad")
        }

        // Cargar responsable del partner si existe
        if (opportunity?.partner_responsible_id) {
          logDebug(`Cargando responsable del partner: ${opportunity.partner_responsible_id}`)
          try {
            const { data, error } = await supabase
              .from("users")
              .select("id, first_name, last_name, email, role_id")
              .eq("id", opportunity.partner_responsible_id)
              .single()

            if (error) {
              logDebug(`Error al cargar responsable del partner: ${error.message}`)
              throw error
            }
            setPartnerResponsible(data)
            logDebug(`Responsable del partner cargado: ${data?.id}`)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logDebug(`Error al cargar responsable del partner: ${errorMessage}`)
          }
        } else {
          logDebug("No hay responsable del partner para esta oportunidad")
        }

        // Cargar usuarios de ScaleUp para el selector
        try {
          const { data: scaleupUsersData, error: scaleupUsersError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, role_id")
            .in("role_id", ["3ddc89f1-1478-46b4-8a3f-8e42033a0b83", "ff536fc8-8786-4be5-acf2-aee27b3d9924"]) // IDs de roles de ScaleUp

          if (scaleupUsersError) {
            logDebug(`Error al cargar usuarios de ScaleUp: ${scaleupUsersError.message}`)
          } else {
            setScaleupUsers(scaleupUsersData || [])
            logDebug(`Usuarios de ScaleUp cargados: ${scaleupUsersData?.length}`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logDebug(`Error al cargar usuarios de ScaleUp: ${errorMessage}`)
        }

        // Cargar usuarios del partner para el selector
        if (opportunity?.partner_id) {
          try {
            const { data: partnerUsersData, error: partnerUsersError } = await supabase
              .from("users")
              .select("id, first_name, last_name, email, role_id")
              .eq("partner_id", opportunity.partner_id)

            if (partnerUsersError) {
              logDebug(`Error al cargar usuarios del partner: ${partnerUsersError.message}`)
            } else {
              setPartnerUsers(partnerUsersData || [])
              logDebug(`Usuarios del partner cargados: ${partnerUsersData?.length}`)
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logDebug(`Error al cargar usuarios del partner: ${errorMessage}`)
          }
        }

        // Cargar países del partner si existe
        if (opportunity?.partner_id) {
          loadPartnerCountries(opportunity.partner_id)
        }

        // Cargar partners disponibles si existe tech_company_id
        if (opportunity?.tech_company_id) {
          loadAvailablePartners(opportunity.tech_company_id)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logDebug(`Error general al cargar datos: ${errorMessage}`)
        setError(`Error al cargar datos: ${errorMessage}`)
      }
    }

    loadData()
  }, [
    opportunity?.id,
    opportunity?.assigned_to,
    opportunity?.partner_responsible_id,
    opportunity?.partner_id,
    opportunity?.tech_company_id,
  ])

  // Función para eliminar la oportunidad
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      logDebug(`Eliminando oportunidad: ${opportunity?.id}`)

      const { error } = await supabase.from("opportunities").delete().eq("id", opportunity?.id)

      if (error) throw error

      logDebug("Oportunidad eliminada correctamente")

      toast({
        title: "Oportunidad eliminada",
        description: "La oportunidad ha sido eliminada correctamente",
      })

      router.push("/dashboard/opportunities")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logDebug(`Error al eliminar la oportunidad: ${errorMessage}`)

      toast({
        title: "Error",
        description: "No se pudo eliminar la oportunidad",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  // Función para actualizar un campo específico
  const updateField = async (field: string, value: any) => {
    setIsSaving(true)
    try {
      logDebug(`Actualizando campo: ${field} con valor: ${value}`)

      // Guardar el valor anterior de la etapa si estamos actualizando pipeline_stage_id
      const oldStageCode = field === "pipeline_stage_id" && opportunity?.stage ? opportunity.stage.code : null
      let newStageCode = null

      // Si estamos actualizando la etapa, obtener el código de la nueva etapa
      if (field === "pipeline_stage_id" && value) {
        const selectedStage = stages.find((stage) => stage.id === value)
        if (selectedStage) {
          newStageCode = selectedStage.code
          logDebug(`Nueva etapa seleccionada: ${newStageCode}`)
        }
      }

      const { error } = await supabase
        .from("opportunities")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", opportunity?.id)

      if (error) throw error

      logDebug(`Campo ${field} actualizado correctamente`)

      // Si se está marcando como nuevo partner (is_new_partner = true), abrir modal para seleccionar prospect partner
      if (field === "is_new_partner" && value === true) {
        // Cargar prospect partners existentes
        try {
          const { data: prospects } = await ProspectPartnerService.getProspectPartners(1, 1000)
          if (prospects && Array.isArray(prospects)) {
            setExistingProspectPartners(prospects)
          }
        } catch (err) {
          console.error("Error loading prospect partners:", err)
        }
        setIsNewPartnerModalOpen(true)
        setIsSaving(false)
        return
      }

      // Si se cambió la etapa, registrar el cambio en la reseña histórica
      if (
        field === "pipeline_stage_id" &&
        oldStageCode &&
        newStageCode &&
        oldStageCode !== newStageCode &&
        currentUser
      ) {
        logDebug(`Detectado cambio de etapa: ${oldStageCode} -> ${newStageCode}`)

        try {
          const noteResult = await createStageChangeNote(opportunity?.id, currentUser.id, oldStageCode, newStageCode)

          if (noteResult) {
            logDebug(`Nota de cambio de etapa creada: ${noteResult.id}`)
          } else {
            logDebug("No se pudo crear la nota de cambio de etapa")
          }

          // Forzar la recarga del componente de notas
          setNotesKey((prev) => prev + 1)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logDebug(`Error al crear nota de cambio de etapa: ${errorMessage}`)
        }
      }

      // Si se cambió el usuario asignado, actualizar el estado local
      if (field === "assigned_to") {
        const selectedUser = scaleupUsers.find((user) => user.id === value)
        if (selectedUser) {
          setAssignedUser(selectedUser)

          // Crear nota sobre la asignación
          if (currentUser) {
            try {
              await createNote({
                opportunity_id: opportunity?.id,
                user_id: currentUser.id,
                content: `**Responsable de ScaleUp asignado:** ${selectedUser.first_name} ${selectedUser.last_name}`,
                is_private: false,
              })

              // Forzar la recarga del componente de notas
              setNotesKey((prev) => prev + 1)
            } catch (error) {
              logDebug(`Error al crear nota de asignación: ${error}`)
            }
          }
        }
      }

      // Si se cambió el responsable del partner, actualizar el estado local
      if (field === "partner_responsible_id") {
        const selectedUser = partnerUsers.find((user) => user.id === value)
        if (selectedUser) {
          setPartnerResponsible(selectedUser)

          // Crear nota sobre la asignación del responsable del partner
          if (currentUser) {
            try {
              await createNote({
                opportunity_id: opportunity?.id,
                user_id: currentUser.id,
                content: `**Responsable del Partner asignado:** ${selectedUser.first_name} ${selectedUser.last_name}`,
                is_private: false,
              })

              // Forzar la recarga del componente de notas
              setNotesKey((prev) => prev + 1)
            } catch (error) {
              logDebug(`Error al crear nota de asignación de partner: ${error}`)
            }
          }
        }
      }

      // Si se cambió el partner, actualizar el estado local y crear nota
      if (field === "partner_id") {
        const selectedPartner = availablePartners.find((partner) => partner.id === value)
        if (selectedPartner) {
          // Actualizar el estado local de la oportunidad
          setOpportunity((prev) => ({
            ...prev,
            partner_id: value,
            partner: selectedPartner,
          }))

          // Crear nota sobre la asignación del partner
          if (currentUser) {
            try {
              await createNote({
                opportunity_id: opportunity?.id,
                user_id: currentUser.id,
                content: `**Partner asignado:** ${selectedPartner.name}`,
                is_private: false,
              })

              // Forzar la recarga del componente de notas
              setNotesKey((prev) => prev + 1)
            } catch (error) {
              logDebug(`Error al crear nota de asignación de partner: ${error}`)
            }
          }

          // Cargar países del nuevo partner
          loadPartnerCountries(value)
        }
      }

      toast({
        title: "Campo actualizado",
        description: `El campo ha sido actualizado correctamente`,
      })

      setEditMode((prev) => ({ ...prev, [field]: false }))

      // Actualizar el estado local
      if (field === "pipeline_stage_id") {
        // Si actualizamos la etapa, necesitamos actualizar también la información de la etapa
        const updatedStage = stages.find((stage) => stage.id === value)
        setOpportunity((prev) => ({
          ...prev,
          [field]: value,
          stage: updatedStage || prev.stage,
        }))
      } else {
        setOpportunity((prev) => ({ ...prev, [field]: value }))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logDebug(`Error al actualizar el campo ${field}: ${errorMessage}`)

      toast({
        title: "Error",
        description: `No se pudo actualizar el campo`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Función para manejar cambios en los campos
  const handleChange = (field: string, value: any) => {
    setOpportunity((prev) => ({ ...prev, [field]: value }))
  }

  // Función para asignar responsable de ScaleUp
  const handleAssignScaleupUser = async () => {
    if (!selectedScaleupUser) {
      toast({
        title: "Error",
        description: "Debes seleccionar un usuario",
        variant: "destructive",
      })
      return
    }

    await updateField("assigned_to", selectedScaleupUser)
    setIsAssignDialogOpen(false)
    setSelectedScaleupUser("")
  }

  // Función para asignar responsable del Partner
  const handleAssignPartnerUser = async () => {
    if (!selectedPartnerUser) {
      toast({
        title: "Error",
        description: "Debes seleccionar un usuario",
        variant: "destructive",
      })
      return
    }

    await updateField("partner_responsible_id", selectedPartnerUser)
    setIsPartnerResponsibleDialogOpen(false)
    setSelectedPartnerUser("")
  }

  // Función para asignar partner a la oportunidad
  const handleAssignPartner = async () => {
    if (!selectedPartnerId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un partner",
        variant: "destructive",
      })
      return
    }

    await updateField("partner_id", selectedPartnerId)
    setIsPartnerAssignDialogOpen(false)
    setSelectedPartnerId("")

    // Recargar usuarios del partner después de asignar
    if (selectedPartnerId) {
      try {
        const { data: partnerUsersData, error: partnerUsersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email, role_id")
          .eq("partner_id", selectedPartnerId)

        if (!partnerUsersError) {
          setPartnerUsers(partnerUsersData || [])
          logDebug(`Usuarios del partner recargados: ${partnerUsersData?.length}`)
        }
      } catch (error) {
        logDebug(`Error al recargar usuarios del partner: ${error}`)
      }
    }
  }

  // Modificar la función handleValidateOpportunity para mejorar la creación de notas
  const handleValidateOpportunity = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No se pudo identificar al usuario actual",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      logDebug(`Validando oportunidad: ${opportunity?.id}`)

      const { error } = await supabase
        .from("opportunities")
        .update({
          validation_status: "validated",
          validation_date: new Date().toISOString(),
          validated_by: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunity?.id)

      if (error) throw error

      logDebug("Oportunidad validada correctamente, creando nota...")

      // Verificar si el usuario es miembro de ScaleUp
      const isUserScaleUpMember = await isScaleUpMember(currentUser.id)
      logDebug(`¿Es usuario ScaleUp? ${isUserScaleUpMember ? "Sí" : "No"}`)

      // Crear nota de validación
      try {
        const noteResult = await createOpportunityValidationNote(opportunity?.id, currentUser.id, isUserScaleUpMember)

        if (noteResult) {
          logDebug(`Nota de validación creada: ${noteResult.id}`)
        } else {
          logDebug("No se pudo crear la nota de validación")
          // Intento de creación manual si falla el método normal
          const manualNoteResult = await createNote({
            opportunity_id: opportunity?.id,
            user_id: currentUser.id,
            content: "**Oportunidad Validada**",
            is_private: false,
          })

          if (manualNoteResult) {
            logDebug(`Nota de validación creada manualmente: ${manualNoteResult.id}`)
          } else {
            logDebug("También falló la creación manual de la nota")
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logDebug(`Error al crear nota de validación: ${errorMessage}`)

        // Intento de recuperación en caso de error
        try {
          logDebug("Intentando crear nota de validación de forma alternativa...")
          await supabase.from("notes").insert({
            opportunity_id: opportunity?.id,
            user_id: currentUser.id,
            content: "**Oportunidad Validada**",
            is_private: false,
            created_at: new Date().toISOString(),
          })
          logDebug("Nota creada mediante método alternativo")
        } catch (fallbackError) {
          logDebug(`También falló el método alternativo: ${fallbackError}`)
        }
      }

      // Actualizar el estado local
      setOpportunity((prev) => ({
        ...prev,
        validation_status: "validated",
        validation_date: new Date().toISOString(),
        validated_by: currentUser.id,
      }))

      // Forzar la recarga del componente de notas
      setNotesKey((prev) => prev + 1)

      toast({
        title: "Oportunidad validada",
        description: "La oportunidad ha sido validada correctamente",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logDebug(`Error al validar la oportunidad: ${errorMessage}`)

      toast({
        title: "Error",
        description: "No se pudo validar la oportunidad",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Función para rechazar la oportunidad
  const handleRejectOpportunity = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No se pudo identificar al usuario actual",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      logDebug(`Rechazando oportunidad: ${opportunity?.id}, Motivo: ${rejectionReason}`)

      const { error } = await supabase
        .from("opportunities")
        .update({
          validation_status: "rejected",
          validation_date: new Date().toISOString(),
          validated_by: currentUser.id,
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunity?.id)

      if (error) throw error

      logDebug("Oportunidad rechazada correctamente, creando nota...")

      // Crear nota de rechazo
      try {
        const noteResult = await createOpportunityRejectionNote(opportunity?.id, currentUser.id, rejectionReason)

        if (noteResult) {
          logDebug(`Nota de rechazo creada: ${noteResult.id}`)
        } else {
          logDebug("No se pudo crear la nota de rechazo")
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logDebug(`Error al crear nota de rechazo: ${errorMessage}`)
      }

      // Actualizar el estado local
      setOpportunity((prev) => ({
        ...prev,
        validation_status: "rejected",
        validation_date: new Date().toISOString(),
        validated_by: currentUser.id,
        rejection_reason: rejectionReason,
      }))

      // Forzar la recarga del componente de notas
      setNotesKey((prev) => prev + 1)

      // Cerrar el diálogo y limpiar el motivo
      setIsRejectionDialogOpen(false)
      setRejectionReason("")

      toast({
        title: "Oportunidad rechazada",
        description: "La oportunidad ha sido rechazada correctamente",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logDebug(`Error al rechazar la oportunidad: ${errorMessage}`)

      toast({
        title: "Error",
        description: "No se pudo rechazar la oportunidad",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Función para activar el modo de edición de un campo
  const startEditing = (field: string) => {
    setEditMode((prev) => ({ ...prev, [field]: true }))
  }

  // Función para cancelar la edición de un campo
  const cancelEditing = (field: string) => {
    setEditMode((prev) => ({ ...prev, [field]: false }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>
  }

  if (!opportunity) {
    return <div className="p-4 bg-amber-50 text-amber-800 rounded-md">No se encontró la oportunidad</div>
  }

  return (
    <div className="space-y-6 pb-8">
      {showDebug && <DebugPanel logs={debugLogs} />}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/opportunities")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="flex space-x-2">
          {/* Botones de validación/rechazo solo si la oportunidad está pendiente */}
          {opportunity?.validation_status === "pending" && currentUser && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                onClick={() => setShowEndCustomerInfo(true)}
              >
                <Building2 className="h-4 w-4 mr-1" />
                Ver info Cliente Final
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                onClick={handleValidateOpportunity}
                disabled={isSaving}
              >
                {isSaving ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Validar
              </Button>

              <AlertDialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rechazar oportunidad</AlertDialogTitle>
                    <AlertDialogDescription>
                      Por favor, indica el motivo del rechazo de esta oportunidad.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Motivo del rechazo"
                      className="w-full min-h-[100px]"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRejectionReason("")}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRejectOpportunity} disabled={isSaving || !rejectionReason.trim()}>
                      {isSaving ? "Procesando..." : "Rechazar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la oportunidad.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full">
          {editMode.title ? (
            <InlineEdit
              value={opportunity?.title}
              onSave={(value) => updateField("title", value)}
              isEditing={true}
              onEdit={() => { }}
              onCancel={() => cancelEditing("title")}
              placeholder="Título de la oportunidad"
            />
          ) : (
            <div className="flex items-center group">
              <h1 className="text-2xl font-bold flex-grow">
                {opportunity?.title}
                {opportunity?.end_customer && ` - ${opportunity.end_customer.name}`}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => startEditing("title")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-primary/10">
              {opportunity?.stage
                ? opportunity.stage.code
                  ? opportunity.stage.code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                  : opportunity.stage.name
                : "Sin etapa"}
            </Badge>
            {opportunity?.validation_status === "validated" ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Validada</Badge>
            ) : opportunity?.validation_status === "rejected" ? (
              <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rechazada</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                Pendiente de validación
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalles de la oportunidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Descripción</h3>
                  {editMode.description ? (
                    <InlineEdit
                      value={opportunity?.description}
                      onSave={(value) => updateField("description", value)}
                      isEditing={true}
                      onEdit={() => { }}
                      onCancel={() => cancelEditing("description")}
                      placeholder="Descripción de la oportunidad"
                      multiline={true}
                    />
                  ) : (
                    <div className="group">
                      <div className="flex items-start">
                        <p className="text-gray-700 flex-grow">{opportunity?.description || "Sin descripción"}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditing("description")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      Empresa tecnológica
                    </h3>
                    <div className="flex items-center">
                      <OrganizationAvatar
                        name={opportunity?.tech_company?.name || ""}
                        imageUrl={opportunity?.tech_company?.logo_url}
                        size="sm"
                      />
                      <span className="ml-2">{opportunity?.tech_company?.name || "No especificada"}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      Partner
                    </h3>
                    <Dialog open={isPartnerAssignDialogOpen} onOpenChange={setIsPartnerAssignDialogOpen}>
                      <div className="flex items-center group">
                        <div className="flex items-center flex-grow">
                          {opportunity?.partner ? (
                            <>
                              <OrganizationAvatar
                                name={opportunity.partner.name || ""}
                                imageUrl={opportunity.partner.logo_url}
                                size="sm"
                              />
                              <span className="ml-2">{opportunity.partner.name}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">No especificado</span>
                          )}
                        </div>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              logDebug("Abriendo diálogo de asignación de partner")
                              if (opportunity?.tech_company_id) {
                                loadAvailablePartners(opportunity.tech_company_id)
                              }
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                      </div>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Asignar Partner</DialogTitle>
                          <DialogDescription>
                            Selecciona el partner que trabajará en esta oportunidad.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="partner-select">Partner</Label>
                          {isLoadingPartners ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              <span className="ml-2">Cargando partners...</span>
                            </div>
                          ) : (
                            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                              <SelectTrigger id="partner-select">
                                <SelectValue placeholder="Selecciona un partner" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePartners.length === 0 ? (
                                  <div className="p-2 text-sm text-gray-500">
                                    No hay partners disponibles para esta tech company
                                  </div>
                                ) : (
                                  availablePartners.map((partner) => (
                                    <SelectItem key={partner.id} value={partner.id}>
                                      <div className="flex items-center">
                                        <OrganizationAvatar name={partner.name} imageUrl={partner.logo_url} size="xs" />
                                        <span className="ml-2">{partner.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPartnerAssignDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleAssignPartner}
                            disabled={isSaving || !selectedPartnerId || isLoadingPartners}
                          >
                            {isSaving ? "Guardando..." : "Guardar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      Cliente final
                    </h3>
                    <span>{opportunity?.end_customer?.name || "No especificado"}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      País
                    </h3>
                    {editMode.country ? (
                      <InlineEdit
                        value={opportunity?.country}
                        onSave={(value) => updateField("country", value)}
                        isEditing={true}
                        onEdit={() => { }}
                        onCancel={() => cancelEditing("country")}
                        placeholder="País"
                        type="select"
                        options={partnerCountries.map((country) => ({
                          value: country.code,
                          label: country.name,
                        }))}
                      />
                    ) : (
                      <InlineEdit
                        value={opportunity?.country}
                        onSave={(value) => updateField("country", value)}
                        isEditing={false}
                        onEdit={() => startEditing("country")}
                        onCancel={() => { }}
                        placeholder="No especificado"
                        type="select"
                        options={partnerCountries.map((country) => ({
                          value: country.code,
                          label: country.name,
                        }))}
                        // Función para mostrar el nombre del país en lugar del código
                        formatter={(value) => {
                          const country = partnerCountries.find((c) => c.code === value)
                          return country ? country.name : value || "No especificado"
                        }}
                      />
                    )}
                  </div>

                  {/* Estimated Value - Only for ScaleUp users */}
                  {(currentUser?.role_id === "3ddc89f1-1478-46b4-8a3f-8e42033a0b83" ||
                    currentUser?.role_id === "ff536fc8-8786-4be5-acf2-aee27b3d9924") && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Valor estimado
                        </h3>
                        {editMode.estimated_value ? (
                          <InlineEdit
                            value={opportunity?.estimated_value}
                            onSave={(value) => updateField("estimated_value", value)}
                            isEditing={true}
                            onEdit={() => { }}
                            onCancel={() => cancelEditing("estimated_value")}
                            type="number"
                            placeholder="Valor estimado"
                          />
                        ) : (
                          <InlineEdit
                            value={opportunity?.estimated_value}
                            onSave={(value) => updateField("estimated_value", value)}
                            isEditing={false}
                            onEdit={() => startEditing("estimated_value")}
                            onCancel={() => { }}
                            type="number"
                            placeholder="No especificado"
                          />
                        )}
                      </div>
                    )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Fecha estimada de cierre
                    </h3>
                    {editingField === "estimated_close_date" ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            type="date"
                            value={dateEditValue ? new Date(dateEditValue).toISOString().split("T")[0] : ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                setDateEditValue(e.target.value)
                              } else {
                                setDateEditValue("")
                              }
                            }}
                            className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600"
                            onClick={handleDateSaveChanges}
                            disabled={isSubmitting}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={handleDateCancelEditing}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 p-1 rounded"
                        onClick={() =>
                          handleDateStartEditing("estimated_close_date", opportunity.estimated_close_date || "")
                        }
                      >
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="text-gray-500">
                            {t("opportunities.estimated_close_date", "Estimated close date")}:
                          </span>{" "}
                          {opportunity.estimated_close_date ? (
                            format(new Date(opportunity.estimated_close_date), "PPP", { locale: getDateFnsLocale() })
                          ) : (
                            <span className="text-gray-400">{t("opportunities.no_close_date", "No close date")}</span>
                          )}
                        </span>
                        <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                      </div>
                    )}
                  </div>

                  {/* Etapa del pipeline */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Etapa
                    </h3>
                    {editMode.pipeline_stage_id ? (
                      <InlineEdit
                        value={opportunity?.pipeline_stage_id}
                        onSave={(value) => updateField("pipeline_stage_id", value)}
                        isEditing={true}
                        onEdit={() => { }}
                        onCancel={() => cancelEditing("pipeline_stage_id")}
                        type="select"
                        options={stages.map((stage) => ({
                          value: stage.id,
                          label: stage.code
                            ? stage.code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            : stage.name,
                        }))}
                        placeholder="Seleccionar etapa"
                      />
                    ) : (
                      <InlineEdit
                        value={opportunity?.pipeline_stage_id}
                        onSave={(value) => updateField("pipeline_stage_id", value)}
                        isEditing={false}
                        onEdit={() => startEditing("pipeline_stage_id")}
                        onCancel={() => { }}
                        type="select"
                        options={stages.map((stage) => ({
                          value: stage.id,
                          label: stage.code
                            ? stage.code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            : stage.name,
                        }))}
                        placeholder="Sin etapa"
                        formatter={(value) => {
                          const selectedStage = stages.find((stage) => stage.id === value)
                          return selectedStage
                            ? selectedStage.code
                              ? selectedStage.code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                              : selectedStage.name
                            : "Sin etapa"
                        }}
                      />
                    )}
                  </div>

                  {/* Responsable de ScaleUp */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Responsable ScaleUp
                    </h3>
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                      <div className="flex items-center group">
                        <span className="flex-grow">
                          {assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : "No asignado"}
                        </span>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                      </div>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Asignar responsable de ScaleUp</DialogTitle>
                          <DialogDescription>
                            Selecciona el usuario de ScaleUp que será responsable de esta oportunidad.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="scaleup-user">Usuario de ScaleUp</Label>
                          <Select value={selectedScaleupUser} onValueChange={setSelectedScaleupUser}>
                            <SelectTrigger id="scaleup-user">
                              <SelectValue placeholder="Selecciona un usuario" />
                            </SelectTrigger>
                            <SelectContent>
                              {scaleupUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAssignScaleupUser} disabled={isSaving || !selectedScaleupUser}>
                            {isSaving ? "Guardando..." : "Guardar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Responsable del Partner */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Responsable Partner
                    </h3>
                    <Dialog open={isPartnerResponsibleDialogOpen} onOpenChange={setIsPartnerResponsibleDialogOpen}>
                      <div className="flex items-center group">
                        <span className="flex-grow">
                          {partnerResponsible
                            ? `${partnerResponsible.first_name} ${partnerResponsible.last_name}`
                            : "No asignado"}
                        </span>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                      </div>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Asignar responsable del Partner</DialogTitle>
                          <DialogDescription>
                            Selecciona el usuario del Partner que será responsable de esta oportunidad.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="partner-user">Usuario del Partner</Label>
                          <Select value={selectedPartnerUser} onValueChange={setSelectedPartnerUser}>
                            <SelectTrigger id="partner-user">
                              <SelectValue placeholder="Selecciona un usuario" />
                            </SelectTrigger>
                            <SelectContent>
                              {partnerUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPartnerResponsibleDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAssignPartnerUser} disabled={isSaving || !selectedPartnerUser}>
                            {isSaving ? "Guardando..." : "Guardar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Creado por
                    </h3>
                    <span>
                      {opportunity?.creator
                        ? `${opportunity.creator.first_name} ${opportunity.creator.last_name}`
                        : "Usuario desconocido"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Fecha de creación
                    </h3>
                    <span>
                      {opportunity?.created_at
                        ? format(new Date(opportunity.created_at), "PPP", { locale: es })
                        : "Desconocida"}
                    </span>
                  </div>

                  {currentUser &&
                    (currentUser.role_id === "3ddc89f1-1478-46b4-8a3f-8e42033a0b83" ||
                      currentUser.role_id === "ff536fc8-8786-4be5-acf2-aee27b3d9924") && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Partner Nuevo
                        </h3>
                        {editMode.is_new_partner ? (
                          <InlineEdit
                            value={opportunity?.is_new_partner ? "true" : "false"}
                            onSave={(value) => updateField("is_new_partner", value === "true")}
                            isEditing={true}
                            onEdit={() => { }}
                            onCancel={() => cancelEditing("is_new_partner")}
                            type="select"
                            options={[
                              { value: "true", label: "Sí" },
                              { value: "false", label: "No" },
                            ]}
                            placeholder="Seleccionar..."
                          />
                        ) : (
                          <InlineEdit
                            value={opportunity?.is_new_partner ? "true" : "false"}
                            onSave={(value) => updateField("is_new_partner", value === "true")}
                            isEditing={false}
                            onEdit={() => startEditing("is_new_partner")}
                            onCancel={() => { }}
                            type="select"
                            options={[
                              { value: "true", label: "Sí" },
                              { value: "false", label: "No" },
                            ]}
                            placeholder="No especificado"
                            formatter={(value) => (value === "true" ? "Sí" : "No")}
                          />
                        )}
                      </div>
                    )}
                </div>

                {/* Campos técnicos integrados dentro de la tarjeta de detalles */}
                {opportunity?.tech_company_id && (
                  <div className="mt-6 border-t pt-4">
                    <OpportunityTechFields
                      opportunityId={opportunity?.id}
                      techCompanyId={opportunity?.tech_company_id}
                      onEmpty={() => null} // No mostrar nada si no hay campos técnicos
                      renderHeader={(hasFields) =>
                        hasFields ? (
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              Campos técnicos
                            </h3>
                          </div>
                        ) : null
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contactos relacionados */}
          <div className="mt-6">
            {/* Prospect Partner Header - Professional Container */}
            {opportunity?.prospect?.name && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-t-lg p-3 mb-0">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 mb-1">
                        Empresa (Prospecto)
                      </p>
                      <p className="text-sm font-bold text-slate-900">{opportunity.prospect.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-white">
                    Prospect Partner
                  </Badge>
                </div>
              </div>
            )}
            <OpportunityContactsSection
              opportunityId={opportunity?.id}
              onSendMessage={() => setShowPulseMessageSender(true)}
            />
          </div>

          {/* Tareas relacionadas */}
          <div className="mt-6">
            <RelatedTasksList
              opportunityId={opportunity?.id}
              title={t("opportunities.related_tasks", "Tareas relacionadas")}
              description={t(
                "opportunities.related_tasks_description",
                "Gestiona las tareas relacionadas a esta oportunidad",
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Usar el componente OpportunityNotesFixed que maneja su propio estado de usuario */}
          <OpportunityNotesFixed opportunityId={opportunity?.id} />
        </div>
      </div>
      {/* Diálogo de información del cliente final */}
      {showEndCustomerInfo && (
        <EndCustomerInfoDialog
          open={showEndCustomerInfo}
          onClose={() => setShowEndCustomerInfo(false)}
          opportunity={opportunity}
          endCustomerId={opportunity?.end_customer?.id}
        />
      )}

      {/* Modal de envío de mensajes Pulse */}
      {showPulseMessageSender && opportunity && (
        <PulseMessageSenderOpportunity
          opportunity={{
            id: opportunity.id,
            title: opportunity.title,
            estimated_value: opportunity.estimated_value,
            probability: opportunity.probability,
            stage: opportunity.stage,
            description: opportunity.description,
            end_customer_id: opportunity.end_customer_id,
            tech_company_id: opportunity.tech_company_id,
            prospect_id: opportunity.prospect_id,
            partner_id: opportunity.partner_id,
          }}
          techCompanyData={opportunity.tech_companies}
          prospectData={opportunity.prospects}
          partnerData={opportunity.partners}
          contacts={opportunity.opportunity_contacts?.map((oc) => ({
            id: oc.contact?.id,
            name: oc.contact?.first_name + " " + oc.contact?.last_name,
            email: oc.contact?.email,
            phone: oc.contact?.phone,
            position: oc.contact?.position,
          })) || []}
          endCustomer={opportunity.end_customer ? {
            id: opportunity.end_customer.id,
            name: opportunity.end_customer.name,
            industry: opportunity.end_customer.industry,
            city: opportunity.end_customer.city,
            country: opportunity.end_customer.country,
          } : undefined}
          templates={[]}
          isOpen={showPulseMessageSender}
          onClose={() => setShowPulseMessageSender(false)}
        />
      )}

      {/* Modal para seleccionar prospect partner cuando is_new_partner = true */}
      <Dialog open={isNewPartnerModalOpen} onOpenChange={setIsNewPartnerModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("opportunities.prospect.selectPartner")}</DialogTitle>
            <DialogDescription>{t("opportunities.prospect.selectPartnerDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Paso 1: Seleccionar prospect partner */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t("opportunities.prospect.name")} *</Label>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {existingProspectPartners.length > 0 ? (
                  existingProspectPartners.map((prospect) => (
                    <button
                      key={prospect.id}
                      onClick={() => {
                        setSelectedProspectPartner(prospect)
                          // Cargar contactos del prospect
                          ; (async () => {
                            try {
                              const { data: contacts } = await supabase
                                .from("contacts")
                                .select("*")
                                .eq("prospect_id", prospect.id)

                              if (contacts && contacts.length > 0) {
                                setProspectPartnerContacts(contacts)
                                setSelectedContact(contacts[0])
                              }
                            } catch (err) {
                              console.error("Error loading contacts:", err)
                            }
                          })()
                      }}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-blue-50 transition-colors ${selectedProspectPartner?.id === prospect.id ? "bg-blue-100" : ""
                        }`}
                    >
                      <div className="font-medium text-sm">{prospect.name}</div>
                      <div className="text-xs text-gray-500">{prospect.website || "Sin website"}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    {t("opportunities.prospect.noProspectsFound")}
                  </div>
                )}
              </div>
            </div>

            {/* Paso 2: Seleccionar contacto si hay prospect seleccionado */}
            {selectedProspectPartner && prospectPartnerContacts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("opportunities.prospect.selectContact")} *</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {prospectPartnerContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-green-50 transition-colors ${selectedContact?.id === contact.id ? "bg-green-100" : ""
                        }`}
                    >
                      <div className="font-medium text-sm">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{contact.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsNewPartnerModalOpen(false)
              setSelectedProspectPartner(null)
              setSelectedContact(null)
              setProspectPartnerContacts([])
            }}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!selectedProspectPartner || !selectedContact}
              onClick={async () => {
                if (!selectedProspectPartner || !selectedContact) return

                try {
                  setIsSaving(true)
                  // Guardar prospect_id en la oportunidad
                  const { error } = await supabase
                    .from("opportunities")
                    .update({
                      prospect_id: selectedProspectPartner.id,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", opportunity?.id)

                  if (error) throw error

                  // Actualizar estado local
                  setOpportunity({
                    ...opportunity,
                    prospect_id: selectedProspectPartner.id,
                    primary_contact_id: selectedContact.id,
                  })

                  toast({
                    title: t("common.success"),
                    description: t("opportunities.prospect.relationshipSaved"),
                  })

                  setIsNewPartnerModalOpen(false)
                  setSelectedProspectPartner(null)
                  setSelectedContact(null)
                  setProspectPartnerContacts([])
                } catch (err) {
                  console.error("Error saving relationship:", err)
                  toast({
                    title: t("common.error"),
                    description: t("common.errorOccurred"),
                    variant: "destructive",
                  })
                } finally {
                  setIsSaving(false)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar prospect partner a una oportunidad existente */}
      <Dialog open={isNewPartnerModalOpen} onOpenChange={(open) => {
        setIsNewPartnerModalOpen(open)
        if (!open) {
          // Reset when closing
          setProspectStep(1)
          setProspectPartnerData({ name: "", website: "", main_country_id: "", lead_source: "" })
          setProspectContactData({ first_name: "", last_name: "", email: "", phone: "", preferred_language: "es" })
          setProspectSearchQuery("")
          setShowCreateNew(false)
          setSelectedProspectPartner(null)
          setSelectedContact(null)
          setProspectPartnerContacts([])
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
                  <div>
                    <h3 className="font-semibold text-blue-900">{t("opportunities.prospect.name")}</h3>
                    <p className="text-sm text-blue-700">{t("opportunities.prospect.step1Description")}</p>
                  </div>
                </div>
              </div>

              {!showCreateNew ? (
                <>
                  {/* Búsqueda de prospect existente */}
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">{t("opportunities.prospect.name")} *</label>
                    <div className="relative">
                      <Input
                        placeholder={t("opportunities.prospect.searchOrCreate")}
                        value={prospectSearchQuery}
                        onChange={(e) => setProspectSearchQuery(e.target.value)}
                        onFocus={() => prospectSearchQuery && setShowProspectResults(true)}
                        className="text-base"
                      />
                      {prospectSearchQuery && showProspectResults && prospectSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50 max-h-48 overflow-y-auto">
                          {prospectSearchResults.map((prospect) => (
                            <button
                              key={prospect.id}
                              type="button"
                              onClick={() => handleSelectExistingProspect(prospect)}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-sm">{prospect.name}</div>
                              <div className="text-xs text-gray-500">{prospect.website || "Sin website"}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      {prospectSearchQuery && showProspectResults && prospectSearchResults.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50 px-3 py-2">
                          <p className="text-sm text-gray-500">{t("opportunities.prospect.noResults")}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {prospectSearchQuery ? t("opportunities.prospect.searchHint") : t("opportunities.prospect.createNewHint")}
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">{t("common.or")}</span>
                    </div>
                  </div>

                  <Button onClick={() => setShowCreateNew(true)} variant="outline" className="w-full">
                    {t("opportunities.prospect.createNew")}
                  </Button>
                </>
              ) : (
                <>
                  {/* Crear nuevo prospect */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">{t("opportunities.prospect.name")} *</label>
                      <Input
                        placeholder="Nombre de la empresa"
                        value={prospectPartnerData.name}
                        onChange={(e) => setProspectPartnerData({ ...prospectPartnerData, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("opportunities.prospect.website")}</label>
                      <Input
                        placeholder="https://ejemplo.com"
                        value={prospectPartnerData.website}
                        onChange={(e) => setProspectPartnerData({ ...prospectPartnerData, website: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("opportunities.prospect.country")}</label>
                      <select
                        value={prospectPartnerData.main_country_id}
                        onChange={(e) => setProspectPartnerData({ ...prospectPartnerData, main_country_id: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">{t("common.select")}</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("opportunities.prospect.leadSource")}</label>
                      <select
                        value={prospectPartnerData.lead_source}
                        onChange={(e) => setProspectPartnerData({ ...prospectPartnerData, lead_source: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">{t("common.select")}</option>
                        <option value="direct">{t("opportunities.leadSource.direct")}</option>
                        <option value="referral">{t("opportunities.leadSource.referral")}</option>
                        <option value="event">{t("opportunities.leadSource.event")}</option>
                        <option value="cold_call">{t("opportunities.leadSource.coldCall")}</option>
                        <option value="linkedin">{t("opportunities.leadSource.linkedin")}</option>
                        <option value="other">{t("opportunities.leadSource.other")}</option>
                      </select>
                    </div>

                    <Button onClick={() => setShowCreateNew(false)} variant="outline" className="w-full">
                      {t("common.back")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Contact Selection/Creation */}
          {prospectStep === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex gap-3">
                  <div>
                    <h3 className="font-semibold text-green-900">{t("opportunities.prospect.selectContact")}</h3>
                    <p className="text-sm text-green-700">{t("opportunities.prospect.selectContactDescription")}</p>
                  </div>
                </div>
              </div>

              {prospectPartnerContacts.length > 0 && !showCreateNew ? (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t("opportunities.prospect.selectContact")} *</label>
                    <div className="space-y-2 border rounded-lg p-2">
                      {prospectPartnerContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-colors ${selectedContact?.id === contact.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent hover:bg-gray-50"
                            }`}
                        >
                          <div className="font-medium text-sm">
                            {contact.first_name} {contact.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{contact.email}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">{t("common.or")}</span>
                    </div>
                  </div>

                  <Button onClick={() => setShowCreateNew(true)} variant="outline" className="w-full">
                    {t("opportunities.prospect.createContact")}
                  </Button>
                </>
              ) : (
                <>
                  {/* Crear nuevo contacto */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">{t("contacts.form.firstName")} *</label>
                        <Input
                          placeholder="Nombre"
                          value={prospectContactData.first_name}
                          onChange={(e) => setProspectContactData({ ...prospectContactData, first_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("contacts.form.lastName")} *</label>
                        <Input
                          placeholder="Apellido"
                          value={prospectContactData.last_name}
                          onChange={(e) => setProspectContactData({ ...prospectContactData, last_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("contacts.form.email")} *</label>
                      <Input
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={prospectContactData.email}
                        onChange={(e) => setProspectContactData({ ...prospectContactData, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("contacts.form.phone")}</label>
                      <Input
                        placeholder="+1 (555) 000-0000"
                        value={prospectContactData.phone}
                        onChange={(e) => setProspectContactData({ ...prospectContactData, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    {prospectPartnerContacts.length > 0 && (
                      <Button onClick={() => setShowCreateNew(false)} variant="outline" className="w-full">
                        {t("common.back")}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsNewPartnerModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsSaving(true)

                  let prospectPartnerId = selectedProspectPartner?.id

                  // Si es un nuevo prospect partner, crear
                  if (!prospectPartnerId && prospectPartnerData.name) {
                    console.log("[v0] Creating new prospect partner:", prospectPartnerData)
                    const { data: newProspect, error: prospectError } = await supabase
                      .from("prospect_partners")
                      .insert([
                        {
                          name: prospectPartnerData.name,
                          website: prospectPartnerData.website || null,
                          main_country_id: prospectPartnerData.main_country_id || null,
                          lead_source: prospectPartnerData.lead_source || null,
                        },
                      ])
                      .select("id")

                    if (prospectError) {
                      console.error("[v0] Error creating prospect partner:", prospectError)
                      throw prospectError
                    }

                    if (newProspect && newProspect[0]) {
                      prospectPartnerId = newProspect[0].id
                      console.log("[v0] New prospect partner created with ID:", prospectPartnerId)
                    } else {
                      throw new Error("No se pudo crear el prospect partner")
                    }
                  }

                  let contactId = selectedContact?.id

                  // Si es un nuevo contacto, crear
                  if (!contactId && prospectContactData.first_name && prospectContactData.email) {
                    console.log("[v0] Creating new contact with prospect_id:", prospectPartnerId)
                    const { data: newContact, error: contactError } = await supabase
                      .from("contacts")
                      .insert([
                        {
                          first_name: prospectContactData.first_name,
                          last_name: prospectContactData.last_name,
                          email: prospectContactData.email,
                          phone: prospectContactData.phone || null,
                          prospect_id: prospectPartnerId,
                          department: "General",
                          preferred_language: prospectContactData.preferred_language,
                        },
                      ])
                      .select("id")

                    if (contactError) {
                      console.error("[v0] Error creating contact:", contactError)
                      throw contactError
                    }

                    if (newContact && newContact[0]) {
                      contactId = newContact[0].id
                      console.log("[v0] New contact created with ID:", contactId)
                    } else {
                      throw new Error("No se pudo crear el contacto")
                    }
                  }

                  console.log("[v0] About to update opportunity with prospect_id:", prospectPartnerId, "and contact_id:", contactId)

                  // Update opportunity with prospect_id
                  if (prospectPartnerId && opportunity?.id) {
                    const { error: updateError } = await supabase
                      .from("opportunities")
                      .update({
                        prospect_id: prospectPartnerId,
                        updated_at: new Date().toISOString(),
                      })
                      .eq("id", opportunity.id)

                    if (updateError) {
                      console.error("[v0] Error updating opportunity:", updateError)
                      throw updateError
                    }

                    console.log("[v0] Opportunity updated with prospect_id successfully")
                  }

                  // Set contact as primary in opportunity_contacts
                  if (contactId && opportunity?.id) {
                    try {
                      // First, set is_primary = false for all other contacts of this opportunity
                      const { error: clearError } = await supabase
                        .from("opportunity_contacts")
                        .update({ is_primary: false })
                        .eq("opportunity_id", opportunity.id)

                      if (clearError) {
                        console.warn("[v0] Warning setting other contacts as non-primary:", clearError)
                      }

                      // Then, insert or update this contact as primary
                      const { error: primaryError } = await supabase
                        .from("opportunity_contacts")
                        .upsert([
                          {
                            opportunity_id: opportunity.id,
                            contact_id: contactId,
                            is_primary: true,
                          },
                        ])

                      if (primaryError) {
                        console.error("[v0] Error setting contact as primary:", primaryError)
                        throw primaryError
                      }

                      console.log("[v0] Contact set as primary successfully")
                    } catch (err) {
                      console.error("[v0] Error managing opportunity_contacts:", err)
                      throw err
                    }
                  }

                  if (prospectPartnerId && contactId) {
                    toast({
                      title: t("common.success"),
                      description: t("opportunities.prospect.relationshipSaved"),
                    })

                    // Reload opportunity
                    await window.location.reload();

                    setIsNewPartnerModalOpen(false)
                  } else {
                    console.error("[v0] Missing required values for update:", {
                      prospectPartnerId,
                      contactId,
                      opportunityId: opportunity?.id,
                    })
                    throw new Error("No se pudieron validar los datos necesarios para guardar")
                  }
                } catch (err) {
                  console.error("[v0] Error saving relationship:", err)
                  toast({
                    title: t("common.error"),
                    description: err instanceof Error ? err.message : t("common.errorOccurred"),
                    variant: "destructive",
                  })
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={!((selectedProspectPartner && selectedContact) || (prospectPartnerData.name && prospectContactData.email))}
            >
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
