"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { updateOpportunity, getUsersByPartner } from "@/lib/services/follow-up-meeting-service"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

interface EditOpportunityDialogProps {
  open: boolean
  onClose: () => void
  opportunity: any
  onSuccess?: () => void
  partnerUsers?: any[]
}

export function EditOpportunityDialog({
  open,
  onClose,
  opportunity,
  onSuccess,
  partnerUsers = [],
}: EditOpportunityDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date | undefined>(
    opportunity.estimated_close_date ? new Date(opportunity.estimated_close_date) : undefined,
  )
  const [partnerResponsible, setPartnerResponsible] = useState(opportunity.partner_responsible || "")
  const [description, setDescription] = useState(opportunity.description || "")
  const [isNewPartner, setIsNewPartner] = useState(opportunity.is_new_partner || false)
  const [users, setUsers] = useState<any[]>(partnerUsers)
  const [loading, setLoading] = useState(false)

  const isScaleUpUser = user?.roleCode?.toLowerCase() !== "partneruser"

  useEffect(() => {
    const loadUsers = async () => {
      if (partnerUsers.length === 0 && opportunity?.partner?.id) {
        setLoading(true)
        try {
          const loadedUsers = await getUsersByPartner(opportunity.partner.id)
          setUsers(loadedUsers)
          console.log("Loaded partner users:", loadedUsers)
        } catch (error) {
          console.error("Error loading partner users:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setUsers(partnerUsers)
      }
    }

    loadUsers()
  }, [opportunity, partnerUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updateData: any = {
        id: opportunity.id,
        estimated_close_date: date ? date.toISOString() : null,
        partner_responsible: partnerResponsible,
        description: description,
      }

      if (isScaleUpUser) {
        updateData.is_new_partner = isNewPartner
      }

      await updateOpportunity(updateData)

      toast({
        title: "Oportunidad actualizada",
        description: "La oportunidad se ha actualizado correctamente.",
      })

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error) {
      console.error("Error al actualizar oportunidad:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la oportunidad. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatUserName = (user: any) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.email || "Usuario sin nombre"
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Oportunidad</DialogTitle>
          <DialogDescription>
            Actualiza la información de la oportunidad. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={opportunity.title} disabled className="bg-gray-100" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descripción de la oportunidad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_close_date">Fecha de cierre estimada</Label>
            <Input
              id="estimated_close_date"
              type="date"
              value={date ? new Date(date).toISOString().split("T")[0] : ""}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value) : undefined
                setDate(newDate)
              }}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner_responsible">Responsable del Partner</Label>
            {loading ? (
              <div className="text-sm text-gray-500">Cargando usuarios...</div>
            ) : (
              <Select value={partnerResponsible} onValueChange={setPartnerResponsible}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {formatUserName(user)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no_users" disabled>
                      No hay usuarios disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
