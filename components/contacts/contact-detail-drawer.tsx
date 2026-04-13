"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, Globe, Building, Briefcase } from "lucide-react"
import { type Contact } from "@/lib/services/contact-service"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"

interface ContactDetailDrawerProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDetailDrawer({ contact, open, onOpenChange }: ContactDetailDrawerProps) {
  const { t } = useTranslations(DICT_LANG_CONTACTS)

  if (!contact) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contact.first_name} {contact.last_name}</DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Email */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline break-all">
                    {contact.email}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phone */}
          {contact.phone && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                    <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Position */}
          {contact.position && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Cargo</p>
                    <p className="text-sm font-medium">{contact.position}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Department */}
          {contact.department && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Departamento</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {t(`contacts.department.${contact.department}`)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Language */}
          {contact.preferred_language && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Idioma Preferido</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {contact.preferred_language.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {contact.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* LinkedIn */}
          {contact.linkedin_url && (
            <Card>
              <CardContent className="pt-4">
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                >
                  LinkedIn
                  <span className="text-xs">↗</span>
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
