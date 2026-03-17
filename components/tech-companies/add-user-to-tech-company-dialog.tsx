"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { UserFormData } from "@/lib/services/user-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AddUserToTechCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  techCompanyId: string
  onUserAdded: () => void
}

export function AddUserToTechCompanyDialog({
  open,
  onOpenChange,
  techCompanyId,
  onUserAdded,
}: AddUserToTechCompanyDialogProps) {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [language, setLanguage] = useState("es") // Idioma preferido, por defecto español
  const [isActive, setIsActive] = useState(true)
  const [requireConfirmation, setRequireConfirmation] = useState(false) // Nuevo estado para requerir confirmación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [roleId, setRoleId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Obtener el ID del rol "TechUser"
  useEffect(() => {
    async function fetchRoleId() {
      try {
        // Primero, veamos todos los roles disponibles - solo seleccionamos id y code
        const allRoles = await supabase.from("roles").select("id, code")

        if (allRoles.error) {
          console.error("Error al obtener todos los roles:", allRoles.error.message)
        }

        // Ahora busquemos el rol correcto - solo seleccionamos id y code
        const { data, error } = await supabase.from("roles").select("id, code").eq("code", "TechUser").single()

        if (error) {
          console.error("Error al obtener el rol TechUser:", error.message)
          setErrors((prev) => ({ ...prev, role: `No se pudo obtener el rol TechUser: ${error.message}` }))
          return
        }

        if (data) {
          console.log("Rol TechUser encontrado:", data)
          setRoleId(data.id)
        } else {
          console.error("No se encontró el rol TechUser")
          setErrors((prev) => ({ ...prev, role: "No se encontró el rol TechUser" }))
        }
      } catch (err: any) {
        console.error("Error al obtener el rol:", err.message)
        setErrors((prev) => ({ ...prev, role: `Error al obtener el rol TechUser: ${err.message}` }))
      }
    }

    if (open) {
      fetchRoleId()
    }
  }, [supabase, open, techCompanyId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email) newErrors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "El email no es válido"

    if (!firstName) newErrors.firstName = "El nombre es requerido"
    if (!lastName) newErrors.lastName = "El apellido es requerido"
    if (!roleId) newErrors.role = "No se pudo obtener el rol de Tech User"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Usar una contraseña fija para pruebas
      const password = "123456"

      // Crear el usuario con el tech_company_id y el rol TechUser
      const userData: UserFormData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        is_active: isActive,
        tech_company_id: techCompanyId,
        role_id: roleId!, // Usamos el roleId que obtuvimos de la base de datos
        require_email_confirmation: requireConfirmation, // Usar el valor del checkbox
        preferred_language: language, // Usar el idioma seleccionado
      }

      // Intentar crear el usuario directamente con la API
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(`Error en la API: ${responseData.error || "Error desconocido"}`)
      }

      if (responseData.user) {
        toast({
          title: "Usuario creado",
          description: `Se ha creado el usuario ${firstName} ${lastName} y se ha asociado a la empresa tecnológica`,
        })

        // Limpiar formulario y cerrar diálogo
        resetForm()
        onOpenChange(false)
        onUserAdded()
      } else {
        throw new Error("No se recibió información del usuario creado")
      }
    } catch (error: any) {
      console.error("Error al crear usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setFirstName("")
    setLastName("")
    setPhone("")
    setLanguage("es")
    setIsActive(true)
    setRequireConfirmation(false)
    setErrors({})
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetForm()
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Usuario</DialogTitle>
          <DialogDescription>Crea un nuevo usuario asociado a esta empresa tecnológica</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {errors.role && <div className="bg-red-100 p-3 rounded-md text-red-800 text-sm">{errors.role}</div>}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nombre"
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellido"
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          {/* Selector de idioma preferido */}
          <div className="grid gap-2">
            <Label htmlFor="language">Idioma preferido</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(!!checked)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Usuario activo
            </Label>
          </div>

          {/* Checkbox para requerir confirmación de email */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requireConfirmation"
              checked={requireConfirmation}
              onCheckedChange={(checked) => setRequireConfirmation(!!checked)}
            />
            <Label htmlFor="requireConfirmation" className="cursor-pointer">
              Requerir confirmación de email
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !roleId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
