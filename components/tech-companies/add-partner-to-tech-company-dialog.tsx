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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Partner {
  id: string
  name: string
  code: string
  is_active: boolean
}

interface AddPartnerToTechCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  techCompanyId: string
  onPartnerAdded: () => void
}

export function AddPartnerToTechCompanyDialog({
  open,
  onOpenChange,
  techCompanyId,
  onPartnerAdded,
}: AddPartnerToTechCompanyDialogProps) {
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([])
  const [selectedPartners, setSelectedPartners] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Cargar partners disponibles (que no estén ya asociados)
  useEffect(() => {
    const loadAvailablePartners = async () => {
      if (!open || !techCompanyId) return

      setIsLoading(true)
      try {
        // Primero, obtener los IDs de partners ya asociados
        const { data: existingLinks } = await supabase
          .from("partner_tech_companies")
          .select("partner_id")
          .eq("tech_company_id", techCompanyId)

        const existingPartnerIds = existingLinks?.map((link) => link.partner_id) || []

        // Luego, obtener todos los partners que no estén en esa lista
        let query = supabase.from("partners").select("id, name, code, is_active").order("name")

        if (existingPartnerIds.length > 0) {
          query = query.not("id", "in", `(${existingPartnerIds.join(",")})`)
        }

        const { data, error } = await query

        if (error) throw error
        setAvailablePartners(data || [])
      } catch (error) {
        console.error("Error al cargar partners disponibles:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los partners disponibles",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAvailablePartners()
  }, [open, techCompanyId, supabase, toast])

  const handlePartnerToggle = (partnerId: string) => {
    setSelectedPartners((prev) =>
      prev.includes(partnerId) ? prev.filter((id) => id !== partnerId) : [...prev, partnerId],
    )
  }

  const handleSubmit = async () => {
    if (selectedPartners.length === 0) {
      toast({
        title: "Selección requerida",
        description: "Por favor, selecciona al menos un partner",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Crear las asociaciones entre partners y tech company
      const linksToInsert = selectedPartners.map((partnerId) => ({
        partner_id: partnerId,
        tech_company_id: techCompanyId,
      }))

      const { error } = await supabase.from("partner_tech_companies").insert(linksToInsert)

      if (error) throw error

      toast({
        title: "Partners asociados",
        description: `Se han asociado ${selectedPartners.length} partners a la empresa tecnológica`,
      })

      // Limpiar selección y cerrar diálogo
      setSelectedPartners([])
      onOpenChange(false)
      onPartnerAdded()
    } catch (error) {
      console.error("Error al asociar partners:", error)
      toast({
        title: "Error",
        description: "No se pudieron asociar los partners seleccionados",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asociar Partners</DialogTitle>
          <DialogDescription>Selecciona los partners que deseas asociar a esta empresa tecnológica</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="partners-list">Partners disponibles</Label>
          <div className="mt-2 max-h-[300px] overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando partners...</span>
              </div>
            ) : availablePartners.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No hay partners disponibles para asociar</div>
            ) : (
              <div className="divide-y">
                {availablePartners.map((partner) => (
                  <div
                    key={partner.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${
                      selectedPartners.includes(partner.id) ? "bg-muted" : ""
                    }`}
                    onClick={() => handlePartnerToggle(partner.id)}
                  >
                    <div>
                      <div className="font-medium flex items-center">
                        {partner.name}
                        <Badge variant={partner.is_active ? "success" : "destructive"} className="ml-2 text-xs">
                          {partner.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{partner.code}</div>
                    </div>
                    {selectedPartners.includes(partner.id) && <Check className="h-5 w-5 text-primary" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{selectedPartners.length} partners seleccionados</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedPartners.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asociar Partners
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
