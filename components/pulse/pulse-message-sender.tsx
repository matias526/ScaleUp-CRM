"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Search } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { sendPulseMessage } from "@/lib/services/pulse-message-service"
import { toast } from "@/components/ui/use-toast"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import SafeEditor from "@/components/pulse/safe-editor"
import { Textarea } from "@/components/ui/textarea"

interface Recipient {
  id: string
  name: string
  email: string
  type: "scaleup_user" | "tech_company_contact" | "partner_contact" | "prospect_contact"
}

interface PulseMessageSenderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RECIPIENT_TYPES = [
  { value: "all", label: "Todos" },
  { value: "scaleup_user", label: "Usuarios ScaleUp" },
  { value: "tech_company_contact", label: "Contactos TechCompanies" },
  { value: "partner_contact", label: "Contactos Partners" },
  { value: "prospect_contact", label: "Contactos Prospects" },
]

export function PulseMessageSender({ open, onOpenChange }: PulseMessageSenderProps) {
  const { userInfo } = useAuth()
  const { t } = useTranslations()
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [recipientType, setRecipientType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)

  // Cargar destinatarios según el tipo seleccionado
  useEffect(() => {
    if (open) {
      loadRecipients()
    }
  }, [open, recipientType, searchTerm])

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true)
      let newRecipients: Recipient[] = []

      // Usuarios ScaleUp
      if (recipientType === "all" || recipientType === "scaleup_user") {
        const { data: users } = await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .eq("is_active", true)
          .or(
            searchTerm
              ? `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
              : "",
          )

        if (users) {
          newRecipients.push(
            ...users.map((u) => ({
              id: `scaleup_${u.id}`,
              name: `${u.first_name} ${u.last_name}`,
              email: u.email,
              type: "scaleup_user" as const,
            })),
          )
        }
      }

      // Contactos de TechCompanies
      if (recipientType === "all" || recipientType === "tech_company_contact") {
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email, tech_company_id")
          .eq("tech_company_id", null)
          .eq("is_active", true)
          .or(
            searchTerm
              ? `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
              : "",
          )

        if (contacts) {
          newRecipients.push(
            ...contacts.map((c) => ({
              id: `tech_contact_${c.id}`,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              type: "tech_company_contact" as const,
            })),
          )
        }
      }

      // Contactos de Partners
      if (recipientType === "all" || recipientType === "partner_contact") {
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email, partner_id")
          .not("partner_id", "is", null)
          .eq("is_active", true)
          .or(
            searchTerm
              ? `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
              : "",
          )

        if (contacts) {
          newRecipients.push(
            ...contacts.map((c) => ({
              id: `partner_contact_${c.id}`,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              type: "partner_contact" as const,
            })),
          )
        }
      }

      // Contactos de Prospects
      if (recipientType === "all" || recipientType === "prospect_contact") {
        const { data: contacts } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email, prospect_partner_id")
          .not("prospect_partner_id", "is", null)
          .eq("is_active", true)
          .or(
            searchTerm
              ? `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
              : "",
          )

        if (contacts) {
          newRecipients.push(
            ...contacts.map((c) => ({
              id: `prospect_contact_${c.id}`,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              type: "prospect_contact" as const,
            })),
          )
        }
      }

      setRecipients(newRecipients)
    } catch (error) {
      console.error("[v0] Error loading recipients:", error)
      toast({ title: "Error", description: "No se pudieron cargar los destinatarios", variant: "destructive" })
    } finally {
      setLoadingRecipients(false)
    }
  }

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim() || selectedRecipients.length === 0) {
      toast({ title: "Error", description: "Por favor completa todos los campos y selecciona destinatarios" })
      return
    }

    try {
      setLoading(true)
      const recipientEmails = selectedRecipients
        .map((id) => recipients.find((r) => `${r.type}_${r.id}` === id || r.id === id)?.email)
        .filter(Boolean) as string[]

      await sendPulseMessage({
        to: recipientEmails,
        subject,
        body: message,
        user_id: userInfo?.id || "",
      })

      toast({ title: "Éxito", description: "Mensaje enviado a todos los destinatarios" })
      setSubject("")
      setMessage("")
      setSelectedRecipients([])
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId) ? prev.filter((id) => id !== recipientId) : [...prev, recipientId],
    )
  }

  const filteredRecipients = useMemo(
    () =>
      recipients.filter((r) => {
        if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
        return true
      }),
    [recipients, searchTerm],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Enviar Mensaje</DialogTitle>
        <DialogDescription>Selecciona destinatarios y redacta tu mensaje</DialogDescription>

        <div className="space-y-4">
          {/* Filtro de tipo de destinatario */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Tipo de Destinatarios</label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECIPIENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Lista de destinatarios seleccionables */}
          <Card>
            <ScrollArea className="h-48 p-4">
              {loadingRecipients ? (
                <div className="text-center text-gray-500">Cargando destinatarios...</div>
              ) : filteredRecipients.length === 0 ? (
                <div className="text-center text-gray-500">No hay destinatarios disponibles</div>
              ) : (
                <div className="space-y-2">
                  {filteredRecipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(recipient.id)}
                        onChange={() => toggleRecipient(recipient.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{recipient.name}</div>
                        <div className="text-xs text-gray-500">{recipient.email}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {recipient.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Mostrar destinatarios seleccionados */}
          {selectedRecipients.length > 0 && (
            <div>
              <label className="text-sm font-medium">Destinatarios Seleccionados: {selectedRecipients.length}</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedRecipients.map((id) => {
                  const recipient = recipients.find((r) => r.id === id)
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-2">
                      {recipient?.name}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => toggleRecipient(id)} />
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Asunto */}
          <div>
            <label className="text-sm font-medium">Asunto</label>
            <Input
              placeholder="Asunto del mensaje..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Mensaje */}
          <div>
            <label className="text-sm font-medium">Mensaje</label>
            <Textarea
              placeholder="Escribe tu mensaje aquí..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={8}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={loading || selectedRecipients.length === 0 || !subject.trim() || !message.trim()}
            >
              {loading ? "Enviando..." : "Enviar Mensaje"}
              {!loading && <Send className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
