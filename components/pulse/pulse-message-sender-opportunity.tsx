"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Upload, Mail, MessageCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { sendPulseMessage } from "@/lib/services/pulse-message-service"
import { replaceVariables } from "@/lib/pulse/pulse-message-variables"
import { PULSE_VARIABLES } from "@/lib/pulse/pulse-variables"
import { toast } from "@/components/ui/use-toast"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"
import SafeEditor from "@/components/pulse/safe-editor"
import { FileUpload } from "@/components/file-upload"

// Convertir [BR] a saltos de línea reales para edición
const brToNewlines = (text: string): string => {
  return text.replaceAll("[BR]", "\n")
}

// Convertir saltos de línea reales a [BR] para almacenamiento/envío
const newlinesToBr = (text: string): string => {
  return text.replaceAll("\n", "[BR]")
}

// Función para renderizar el contenido con tags [IMG], [B], [I], [U] y variables (ya reemplazadas)
const renderFormattedContent = (
  content: string,
  variables?: Record<string, string | number>
): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let componentCounter = 0

  // Primero reemplazar variables si se proporcionan
  let processedContent = content
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const tag = `{{${key}}}`
      const stringValue = value !== null && value !== undefined ? String(value) : ""
      processedContent = processedContent.replaceAll(tag, stringValue)
    })
  }

  // Regex para procesar [IMG], [B], [I], [U] (ya sin variables, que fueron reemplazadas arriba)
  const regex = /\[IMG\](.*?)\[\/IMG\]|\[B\](.*?)\[\/B\]|\[I\](.*?)\[\/I\]|\[U\](.*?)\[\/U\]/g
  let match

  while ((match = regex.exec(processedContent)) !== null) {
    const elementKey = `elem-${componentCounter++}`

    // Agregar texto plano antes del match
    if (match.index > lastIndex) {
      parts.push(processedContent.substring(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      // [IMG]url[/IMG]
      const imgUrl = match[1]
      const imgKey = `img-${componentCounter++}`

      parts.push(
        <img
          key={imgKey}
          src={imgUrl}
          alt="Contenido"
          className="max-w-full max-h-80 rounded my-2 block shadow-sm border border-slate-100"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            if (target.dataset.errorHandled) return
            target.dataset.errorHandled = "true"
            target.src = "https://placehold.co/400x200?text=Imagen+Expirada"
            target.className = "max-w-full h-20 rounded my-2 block opacity-40 grayscale"
            console.warn("[v0] Imagen blob expirada omitida:", imgUrl)
          }}
        />
      )
    } else if (match[2] !== undefined) {
      // [B]text[/B]
      parts.push(
        <strong key={elementKey} className="font-bold">
          {match[2]}
        </strong>
      )
    } else if (match[3] !== undefined) {
      // [I]text[/I]
      parts.push(
        <em key={elementKey} className="italic">
          {match[3]}
        </em>
      )
    } else if (match[4] !== undefined) {
      // [U]text[/U]
      parts.push(
        <u key={elementKey} className="underline">
          {match[4]}
        </u>
      )
    }

    lastIndex = regex.lastIndex
  }

  // Agregar texto restante
  if (lastIndex < processedContent.length) {
    const remaining = processedContent.substring(lastIndex)
    if (remaining) {
      parts.push(remaining)
    }
  }

  return parts.length > 0 ? parts : [processedContent]
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  position?: string
}

interface Opportunity {
  id: string
  name: string
  value?: number
  probability?: number
  stage?: string
  description?: string
  end_customer_id?: string
}

interface EndCustomer {
  id: string
  name: string
  industry?: string
  city?: string
  country?: string
}

interface PulseMessageSenderOpportunityProps {
  opportunity: Opportunity & {
    tech_company_id?: string
    prospect_id?: string
    partner_id?: string
    title?: string
    estimated_value?: number
  }
  techCompanyData?: any
  prospectData?: any
  partnerData?: any
  contacts: Contact[]
  endCustomer?: EndCustomer
  templates: any[]
  isOpen: boolean
  onClose: () => void
}

