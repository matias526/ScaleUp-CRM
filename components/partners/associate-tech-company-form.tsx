"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { TechCompanyService } from "@/lib/services/tech-company-service"
import { UserService } from "@/lib/services/user-service"
import { PartnerTechCompanyService } from "@/lib/services/partner-tech-company-service"
import { Checkbox } from "@/components/ui/checkbox"

// Esquema de validación para el formulario de relación
const relationSchema = z.object({
  tech_company_id: z.string().min(1, "Selecciona una empresa tecnológica"),
  scaleup_manager_id: z.string().optional(),
  associate_tech_company: z.boolean().default(false),
})

interface AssociateTechCompanyFormProps {
  partnerId?: string
  onAssociate?: (techCompanyId: string, managerId: string | null) => void
}

export function AssociateTechCompanyForm({ partnerId, onAssociate }: AssociateTechCompanyFormProps) {
  const [techCompanies, setTechCompanies] = useState<{ id: string; name: string }[]>([])
  const [scaleupManagers, setScaleupManagers] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicializar el formulario
  const form = useForm<z.infer<typeof relationSchema>>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      tech_company_id: "",
      scaleup_manager_id: "",
      associate_tech_company: false,
    },
  })

  const associateTechCompany = form.watch("associate_tech_company")

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
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
  }, [])

  // Manejar envío del formulario
  const onSubmit = async (values: z.infer<typeof relationSchema>) => {
    if (!values.associate_tech_company) return null

    if (!partnerId) {
      // Si no hay partnerId, solo devolvemos los valores para que el componente padre los maneje
      if (onAssociate) {
        onAssociate(
          values.tech_company_id,
          values.scaleup_manager_id === "null" ? null : values.scaleup_manager_id || null,
        )
      }
      return null
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await PartnerTechCompanyService.createPartnerTechCompany({
        partner_id: partnerId,
        tech_company_id: values.tech_company_id,
        scaleup_manager_id: values.scaleup_manager_id === "null" ? null : values.scaleup_manager_id,
      })

      if (!result) {
        throw new Error("No se pudo crear la relación")
      }

      return result
    } catch (err: any) {
      setError(err.message || "Error al crear la relación")
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Asociación con Empresa Tecnológica</CardTitle>
        <CardDescription>Opcionalmente, puedes asociar este partner con una empresa tecnológica</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="associate_tech_company"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Asociar con empresa tecnológica</FormLabel>
                    <FormDescription>
                      Selecciona esta opción si deseas asociar este partner con una empresa tecnológica
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {associateTechCompany && (
              <>
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
                          {techCompanies.map((company) => (
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
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
