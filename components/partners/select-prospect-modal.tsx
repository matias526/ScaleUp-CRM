"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { ProspectPartner } from "@/types/prospect-partner"

interface SelectProspectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (prospect: ProspectPartner) => void
}

export function SelectProspectModal({ open, onOpenChange, onSelect }: SelectProspectModalProps) {
  const [prospects, setProspects] = useState<ProspectPartner[]>([])
  const [filteredProspects, setFilteredProspects] = useState<ProspectPartner[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (open) {
      loadProspects()
    }
  }, [open])

  useEffect(() => {
    // Filter prospects where converted_partner_id is null (not yet converted)
    const filtered = prospects.filter(
      (p) =>
        !p.converted_partner_id &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredProspects(filtered)
  }, [searchTerm, prospects])

  const loadProspects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("prospect_partners")
        .select("*")
        .is("converted_partner_id", null)
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setProspects(data || [])
    } catch (err) {
      console.error("Error loading prospects:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Prospect para Convertir</DialogTitle>
          <DialogDescription>
            Elige un prospect partner para convertirlo en un partner oficial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <Input
            placeholder="Buscar prospect por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          {/* Prospects list */}
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
                  <div
                    key={prospect.id}
                    className="p-4 hover:bg-accent/50 transition-colors flex justify-between items-start gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{prospect.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {prospect.website || "Sin sitio web"}
                      </p>
                      {prospect.lead_source && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fuente: {prospect.lead_source}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelect(prospect)
                        onOpenChange(false)
                      }}
                      className="flex-shrink-0"
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
