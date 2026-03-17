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
import { Edit, Loader2 } from "lucide-react"
import { UserService, type User } from "@/lib/services/user-service"
import { useToast } from "@/hooks/use-toast"

interface EditPartnerUserDialogProps {
  user: User
  onUserUpdated: () => void
  trigger?: React.ReactNode
}

export function EditPartnerUserDialog({ user, onUserUpdated, trigger }: EditPartnerUserDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Valores del formulario
  const [email, setEmail] = useState(user.email || "")
  const [firstName, setFirstName] = useState(user.first_name || "")
  const [lastName, setLastName] = useState(user.last_name || "")
  const [phone, setPhone] = useState(user.phone || "")
  const [isActive, setIsActive] = useState(user.is_active)

  // Actualizar los valores del formulario cuando cambia el usuario
  useEffect(() => {
    setEmail(user.email || "")
    setFirstName(user.first_name || "")
    setLastName(user.last_name || "")
    setPhone(user.phone || "")
    setIsActive(user.is_active)
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError(null)

    try {
      const updatedUser = await UserService.updateUser(user.id, {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role_id: user.role_id,
        partner_id: user.partner_id,
        is_active: isActive,
      })

      if (!updatedUser) {
        throw new Error("No se pudo actualizar el usuario")
      }

      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado correctamente",
      })

      // Cerramos el diálogo y notificamos
      setIsOpen(false)
      onUserUpdated()
    } catch (err: any) {
      console.error("Error al actualizar usuario:", err)
      setError(err.message || "Error al actualizar usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información del usuario {firstName} {lastName}.
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
          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
            <Label htmlFor="isActive" className="text-sm">
              Usuario activo
            </Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
