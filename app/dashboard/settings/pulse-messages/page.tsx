"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Mail } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { sendPulseMessage } from "@/lib/services/pulse-message-service"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"

interface Recipient {
  id: string
  name: string
  email: string
  type: "scaleup_user" | "tech_company_contact" | "partner_contact" | "prospect_contact"
}

const RECIPIENT_TYPES = [
  { value: "all", label: "Todos" },
  { value: "scaleup_user", label: "Usuarios ScaleUp" },
  { value: "tech_company_contact", label: "Contactos TechCompanies" },
  { value: "partner_contact", label: "Contactos Partners" },
  { value: "prospect_contact", label: "Contactos Prospects" },
]

export default function PulseMessagesPage() {
  const { userInfo } = useAuth()
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
    loadRecipients()
  }, [recipientType, searchTerm])

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
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-2 mb-6">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Enviar Mensaje</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de selección de destinatarios */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Seleccionar Destinatarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="border rounded-lg">
              <ScrollArea className="h-96">
                {loadingRecipients ? (
                  <div className="text-center text-gray-500 p-4">Cargando destinatarios...</div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">No hay destinatarios disponibles</div>
                ) : (
                  <div className="space-y-0">
                    {filteredRecipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className="flex items-center gap-2 p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                        onClick={() => toggleRecipient(recipient.id)}
                      >
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
                          {recipient.type === "scaleup_user"
                            ? "ScaleUp"
                            : recipient.type === "tech_company_contact"
                              ? "TechCompany"
                              : recipient.type === "partner_contact"
                                ? "Partner"
                                : "Prospect"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Panel de composición */}
        <Card>
          <CardHeader>
            <CardTitle>Composición del Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mostrar destinatarios seleccionados */}
            {selectedRecipients.length > 0 && (
              <div>
                <label className="text-sm font-medium">
                  Destinatarios: <span className="text-primary">{selectedRecipients.length}</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                  {selectedRecipients.map((id) => {
                    const recipient = recipients.find((r) => r.id === id)
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
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
                rows={6}
              />
            </div>

            {/* Botón de envío */}
            <Button
              onClick={handleSendMessage}
              disabled={loading || selectedRecipients.length === 0 || !subject.trim() || !message.trim()}
              className="w-full"
            >
              {loading ? "Enviando..." : "Enviar Mensaje"}
              {!loading && <Send className="w-4 h-4 ml-2" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
