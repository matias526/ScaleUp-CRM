"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Globe, MapPin, Zap, Users, Briefcase, Plus } from "lucide-react"
import type { ProspectPartner } from "@/lib/services/prospect-partner-service"
import { ProspectPartnerService } from "@/lib/services/prospect-partner-service"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PROSPECT_PARTNERS } from "@/lib/constants/dict-lang-prospect-partners"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface ProspectPartnerDetailDrawerProps {
  partner: ProspectPartner | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProspectPartnerDetailDrawer({ partner, open, onOpenChange }: ProspectPartnerDetailDrawerProps) {
  const { t } = useTranslations(DICT_LANG_PROSPECT_PARTNERS)
  const { toast } = useToast()
  const [contacts, setContacts] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [loadingOpportunities, setLoadingOpportunities] = useState(false)
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
  })

  useEffect(() => {
    const loadData = async () => {
      if (partner?.id && open) {
        setLoadingContacts(true)
        setLoadingOpportunities(true)

        try {
          const [contactsData, opportunitiesData] = await Promise.all([
            ProspectPartnerService.getContactsByProspectPartner(partner.id),
            ProspectPartnerService.getOpportunitiesByProspectPartner(partner.id),
          ])

          setContacts(contactsData || [])
          setOpportunities(opportunitiesData || [])
        } catch (error) {
          console.error("Error loading data:", error)
          setContacts([])
          setOpportunities([])
        } finally {
          setLoadingContacts(false)
          setLoadingOpportunities(false)
        }
      }
    }

    loadData()
  }, [partner?.id, open])

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newContact.first_name.trim() || !newContact.last_name.trim() || !newContact.email.trim()) {
      toast({
        description: "First name, last name, and email are required",
        variant: "destructive",
      })
      return
    }

    setIsAddingContact(true)
    try {
      await ProspectPartnerService.addContactToProspectPartner({
        ...newContact,
        prospect_id: partner?.id,
      })

      toast({
        description: t("prospect_partners.contact.success"),
      })

      setNewContact({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
      })

      setIsAddContactModalOpen(false)

      // Reload contacts
      const updatedContacts = await ProspectPartnerService.getContactsByProspectPartner(partner?.id || "")
      setContacts(updatedContacts)
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({
        description: t("prospect_partners.contact.error"),
        variant: "destructive",
      })
    } finally {
      setIsAddingContact(false)
    }
  }

  if (!partner) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[450px] sm:max-w-none overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{partner.name}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* General Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{t("prospect_partners.drawer.generalInfo")}</h3>

              {partner.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">{t("prospect_partners.website")}</p>
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {partner.website}
                    </a>
                  </div>
                </div>
              )}

              {partner.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">{t("prospect_partners.form.address")}</p>
                    <p className="text-sm">{partner.address}</p>
                  </div>
                </div>
              )}

              {partner.lead_source && (
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">{t("prospect_partners.leadSource")}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {partner.lead_source}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">{t("prospect_partners.status")}</p>
                  <Badge variant={partner.is_active ? "default" : "secondary"} className="text-xs mt-1">
                    {partner.is_active ? t("prospect_partners.status.active") : t("prospect_partners.status.inactive")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("prospect_partners.drawer.contacts")}
                </h3>
                <Button size="sm" variant="outline" onClick={() => setIsAddContactModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("prospect_partners.drawer.addContact")}
                </Button>
              </div>

              {loadingContacts ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-gray-500">{t("prospect_partners.message.noContacts")}</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-sm">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.email && (
                        <p className="text-xs text-blue-600 break-all">{contact.email}</p>
                      )}
                      {contact.position && (
                        <p className="text-xs text-gray-600">{contact.position}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opportunities Section */}
            <div className="space-y-3 border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {t("prospect_partners.drawer.opportunities")}
              </h3>

              {loadingOpportunities ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : opportunities.length === 0 ? (
                <p className="text-sm text-gray-500">{t("prospect_partners.message.noOpportunities")}</p>
              ) : (
                <div className="space-y-2">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-sm">{opp.title}</p>
                      <div className="flex justify-between items-center mt-1">
                        <Badge variant="outline" className="text-xs">
                          {opp.status}
                        </Badge>
                        {opp.amount && (
                          <p className="text-xs font-semibold text-gray-600">${opp.amount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Contact Modal */}
      <Dialog open={isAddContactModalOpen} onOpenChange={setIsAddContactModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("prospect_partners.contact.title.add")}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddContact} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-sm font-medium">
                  {t("prospect_partners.contact.firstName")} *
                </Label>
                <Input
                  id="first_name"
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  placeholder="Juan"
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="last_name" className="text-sm font-medium">
                  {t("prospect_partners.contact.lastName")} *
                </Label>
                <Input
                  id="last_name"
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  placeholder="Pérez"
                  required
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                {t("prospect_partners.contact.email")} *
              </Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="juan@example.com"
                required
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t("prospect_partners.contact.phone")}
                </Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="position" className="text-sm font-medium">
                  {t("prospect_partners.contact.position")}
                </Label>
                <Input
                  id="position"
                  value={newContact.position}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                  placeholder="Director"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="department" className="text-sm font-medium">
                {t("prospect_partners.contact.department")}
              </Label>
              <Select
                value={newContact.department || ""}
                onValueChange={(value) => setNewContact({ ...newContact, department: value })}
              >
                <SelectTrigger id="department" className="mt-1.5">
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddContactModalOpen(false)}
                className="mt-4"
              >
                {t("prospect_partners.contact.button.cancel")}
              </Button>
              <Button type="submit" disabled={isAddingContact} className="mt-4">
                {isAddingContact ? "..." : t("prospect_partners.contact.button.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
              </Button>
              <Button type="submit" disabled={isAddingContact}>
                {isAddingContact ? "..." : t("prospect_partners.contact.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
