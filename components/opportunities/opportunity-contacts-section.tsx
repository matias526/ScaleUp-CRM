"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2, Plus, Send, Edit2 } from "lucide-react"
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
  onSendMessage?: () => void
}

export function OpportunityContactsSection({ opportunityId, onSendMessage }: OpportunityContactsSectionProps) {
  const { t } = useTranslations(DICT_LANG_CONTACTS)
  const [contacts, setContacts] = useState<OpportunityContact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [contactToRemove, setContactToRemove] = useState<string | null>(null)
  const [contactToMessage, setContactToMessage] = useState<string | null>(null)

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
          <div className="flex gap-2">
            {onSendMessage && (
              <Button
                size="sm"
                onClick={onSendMessage}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensaje
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("opportunity.contacts.addContact")}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando contactos...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t("opportunity.contacts.noContacts")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Contacto</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">{t("opportunity.contacts.position")}</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">{t("opportunity.contacts.department")}</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Principal</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((oc) => {
                    const contact = oc.contact
                    if (!contact) return null

                    return (
                      <tr key={oc.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{contact.email}</td>
                        <td className="py-3 px-3 text-gray-600">{contact.position || "-"}</td>
                        <td className="py-3 px-3">
                          {contact.department ? (
                            <Badge variant="outline" className="text-xs">
                              {t(`contacts.department.${contact.department}`)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {oc.is_primary ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mx-auto" />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSetPrimary(contact.id)}
                              title={t("opportunity.contacts.primary")}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Editar contacto"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setContactToMessage(oc.id)
                                onSendMessage?.()
                              }}
                              title="Enviar mensaje a este contacto"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-green-500"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setContactToRemove(oc.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                              title="Remover contacto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
