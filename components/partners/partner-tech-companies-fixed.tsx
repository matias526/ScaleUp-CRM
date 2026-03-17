"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { TechCompanyService } from "@/lib/services/tech-company-service"
import { UserService } from "@/lib/services/user-service"
import { PartnerTechCompanyService, type PartnerTechCompany } from "@/lib/services/partner-tech-company-service"

// Añadir importación del hook de traducciones
import { useTranslations } from "@/hooks/use-translations"

// Esquema de validación para el formulario de relación
const relationSchema = z.object({
  tech_company_id: z.string().min(1, "Selecciona una empresa tecnológica"),
  scaleup_manager_id: z.string().optional(),
})

interface PartnerTechCompaniesProps {
  partnerId: string
}

export function PartnerTechCompaniesFixed({ partnerId }: PartnerTechCompaniesProps) {
  // Añadir el hook de traducciones
  const { t } = useTranslations()
  const [relations, setRelations] = useState<PartnerTechCompany[]>([])
  const [techCompanies, setTechCompanies] = useState<{ id: string; name: string }[]>([])
  const [scaleupManagers, setScaleupManagers] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [relationToDelete, setRelationToDelete] = useState<PartnerTechCompany | null>(null)

  // Inicializar el formulario
  const form = useForm<z.infer<typeof relationSchema>>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      tech_company_id: "",
      scaleup_manager_id: "null", // Usar "null" como string para representar null
    },
  })

  // Cargar datos iniciales
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Cargar relaciones existentes
      const relationsData = await PartnerTechCompanyService.getPartnerTechCompanies(partnerId)
      setRelations(relationsData)

      // Cargar empresas tecnológicas
      const techCompaniesData = await TechCompanyService.getTechCompaniesBasic()
      setTechCompanies(techCompaniesData)

      // Cargar usuarios de ScaleUp (filtrar por roles "BDD" o "Admin" y que estén activos)
      const { data: usersData } = await UserService.getUsers(1, 100)
      const scaleupUsers = usersData.filter(
        (user) => (user.role_code === "BDD" || user.role_code === "Admin") && user.is_active,
      )
      setScaleupManagers(
        scaleupUsers.map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name} (${user.role_code})`,
        })),
      )
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [partnerId])

  // Filtrar empresas tecnológicas que ya están relacionadas
  const availableTechCompanies = techCompanies.filter(
    (company) => !relations.some((relation) => relation.tech_company_id === company.id),
  )

  // Manejar envío del formulario
  const onSubmit = async (values: z.infer<typeof relationSchema>) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await PartnerTechCompanyService.createPartnerTechCompany({
        partner_id: partnerId,
        tech_company_id: values.tech_company_id,
        scaleup_manager_id: values.scaleup_manager_id === "null" ? null : values.scaleup_manager_id,
      })

      if (result) {
        // Recargar relaciones
        await loadData()

        // Resetear formulario y cerrar diálogo
        form.reset({
          tech_company_id: "",
          scaleup_manager_id: "null",
        })
        setIsDialogOpen(false)
      } else {
        throw new Error("No se pudo crear la relación")
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la relación")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar actualización de gestor
  const handleUpdateManager = async (relationId: string, managerId: string | null) => {
    setIsLoading(true)
    setError(null)

    try {
      await PartnerTechCompanyService.updatePartnerTechCompany(relationId, managerId)

      // Recargar relaciones
      await loadData()
    } catch (err: any) {
      setError(err.message || "Error al actualizar el gestor")
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar eliminación de relación
  const handleDeleteRelation = async () => {
    if (!relationToDelete) return

    setIsLoading(true)
    setError(null)

    try {
      await PartnerTechCompanyService.deletePartnerTechCompany(relationToDelete.id)

      // Recargar relaciones
      await loadData()

      setRelationToDelete(null)
    } catch (err: any) {
      setError(err.message || "Error al eliminar la relación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t("associated_tech_companies")}</CardTitle>
            <CardDescription>{t("manage_associated_tech_companies")}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={availableTechCompanies.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                {t("associate_company")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("associate_tech_company")}</DialogTitle>
                <DialogDescription>{t("associate_tech_company_description")}</DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="tech_company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("tech_company")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_company")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTechCompanies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{t("tech_company_to_associate")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scaleup_manager_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("scaleup_manager")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "null"} defaultValue="null">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_manager_optional")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">{t("no_manager_assigned")}</SelectItem>
                            {scaleupManagers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{t("scaleup_manager_description")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("saving")}
                        </>
                      ) : (
                        t("save")
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : relations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t("no_tech_companies_associated")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tech_company")}</TableHead>
                <TableHead>{t("scaleup_manager")}</TableHead>
                <TableHead>{t("association_date")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relations.map((relation) => (
                <TableRow key={relation.id}>
                  <TableCell className="font-medium">{relation.tech_company_name}</TableCell>
                  <TableCell>
                    <Select
                      value={relation.scaleup_manager_id || "null"}
                      onValueChange={(value) => handleUpdateManager(relation.id, value === "null" ? null : value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t("no_manager_assigned")}>
                          {relation.scaleup_manager_name || t("no_manager_assigned")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">{t("no_manager_assigned")}</SelectItem>
                        {scaleupManagers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(relation.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRelationToDelete(relation)}
                      className="text-destructive border-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Diálogo de confirmación para eliminar relación */}
        <AlertDialog open={!!relationToDelete} onOpenChange={(open) => !open && setRelationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("delete_association_confirmation", { name: relationToDelete?.tech_company_name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDeleteRelation()
                }}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground"
              >
                {isLoading ? t("deleting") : t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// Exportar como PartnerTechCompanies por defecto
export default function PartnerTechCompanies(props: PartnerTechCompaniesProps) {
  return <PartnerTechCompaniesFixed {...props} />
}