export function PulseMessageSenderOpportunity({
  opportunity,
  techCompanyData,
  prospectData,
  partnerData,
  contacts,
  endCustomer,
  isOpen,
  onClose,
}: PulseMessageSenderOpportunityProps) {
  const { userInfo } = useAuth()
  const { language } = useTranslations(DICT_LANG_CONTACTS)
  const [channel, setChannel] = useState<"email" | "whatsapp">("email")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [toEmails, setToEmails] = useState<string[]>([])
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [bccEmails, setBccEmails] = useState<string[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<
    Array<{ email: string; phone?: string; first_name: string; last_name: string }>
  >([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sendMode, setSendMode] = useState<"individual" | "group">("group")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [sending, setSending] = useState(false)
  const [loadedTemplates, setLoadedTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([])
  const [newAttachments, setNewAttachments] = useState<any[]>([])
  const [recipients, setRecipients] = useState<any[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [manualEmail, setManualEmail] = useState("")
  const [recipientType, setRecipientType] = useState<"to" | "cc" | "bcc">("to")
  const [opportunityRelations, setOpportunityRelations] = useState<any>({})
  const [relationsLoading, setRelationsLoading] = useState(false)
  const [senderMode, setSenderMode] = useState<"personal" | "system">("personal")
  const [openSubjectDropdown, setOpenSubjectDropdown] = useState<"entidad" | "destinatario" | "emisor" | null>(null)
  const [hasPersonalEmail, setHasPersonalEmail] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [showConnectEmailModal, setShowConnectEmailModal] = useState(false)

  // Cargar templates, recipients y relaciones al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      loadRecipients()
      loadOpportunityRelations()
      checkUserEmailConnection()
    }
  }, [isOpen])

  // Función para verificar si el usuario tiene email conectado
  const checkUserEmailConnection = async () => {
    if (!userInfo?.id) return

    try {
      setCheckingEmail(true)
      const response = await fetch(`/api/pulse/user-email-integration?userId=${userInfo.id}`)
      if (!response.ok) throw new Error("Error al verificar conexión de email")

      const data = await response.json()
      setHasPersonalEmail(data.hasIntegration || false)
    } catch (error) {
      console.error("Error verificando email:", error)
      setHasPersonalEmail(false)
    } finally {
      setCheckingEmail(false)
    }
  }

  // Función para iniciar el flujo OAuth de email
  const handleConnectEmail = async (provider: "google" | "outlook") => {
    try {
      const response = await fetch("/api/auth/email-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          userId: userInfo?.id // Pasar el user_id
        }),
      })

      if (!response.ok) throw new Error("Error al iniciar conexión")

      const data = await response.json()
      if (data.authUrl) {
        // Abrir ventana popup para OAuth
        const width = 500
        const height = 600
        const left = window.innerWidth / 2 - width / 2
        const top = window.innerHeight / 2 - height / 2

        const popup = window.open(
          data.authUrl,
          "email-oauth",
          `width=${width},height=${height},left=${left},top=${top}`
        )

        if (!popup) {
          toast({
            description: "Por favor permite popups para conectar tu email",
            variant: "destructive",
          })
          return
        }

        // Esperar 5 segundos y verificar si se guardó la conexión
        // No usamos window.closed porque Google OAuth cambia el origen (COOP)
        setTimeout(() => {
          setShowConnectEmailModal(false)
          checkUserEmailConnection()
        }, 5000)
      }
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Error al conectar email",
        variant: "destructive",
      })
    }
  }

  // Función para cargar las relaciones de la oportunidad (tech_company, prospect, partner)
  const loadOpportunityRelations = async () => {
    try {
      setRelationsLoading(true)
      const params = new URLSearchParams()

      if (opportunity.tech_company_id) {
        params.append("techCompanyId", opportunity.tech_company_id)
      }
      if (opportunity.prospect_id) {
        params.append("prospectId", opportunity.prospect_id)
      }
      if (opportunity.partner_id) {
        params.append("partnerId", opportunity.partner_id)
      }

      if (params.toString()) {
        const response = await fetch(
          `/api/pulse/opportunity-relations?${params.toString()}`
        )

        if (!response.ok) throw new Error("Error al cargar relaciones")

        const data = await response.json()
        setOpportunityRelations(data || {})
      }
    } catch (error) {
      console.error("Error cargando relaciones:", error)
    } finally {
      setRelationsLoading(false)
    }
  }

  // Función para cargar recipients (users de tech_company + admins/BDD + contactos)
  const loadRecipients = async () => {
    if (!opportunity.tech_company_id || !opportunity.id) return

    try {
      setRecipientsLoading(true)
      const params = new URLSearchParams()
      params.append("techCompanyId", opportunity.tech_company_id)
      params.append("opportunityId", opportunity.id)
      if (opportunity.partner_id) {
        params.append("partnerId", opportunity.partner_id)
      }

      const response = await fetch(`/api/pulse/recipients?${params.toString()}`)
      if (!response.ok) throw new Error("Error al cargar recipients")

      const data = await response.json()
      setRecipients(data || [])
    } catch (error) {
      console.error("Error cargando recipients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setRecipientsLoading(false)
    }
  }

  // Función para cargar templates
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true)
      const response = await fetch(
        "/api/pulse/templates?includeTranslations=true"
      )
      if (!response.ok) throw new Error("Error al cargar templates")

      const data = await response.json()
      setLoadedTemplates(data || [])
    } catch (error) {
      console.error("Error cargando templates:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los templates",
        variant: "destructive",
      })
    } finally {
      setTemplatesLoading(false)
    }
  }

  // Filtrar y ordenar templates por idioma del usuario
  const sortedTemplates = useMemo(() => {
    return loadedTemplates
      .filter((template: any) => {
        const translation = template.translations?.find(
          (t: any) => t.language_code === language
        )
        return translation !== undefined
      })
      .map((template: any) => {
        const translation = template.translations?.find(
          (t: any) => t.language_code === language
        )
        return {
          ...template,
          displayName: translation?.display_name || template.internal_code,
        }
      })
      .sort((a: any, b: any) =>
        a.displayName.localeCompare(b.displayName)
      )
  }, [loadedTemplates, language])

  // Construir objeto con valores de variables disponibles
  const variableValues = useMemo(() => {
    const values: Record<string, string | number> = {}

    // Variables de contacto (primer contacto disponible)
    if (contacts && contacts.length > 0) {
      const firstContact = contacts[0]
      values.contact_name = firstContact.name || ""
      values.contact_email = firstContact.email || ""
      values.contact_phone = firstContact.phone || ""
      values.contact_position = firstContact.position || ""
    } else {
      // Si no hay contactos, mostrar placeholders
      values.contact_name = "[Sin contacto]"
      values.contact_email = "[Sin contacto]"
      values.contact_phone = "[Sin contacto]"
      values.contact_position = "[Sin contacto]"
    }

    // Variables de empresa/cliente
    if (endCustomer) {
      values.company_name = endCustomer.name || ""
      values.company_industry = endCustomer.industry || ""
      values.company_city = endCustomer.city || ""
      values.company_country = endCustomer.country || ""
    } else {
      values.company_name = "[Sin empresa]"
      values.company_industry = "[Sin empresa]"
      values.company_city = "[Sin empresa]"
      values.company_country = "[Sin empresa]"
    }

    // Variables de oportunidad
    values.opportunity_name = opportunity?.title || ""
    values.opportunity_amount = opportunity?.estimated_value || ""
    values.opportunity_stage = opportunity?.stage || ""
    values.opportunity_probability = opportunity?.probability || ""
    values.opportunity_description = opportunity?.description || ""

    // Variables de tech_company
    if (opportunityRelations.tech_company) {
      values.tech_company_name = opportunityRelations.tech_company.name || ""
    } else {
      values.tech_company_name = "[Sin empresa técnica]"
    }

    // Variables de prospect
    if (opportunityRelations.prospect) {
      values.prospect_partner_name = opportunityRelations.prospect.name || ""
    } else {
      values.prospect_partner_name = "[Sin prospect]"
    }

    // Variables de partner
    if (opportunityRelations.partner) {
      values.partner_name = opportunityRelations.partner.name || ""
    } else {
      values.partner_name = "[Sin partner]"
    }

    // Variables de usuario
    if (userInfo) {
      values.user_name = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim()
      values.user_email = userInfo.email || ""
    } else {
      values.user_name = "[Sin usuario]"
      values.user_email = "[Sin usuario]"
    }

    // Variables de emisor (cambian según senderMode)
    if (senderMode === "personal") {
      values.sender_name = userInfo?.firstName || ""
      values.sender_lastname = userInfo?.lastName || ""
    } else {
      values.sender_name = "ScaleUp"
      values.sender_lastname = ""
    }
    values.sender_company = "ScaleUp"

    // Variables de fecha/hora
    const now = new Date()
    values.today_date = now.toLocaleDateString("es-ES")
    values.current_time = now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Variables de destinatario (solo si hay exactamente 1 destinatario "to")
    if (selectedRecipients.length === 1) {
      values.recipient_first_name = selectedRecipients[0].first_name || ""
      values.recipient_last_name = selectedRecipients[0].last_name || ""
    } else {
      // Si hay múltiples o ninguno, dejar vacío
      values.recipient_first_name = ""
      values.recipient_last_name = ""
    }

    return values
  }, [contacts, endCustomer, opportunity, userInfo, opportunityRelations, senderMode, selectedRecipients])

  const previewMessage = useMemo(() => {
    return replaceVariables(message, variableValues)
  }, [message, variableValues])

  const previewSubject = useMemo(() => {
    return replaceVariables(subject, variableValues)
  }, [subject, variableValues])

  // Cargar asunto, contenido y adjuntos cuando se selecciona un template
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== "none") {
      const template = sortedTemplates.find((t: any) => t.id === selectedTemplate)
      if (template) {
        const translation = template.translations?.find(
          (t: any) => t.language_code === language
        )
        if (translation) {
          setSubject(brToNewlines(translation.subject || ""))
          setMessage(brToNewlines(translation.body_content || ""))
        }

        // Cargar attachments del template (filtrados por idioma o "all")
        const attachments = template.attachments
          ?.filter(
            (ta: any) =>
              ta.language_code === language || ta.language_code === "all"
          )
          .map((ta: any) => ta.attachment)
          .filter(Boolean) || []

        setSelectedAttachments(attachments)
      }
    } else {
      // Limpiar attachments si no hay template seleccionado
      setSelectedAttachments([])
    }
  }, [selectedTemplate, sortedTemplates, language])

  const handleAddContact = (value: string) => {
    if (value.startsWith("contact-")) {
      // Es un contacto de la oportunidad
      const contactId = value.replace("contact-", "")
      const contact = contacts.find((c) => c.id === contactId)
      if (contact && contact.email) {
        addEmailToGroup(contact.email, {
          first_name: contact.name?.split(" ")[0] || "",
          last_name: contact.name?.split(" ").slice(1).join(" ") || "",
          phone: contact.phone || "",
        })
      }
    } else if (value.startsWith("user-")) {
      // Es un user de la tech_company o admin
      const userId = value.replace("user-", "")
      const userRecipient = recipients.find((r) => r.id === userId)
      if (userRecipient && userRecipient.email) {
        addEmailToGroup(userRecipient.email, {
          first_name: userRecipient.first_name || "",
          last_name: userRecipient.last_name || "",
          phone: userRecipient.phone || "",
        })
      }
    }
  }

  const addEmailToGroup = (email: string, recipient?: { first_name: string; last_name: string; phone?: string }) => {
    if (recipientType === "to" && !toEmails.includes(email)) {
      setToEmails([...toEmails, email])
      if (recipient) {
        setSelectedRecipients([...selectedRecipients, { email, ...recipient }])
      }
    } else if (recipientType === "cc" && !ccEmails.includes(email)) {
      setCcEmails([...ccEmails, email])
    } else if (recipientType === "bcc" && !bccEmails.includes(email)) {
      setBccEmails([...bccEmails, email])
    }
  }

  const handleAddManualEmail = () => {
    if (manualEmail.trim()) {
      addEmailToGroup(manualEmail)
      setManualEmail("")
    }
  }

  const handleRemoveFromEmail = (email: string) => {
    setToEmails(toEmails.filter((e) => e !== email))
    setSelectedRecipients(selectedRecipients.filter((r) => r.email !== email))
  }

  const handleRemoveCcEmail = (email: string) => {
    setCcEmails(ccEmails.filter((e) => e !== email))
  }

  const handleRemoveBccEmail = (email: string) => {
    setBccEmails(bccEmails.filter((e) => e !== email))
  }

  const handleSend = async () => {
    // Para WhatsApp, solo se requiere el mensaje (no el asunto)
    if (channel === "whatsapp") {
      if (!message.trim()) {
        toast({
          description: "El mensaje es requerido",
          variant: "destructive",
        })
        return
      }
    } else {
      // Para email, se requieren asunto y mensaje
      if (!subject.trim() || !message.trim()) {
        toast({
          description: "Asunto y mensaje son requeridos",
          variant: "destructive",
        })
        return
      }
    }

    if (toEmails.length === 0) {
      toast({
        description: "Debe seleccionar al menos un destinatario",
        variant: "destructive",
      })
      return
    }

    // Validar si eligió enviar como personal pero no tiene email conectado
    if (channel === "email" && senderMode === "personal" && !hasPersonalEmail) {
      setShowConnectEmailModal(true)
      return
    }

    setSending(true)
    try {
      // Si es WhatsApp personal, abrir en nueva ventana
      if (channel === "whatsapp" && senderMode === "personal") {
        // Para WhatsApp, usar el número de teléfono del primer destinatario
        const firstRecipient = selectedRecipients[0]
        const phoneNumber = firstRecipient?.phone || toEmails[0]
        
        if (!phoneNumber) {
          toast({
            description: "El destinatario no tiene número de teléfono registrado",
            variant: "destructive",
          })
          setSending(false)
          return
        }

        const encodedMessage = encodeURIComponent(message)
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank")
        toast({
          description: "Ventana de WhatsApp abierta. Por favor envía el mensaje manualmente.",
        })
        onClose()
        return
      }

      // Para emails, usar el servicio de envío
      const scheduledAt = scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}:00` : undefined

      await sendPulseMessage({
        template_id: selectedTemplate,
        opportunity_id: opportunity.id,
        user_id: userInfo?.id || "",
        to_emails: toEmails,
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
        subject,
        body_content: message,
        send_mode: sendMode,
        channel: channel,
        senderMode: senderMode,
        scheduled_at: scheduledAt,
        recipients: [
          ...toEmails.map((email) => {
            const recipient = selectedRecipients.find((r) => r.email === email)
            return {
              contact_id: "",
              email,
              name: `${recipient?.first_name || ""} ${recipient?.last_name || ""}`.trim(),
              phone: recipient?.phone || "",
            }
          }),
          ...ccEmails.map((email) => {
            const recipient = selectedRecipients.find((r) => r.email === email)
            return {
              contact_id: "",
              email,
              name: `${recipient?.first_name || ""} ${recipient?.last_name || ""}`.trim(),
              phone: recipient?.phone || "",
            }
          }),
          ...bccEmails.map((email) => {
            const recipient = selectedRecipients.find((r) => r.email === email)
            return {
              contact_id: "",
              email,
              name: `${recipient?.first_name || ""} ${recipient?.last_name || ""}`.trim(),
              phone: recipient?.phone || "",
            }
          }),
        ],
        variables_values: variableValues,
        attachments: [
          ...selectedAttachments, // Attachments del template
          ...newAttachments.map((att: any) => ({
            ...att,
            file_content: att.file, // FormData será manejado en el servicio
          })),
        ],
      })

      toast({
        description: "Mensaje enviado correctamente",
      })
      onClose()
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Error al enviar mensaje",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Dialog principal de envío */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 bg-white rounded-lg shadow-xl">
          {/* HEADER - ESTILO CREAR OPORTUNIDAD */}
          <div className="bg-blue-50 border-b border-blue-200 px-8 py-6">
            <h2 className="text-2xl font-bold text-blue-900">Enviar Mensaje</h2>
            <p className="text-sm text-blue-600 mt-2">Configura y envía un mensaje a tus contactos. Oportunidad: {opportunity.name}</p>
          </div>

          {/* CONTENIDO PRINCIPAL - DOS COLUMNAS */}
          <div className="flex flex-1 overflow-hidden">
            {/* COLUMNA IZQUIERDA (60%) - CONFIGURACIÓN */}
            <div className="w-3/5 border-r border-slate-200 overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="p-8 space-y-6">
                  {/* CANAL, MODO DE ENVÍO Y TEMPLATE - GRID 3 COL */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Canal *</label>
                      <Select value={channel} onValueChange={(val) => setChannel(val as any)}>
                        <SelectTrigger className="h-9 border border-slate-300 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </div>
                          </SelectItem>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Modo *</label>
                      <Select value={sendMode} onValueChange={(val) => setSendMode(val as any)}>
                        <SelectTrigger className="h-9 border border-slate-300 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">Grupal</SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Template (Opcional)</label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="h-9 border border-slate-300 rounded-lg text-sm">
                          <SelectValue placeholder={templatesLoading ? "Cargando..." : "Seleccionar template"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin template</SelectItem>
                          {sortedTemplates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* REMITENTE - Solo para Email */}
                  {channel === "email" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-900">Enviar como *</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSenderMode("personal")}
                          className={`text-xs font-semibold px-3 py-2 rounded transition-all ${senderMode === "personal"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-white text-slate-600 border border-slate-300 hover:border-blue-200"
                            }`}
                        >
                          Tu Email {hasPersonalEmail && senderMode === "personal" ? "✓" : ""}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSenderMode("system")}
                          className={`text-xs font-semibold px-3 py-2 rounded transition-all ${senderMode === "system"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-white text-slate-600 border border-slate-300 hover:border-blue-200"
                            }`}
                        >
                          Sistema CRM
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DESTINATARIOS */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-900">Destinatarios *</label>

                    {/* Botones para seleccionar To/CC/BCC - en una línea */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRecipientType("to")}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${recipientType === "to"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        Para
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientType("cc")}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${recipientType === "cc"
                          ? "bg-amber-600 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        CC
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientType("bcc")}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${recipientType === "bcc"
                          ? "bg-slate-600 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        BCC
                      </button>
                    </div>

                    {/* Select y botón agregar en una línea */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select onValueChange={handleAddContact}>
                          <SelectTrigger className="h-9 border border-slate-300 rounded-lg text-sm bg-white">
                            <SelectValue placeholder="+ Agregar destinatario" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Contactos de la oportunidad */}
                            {contacts.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Contactos de la oportunidad
                                </div>
                                {contacts.map((contact) => (
                                  <SelectItem key={`contact-${contact.id}`} value={`contact-${contact.id}`}>
                                    {contact.name} ({contact.email})
                                  </SelectItem>
                                ))}
                              </>
                            )}

                            {/* Users de la TechCompany */}
                            {recipients.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Usuarios de la empresa
                                </div>
                                {recipients.map((user) => (
                                  <SelectItem key={`user-${user.id}`} value={`user-${user.id}`}>
                                    {user.first_name} {user.last_name} ({user.email})
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Input para agregar emails manuales */}
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddManualEmail()
                          }
                        }}
                        placeholder="O escribe un email manual..."
                        className="h-9 border border-slate-300 rounded-lg text-sm flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddManualEmail}
                        className="h-9 px-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg text-sm"
                      >
                        +
                      </Button>
                    </div>

                    {toEmails.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-semibold text-slate-900">Para:</p>
                        <div className="flex flex-wrap gap-2">
                          {toEmails.map((email) => (
                            <Badge key={email} className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-medium px-3 py-2">
                              {email}
                              <button onClick={() => handleRemoveFromEmail(email)} className="ml-2 hover:opacity-70">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {ccEmails.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">CC:</p>
                        <div className="flex flex-wrap gap-2">
                          {ccEmails.map((email) => (
                            <Badge key={email} className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-medium px-3 py-2">
                              {email}
                              <button onClick={() => handleRemoveCcEmail(email)} className="ml-2 hover:opacity-70">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {bccEmails.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">BCC:</p>
                        <div className="flex flex-wrap gap-2">
                          {bccEmails.map((email) => (
                            <Badge key={email} className="bg-slate-200 text-slate-800 hover:bg-slate-200 text-xs font-medium px-3 py-2">
                              {email}
                              <button onClick={() => handleRemoveBccEmail(email)} className="ml-2 hover:opacity-70">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ASUNTO Y VARIABLES - EN UNA LÍNEA */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-900">Asunto *</label>
                    <div className="flex gap-2 items-start">
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ej: Propuesta especial para {{company_name}}"
                        className="h-9 border border-slate-300 rounded-lg text-sm flex-1"
                      />

                      {/* Dropdown buttons compactos */}
                      <div className="flex gap-1">
                        {/* ENTIDAD Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenSubjectDropdown(openSubjectDropdown === "entidad" ? null : "entidad")}
                            className="text-xs font-semibold px-2 py-2 rounded bg-slate-700 text-white hover:bg-slate-800 transition-all whitespace-nowrap"
                          >
                            ENT
                          </button>
                          {openSubjectDropdown === "entidad" && (
                            <div className="absolute top-full mt-1 right-0 bg-white border border-slate-300 rounded shadow-lg z-10 min-w-max">
                              {PULSE_VARIABLES.entidad.map((v) => (
                                <button
                                  key={v.tag}
                                  type="button"
                                  onClick={() => {
                                    setSubject(subject + v.tag)
                                    setOpenSubjectDropdown(null)
                                  }}
                                  className="block w-full text-left text-xs px-3 py-1.5 hover:bg-slate-100 transition-all border-b border-slate-100 last:border-b-0"
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* DESTINATARIO Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenSubjectDropdown(openSubjectDropdown === "destinatario" ? null : "destinatario")}
                            className="text-xs font-semibold px-2 py-2 rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all whitespace-nowrap"
                          >
                            DES
                          </button>
                          {openSubjectDropdown === "destinatario" && (
                            <div className="absolute top-full mt-1 right-0 bg-white border border-slate-300 rounded shadow-lg z-10 min-w-max">
                              {PULSE_VARIABLES.destinatario.map((v) => (
                                <button
                                  key={v.tag}
                                  type="button"
                                  onClick={() => {
                                    setSubject(subject + v.tag)
                                    setOpenSubjectDropdown(null)
                                  }}
                                  className="block w-full text-left text-xs px-3 py-1.5 hover:bg-blue-50 transition-all border-b border-slate-100 last:border-b-0 text-blue-700"
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* EMISOR Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenSubjectDropdown(openSubjectDropdown === "emisor" ? null : "emisor")}
                            className="text-xs font-semibold px-2 py-2 rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all whitespace-nowrap"
                          >
                            EMI
                          </button>
                          {openSubjectDropdown === "emisor" && (
                            <div className="absolute top-full mt-1 right-0 bg-white border border-slate-300 rounded shadow-lg z-10 min-w-max">
                              {PULSE_VARIABLES.emisor.map((v) => (
                                <button
                                  key={v.tag}
                                  type="button"
                                  onClick={() => {
                                    setSubject(subject + v.tag)
                                    setOpenSubjectDropdown(null)
                                  }}
                                  className="block w-full text-left text-xs px-3 py-1.5 hover:bg-green-50 transition-all border-b border-slate-100 last:border-b-0 text-green-700"
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MENSAJE */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-900">Mensaje *</label>
                    <SafeEditor
                      value={message}
                      onChange={setMessage}
                      placeholder="Escribe tu mensaje aquí..."
                      onAddImage={(url) => setMessage(message + `\n[IMG]${url}[/IMG]`)}
                    />
                  </div>

                  {/* ADJUNTOS */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-900">Adjuntos (Opcional)</label>

                    {/* Mostrar adjuntos cargados del template */}
                    {selectedAttachments.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-3">Adjuntos del template:</p>
                        <div className="space-y-2">
                          {selectedAttachments.map((attachment: any) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between bg-white border border-blue-100 rounded p-3"
                            >
                              <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4 text-blue-600" />
                                <div className="text-sm">
                                  <p className="font-medium text-slate-900">{attachment.file_name}</p>
                                  <p className="text-xs text-slate-500">
                                    {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(2)} KB` : "Tamaño desconocido"}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={attachment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Ver
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dropzone para agregar más adjuntos */}
                    <FileUpload
                      maxSizeMB={10}
                      allowedFileTypes={["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "jpg", "jpeg", "png", "gif", "zip"]}
                      onUpload={async (file: File) => {
                        try {
                          // Crear objeto con información del archivo
                          const newAttachment = {
                            id: Date.now().toString(),
                            file_name: file.name,
                            file_size: file.size,
                            file_url: URL.createObjectURL(file),
                            file_path: file.name,
                            file: file, // Guardar el archivo para enviarlo después
                            is_new: true,
                          }
                          setNewAttachments([...newAttachments, newAttachment])
                          toast({
                            description: `Archivo "${file.name}" agregado exitosamente`,
                          })
                        } catch (error) {
                          toast({
                            description: "Error al agregar el archivo",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-white">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Arrastra archivos aquí o haz clic para seleccionar</p>
                        <p className="text-xs text-slate-500 mt-1">Máximo 10MB por archivo</p>
                      </div>
                    </FileUpload>

                    {/* Mostrar adjuntos nuevos agregados */}
                    {newAttachments.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <p className="text-sm font-semibold text-green-900 mb-3">Adjuntos agregados:</p>
                        <div className="space-y-2">
                          {newAttachments.map((attachment: any) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between bg-white border border-green-100 rounded p-3"
                            >
                              <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4 text-green-600" />
                                <div className="text-sm">
                                  <p className="font-medium text-slate-900">{attachment.file_name}</p>
                                  <p className="text-xs text-slate-500">
                                    {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(2)} KB` : "Tamaño desconocido"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewAttachments(newAttachments.filter((a: any) => a.id !== attachment.id))
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PROGRAMACIÓN */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-900">Fecha (Opcional)</label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="h-10 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-900">Hora (Opcional)</label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="h-10 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* COLUMNA DERECHA (40%) - PREVIEW */}
            <div className="w-2/5 bg-slate-50 border-l border-slate-200 p-8 overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  <h3 className="text-sm font-bold text-slate-900">Previsualización</h3>

                  {channel === "email" && (
                    <Card className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <div className="p-4 space-y-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-slate-600">De:</p>
                          <p className="font-semibold text-slate-900">{userInfo?.email || "noreply@scaleup.com"}</p>
                        </div>
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs font-semibold text-slate-600">Para:</p>
                          <p className="font-semibold text-slate-900 break-words">{toEmails.join(", ") || "(sin destinatarios)"}</p>
                        </div>
                        {ccEmails.length > 0 && (
                          <div className="border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold text-slate-600">CC:</p>
                            <p className="font-semibold text-slate-900 break-words">{ccEmails.join(", ")}</p>
                          </div>
                        )}
                        {bccEmails.length > 0 && (
                          <div className="border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold text-slate-600">BCC:</p>
                            <p className="font-semibold text-slate-900 break-words">{bccEmails.join(", ")}</p>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs font-semibold text-slate-600">Asunto:</p>
                          <p className="font-semibold text-slate-900 break-words">{previewSubject || "(sin asunto)"}</p>
                        </div>
                        <div className="border-t border-slate-200 pt-3">
                          <div className="bg-slate-50 border border-slate-200 rounded p-3 min-h-32 text-xs text-slate-700 whitespace-pre-wrap break-words space-y-1">
                            {renderFormattedContent(message, variableValues) || "(mensaje vacío)"}
                          </div>
                        </div>
                        {selectedAttachments.length > 0 && (
                          <div className="border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold text-slate-600">Adjuntos:</p>
                            <div className="mt-2 space-y-1">
                              {selectedAttachments.map((attachment: any) => (
                                <div key={attachment.id} className="text-xs text-slate-600 flex items-center gap-2">
                                  <span className="w-4 h-4">📎</span>
                                  <span>{attachment.file_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {channel === "whatsapp" && (
                    <Card className="bg-green-50 border border-green-200 rounded-lg overflow-hidden p-4">
                      <div className="space-y-2">
                        <div className="bg-green-500 rounded-lg p-3 max-w-xs ml-auto text-sm text-white break-words font-medium">
                          {renderFormattedContent(message, variableValues) || "(mensaje vacío)"}
                          <div className="flex justify-end items-center gap-1 mt-2">
                            <p className="text-xs text-green-100">{new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                            <svg className="h-4 w-4 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* FOOTER CON BOTONES */}
          <div className="border-t border-slate-200 bg-white px-8 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {sending ? "Enviando..." : "Enviar"}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para conectar email personal */}
      <Dialog open={showConnectEmailModal} onOpenChange={setShowConnectEmailModal}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Conectar Email Personal</h2>
              <p className="text-sm text-slate-600 mt-1">
                Para enviar desde tu cuenta personal, primero necesitas conectar tu email.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-3">Selecciona tu proveedor de email:</p>
              <div className="space-y-2">
                <button
                  onClick={() => handleConnectEmail("google")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-xs font-bold">
                    G
                  </div>
                  <span className="font-semibold text-slate-900">Gmail</span>
                </button>
                <button
                  onClick={() => handleConnectEmail("outlook")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-xs font-bold text-white">
                    O
                  </div>
                  <span className="font-semibold text-slate-900">Outlook</span>
                </button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowConnectEmailModal(false)}
              className="w-full border-slate-300"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
