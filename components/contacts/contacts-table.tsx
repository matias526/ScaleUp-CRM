"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Edit, Trash2, Eye } from "lucide-react"
import { type Contact, ContactService } from "@/lib/services/contact-service"
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
import { useMobile } from "@/hooks/use-mobile"
import { useTranslations } from "@/hooks/use-translations"
import { Card, CardContent } from "@/components/ui/card"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"

interface ContactsTableProps {
  contacts: Contact[]
  onDelete?: () => void
  onView?: (contact: Contact) => void
  onEdit?: (contact: Contact) => void
}

const DEPARTMENT_COLORS: Record<string, string> = {
  sales: "bg-blue-100 text-blue-800",
  technical: "bg-purple-100 text-purple-800",
  marketing: "bg-green-100 text-green-800",
  operations: "bg-orange-100 text-orange-800",
  finance: "bg-red-100 text-red-800",
  hr: "bg-pink-100 text-pink-800",
  executive: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800",
}

const LANGUAGE_LABELS: Record<string, string> = {
  es: "ES",
  en: "EN",
  pt: "PT",
}

export default function ContactsTable({ contacts, onDelete, onView, onEdit }: ContactsTableProps) {
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMobile = useMobile()
  const { t } = useTranslations(DICT_LANG_CONTACTS)

  const handleDelete = async () => {
    if (!contactToDelete) return

    setIsDeleting(true)
    try {
      await ContactService.deleteContact(contactToDelete.id)
      onDelete?.()
    } catch (error) {
      console.error("Error al eliminar contacto:", error)
    } finally {
      setIsDeleting(false)
      setContactToDelete(null)
    }
  }

  // Mobile view (card layout)
  if (isMobile) {
    return (
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              {t("contacts.message.noContacts")}
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{contact.position}</p>
                  </div>
                  <Badge className={DEPARTMENT_COLORS[contact.department] || DEPARTMENT_COLORS.other}>
                    {t(DICT_LANG_CONTACTS[`contacts.department.${contact.department}`]?.es || contact.department)}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(contact)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContactToDelete(contact)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  // Desktop view (table layout)
  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">{t("contacts.table.name")}</TableHead>
              <TableHead className="font-semibold">{t("contacts.table.email")}</TableHead>
              <TableHead className="font-semibold">{t("contacts.table.phone")}</TableHead>
              <TableHead className="font-semibold">{t("contacts.table.department")}</TableHead>
              <TableHead className="font-semibold">{t("contacts.table.language")}</TableHead>
              <TableHead className="text-right font-semibold">{t("contacts.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                  {t("contacts.message.noContacts")}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={DEPARTMENT_COLORS[contact.department] || DEPARTMENT_COLORS.other}>
                      {t(DICT_LANG_CONTACTS[`contacts.department.${contact.department}`]?.es || contact.department)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{LANGUAGE_LABELS[contact.preferred_language] || contact.preferred_language}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(contact)}
                        title={t("contacts.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(contact)}
                        title={t("contacts.edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContactToDelete(contact)}
                        title={t("contacts.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contacts.confirm.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("contacts.confirm.deleteMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("contacts.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : t("contacts.confirm.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
