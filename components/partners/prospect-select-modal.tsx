"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ProspectPartnerService } from "@/lib/services/prospect-partner-service"

interface ProspectSelectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (prospect: any) => void
}

export function ProspectSelectModal({ open, onOpenChange, onSelect }: ProspectSelectModalProps) {
  const [prospects, setProspects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (open) {
      loadProspects()
    }
  }, [open])

  const loadProspects = async () => {
    setLoading(true)
    try {
      const { data } = await ProspectPartnerService.getProspectPartners(1, 100, {
        searchTerm: searchTerm || undefined,
      })
      // Solo mostrar prospects no convertidos
      const unconvertedProspects = data.filter(p => !p.converted_partner_id)
      setProspects(unconvertedProspects)
    } catch (error) {
      console.error("[v0] Error loading prospects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const filteredProspects = prospects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.website?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Prospect para Convertir</DialogTitle>
          <DialogDescription>Elige un prospect partner para convertirlo en un partner oficial</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Buscar prospect por nombre..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredProspects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "No se encontraron prospects" : "No hay prospects disponibles"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredProspects.map((prospect) => (
                  <div key={prospect.id} className="py-2 px-2 hover:bg-accent transition-colors flex items-center justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium leading-tight">{prospect.name}</h3>
                      <p className="text-xs text-muted-foreground truncate leading-tight">
                        {prospect.website || "Sin sitio web"}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      onClick={() => {
                        onSelect(prospect)
                        onOpenChange(false)
                      }}
                      className="flex-shrink-0 whitespace-nowrap"
                    >
                      Seleccionar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
