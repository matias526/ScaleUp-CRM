"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, ExternalLink, Eye, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { type Partner, PartnerService } from "@/lib/services/partner-service"
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
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslations } from "@/hooks/use-translations"
import { Card, CardContent } from "@/components/ui/card"

interface PartnersTableProps {
  partners: Partner[]
  onDelete?: () => void
}

export default function PartnersTable({ partners, onDelete }: PartnersTableProps) {
  const router = useRouter()
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMobile = useMobile()
  const { t } = useTranslations()
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>(partners || [])
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    // Actualizar los partners filtrados cuando cambien los partners originales
    setFilteredPartners(partners || [])
  }, [partners])

  useEffect(() => {
    // Filtrar partners localmente cuando cambie el término de búsqueda
    if (!debouncedSearchTerm) {
      setFilteredPartners(partners || [])
      return
    }

    const term = debouncedSearchTerm.toLowerCase()
    const filtered = (partners || []).filter(
      (partner) =>
        partner.name.toLowerCase().includes(term) ||
        (partner.city && partner.city.toLowerCase().includes(term)) ||
        (partner.code && partner.code.toLowerCase().includes(term)),
    )
    setFilteredPartners(filtered)
  }, [debouncedSearchTerm, partners])

  const handleDelete = async () => {
    if (!partnerToDelete) return

    setIsDeleting(true)
    try {
      await PartnerService.deletePartner(partnerToDelete.id)
      onDelete?.()
    } catch (error) {
      console.error("Error al eliminar partner:", error)
    } finally {
      setIsDeleting(false)
      setPartnerToDelete(null)
    }
  }

  // Renderizado para móviles (vista de tarjetas)
  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {filteredPartners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("no_partners_registered")}</div>
          ) : (
            filteredPartners.map((partner) => (
              <Card key={partner.id}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-4">
                    {partner.logo_url ? (
                      <div className="relative w-12 h-12 rounded-md overflow-hidden mr-3">
                        <Image
                          src={partner.logo_url || "/placeholder.svg"}
                          alt={t("logo_of", { name: partner.name })}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mr-3">
                        <Building className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{partner.name}</h3>
                      <p className="text-sm text-muted-foreground">{partner.city}</p>
                    </div>
                    <Badge variant={partner.is_active ? "success" : "destructive"} className="ml-auto">
                      {partner.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </div>

                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/partners/${partner.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/partners/${partner.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPartnerToDelete(partner)}
                      className="text-destructive border-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={!!partnerToDelete} onOpenChange={(open) => !open && setPartnerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("delete_partner_confirmation", { name: partnerToDelete?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground"
              >
                {isDeleting ? t("deleting") : t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // Renderizado para escritorio (vista de tabla)
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{t("logo")}</TableHead>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("website")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPartners.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {t("no_partners_registered")}
              </TableCell>
            </TableRow>
          ) : (
            filteredPartners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>
                  {partner.logo_url ? (
                    <div className="relative w-10 h-10 rounded-md overflow-hidden">
                      <Image
                        src={partner.logo_url || "/placeholder.svg"}
                        alt={t("logo_of", { name: partner.name })}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>
                  {partner.website ? (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      {partner.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={partner.is_active ? "success" : "destructive"}>
                    {partner.is_active ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/partners/${partner.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/partners/${partner.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPartnerToDelete(partner)}
                      className="text-destructive border-destructive"
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

      <AlertDialog open={!!partnerToDelete} onOpenChange={(open) => !open && setPartnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_partner_confirmation", { name: partnerToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
