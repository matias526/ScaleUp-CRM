"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2 } from "lucide-react"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"

interface AddPartnerUserDialogProps {
  partnerId: string
  partnerName: string
  onUserAdded: () => void
}

export function AddPartnerUserDialog({ partnerId, partnerName, onUserAdded }: AddPartnerUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roleId, setRoleId] = useState<string | null>(null)
  //const supabase = createClientComponentClient()

  // Valores del formulario
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [language, setLanguage] = useState("es") // Idioma preferido, por defecto español
  const [requireConfirmation, setRequireConfirmation] = useState(false)

  // Obtener el ID del rol "PartnerUser"
  useEffect(() => {
    async function fetchRoleId() {
      try {
        const { data, error } = await supabase.from("roles").select("id, code").eq("code", "PartnerUser").single()

        if (error) {
          console.error("Error al obtener el rol:", error)
          return
        }

        if (data) {
          setRoleId(data.id)
        }
      } catch (err) {
        console.error("Error al obtener el rol:", err)
      }
    }

    fetchRoleId()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roleId) {
      setError("No se pudo obtener el rol de Partner User. Inténtalo de nuevo más tarde.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Usar una contraseña fija para pruebas
      const password = "123456"

      // Crear el usuario usando el endpoint de administración
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          role_id: roleId,
          partner_id: partnerId,
          is_active: true,
          preferred_language: language, // Usar el idioma seleccionado
          theme_preference: "light",
          require_email_confirmation: requireConfirmation,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear usuario")
      }

      // Cerramos el diálogo y notificamos
      setIsOpen(false)
      onUserAdded()

      // Limpiamos el formulario
      setEmail("")
      setFirstName("")
      setLastName("")
      setPhone("")
      setLanguage("es")
      setRequireConfirmation(false)
    } catch (err: any) {
      console.error("Error al crear usuario:", err)
      setError(err.message || "Error al crear usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button data-dialog-trigger="true">
          <UserPlus className="mr-2 h-4 w-4" />
          Añadir Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Usuario al Partner</DialogTitle>
          <DialogDescription>
            Añade un nuevo usuario al partner {partnerName}. El usuario tendrá el rol de Partner User.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-100 p-3 rounded-md text-red-800 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                placeholder="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+34 123 456 789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Selector de idioma preferido */}
          <div className="space-y-2">
            <Label htmlFor="partnerLanguage">Idioma preferido</Label>
            <select
              id="partnerLanguage"
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
            <Checkbox
              id="requireConfirmation"
              checked={requireConfirmation}
              onCheckedChange={(checked) => setRequireConfirmation(checked === true)}
            />
            <Label htmlFor="requireConfirmation" className="text-sm">
              Requerir confirmación de email
            </Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
