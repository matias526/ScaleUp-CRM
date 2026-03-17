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

// Esquema de validación para el formulario de relación
const relationSchema = z.object({
  tech_company_id: z.string().min(1, "Selecciona una empresa tecnológica"),
  scaleup_manager_id: z.string().optional(),
})

interface PartnerTechCompaniesProps {
  partnerId: string
}

export function PartnerTechCompanies({ partnerId }: PartnerTechCompaniesProps) {
  const [relations, setRelations] = useState<PartnerTechCompany[]>([])
  const [techCompanies, setTechCompanies] = useState<{ id: string; name: string }[]>([])
  const [scaleupManagers, setScaleupManagers] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [relationToDelete, setRelationToDelete] = useState<PartnerTechCompany | null>(null)
  const [relationToUpdate, setRelationToUpdate] = useState<PartnerTechCompany | null>(null)

  // Inicializar el formulario
  const form = useForm<z.infer<typeof relationSchema>>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      tech_company_id: "",
      scaleup_manager_id: "",
    },
  })

  // Cargar datos iniciales
  useEffect(() => {
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

        // Cargar usuarios de ScaleUp (filtrar por rol TechUser)
        const { data: usersData } = await UserService.getUsers(1, 100)
        const scaleupUsers = usersData.filter((user) => user.role_code === "TechUser")
        setScaleupManagers(
          scaleupUsers.map((user) => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
          })),
        )
      } catch (err: any) {
        setError(err.message || "Error al cargar datos")
      } finally {
        setIsLoading(false)
      }
    }

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
        const updatedRelations = await PartnerTechCompanyService.getPartnerTechCompanies(partnerId)
        setRelations(updatedRelations)

        // Resetear formulario y cerrar diálogo
        form.reset()
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
      const updatedRelations = await PartnerTechCompanyService.getPartnerTechCompanies(partnerId)
      setRelations(updatedRelations)

      setRelationToUpdate(null)
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
      const updatedRelations = await PartnerTechCompanyService.getPartnerTechCompanies(partnerId)
      setRelations(updatedRelations)

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
            <CardTitle>Empresas Tecnológicas Asociadas</CardTitle>
            <CardDescription>Gestiona las empresas tecnológicas asociadas a este partner</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={availableTechCompanies.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Asociar Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asociar Empresa Tecnológica</DialogTitle>
                <DialogDescription>
                  Selecciona una empresa tecnológica para asociarla a este partner y opcionalmente asigna un gestor de
                  ScaleUp.
                </DialogDescription>
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
                        <FormLabel>Empresa Tecnológica</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una empresa" />
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
                        <FormDescription>Empresa tecnológica que se asociará con este partner</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scaleup_manager_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gestor de ScaleUp</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un gestor (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">Sin gestor asignado</SelectItem>
                            {scaleupManagers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Usuario de ScaleUp que gestionará esta relación (opcional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar"
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
          <div className="text-center py-8 text-muted-foreground">
            No hay empresas tecnológicas asociadas a este partner
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa Tecnológica</TableHead>
                <TableHead>Gestor de ScaleUp</TableHead>
                <TableHead>Fecha de Asociación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                        <SelectValue placeholder="Sin gestor asignado">
                          {relation.scaleup_manager_name || "Sin gestor asignado"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Sin gestor asignado</SelectItem>
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
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la asociación con la empresa tecnológica "{relationToDelete?.tech_company_name}".
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDeleteRelation()
                }}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground"
              >
                {isLoading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
