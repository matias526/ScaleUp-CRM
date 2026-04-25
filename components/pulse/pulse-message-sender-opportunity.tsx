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
import { toast } from "@/components/ui/use-toast"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"
import SafeEditor from "@/components/pulse/safe-editor"

// Función para renderizar el contenido con tags [B], [I], [U] y variables
const renderFormattedContent = (content: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let componentCounter = 0

  // Regex para procesar [B], [I], [U] y {{variables}}
  const regex = /\[B\](.*?)\[\/B\]|\[I\](.*?)\[\/I\]|\[U\](.*?)\[\/U\]|\{\{([^}]*)\}\}/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const elementKey = `elem-${componentCounter++}`

    // Agregar texto plano antes del match
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      // [B]text[/B]
      parts.push(
        <strong key={elementKey} className="font-bold">
          {match[1]}
        </strong>
      )
    } else if (match[2] !== undefined) {
      // [I]text[/I]
      parts.push(
        <em key={elementKey} className="italic">
          {match[2]}
        </em>
      )
    } else if (match[3] !== undefined) {
      // [U]text[/U]
      parts.push(
        <u key={elementKey} className="underline">
          {match[3]}
        </u>
      )
    } else if (match[4] !== undefined) {
      // {{variable}}
      const variableName = match[4]
      parts.push(
        <span
          key={elementKey}
          className="bg-blue-100 text-blue-700 px-1 rounded font-mono text-xs whitespace-nowrap"
          title="Campo dinámico que se reemplazará al enviar"
        >
          {"{{" + variableName + "}}"}
        </span>
      )
    }

    lastIndex = regex.lastIndex
  }

  // Agregar texto restante
  if (lastIndex < content.length) {
    const remaining = content.substring(lastIndex)
    if (remaining) {
      parts.push(remaining)
    }
  }

  return parts.length > 0 ? parts : [content]
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
  opportunity: Opportunity
  techCompanyId?: string
  contacts: Contact[]
  endCustomer?: EndCustomer
  templates: any[]
  isOpen: boolean
  onClose: () => void
}

