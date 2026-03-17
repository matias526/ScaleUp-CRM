"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { taskStatusOptions, type TaskType } from "@/types/task"
import { useTaskService } from "@/lib/services/task-service-client"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { PendingSubtasks, type PendingSubtask } from "./pending-subtasks"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  due_date: z.date().optional().nullable(),
  task_type_id: z.string().optional(),
  assigned_to: z.string().min(1, "Assigned user is required"),
  tech_company_id: z.string().optional(),
  partner_id: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface TaskFormProps {
  taskTypes: TaskType[]
  techCompanyId?: string
  partnerId?: string
}

export default function TaskForm({ taskTypes, techCompanyId, partnerId }: TaskFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const taskService = useTaskService()
  const [users, setUsers] = useState<any[]>([])
  const [techCompanies, setTechCompanies] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [filteredPartners, setFilteredPartners] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPartnerId, setUserPartnerId] = useState<string | null>(null)
  const [isPartnerUser, setIsPartnerUser] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [pendingSubtasks, setPendingSubtasks] = useState<PendingSubtask[]>([])
  const [bddManagers, setBddManagers] = useState<any[]>([])

  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  //const supabase = createClientComponentClient()

  // Cargar datos necesarios al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user)

          // Obtener el rol y partner_id del usuario
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, email, role_id, partner_id, roles:role_id(id, code)")
            .eq("id", user.id)
            .single()

          if (userError) {
            console.error("Error fetching user data:", userError)
          } else if (userData) {
            const roleCode = userData.roles?.code || null
            setUserRole(roleCode)
            setUserPartnerId(userData.partner_id)

            // Determinar si es usuario partner o admin
            const isPartner = roleCode?.toLowerCase().includes("partner") || false
            const isAdmin = roleCode?.toLowerCase() === "admin" || false

            setIsPartnerUser(isPartner)
            setIsAdminUser(isAdmin)

            // Si es un usuario partner, establecer el partner_id por defecto
            if (userData.partner_id && isPartner) {
              form.setValue("partner_id", userData.partner_id)
            }
          }
        }

        // Cargar tech companies
        if (isPartnerUser && userPartnerId) {
          // Si es usuario partner, cargar solo las tech companies relacionadas
          const { data: relatedTechCompanies, error: relatedError } = await supabase
            .from("partner_tech_companies")
            .select("tech_company_id, tech_companies:tech_company_id(id, name), scaleup_manager_id")
            .eq("partner_id", userPartnerId)

          if (relatedError) {
            console.error("Error fetching related tech companies:", relatedError)
          } else if (relatedTechCompanies) {
            const formattedTechCompanies = relatedTechCompanies.map((item) => ({
              id: item.tech_companies.id,
              name: item.tech_companies.name,
            }))
            setTechCompanies(formattedTechCompanies)

            // Obtener los BDD managers que manejan las relaciones
            const managerIds = relatedTechCompanies
              .filter((item) => item.scaleup_manager_id)
              .map((item) => item.scaleup_manager_id)

            if (managerIds.length > 0) {
              const { data: managers, error: managersError } = await supabase
                .from("users")
                .select("id, first_name, last_name, email, role_id, roles:role_id(code)")
                .in("id", managerIds)

              if (managersError) {
                console.error("Error fetching BDD managers:", managersError)
              } else if (managers) {
                setBddManagers(managers)
              }
            }
          }
        } else {
          // Si no es usuario partner, cargar todas las tech companies
          const { data: techCompaniesData } = await supabase.from("tech_companies").select("id, name")
          if (techCompaniesData) {
            setTechCompanies(techCompaniesData)
          }
        }

        // Cargar partners (solo si no es usuario partner)
        if (!isPartnerUser) {
          const { data: partnersData } = await supabase.from("partners").select("id, name")
          if (partnersData) {
            setPartners(partnersData)
            setFilteredPartners(partnersData)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Error loading initial data")
      }
    }

    fetchData()
  }, [isPartnerUser, userPartnerId])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      due_date: null,
      task_type_id: undefined,
      assigned_to: "",
      tech_company_id: techCompanyId,
      partner_id: partnerId || userPartnerId || undefined,
    },
  })

  const { watch } = form
  const watchTechCompany = watch("tech_company_id")
  const watchPartner = watch("partner_id")

  // Filter users based on selected tech company and partner
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        // Primero, verificar si hay relación entre TechCompany y Partner cuando ambos están seleccionados
        if (watchTechCompany && watchTechCompany !== "none" && watchPartner && watchPartner !== "none") {
          const { data: relationData, error: relationError } = await supabase
            .from("partner_tech_companies")
            .select("*")
            .eq("tech_company_id", watchTechCompany)
            .eq("partner_id", watchPartner)

          if (relationError) {
            console.error("Error checking relationship:", relationError)
            toast.error("Error checking relationship between Tech Company and Partner")
          } else if (!relationData || relationData.length === 0) {
            // No hay relación, mostrar mensaje de error
            form.setError("tech_company_id", {
              type: "manual",
              message: "No relationship exists between this Tech Company and Partner",
            })
            form.setError("partner_id", {
              type: "manual",
              message: "No relationship exists between this Tech Company and Partner",
            })
            setUsers([])
            setIsLoadingUsers(false)
            return
          } else {
            // Si hay relación, limpiar errores
            form.clearErrors(["tech_company_id", "partner_id"])
          }
        } else {
          // Si no están ambos seleccionados, limpiar errores
          form.clearErrors(["tech_company_id", "partner_id"])
        }

        // Lógica diferente según el tipo de usuario
        if (isPartnerUser) {
          // CASO 1: Usuario Partner - Mostrar solo usuarios de su partner y BDD managers relacionados
          let partnerUsers: any[] = []

          if (userPartnerId) {
            const { data: partnerUsersData, error: partnerUsersError } = await supabase
              .from("users")
              .select("id, first_name, last_name, email, partner_id, role_id, roles:role_id(code)")
              .eq("partner_id", userPartnerId)
              .order("first_name", { ascending: true })

            if (partnerUsersError) {
              console.error("Error fetching partner users:", partnerUsersError)
            } else if (partnerUsersData) {
              partnerUsers = partnerUsersData
            }
          }

          // Combinar usuarios del partner con los BDD managers
          const relevantUsers = [...partnerUsers, ...bddManagers]

          // Eliminar duplicados
          const uniqueUsers = relevantUsers.filter(
            (user, index, self) => index === self.findIndex((u) => u.id === user.id),
          )

          // Ordenar por nombre
          uniqueUsers.sort((a, b) => {
            const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim()
            const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim()
            return nameA.localeCompare(nameB)
          })

          setUsers(uniqueUsers)
        } else {
          // CASO 2: Usuario Admin o BDD - Mostrar usuarios según selecciones de Tech Company y Partner
          // Construir la consulta para obtener todos los usuarios
          const { data: allUsers, error: usersError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, tech_company_id, partner_id, role_id, roles:role_id(code)")
            .order("first_name", { ascending: true })

          if (usersError) {
            console.error("Error fetching users:", usersError)
            toast.error("Error loading users")
            setUsers([])
          } else if (allUsers) {
            // Filtrar usuarios según las selecciones
            const filteredUsers = allUsers.filter((user) => {
              // Incluir usuarios de ScaleUp (sin tech_company_id ni partner_id)
              const isScaleUpUser = !user.tech_company_id && !user.partner_id

              // Incluir usuarios de la tech company seleccionada
              const isTechCompanyUser =
                watchTechCompany && watchTechCompany !== "none" && user.tech_company_id === watchTechCompany

              // Incluir usuarios del partner seleccionado
              const isPartnerUser = watchPartner && watchPartner !== "none" && user.partner_id === watchPartner

              return isScaleUpUser || isTechCompanyUser || isPartnerUser
            })

            setUsers(filteredUsers)
          }
        }
      } catch (error) {
        console.error("Error in user filtering:", error)
        toast.error("Error filtering users")
        setUsers([])
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [watchTechCompany, watchPartner, form, isPartnerUser, userPartnerId, bddManagers])

  // Añadir un useEffect para filtrar partners basados en la tech company seleccionada
  useEffect(() => {
    const filterPartners = async () => {
      if (techCompanyId) {
        try {
          // Obtener partners relacionados con la tech company seleccionada
          const { data: relatedPartners, error } = await supabase
            .from("partner_tech_companies")
            .select("partner_id")
            .eq("tech_company_id", techCompanyId)

          if (error) {
            console.error("Error fetching related partners:", error)
            toast.error("Error loading related partners")
            setFilteredPartners(partners)
          } else if (relatedPartners && relatedPartners.length > 0) {
            const partnerIds = relatedPartners.map((item) => item.partner_id)
            const filtered = partners.filter((partner) => partnerIds.includes(partner.id))
            setFilteredPartners(filtered)

            // Si el partner actual no está en la lista filtrada, resetear la selección
            if (watchPartner && watchPartner !== "none" && !partnerIds.includes(watchPartner)) {
              form.setValue("partner_id", undefined)
            }
          } else {
            // No hay partners relacionados
            setFilteredPartners([])
            if (watchPartner && watchPartner !== "none") {
              form.setValue("partner_id", undefined)
            }
          }
        } catch (error) {
          console.error("Error filtering partners:", error)
          toast.error("Error filtering partners")
          setFilteredPartners(partners)
        }
      } else {
        // Si no hay tech company seleccionada, mostrar todos los partners
        setFilteredPartners(partners)
      }
    }

    filterPartners()
  }, [watchTechCompany, partners, form, watchPartner])

  // Funciones para gestionar subtareas pendientes
  const handleAddSubtask = (subtask: PendingSubtask) => {
    // Generar un ID temporal para la subtarea
    const newSubtask = {
      ...subtask,
      id: uuidv4(),
      assigned_to_name: subtask.assigned_to
        ? users.find((user) => user.id === subtask.assigned_to)?.first_name +
          " " +
          users.find((user) => user.id === subtask.assigned_to)?.last_name
        : undefined,
    }
    setPendingSubtasks([...pendingSubtasks, newSubtask])
  }

  const handleUpdateSubtask = (updatedSubtask: PendingSubtask) => {
    const updatedSubtasks = pendingSubtasks.map((subtask) =>
      subtask.id === updatedSubtask.id
        ? {
            ...updatedSubtask,
            assigned_to_name: updatedSubtask.assigned_to
              ? users.find((user) => user.id === updatedSubtask.assigned_to)?.first_name +
                " " +
                users.find((user) => user.id === updatedSubtask.assigned_to)?.last_name
              : undefined,
          }
        : subtask,
    )
    setPendingSubtasks(updatedSubtasks)
  }

  const handleDeleteSubtask = (id: string) => {
    setPendingSubtasks(pendingSubtasks.filter((subtask) => subtask.id !== id))
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)

      // Preparar los datos para enviar
      const taskData = {
        ...values,
        assigned_by: currentUser?.id || null,
        // Si es usuario partner, usar su partner_id
        partner_id: isPartnerUser ? userPartnerId : values.partner_id === "none" ? null : values.partner_id,
        // Convertir "none" a null para los campos opcionales
        tech_company_id: values.tech_company_id === "none" ? null : values.tech_company_id,
      }

      // Crear la tarea principal
      const result = await taskService.createTask(taskData)

      // Verificar si result es un objeto válido y tiene un id
      if (result && result.id) {
        const parentTaskId = result.id

        // Crear subtareas si existen
        if (pendingSubtasks.length > 0) {
          const subtaskPromises = pendingSubtasks.map((subtask) => {
            const subtaskData = {
              title: subtask.title,
              description: subtask.description || null,
              status: "pending",
              due_date: subtask.due_date,
              assigned_to: subtask.assigned_to,
              assigned_by: currentUser?.id || null,
              parent_task_id: parentTaskId,
              // Heredar tech_company_id y partner_id de la tarea principal
              tech_company_id: taskData.tech_company_id,
              partner_id: taskData.partner_id,
            }
            return taskService.createTask(subtaskData)
          })

          await Promise.all(subtaskPromises)
        }

        toast.success("Task and subtasks created successfully")

        // Redirección directa usando window.location
        window.location.href = "/dashboard/tasks"
      } else {
        console.error("Error: result is not valid or doesn't have an id", result)
        toast.error("Error creating task: Invalid result from server")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Error creating task: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Task description" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taskStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value ? new Date(value) : null)
                      }}
                      className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="task_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingUsers}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select user"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        {isLoadingUsers ? "Loading users..." : "No users available with current filters"}
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                          {user.roles?.code ? ` (${user.roles.code})` : user.partner_id ? " (Partner)" : " (ScaleUp)"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {isPartnerUser
                    ? "Only users from your partner and ScaleUp managers for your relationships are shown"
                    : "Users from ScaleUp and the selected Tech Company or Partner will be shown"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormDescription className="text-base font-medium">Related to</FormDescription>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="tech_company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tech Company</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tech company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {techCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Solo mostrar el selector de Partner si no es un usuario partner */}
          {!isPartnerUser && (
            <FormField
              control={form.control}
              name="partner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {filteredPartners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Si es un usuario partner, mostrar su partner como texto */}
          {isPartnerUser && userPartnerId && (
            <div className="space-y-2">
              <FormLabel>Partner</FormLabel>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                {partners.find((p) => p.id === userPartnerId)?.name || "Your Partner"}
                <input type="hidden" name="partner_id" value={userPartnerId} />
              </div>
              <FormDescription className="text-xs">
                Tasks will be automatically assigned to your partner
              </FormDescription>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Sección de subtareas */}
        <PendingSubtasks
          pendingSubtasks={pendingSubtasks}
          onAddSubtask={handleAddSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          users={users}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/tasks")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
