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
import { Send, Loader2, X, Paperclip, AlertCircle } from "lucide-react"
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
    name: string
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
  const [channel, setChannel] = useState("email")
  const [sender, setSender] = useState("personal")
  const [toContacts, setToContacts] = useState<Set<string>>(new Set())
  const [ccContacts, setCcContacts] = useState<Set<string>>(new Set())
  const [bccContacts, setBccContacts] = useState<Set<string>>(new Set())
  const [sendIndividual, setSendIndividual] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [scheduledFor, setScheduledFor] = useState("")

  // Obtener valores de variables del contexto
  const variableValues: VariableValues = useMemo(() => {
    const firstToContact = toContacts.size === 1 ? contacts.find((c) => toContacts.has(c.id)) : null
    return {
      contact_name: firstToContact?.name || "",
      contact_email: firstToContact?.email || "",
      contact_phone: firstToContact?.phone || "",
      contact_position: firstToContact?.position || "",
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
  }, [toContacts, contacts, endCustomer, opportunity, user])

  // Renderizar preview con variables reemplazadas
  const previewMessage = useMemo(() => {
    return replaceVariables(message, variableValues)
  }, [message, variableValues])

  const previewSubject = useMemo(() => {
    return replaceVariables(subject, variableValues)
  }, [subject, variableValues])

  const handleSend = async () => {
    if (toContacts.size === 0) {
      toast.error("Selecciona al menos un contacto en 'Para'")
      return
    }

    setLoading(true)
    try {
      const recipients: PulseMessageRecipient[] = Array.from(toContacts).map((contactId) => ({
        type: "to",
        email: contacts.find((c) => c.id === contactId)?.email || "",
      }))

      recipients.push(
        ...Array.from(ccContacts).map((contactId) => ({
          type: "cc" as const,
          email: contacts.find((c) => c.id === contactId)?.email || "",
        }))
      )

      recipients.push(
        ...Array.from(bccContacts).map((contactId) => ({
          type: "bcc" as const,
          email: contacts.find((c) => c.id === contactId)?.email || "",
        }))
      )

      await sendPulseMessage({
        template_id: selectedTemplate,
        channel: channel as "email" | "whatsapp",
        send_mode: sendIndividual ? "individual" : "group",
        recipients,
        subject,
        body: message,
        scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
        attachments: attachments.map((f) => f.name),
      })

      toast.success("Mensaje enviado correctamente")
      onClose()
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast.error(error instanceof Error ? error.message : "Error al enviar mensaje")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleContact = (contactId: string, type: "to" | "cc" | "bcc") => {
    if (type === "to") {
      setToContacts((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(contactId)) newSet.delete(contactId)
        else newSet.add(contactId)
        return newSet
      })
    } else if (type === "cc") {
      setCcContacts((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(contactId)) newSet.delete(contactId)
        else newSet.add(contactId)
        return newSet
      })
    } else {
      setBccContacts((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(contactId)) newSet.delete(contactId)
        else newSet.add(contactId)
        return newSet
      })
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4 space-y-2">
          <DialogTitle className="text-xl">Enviar Comunicación</DialogTitle>
          <DialogDescription>Configura y previsualiza tu mensaje antes de enviar.</DialogDescription>
        </DialogHeader>

        {/* Main Content - Two Columns */}
        <div className="flex-1 overflow-hidden flex">
          {/* COLUMNA 1: CONFIGURACIÓN (45%) */}
          <div className="w-[45%] border-r overflow-y-auto p-6 space-y-6">
            {/* 1. CANAL Y REMITENTE */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-700 mb-3">Canal y Remitente</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs mb-2 block">Canal</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs mb-2 block">Remitente</Label>
                  <Select value={sender} onValueChange={setSender}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. DESTINATARIOS */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-700 mb-3">Destinatarios</h3>
              <div className="space-y-3">
                {/* Para */}
                <div>
                  <Label className="text-xs mb-2 block">Para</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded bg-slate-50 min-h-9">
                    {Array.from(toContacts).map((cId) => {
                      const contact = contacts.find((c) => c.id === cId)
                      return (
                        <Badge key={cId} variant="secondary" className="flex items-center gap-1">
                          {contact?.name}
                          <button onClick={() => toggleContact(cId, "to")} className="hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                    <Select value="" onValueChange={(val) => toggleContact(val, "to")}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue placeholder="+ Agregar" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts
                          .filter((c) => !toContacts.has(c.id) && !ccContacts.has(c.id) && !bccContacts.has(c.id))
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* CC */}
                <div>
                  <Label className="text-xs mb-2 block">CC</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded bg-slate-50 min-h-9">
                    {Array.from(ccContacts).map((cId) => {
                      const contact = contacts.find((c) => c.id === cId)
                      return (
                        <Badge key={cId} variant="secondary" className="flex items-center gap-1">
                          {contact?.name}
                          <button onClick={() => toggleContact(cId, "cc")} className="hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                    <Select value="" onValueChange={(val) => toggleContact(val, "cc")}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue placeholder="+ Agregar" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts
                          .filter((c) => !toContacts.has(c.id) && !ccContacts.has(c.id) && !bccContacts.has(c.id))
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* BCC */}
                <div>
                  <Label className="text-xs mb-2 block">BCC</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded bg-slate-50 min-h-9">
                    {Array.from(bccContacts).map((cId) => {
                      const contact = contacts.find((c) => c.id === cId)
                      return (
                        <Badge key={cId} variant="secondary" className="flex items-center gap-1">
                          {contact?.name}
                          <button onClick={() => toggleContact(cId, "bcc")} className="hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                    <Select value="" onValueChange={(val) => toggleContact(val, "bcc")}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue placeholder="+ Agregar" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts
                          .filter((c) => !toContacts.has(c.id) && !ccContacts.has(c.id) && !bccContacts.has(c.id))
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Envío Individual */}
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox id="individual" checked={sendIndividual} onCheckedChange={setSendIndividual} />
                  <Label htmlFor="individual" className="text-xs cursor-pointer">
                    Envío Individual (uno por uno)
                  </Label>
                </div>
              </div>
            </div>

            {/* 3. CONTENIDO DEL MENSAJE */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-700 mb-3">Contenido del Mensaje</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-2 block">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Elegir template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Asunto</Label>
                  <Input
                    placeholder="Asunto del email..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Mensaje</Label>
                  <Textarea
                    placeholder="Escribe tu mensaje aquí..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-32 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Usa variables disponibles: {PULSE_MESSAGE_VARIABLES.slice(0, 3).map((v) => v.tag).join(", ")}...
                  </p>
                </div>
              </div>
            </div>

            {/* 4. ADJUNTOS */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-700 mb-3">Adjuntos</h3>
              <div className="border-2 border-dashed rounded-lg p-4 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Paperclip className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-600">Arrastra archivos aquí o haz clic</span>
                </Label>
              </div>
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Programación */}
            <div>
              <Label className="text-xs mb-2 block">Programar Envío (Opcional)</Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* COLUMNA 2: PREVISUALIZACIÓN (55%) */}
          <div className="w-[55%] bg-slate-50 border-l overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-700 mb-3">Vista Previa del Mensaje</h3>
                <Card className="bg-white">
                  <CardContent className="p-4 space-y-3 text-sm">
                    {/* From */}
                    <div className="border-b pb-3">
                      <p className="text-xs text-slate-500 font-medium">De:</p>
                      <p className="text-slate-900">
                        {sender === "personal" ? user?.email : "sistema@scaleup.com"}
                      </p>
                    </div>

                    {/* To */}
                    <div className="border-b pb-3">
                      <p className="text-xs text-slate-500 font-medium">Para:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(toContacts)
                          .map((cId) => contacts.find((c) => c.id === cId)?.email)
                          .join(", ") || "No seleccionado"}
                      </div>
                    </div>

                    {/* CC/BCC */}
                    {(ccContacts.size > 0 || bccContacts.size > 0) && (
                      <div className="border-b pb-3">
                        {ccContacts.size > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 font-medium">CC:</p>
                            <p>
                              {Array.from(ccContacts)
                                .map((cId) => contacts.find((c) => c.id === cId)?.email)
                                .join(", ")}
                            </p>
                          </div>
                        )}
                        {bccContacts.size > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 font-medium">BCC:</p>
                            <p>
                              {Array.from(bccContacts)
                                .map((cId) => contacts.find((c) => c.id === cId)?.email)
                                .join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subject */}
                    <div className="border-b pb-3">
                      <p className="text-xs text-slate-500 font-medium">Asunto:</p>
                      <p className="font-medium text-slate-900">{previewSubject || "(sin asunto)"}</p>
                    </div>

                    {/* Message Body */}
                    <div className="border-b pb-3">
                      <p className="text-xs text-slate-500 font-medium mb-2">Mensaje:</p>
                      <div className="prose prose-sm max-w-none text-slate-900 whitespace-pre-wrap leading-relaxed">
                        {previewMessage || "(mensaje vacío)"}
                      </div>
                    </div>

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-2">Adjuntos:</p>
                        <div className="space-y-1">
                          {attachments.map((file, idx) => (
                            <p key={idx} className="text-xs text-slate-700 flex items-center gap-1">
                              <Paperclip className="h-3 w-3" /> {file.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Badge */}
                <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900">
                    Las variables se reemplazan dinámicamente en esta vista previa y aparecen en negrita en el mensaje enviado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={() => {}}>
            Guardar como Nuevo Template
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || toContacts.size === 0}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar Mensaje
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
