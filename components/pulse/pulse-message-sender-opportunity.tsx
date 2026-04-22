"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Upload, Mail, MessageCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { sendPulseMessage } from "@/lib/services/pulse-message-service"
import { toast } from "@/components/ui/use-toast"

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
  contacts: Contact[]
  endCustomer?: EndCustomer
  templates: any[]
  isOpen: boolean
  onClose: () => void
}

export function PulseMessageSenderOpportunity({
  opportunity,
  contacts,
  endCustomer,
  isOpen,
  onClose,
}: PulseMessageSenderOpportunityProps) {
  const { user } = useAuth()
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

  // Valores de variables para preview
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

  // Reemplazar variables en el mensaje
  const previewMessage = useMemo(() => {
    let result = message
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      result = result.replace(regex, String(value))
    })
    return result
  }, [message, variableValues])

  const previewSubject = useMemo(() => {
    let result = subject
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      result = result.replace(regex, String(value))
    })
    return result
  }, [subject, variableValues])

  const handleAddContact = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    if (contact && !toEmails.includes(contact.email)) {
      setToEmails([...toEmails, contact.email])
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
        {/* HEADER CON FONDO AZUL - ESTILO SCALEUP */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold text-white">Enviar Mensaje</DialogTitle>
            <p className="text-sm text-blue-100">{opportunity.name}</p>
          </DialogHeader>
        </div>

        {/* CONTENIDO PRINCIPAL - DOS COLUMNAS */}
        <div className="flex flex-1 overflow-hidden">
          {/* COLUMNA IZQUIERDA (60%) - CONFIGURACIÓN */}
          <div className="w-3/5 border-r border-slate-200 overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-4">
                {/* CANAL Y REMITENTE */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Canal</label>
                  <Select value={channel} onValueChange={(val) => setChannel(val as any)}>
                    <SelectTrigger className="h-9 border-slate-300 rounded-md">
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

                {/* TEMPLATE SELECTOR */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Template (Opcional)</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-9 border-slate-300 rounded-md">
                      <SelectValue placeholder="Seleccionar template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* DESTINATARIOS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Destinatarios</label>

                  {/* Agregar contacto */}
                  <Select onValueChange={handleAddContact}>
                    <SelectTrigger className="h-9 border-slate-300 rounded-md">
                      <SelectValue placeholder="+ Agregar contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} ({contact.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Para - Chips */}
                  {toEmails.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 font-medium">Para:</p>
                      <div className="flex flex-wrap gap-2">
                        {toEmails.map((email) => (
                          <Badge key={email} className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-medium">
                            {email}
                            <button
                              onClick={() => handleRemoveFromEmail(email)}
                              className="ml-1.5 hover:opacity-70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CC - Chips */}
                  {ccEmails.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 font-medium">CC:</p>
                      <div className="flex flex-wrap gap-2">
                        {ccEmails.map((email) => (
                          <Badge key={email} className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-medium">
                            {email}
                            <button
                              onClick={() => handleRemoveCcEmail(email)}
                              className="ml-1.5 hover:opacity-70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BCC - Chips */}
                  {bccEmails.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 font-medium">BCC:</p>
                      <div className="flex flex-wrap gap-2">
                        {bccEmails.map((email) => (
                          <Badge key={email} className="bg-slate-100 text-slate-800 hover:bg-slate-100 text-xs font-medium">
                            {email}
                            <button
                              onClick={() => handleRemoveBccEmail(email)}
                              className="ml-1.5 hover:opacity-70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* MODO DE ENVÍO */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Modo de Envío</label>
                  <Select value={sendMode} onValueChange={(val) => setSendMode(val as any)}>
                    <SelectTrigger className="h-9 border-slate-300 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Un email grupal (To/CC/BCC)</SelectItem>
                      <SelectItem value="individual">Emails individuales (uno a uno)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CONTENIDO */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Asunto</label>
                  <div className="flex justify-between items-end gap-2 mb-2">
                    <div className="flex-1" />
                    <div className="flex gap-1 flex-wrap justify-end">
                      {["contact_name", "company_name", "opportunity_name"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSubject(subject + `{{${v}}}`)}
                          className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-all"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ej: Propuesta especial para {{company_name}}"
                    className="h-9 border-slate-300 rounded-md text-sm"
                  />
                </div>

                {/* MENSAJE */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mensaje</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="w-full h-32 p-3 border border-slate-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* ADJUNTOS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Adjuntos (Opcional)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                    <Upload className="h-5 w-5 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">Arrastra archivos o haz clic para cargar</p>
                  </div>
                </div>

                {/* PROGRAMACIÓN */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha (Opcional)</label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="h-9 border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora (Opcional)</label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="h-9 border-slate-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* COLUMNA DERECHA (40%) - PREVIEW */}
          <div className="w-2/5 bg-slate-50 border-l border-slate-200 p-5 overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                <h3 className="text-sm font-semibold text-slate-900">Previsualización</h3>

                {/* PREVIEW EMAIL */}
                {channel === "email" && (
                  <Card className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">De:</p>
                        <p className="font-semibold text-slate-900">{user?.email || "noreply@scaleup.com"}</p>
                      </div>
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-500 font-medium">Para:</p>
                        <p className="font-semibold text-slate-900 break-words">{toEmails.join(", ") || "(sin destinatarios)"}</p>
                      </div>
                      {ccEmails.length > 0 && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs text-slate-500 font-medium">CC:</p>
                          <p className="font-semibold text-slate-900 break-words">{ccEmails.join(", ")}</p>
                        </div>
                      )}
                      {bccEmails.length > 0 && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs text-slate-500 font-medium">BCC:</p>
                          <p className="font-semibold text-slate-900 break-words">{bccEmails.join(", ")}</p>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-500 font-medium">Asunto:</p>
                        <p className="font-semibold text-slate-900 break-words">{previewSubject || "(sin asunto)"}</p>
                      </div>
                      <div className="border-t border-slate-200 pt-3">
                        <div className="bg-white border border-slate-200 rounded p-3 min-h-32">
                          <p className="text-xs text-slate-700 whitespace-pre-wrap break-words">{previewMessage || "(mensaje vacío)"}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* PREVIEW WHATSAPP */}
                {channel === "whatsapp" && (
                  <Card className="bg-green-50 border border-green-200 rounded-lg overflow-hidden p-4">
                    <div className="space-y-2">
                      <div className="bg-green-100 rounded-lg p-3 max-w-xs ml-auto">
                        <p className="text-sm text-slate-900 break-words">{previewMessage || "(mensaje vacío)"}</p>
                        <div className="flex justify-end items-center gap-1 mt-2">
                          <p className="text-xs text-slate-600">{new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
                          <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* INFO DE VARIABLES */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Variables Disponibles:</p>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p>• {`{{contact_name}}`} - Nombre del contacto</p>
                    <p>• {`{{company_name}}`} - Empresa</p>
                    <p>• {`{{opportunity_name}}`} - Nombre de la oportunidad</p>
                    <p>• {`{{user_name}}`} - Tu nombre</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* FOOTER CON BOTONES FIJOS */}
        <div className="border-t border-slate-200 bg-white px-6 py-3 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="h-9 rounded-md text-slate-700 border-slate-300">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || toEmails.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 rounded-md gap-2 disabled:opacity-50"
          >
            {sending ? (
              <>
                <span className="animate-spin">⏳</span> Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Mensaje
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