export function PulseMessageSenderOpportunity({
  opportunity,
  techCompanyId,
  contacts,
  endCustomer,
  isOpen,
  onClose,
}: PulseMessageSenderOpportunityProps) {
  const { user } = useAuth()
  const { language } = useTranslations(DICT_LANG_CONTACTS)
  const [channel, setChannel] = useState<"email" | "whatsapp">("email")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [toEmails, setToEmails] = useState<string[]>([])
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [bccEmails, setBccEmails] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sendMode, setSendMode] = useState<"individual" | "group">("group")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [sending, setSending] = useState(false)
  const [loadedTemplates, setLoadedTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([])
  const [recipients, setRecipients] = useState<any[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [manualEmail, setManualEmail] = useState("")
  const [recipientType, setRecipientType] = useState<"to" | "cc" | "bcc">("to")

  // Cargar templates y recipients al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      loadRecipients()
    }
  }, [isOpen])

  // Función para cargar recipients (users de tech_company + admins/BDD + contactos)
  const loadRecipients = async () => {
    if (!techCompanyId || !opportunity.id) return

    try {
      setRecipientsLoading(true)
      const response = await fetch(
        `/api/pulse/recipients?techCompanyId=${techCompanyId}&opportunityId=${opportunity.id}`
      )
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

  const variableValues = useMemo(() => {
    const firstContact = contacts[0]
    return {
      contact_name: firstContact?.name || "",
      contact_email: firstContact?.email || "",
      contact_phone: firstContact?.phone || "",
      contact_position: firstContact?.position || "",
      company_name: endCustomer?.name || "",
      company_industry: endCustomer?.industry || "",
      company_city: endCustomer?.city || "",
      company_country: endCustomer?.country || "",
      opportunity_name: opportunity?.name || "",
      opportunity_stage: opportunity?.stage || "",
      opportunity_value: opportunity?.value || "",
      opportunity_probability: opportunity?.probability || "",
      opportunity_description: opportunity?.description || "",
      user_name: user ? `${user.first_name} ${user.last_name}` : "",
      user_email: user?.email || "",
      today_date: new Date().toLocaleDateString("es-ES"),
      current_time: new Date().toLocaleTimeString("es-ES"),
    }
  }, [contacts, endCustomer, opportunity, user])

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
          setSubject(translation.subject || "")
          setMessage(translation.body_content || "")
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
        addEmailToGroup(contact.email)
      }
    } else if (value.startsWith("user-")) {
      // Es un user de la tech_company o admin
      const userId = value.replace("user-", "")
      const userRecipient = recipients.find((r) => r.id === userId)
      if (userRecipient && userRecipient.email) {
        addEmailToGroup(userRecipient.email)
      }
    }
  }

  const addEmailToGroup = (email: string) => {
    if (recipientType === "to" && !toEmails.includes(email)) {
      setToEmails([...toEmails, email])
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
  }

  const handleRemoveCcEmail = (email: string) => {
    setCcEmails(ccEmails.filter((e) => e !== email))
  }

  const handleRemoveBccEmail = (email: string) => {
    setBccEmails(bccEmails.filter((e) => e !== email))
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        description: "Asunto y mensaje son requeridos",
        variant: "destructive",
      })
      return
    }

    if (toEmails.length === 0) {
      toast({
        description: "Debe seleccionar al menos un destinatario",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      await sendPulseMessage({
        template_id: selectedTemplate,
        opportunity_id: opportunity.id,
        channel,
        to_emails: toEmails,
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
        subject,
        body_content: message,
        send_mode: sendMode,
        schedule_date: scheduleDate ? new Date(scheduleDate) : null,
        schedule_time: scheduleTime,
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
                {/* CANAL Y TEMPLATE - GRID 2 COL */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-900">Canal *</label>
                    <Select value={channel} onValueChange={(val) => setChannel(val as any)}>
                      <SelectTrigger className="h-10 border border-slate-300 rounded-lg text-sm">
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

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-900">Template (Opcional)</label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="h-10 border border-slate-300 rounded-lg text-sm">
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

                {/* DESTINATARIOS */}
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <label className="block text-sm font-bold text-slate-900">Destinatarios *</label>

                  {/* Botones para seleccionar To/CC/BCC */}
                  <div className="flex gap-2 border-b border-slate-200 pb-3">
                    <button
                      type="button"
                      onClick={() => setRecipientType("to")}
                      className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                        recipientType === "to"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Para (To)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("cc")}
                      className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                        recipientType === "cc"
                          ? "bg-amber-600 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      CC
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("bcc")}
                      className={`px-3 py-2 rounded text-sm font-semibold transition-all ${
                        recipientType === "bcc"
                          ? "bg-slate-600 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      BCC
                    </button>
                  </div>

                  {/* Select de opciones disponibles */}
                  <Select onValueChange={handleAddContact}>
                    <SelectTrigger className="h-10 border border-slate-300 rounded-lg text-sm bg-white">
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
                      className="h-10 border border-slate-300 rounded-lg text-sm flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddManualEmail}
                      className="h-10 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg text-sm"
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

                {/* MODO DE ENVÍO */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-900">Modo de Envío *</label>
                  <Select value={sendMode} onValueChange={(val) => setSendMode(val as any)}>
                    <SelectTrigger className="h-10 border border-slate-300 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Un email grupal (To/CC/BCC)</SelectItem>
                      <SelectItem value="individual">Emails individuales (uno a uno)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ASUNTO */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-900">Asunto *</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ej: Propuesta especial para {{company_name}}"
                    className="h-10 border border-slate-300 rounded-lg text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {["contact_name", "company_name", "opportunity_name"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSubject(subject + `{{${v}}}`)}
                        className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded border border-slate-300 transition-all"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MENSAJE */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-900">Mensaje *</label>
                  <SafeEditor
                    value={message}
                    onChange={setMessage}
                    placeholder="Escribe tu mensaje aquí..."
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
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-white">
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Arrastra archivos aquí o haz clic para seleccionar</p>
                    <p className="text-xs text-slate-500 mt-1">Máximo 10MB por archivo</p>
                  </div>
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
                        <p className="font-semibold text-slate-900">{user?.email || "noreply@scaleup.com"}</p>
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
                          {renderFormattedContent(previewMessage) || "(mensaje vacío)"}
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
                        {renderFormattedContent(previewMessage) || "(mensaje vacío)"}
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
  )
}
