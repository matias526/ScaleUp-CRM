"use client"

import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { deleteOpportunityTechFieldClient } from "@/lib/services/opportunity-tech-field-service-client"
import { useToast } from "@/hooks/use-toast"

interface CustomFieldsTableProps {
  fields: any[]
  loading: boolean
  onRefresh: () => void
}

export function CustomFieldsTable({ fields, loading, onRefresh }: CustomFieldsTableProps) {
  const { t } = useTranslations()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<any>(null)

  const handleDelete = async () => {
    if (!fieldToDelete) return

    try {
      await deleteOpportunityTechFieldClient(fieldToDelete.id)
      toast({
        title: t("opportunity_tech_fields.success_delete"),
        variant: "success",
      })
      onRefresh()
    } catch (error) {
      console.error("Error deleting field:", error)
      toast({
        title: t("opportunity_tech_fields.error_delete"),
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setFieldToDelete(null)
    }
  }

  const openDeleteDialog = (field: any) => {
    setFieldToDelete(field)
    setDeleteDialogOpen(true)
  }

  const getFieldTypeName = (type: string) => {
    const types: Record<string, string> = {
      text: t("opportunity_tech_fields.field_type.text"),
      number: t("opportunity_tech_fields.field_type.number"),
      select: t("opportunity_tech_fields.field_type.select"),
      multiselect: t("opportunity_tech_fields.field_type.multiselect"),
      date: t("opportunity_tech_fields.field_type.date"),
      boolean: t("opportunity_tech_fields.field_type.boolean"),
    }

    return types[type] || type
  }

  if (loading) {
    return <div className="py-4 text-center">{t("loading")}</div>
  }

  if (fields.length === 0) {
    return <div className="py-4 text-center">{t("opportunity_tech_fields.no_fields")}</div>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("opportunity_tech_fields.field_name")}</TableHead>
            <TableHead>{t("opportunity_tech_fields.tech_company")}</TableHead>
            <TableHead>{t("opportunity_tech_fields.field_type")}</TableHead>
            <TableHead>{t("opportunity_tech_fields.is_required")}</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.id}>
              <TableCell className="font-medium">{field.field_name}</TableCell>
              <TableCell>{field.tech_companies?.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{getFieldTypeName(field.field_type)}</Badge>
              </TableCell>
              <TableCell>
                {field.is_required ? <Badge variant="default">Sí</Badge> : <Badge variant="outline">No</Badge>}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Acciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/settings/custom-fields/${field.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("opportunity_tech_fields.edit")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => openDeleteDialog(field)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("opportunity_tech_fields.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("opportunity_tech_fields.delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("opportunity_tech_fields.delete_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("opportunity_tech_fields.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("opportunity_tech_fields.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
