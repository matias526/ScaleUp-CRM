"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2, Plus } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"
import { OpportunityContactService, type OpportunityContact } from "@/lib/services/opportunity-contact-service"
import { ContactFormModal } from "@/components/contacts/contact-form-modal"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OpportunityContactsSectionProps {
  opportunityId: string
}

export function OpportunityContactsSection({ opportunityId }: OpportunityContactsSectionProps) {
  const { t } = useTranslations(DICT_LANG_CONTACTS)
  const [contacts, setContacts] = useState<OpportunityContact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [contactToRemove, setContactToRemove] = useState<string | null>(null)

  // Load contacts
  useEffect(() => {
    loadContacts()
  }, [opportunityId])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await OpportunityContactService.getOpportunityContacts(opportunityId)
      setContacts(data)
    } catch (error) {
      console.error("Error loading contacts:", error)
      toast({
        title: "Error",
        description: "Error al cargar los contactos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async (contact: any) => {
    try {
      const contactId = contact.id
      // Check if already exists
      const exists = await OpportunityContactService.isContactInOpportunity(opportunityId, contactId)
      if (exists) {
        toast({
          title: "Contacto",
          description: "Este contacto ya está relacionado con la oportunidad",
        })
        return
      }

      await OpportunityContactService.addContactToOpportunity(opportunityId, contactId, false)
      await loadContacts()
      setShowModal(false)
      toast({
        title: "Éxito",
        description: "Contacto agregado a la oportunidad",
      })
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({
        title: "Error",
        description: "Error al agregar el contacto",
        variant: "destructive",
      })
    }
  }

  const handleSetPrimary = async (contactId: string) => {
    try {
      await OpportunityContactService.updatePrimaryContact(opportunityId, contactId, true)
      await loadContacts()
      toast({
        title: "Éxito",
        description: "Contacto principal actualizado",
      })
    } catch (error) {
      console.error("Error updating primary contact:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el contacto principal",
        variant: "destructive",
      })
    }
  }

  const handleRemoveContact = async (contactId: string) => {
    try {
      await OpportunityContactService.removeContactFromOpportunity(opportunityId, contactId)
      await loadContacts()
      toast({
        title: "Éxito",
        description: "Contacto removido de la oportunidad",
      })
    } catch (error) {
      console.error("Error removing contact:", error)
      toast({
        title: "Error",
        description: "Error al remover el contacto",
        variant: "destructive",
      })
    } finally {
      setContactToRemove(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg">{t("opportunity.contacts.title")}</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("opportunity.contacts.addContact")}
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando contactos...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t("opportunity.contacts.noContacts")}</div>
          ) : (
            <div className="space-y-3">
              {contacts.map((oc) => {
                const contact = oc.contact
                if (!contact) return null

                return (
                  <div
                    key={oc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {oc.is_primary && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{contact.email}</p>
                      <div className="flex gap-2 mt-1">
                        {contact.position && (
                          <Badge variant="secondary" className="text-xs">
                            {contact.position}
                          </Badge>
                        )}
                        {contact.department && (
                          <Badge variant="outline" className="text-xs">
                            {t(`contacts.department.${contact.department}`)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!oc.is_primary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetPrimary(contact.id)}
                          title={t("opportunity.contacts.primary")}
                          className="text-gray-400 hover:text-yellow-400"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setContactToRemove(oc.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Form Modal */}
      <ContactFormModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleAddContact}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!contactToRemove} onOpenChange={(open) => !open && setContactToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Contacto</AlertDialogTitle>
            <AlertDialogDescription>{t("opportunity.contacts.removeConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToRemove && handleRemoveContact(contactToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
