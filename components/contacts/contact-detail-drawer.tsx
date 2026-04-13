"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Globe, Building, Briefcase } from "lucide-react"
import { type Contact } from "@/lib/services/contact-service"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"
import { useState, useEffect } from "react"
import { OpportunityContactService } from "@/lib/services/opportunity-contact-service"

interface ContactDetailDrawerProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDetailDrawer({ contact, open, onOpenChange }: ContactDetailDrawerProps) {
  const { t } = useTranslations(DICT_LANG_CONTACTS)
  const [relatedOpportunities, setRelatedOpportunities] = useState<any[]>([])
  const [loadingOpportunities, setLoadingOpportunities] = useState(false)

  useEffect(() => {
    const loadOpportunities = async () => {
      if (contact?.id && open) {
        setLoadingOpportunities(true)
        try {
          const opportunities = await OpportunityContactService.getOpportunitiesByContact(contact.id)
          setRelatedOpportunities(opportunities || [])
        } catch (error) {
          console.error("Error loading opportunities:", error)
          setRelatedOpportunities([])
        } finally {
          setLoadingOpportunities(false)
        }
      }
    }

    loadOpportunities()
  }, [contact?.id, open])

  if (!contact) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contact.first_name} {contact.last_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* General Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Información General</h3>

            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline break-all">
                  {contact.email}
                </a>
              </div>
            </div>

            {/* Phone */}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                  <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Position */}
            {contact.position && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Cargo</p>
                  <p className="text-sm font-medium">{contact.position}</p>
                </div>
              </div>
            )}

            {/* Department */}
            {contact.department && (
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Departamento</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {t(`contacts.department.${contact.department}`)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Language */}
            {contact.preferred_language && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Idioma Preferido</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {contact.preferred_language.toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Notas</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
                  {contact.notes}
                </p>
              </div>
            )}

            {/* LinkedIn */}
            {contact.linkedin_url && (
              <div>
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                >
                  LinkedIn
                  <span className="text-xs">↗</span>
                </a>
              </div>
            )}
          </div>

          {/* Related Opportunities Section */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900">Oportunidades Relacionadas</h3>
            
            {loadingOpportunities ? (
              <p className="text-sm text-gray-500">Cargando oportunidades...</p>
            ) : relatedOpportunities.length > 0 ? (
              <div className="space-y-2">
                {relatedOpportunities.map((opp) => (
                  <div key={opp.id} className="flex items-start gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{opp.name}</p>
                      <p className="text-xs text-gray-500">{opp.company_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay oportunidades relacionadas</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
