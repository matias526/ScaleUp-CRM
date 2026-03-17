"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth/auth-provider"
import { useTranslations } from "@/hooks/use-translations"
import { createOpportunity } from "@/lib/services/opportunity-service"
import { supabase } from "@/lib/supabase/client"

// Schema de validación
const opportunitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  tech_company_id: z.string().min(1, "La empresa tecnológica es requerida"),
  partner_id: z.string().min(1, "El partner es requerido"),
  end_customer_id: z.string().optional(),
  country_id: z.string().min(1, "El país es requerido"),
  stage_id: z.string().min(1, "La etapa es requerida"),
  assigned_to: z.string().optional(),
  estimated_value: z.number().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

export function OpportunityCreateFormFinalFix() {
  const router = useRouter()
  const { user, userInfo } = useAuth()
  const { t } = useTranslations()

  // Estados para datos de selects
  const [techCompanies, setTechCompanies] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [endCustomers, setEndCustomers] = useState<any[]>([])
  const [countries, setCountries] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Form con valores por defecto estables
  const defaultValues = useMemo(
    () => ({
      name: "",
      description: "",
      tech_company_id: "",
      partner_id: userInfo?.partnerId || "",
      end_customer_id: "",
      country_id: "",
      stage_id: "",
      assigned_to: "",
      estimated_value: undefined,
    }),
    [userInfo?.partnerId],
  )

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues,
  })

  // Funciones para cargar datos directamente con Supabase
  const loadTechCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("tech_companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error cargando tech companies:", error)
        return []
      }

      console.log("Tech companies cargadas:", data?.length)
      return data || []
    } catch (error) {
      console.error("Error inesperado cargando tech companies:", error)
      return []
    }
  }

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase.from("partners").select("id, name").eq("is_active", true).order("name")

      if (error) {
        console.error("Error cargando partners:", error)
        return []
      }

      console.log("Partners cargados:", data?.length)
      return data || []
    } catch (error) {
      console.error("Error inesperado cargando partners:", error)
      return []
    }
  }

  const loadEndCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("end_customers")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error cargando end customers:", error)
        return []
      }

      console.log("End customers cargados:", data?.length)
      return data || []
    } catch (error) {
      console.error("Error inesperado cargando end customers:", error)
      return []
    }
  }

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase.from("countries").select("id, name, code").order("name")

      if (error) {
        console.error("Error cargando countries:", error)
        return []
      }

      console.log("Countries cargados:", data?.length)
      return data || []
    } catch (error) {
      console.error("Error inesperado cargando countries:", error)
      return []
    }
  }

  const loadStages = async () => {
    try {
      console.log("Intentando cargar pipeline stages...")

      // Primero intentamos con display_order
      let { data, error } = await supabase
        .from("pipeline_stages")
        .select("id, name, code, display_order")
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Error cargando stages con display_order:", error)

        // Si falla, intentamos sin display_order
        const result = await supabase.from("pipeline_stages").select("id, name, code").order("id")

        data = result.data
        error = result.error
      }

      if (error) {
        console.error("Error cargando stages:", error)
        return []
      }

      console.log("Stages cargados:", data?.length, data)
      return data || []
    } catch (error) {
      console.error("Error inesperado cargando stages:", error)
      return []
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .order("first_name")

      if (error) {
        console.error("Error cargando users:", error)
        return []
      }

      console.log("Users cargados:", data?.length)
      return data || []
    } catch (error) {
      console.error("Error inesperado cargando users:", error)
      return []
    }
  }

  // Función para cargar todos los datos
  const loadData = useCallback(async () => {
    if (dataLoaded) return

    try {
      setLoading(true)
      console.log("Iniciando carga de datos...")

      const [techCompaniesData, partnersData, endCustomersData, countriesData, stagesData, usersData] =
        await Promise.all([
          loadTechCompanies(),
          loadPartners(),
          loadEndCustomers(),
          loadCountries(),
          loadStages(),
          loadUsers(),
        ])

      setTechCompanies(techCompaniesData)
      setPartners(partnersData)
      setEndCustomers(endCustomersData)
      setCountries(countriesData)
      setStages(stagesData)
      setUsers(usersData)
      setDataLoaded(true)

      console.log("Datos cargados exitosamente")
      console.log("Stages finales:", stagesData)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }, [dataLoaded])

  // Cargar datos solo una vez
  useEffect(() => {
    if (userInfo && !dataLoaded) {
      console.log("UserInfo disponible, cargando datos...")
      loadData()
    }
  }, [userInfo, dataLoaded, loadData])

  // Función de envío
  const onSubmit = useCallback(
    async (data: OpportunityFormData) => {
      if (!user || !userInfo) return

      try {
        setLoading(true)
        console.log("Enviando formulario:", data)

        const opportunityData = {
          ...data,
          created_by: user.id,
          estimated_value: data.estimated_value || null,
        }

        await createOpportunity(opportunityData, [], userInfo.roleCode)
        router.push("/dashboard/opportunities")
      } catch (error) {
        console.error("Error creando oportunidad:", error)
      } finally {
        setLoading(false)
      }
    },
    [user, userInfo, router],
  )

  // Filtros memoizados
  const filteredPartners = useMemo(() => {
    if (userInfo?.partnerId) {
      return partners.filter((p) => p.id === userInfo.partnerId)
    }
    return partners
  }, [partners, userInfo?.partnerId])

  if (!userInfo) {
    return <div className="p-4">Cargando información del usuario...</div>
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t("opportunities.create.title", "Crear Nueva Oportunidad")}</CardTitle>
        <div className="text-sm text-gray-500">
          Debug: Tech Companies: {techCompanies.length}, Partners: {partners.length}, Countries: {countries.length},
          Stages: {stages.length}
        </div>
        {stages.length === 0 && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            ⚠️ No se pudieron cargar las etapas del pipeline. Revisa la tabla pipeline_stages en la base de datos.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("opportunities.create.name", "Nombre")} *</label>
              <Input
                {...form.register("name")}
                placeholder={t("opportunities.create.namePlaceholder", "Nombre de la oportunidad")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Empresa Tecnológica */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("opportunities.create.techCompany", "Empresa Tecnológica")} *
              </label>
              <select {...form.register("tech_company_id")} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">{t("opportunities.create.selectTechCompany", "Seleccionar empresa")}</option>
                {techCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.tech_company_id && (
                <p className="text-sm text-red-600">{form.formState.errors.tech_company_id.message}</p>
              )}
            </div>

            {/* Partner */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("opportunities.create.partner", "Partner")} *</label>
              <select
                {...form.register("partner_id")}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!!userInfo.partnerId}
              >
                <option value="">{t("opportunities.create.selectPartner", "Seleccionar partner")}</option>
                {filteredPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.partner_id && (
                <p className="text-sm text-red-600">{form.formState.errors.partner_id.message}</p>
              )}
            </div>

            {/* Cliente Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("opportunities.create.endCustomer", "Cliente Final")}
                {userInfo.roleCode?.toLowerCase() === "partner" && " *"}
              </label>
              <select {...form.register("end_customer_id")} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">{t("opportunities.create.selectEndCustomer", "Seleccionar cliente")}</option>
                {endCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.end_customer_id && (
                <p className="text-sm text-red-600">{form.formState.errors.end_customer_id.message}</p>
              )}
            </div>

            {/* País */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("opportunities.create.country", "País")} *</label>
              <select {...form.register("country_id")} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">{t("opportunities.create.selectCountry", "Seleccionar país")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.country_id && (
                <p className="text-sm text-red-600">{form.formState.errors.country_id.message}</p>
              )}
            </div>

            {/* Etapa */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("opportunities.create.stage", "Etapa")} *</label>
              <select {...form.register("stage_id")} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">{t("opportunities.create.selectStage", "Seleccionar etapa")}</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name || stage.code}
                  </option>
                ))}
              </select>
              {form.formState.errors.stage_id && (
                <p className="text-sm text-red-600">{form.formState.errors.stage_id.message}</p>
              )}
            </div>

            {/* Asignado a */}
            {userInfo.isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("opportunities.create.assignedTo", "Asignado a")}</label>
                <select {...form.register("assigned_to")} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">{t("opportunities.create.selectUser", "Seleccionar usuario")}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Valor Estimado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("opportunities.create.estimatedValue", "Valor Estimado")}
              </label>
              <Input type="number" {...form.register("estimated_value", { valueAsNumber: true })} placeholder="0" />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("opportunities.create.description", "Descripción")}</label>
            <Textarea
              {...form.register("description")}
              placeholder={t("opportunities.create.descriptionPlaceholder", "Descripción de la oportunidad")}
              rows={4}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/opportunities")}
              disabled={loading}
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={loading || stages.length === 0}>
              {loading ? t("common.saving", "Guardando...") : t("common.save", "Guardar")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
