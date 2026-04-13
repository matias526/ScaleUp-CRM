"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"
import { ContactFormModal } from "@/components/contacts/contact-form-modal"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  position?: string
  department?: string
}

interface TechCompanyContactsSectionProps {
  techCompanyId: string
}

export function TechCompanyContactsSection({ techCompanyId }: TechCompanyContactsSectionProps) {
  const { t } = useTranslations(DICT_LANG_CONTACTS)
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [contactToRemove, setContactToRemove] = useState<string | null>(null)

  const loadContacts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("tech_company_id", techCompanyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error loading contacts:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los contactos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [techCompanyId])

  const handleAddContact = async (contact: Contact) => {
    try {
      await loadContacts()
      setShowModal(false)
      toast({
        title: "Éxito",
        description: "Contacto agregado a la empresa",
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

  const handleRemoveContact = async () => {
    if (!contactToRemove) return

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ tech_company_id: null })
        .eq("id", contactToRemove)

      if (error) throw error
      await loadContacts()
      setContactToRemove(null)
      toast({
        title: "Éxito",
        description: "Contacto removido de la empresa",
      })
    } catch (error) {
      console.error("Error removing contact:", error)
      toast({
        title: "Error",
        description: "Error al remover el contacto",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t("opportunity.contacts.title")}</CardTitle>
              <CardDescription>{t("opportunity.contacts.primary")}</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
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
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-gray-50 transition-colors">
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setContactToRemove(contact.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
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
        entityType="tech-company"
        entityId={techCompanyId}
      />

      {/* Remove Confirmation */}
      <AlertDialog open={!!contactToRemove} onOpenChange={(open) => !open && setContactToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Remover contacto</AlertDialogTitle>
          <AlertDialogDescription>
            {t("contacts.removeConfirm.techCompany")}
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveContact} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
