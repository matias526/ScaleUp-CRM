"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye } from "lucide-react"
import type { ProspectPartner } from "@/lib/services/prospect-partner-service"
import { ProspectPartnerService } from "@/lib/services/prospect-partner-service"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PROSPECT_PARTNERS } from "@/lib/constants/dict-lang-prospect-partners"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProspectPartnersTableProps {
  partners: ProspectPartner[]
  onDelete: () => void
  onView: (partner: ProspectPartner) => void
  onEdit: (partner: ProspectPartner) => void
}

export default function ProspectPartnersTable({ partners, onDelete, onView, onEdit }: ProspectPartnersTableProps) {
  const { t } = useTranslations(DICT_LANG_PROSPECT_PARTNERS)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setSelectedPartnerId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedPartnerId) return

    setIsDeleting(true)
    try {
      await ProspectPartnerService.deleteProspectPartner(selectedPartnerId)
      setDeleteDialogOpen(false)
      setSelectedPartnerId(null)
      onDelete()
    } catch (error) {
      console.error("Error deleting partner:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("prospect_partners.name")}</TableHead>
              <TableHead>{t("prospect_partners.website")}</TableHead>
              <TableHead>{t("prospect_partners.leadSource")}</TableHead>
              <TableHead>{t("prospect_partners.status")}</TableHead>
              <TableHead className="text-right">{t("prospect_partners.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  {t("prospect_partners.message.loading")}
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell className="text-sm">
                    {partner.website ? (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {partner.website}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{partner.lead_source || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={partner.is_active ? "default" : "secondary"}>
                      {partner.is_active ? t("prospect_partners.status.active") : t("prospect_partners.status.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(partner)}
                        title={t("prospect_partners.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(partner)}
                        title={t("prospect_partners.edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(partner.id)}
                        className="text-red-600 hover:text-red-700"
                        title={t("prospect_partners.delete")}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t("prospect_partners.delete")}</AlertDialogTitle>
          <AlertDialogDescription>{t("prospect_partners.confirm.delete")}</AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>{t("prospect_partners.form.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {t("prospect_partners.delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
