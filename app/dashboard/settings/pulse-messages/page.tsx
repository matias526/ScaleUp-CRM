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
  type: "scaleup_user" | "tech_company_user" | "partner" | "prospect_contact" | "standalone_contact"
  entityName?: string
  recipientSubType?: "partner_user" | "partner_contact"
}

interface RecipientField {
  id: string
  name: string
  email: string
  fieldType: "to" | "cc" | "bcc"
  type: Recipient["type"]
  subType?: Recipient["recipientSubType"]
  entityName?: string
}

interface PulseTemplate {
  id: string
  name: string
  subject: string
  body: string
}

const RECIPIENT_TYPES = [
  { value: "all", label: "Todos" },
  { value: "scaleup_user", label: "Usuarios ScaleUp" },
  { value: "tech_company_user", label: "Usuarios TechCompanies" },
  { value: "partner", label: "Partners" },
  { value: "prospect_contact", label: "Contactos Prospects" },
  { value: "standalone_contact", label: "Contactos" },
]

export default function PulseMessagesPage() {
  const { userInfo } = useAuth()
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [recipientType, setRecipientType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientField[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  
  // Entity filters
  const [techCompanies, setTechCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTechCompany, setSelectedTechCompany] = useState<string>("")
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPartner, setSelectedPartner] = useState<string>("")
  const [prospects, setProspects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProspect, setSelectedProspect] = useState<string>("")
  
  // Templates
  const [templates, setTemplates] = useState<PulseTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [senderMode, setSenderMode] = useState<"personal" | "system">("system")

  // Load entities on mount
  useEffect(() => {
    loadTechCompanies()
    loadPartners()
    loadProspects()
    loadTemplates()
  }, [])

  // Load recipients when filter changes
  useEffect(() => {
    loadRecipients()
  }, [recipientType, searchTerm, selectedTechCompany, selectedPartner, selectedProspect])

  const loadTechCompanies = async () => {
    try {
      const { data } = await supabase.from("tech_companies").select("id, name").eq("is_active", true)
      if (data) setTechCompanies(data)
    } catch (error) {
      console.error("[v0] Error loading tech companies:", error)
    }
  }

  const loadPartners = async () => {
    try {
      const { data } = await supabase.from("partners").select("id, name").eq("is_active", true)
      if (data) setPartners(data)
    } catch (error) {
      console.error("[v0] Error loading partners:", error)
    }
  }

  const loadProspects = async () => {
    try {
      const { data } = await supabase.from("end_customers").select("id, name").eq("is_active", true)
      if (data) setProspects(data)
    } catch (error) {
      console.error("[v0] Error loading prospects:", error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/pulse/templates?includeTranslations=true")
      const data = await response.json()
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error("[v0] Error loading templates:", error)
    }
  }

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true)
      let newRecipients: Recipient[] = []

      // ScaleUp Users
      if (recipientType === "all" || recipientType === "scaleup_user") {
        let query = supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .eq("is_active", true)
          .is("tech_company_id", null)
          .is("partner_id", null)

        if (searchTerm) {
          query = query.or(
            `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
          )
        }

        const { data: users } = await query
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

      // TechCompany Users
      if (recipientType === "all" || recipientType === "tech_company_user") {
        let query = supabase
          .from("users")
          .select("id, first_name, last_name, email, tech_company_id, tech_companies(id, name)")
          .eq("is_active", true)
          .not("tech_company_id", "is", null)

        if (selectedTechCompany && recipientType === "tech_company_user") {
          query = query.eq("tech_company_id", selectedTechCompany)
        }

        if (searchTerm) {
          query = query.or(
            `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
          )
        }

        const { data: users } = await query
        if (users) {
          newRecipients.push(
            ...users.map((u: any) => ({
              id: `tech_company_${u.id}`,
              name: `${u.first_name} ${u.last_name}`,
              email: u.email,
              type: "tech_company_user" as const,
              entityName: u.tech_companies?.name,
            })),
          )
        }
      }

      // Partner Users (from users table)
      if (recipientType === "all" || recipientType === "partner") {
        let query = supabase
          .from("users")
          .select("id, first_name, last_name, email, partner_id, partners(id, name)")
          .eq("is_active", true)
          .not("partner_id", "is", null)

        if (selectedPartner && recipientType === "partner") {
          query = query.eq("partner_id", selectedPartner)
        }

        if (searchTerm) {
          query = query.or(
            `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
          )
        }

        const { data: users } = await query
        if (users) {
          newRecipients.push(
            ...users.map((u: any) => ({
              id: `partner_user_${u.id}`,
              name: `${u.first_name} ${u.last_name}`,
              email: u.email,
              type: "partner" as const,
              recipientSubType: "partner_user" as const,
              entityName: u.partners?.name,
            })),
          )
        }
      }

      // Partner Contacts
      if (recipientType === "all" || recipientType === "partner") {
        let query = supabase
          .from("contacts")
          .select("id, first_name, last_name, email, partner_id")
          .not("partner_id", "is", null)

        if (selectedPartner && recipientType === "partner") {
          query = query.eq("partner_id", selectedPartner)
        }

        if (searchTerm) {
          query = query.or(
            `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
          )
        }

        const { data: contacts } = await query
        if (contacts && contacts.length > 0) {
          const partnerIds = [...new Set(contacts.map((c) => c.partner_id))]
          const { data: partnerData } = await supabase.from("partners").select("id, name").in("id", partnerIds)
          const partnerMap = new Map(partnerData?.map((p) => [p.id, p.name]) || [])

          newRecipients.push(
            ...contacts.map((c: any) => ({
              id: `partner_contact_${c.id}`,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              type: "partner" as const,
              recipientSubType: "partner_contact" as const,
              entityName: partnerMap.get(c.partner_id),
            })),
          )
        }
      }

      // Prospect Contacts (from end_customers)
      if (recipientType === "all" || recipientType === "prospect_contact") {
        let query = supabase
          .from("contacts")
          .select("id, first_name, last_name, email, end_customer_id")
          .not("end_customer_id", "is", null)

        if (selectedProspect && recipientType === "prospect_contact") {
          query = query.eq("end_customer_id", selectedProspect)
        }

        if (searchTerm) {
          query = query.or(
            `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
          )
        }

        const { data: contacts } = await query
        if (contacts && contacts.length > 0) {
          const prospectIds = [...new Set(contacts.map((c) => c.end_customer_id))]
          const { data: prospectData } = await supabase
            .from("end_customers")
            .select("id, name")
            .in("id", prospectIds)
          const prospectMap = new Map(prospectData?.map((p) => [p.id, p.name]) || [])

          newRecipients.push(
            ...contacts.map((c: any) => ({
              id: `prospect_contact_${c.id}`,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              type: "prospect_contact" as const,
              entityName: prospectMap.get(c.end_customer_id),
            })),
          )
        }
      }

      // Standalone Contacts
      if (recipientType === "all" || recipientType === "standalone_contact") {
        const { data: allContacts } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email, partner_id, tech_company_id, end_customer_id")

        if (allContacts) {
          const standaloneContacts = allContacts.filter(
            (c) => !c.partner_id && !c.tech_company_id && !c.end_customer_id,
          )

          let filtered = standaloneContacts
          if (searchTerm) {
            filtered = standaloneContacts.filter(
              (c) =>
                `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
          }

          newRecipients.push(
            ...filtered.map((c: any) => ({
              id: `standalone_contact_${c.id}`,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              type: "standalone_contact" as const,
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

  const addRecipient = (recipient: Recipient, fieldType: "to" | "cc" | "bcc") => {
    const newField: RecipientField = {
      id: `${fieldType}_${recipient.id}`,
      name: recipient.name,
      email: recipient.email,
      fieldType,
      type: recipient.type,
      subType: recipient.recipientSubType,
      entityName: recipient.entityName,
    }
    setSelectedRecipients([...selectedRecipients, newField])
  }

  const removeRecipient = (fieldId: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r.id !== fieldId))
  }

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim() || selectedRecipients.length === 0) {
      toast({ title: "Error", description: "Por favor completa todos los campos y selecciona destinatarios" })
      return
    }

    try {
      setLoading(true)
      const toEmails = selectedRecipients.filter((r) => r.fieldType === "to").map((r) => r.email)
      const ccEmails = selectedRecipients.filter((r) => r.fieldType === "cc").map((r) => r.email)
      const bccEmails = selectedRecipients.filter((r) => r.fieldType === "bcc").map((r) => r.email)

      await sendPulseMessage({
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        body: message,
        user_id: userInfo?.id || "",
        sender_mode: senderMode,
      })

      toast({ title: "Éxito", description: "Mensaje enviado a todos los destinatarios" })
      setSubject("")
      setMessage("")
      setSelectedRecipients([])
      setSelectedTemplate("")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setMessage(template.body)
      setSelectedTemplate(templateId)
    }
  }

  const recipientsByType = useMemo(() => {
    return {
      to: selectedRecipients.filter((r) => r.fieldType === "to"),
      cc: selectedRecipients.filter((r) => r.fieldType === "cc"),
      bcc: selectedRecipients.filter((r) => r.fieldType === "bcc"),
    }
  }, [selectedRecipients])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-2 mb-6">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Enviar Mensaje</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipient Selection Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Destinatarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-48">
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

                {recipientType === "tech_company_user" && (
                  <div className="flex-1 min-w-48">
                    <label className="text-sm font-medium">TechCompany</label>
                    <Select value={selectedTechCompany} onValueChange={setSelectedTechCompany}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una TechCompany" />
                      </SelectTrigger>
                      <SelectContent>
                        {techCompanies.map((tc) => (
                          <SelectItem key={tc.id} value={tc.id}>
                            {tc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {recipientType === "partner" && (
                  <div className="flex-1 min-w-48">
                    <label className="text-sm font-medium">Partner</label>
                    <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un Partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {recipientType === "prospect_contact" && (
                  <div className="flex-1 min-w-48">
                    <label className="text-sm font-medium">Prospect</label>
                    <Select value={selectedProspect} onValueChange={setSelectedProspect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un Prospect" />
                      </SelectTrigger>
                      <SelectContent>
                        {prospects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-48"
                />
              </div>

              {/* Recipients List */}
              <div className="border rounded-lg">
                <ScrollArea className="h-96">
                  {loadingRecipients ? (
                    <div className="text-center text-gray-500 p-4">Cargando destinatarios...</div>
                  ) : recipients.length === 0 ? (
                    <div className="text-center text-gray-500 p-4">No hay destinatarios disponibles</div>
                  ) : (
                    <div className="space-y-0">
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                          <div className="flex gap-2">
                            <Select defaultValue="to" onValueChange={(value: "to" | "cc" | "bcc") => addRecipient(recipient, value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="to">Para</SelectItem>
                                <SelectItem value="cc">CC</SelectItem>
                                <SelectItem value="bcc">BCC</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{recipient.name}</div>
                              <div className="text-xs text-gray-500">{recipient.email}</div>
                              {recipient.entityName && <div className="text-xs text-gray-400">{recipient.entityName}</div>}
                            </div>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {recipient.type === "scaleup_user"
                                ? "ScaleUp"
                                : recipient.type === "tech_company_user"
                                  ? "Tech User"
                                  : recipient.type === "partner"
                                    ? recipient.recipientSubType === "partner_user"
                                      ? "Partner User"
                                      : "Partner Contact"
                                    : recipient.type === "prospect_contact"
                                      ? "Prospect"
                                      : "Contact"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Composition Panel */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipients Summary */}
            {selectedRecipients.length > 0 && (
              <div className="space-y-2">
                {recipientsByType.to.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Para ({recipientsByType.to.length})</label>
                    <div className="flex flex-wrap gap-1">
                      {recipientsByType.to.map((r) => (
                        <Badge key={r.id} variant="default" className="text-xs flex items-center gap-1">
                          {r.name}
                          <X className="w-2 h-2 cursor-pointer" onClick={() => removeRecipient(r.id)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {recipientsByType.cc.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">CC ({recipientsByType.cc.length})</label>
                    <div className="flex flex-wrap gap-1">
                      {recipientsByType.cc.map((r) => (
                        <Badge key={r.id} variant="secondary" className="text-xs flex items-center gap-1">
                          {r.name}
                          <X className="w-2 h-2 cursor-pointer" onClick={() => removeRecipient(r.id)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {recipientsByType.bcc.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">BCC ({recipientsByType.bcc.length})</label>
                    <div className="flex flex-wrap gap-1">
                      {recipientsByType.bcc.map((r) => (
                        <Badge key={r.id} variant="outline" className="text-xs flex items-center gap-1">
                          {r.name}
                          <X className="w-2 h-2 cursor-pointer" onClick={() => removeRecipient(r.id)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Template Selection */}
            <div>
              <label className="text-sm font-medium">Plantilla</label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium">Asunto</label>
              <Input
                placeholder="Asunto..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                rows={6}
              />
            </div>

            {/* Sender Mode */}
            <div className="flex gap-2">
              <Button
                variant={senderMode === "personal" ? "default" : "outline"}
                size="sm"
                onClick={() => setSenderMode("personal")}
                className="flex-1"
              >
                Personal
              </Button>
              <Button
                variant={senderMode === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setSenderMode("system")}
                className="flex-1"
              >
                Sistema
              </Button>
            </div>

            {/* Send Button */}
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
