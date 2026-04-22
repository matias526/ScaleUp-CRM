"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Loader2, Calendar, Mail, Phone, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { sendPulseMessage, PulseMessageRecipient } from "@/lib/services/pulse-message-service"
import { replaceVariables, VariableValues, PULSE_MESSAGE_VARIABLES } from "@/lib/pulse/pulse-message-variables"
import { useAuth } from "@/components/auth/auth-provider"

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

interface PulseMessageSenderProps {
  opportunity: Opportunity
  contacts: Contact[]
  endCustomer?: EndCustomer
  templates: Array<{
    id: string
    internal_code: string
    translations: Array<{
      language_code: string
      display_name: string
      subject: string
      body_content: string
    }>
  }>
  isOpen: boolean
  onClose: () => void
}

export function PulseMessageSenderOpportunity({
  opportunity,
  contacts,
  endCustomer,
  templates,
  isOpen,
  onClose,
}: PulseMessageSenderProps) {
  const { user } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [sendMode, setSendMode] = useState<"individual" | "group">("individual")
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [toEmails, setToEmails] = useState<string[]>([])
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [bccEmails, setBccEmails] = useState<string[]>([])
  const [subject, setSubject] = useState<string>("")
  const [bodyContent, setBodyContent] = useState<string>("")
  const [scheduledAt, setScheduledAt] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const currentTemplate = useMemo(() => {
    if (!selectedTemplate) return null
    return templates.find((t) => t.id === selectedTemplate)
  }, [selectedTemplate, templates])

  // Obtener valores de variables del contexto
  const variableValues: VariableValues = useMemo(() => {
    return {
      contact_name: selectedContacts.size === 1 ? contacts.find((c) => selectedContacts.has(c.id))?.name || "" : "",
      contact_email: selectedContacts.size === 1 ? contacts.find((c) => selectedContacts.has(c.id))?.email || "" : "",
      contact_phone: selectedContacts.size === 1 ? contacts.find((c) => selectedContacts.has(c.id))?.phone || "" : "",
      contact_position: selectedContacts.size === 1 ? contacts.find((c) => selectedContacts.has(c.id))?.position || "" : "",
      company_name: endCustomer?.name || "",
      company_industry: endCustomer?.industry || "",
      company_city: endCustomer?.city || "",
      company_country: endCustomer?.country || "",
      opportunity_name: opportunity.name || "",
      opportunity_stage: opportunity.stage || "",
      opportunity_value: opportunity.value || "",
      opportunity_probability: opportunity.probability || "",
      opportunity_description: opportunity.description || "",
      user_name: user ? `${user.first_name} ${user.last_name}` : "",
      user_email: user?.email || "",
      today_date: new Date().toLocaleDateString("es-ES"),
      current_time: new Date().toLocaleTimeString("es-ES"),
    }
  }, [selectedContacts, contacts, endCustomer, opportunity, user])

  // Vista previa renderizada
  const previewSubject = useMemo(() => replaceVariables(subject, variableValues), [subject, variableValues])
  const previewBody = useMemo(() => replaceVariables(bodyContent, variableValues), [bodyContent, variableValues])

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      // Obtener traducción en español
      const esTrans = template.translations.find((t) => t.language_code === "es")
      if (esTrans) {
        setSubject(esTrans.subject)
        setBodyContent(esTrans.body_content)
      }
    }
  }

  const handleToggleContact = (contactId: string) => {
    const newSelection = new Set(selectedContacts)
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId)
    } else {
      newSelection.add(contactId)
    }
    setSelectedContacts(newSelection)

    // Actualizar emails según modo
    if (sendMode === "group") {
      const selectedContactsArray = contacts.filter((c) => newSelection.has(c.id))
      setToEmails(selectedContactsArray.map((c) => c.email))
    }
  }

  const handleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set())
      if (sendMode === "group") {
        setToEmails([])
      }
    } else {
      setSelectedContacts(new Set(contacts.map((c) => c.id)))
      if (sendMode === "group") {
        setToEmails(contacts.map((c) => c.email))
      }
    }
  }

  const handleSendMode = (mode: "individual" | "group") => {
    setSendMode(mode)
    if (mode === "group" && selectedContacts.size > 0) {
      setToEmails(contacts.filter((c) => selectedContacts.has(c.id)).map((c) => c.email))
    }
  }

  const handleSend = async () => {
    // Validaciones
    if (!selectedTemplate) {
      toast({ title: "Error", description: "Selecciona un template", variant: "destructive" })
      return
    }

    if (selectedContacts.size === 0) {
      toast({ title: "Error", description: "Selecciona al menos un contacto", variant: "destructive" })
      return
    }

    if (!subject.trim()) {
      toast({ title: "Error", description: "El asunto no puede estar vacío", variant: "destructive" })
      return
    }

    if (!bodyContent.trim()) {
      toast({ title: "Error", description: "El contenido no puede estar vacío", variant: "destructive" })
      return
    }

    if (sendMode === "group" && toEmails.length === 0) {
      toast({ title: "Error", description: "Agrega al menos un email en 'Para'", variant: "destructive" })
      return
    }

    if (scheduledAt && new Date(scheduledAt) < new Date()) {
      toast({ title: "Error", description: "La fecha programada debe ser en el futuro", variant: "destructive" })
      return
    }

    try {
      setLoading(true)

      const recipients: PulseMessageRecipient[] = contacts
        .filter((c) => selectedContacts.has(c.id))
        .map((c) => ({
          contact_id: c.id,
          email: c.email,
          name: c.name,
        }))

      await sendPulseMessage({
        template_id: selectedTemplate,
        opportunity_id: opportunity.id,
        user_id: user!.id,
        recipients,
        send_mode: sendMode,
        to_emails: toEmails,
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
        subject,
        body_content: bodyContent,
        variables_values: variableValues,
        scheduled_at: scheduledAt || null,
      })

      toast({
        title: "Éxito",
        description: scheduledAt ? "Mensaje programado correctamente" : "Mensaje enviado correctamente",
      })

      onClose()
    } catch (error) {
      console.error("[v0] Error al enviar mensaje:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Mensaje - {opportunity.name}</DialogTitle>
          <DialogDescription>Selecciona un template, contactos y configura el envío</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PASO 1: SELECCIONAR TEMPLATE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Selecciona un Template</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => {
                    const esTrans = template.translations.find((t) => t.language_code === "es")
                    return (
                      <SelectItem key={template.id} value={template.id}>
                        {esTrans?.display_name || template.internal_code}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* PASO 2: SELECCIONAR CONTACTOS */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">2. Selecciona Contactos</CardTitle>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedContacts.size === contacts.length ? "Deseleccionar Todo" : "Seleccionar Todo"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {contacts.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay contactos en esta oportunidad</p>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={() => handleToggleContact(contact.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-600 mt-2">{selectedContacts.size} contacto(s) seleccionado(s)</p>
            </CardContent>
          </Card>

          {/* PASO 3: MODO DE ENVÍO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">3. Modo de Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={sendMode === "individual" ? "default" : "outline"}
                  onClick={() => handleSendMode("individual")}
                  className="flex-1"
                >
                  Uno a Uno
                </Button>
                <Button
                  variant={sendMode === "group" ? "default" : "outline"}
                  onClick={() => handleSendMode("group")}
                  className="flex-1"
                >
                  Grupal (To/CC/BCC)
                </Button>
              </div>

              {sendMode === "group" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Para (To)</Label>
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1">
                      {toEmails.length > 0 ? toEmails.join(", ") : "Selecciona contactos arriba"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">CC (opcional)</Label>
                    <Input
                      placeholder="email1@example.com, email2@example.com"
                      value={ccEmails.join(", ")}
                      onChange={(e) => setCcEmails(e.target.value.split(",").map((e) => e.trim()))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">BCC (opcional)</Label>
                    <Input
                      placeholder="email1@example.com, email2@example.com"
                      value={bccEmails.join(", ")}
                      onChange={(e) => setBccEmails(e.target.value.split(",").map((e) => e.trim()))}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PASO 4: CONTENIDO DEL MENSAJE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">4. Contenido del Mensaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Asunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto del mensaje" />
              </div>
              <div>
                <Label className="text-xs">Contenido</Label>
                <Textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  placeholder="Contenido del mensaje"
                  className="min-h-32"
                />
              </div>

              {/* Variables disponibles */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs font-semibold mb-2 text-slate-700">Variables disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {PULSE_MESSAGE_VARIABLES.map((variable) => (
                    <Badge
                      key={variable.tag}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-slate-200"
                      onClick={() => {
                        setBodyContent(bodyContent + ` ${variable.tag}`)
                      }}
                    >
                      {variable.tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PASO 5: PROGRAMACIÓN */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">5. Programación (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-xs">Enviar en fecha/hora específica</Label>
                <div className="flex gap-2 mt-2">
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                  {scheduledAt && (
                    <Button variant="ghost" size="sm" onClick={() => setScheduledAt("")}>
                      Limpiar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Si no especificas fecha, el mensaje se enviará inmediatamente
                </p>
              </div>
            </CardContent>
          </Card>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? "Ocultar" : "Ver"} Preview
            </Button>
            <Button onClick={handleSend} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {scheduledAt ? "Programar" : "Enviar"}
            </Button>
          </div>
        </div>

        {/* PREVIEW */}
        {showPreview && (
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-900">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Asunto:</p>
                <p className="text-sm bg-white p-2 rounded border">{previewSubject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Contenido:</p>
                <div className="text-sm bg-white p-3 rounded border whitespace-pre-wrap">{previewBody}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
