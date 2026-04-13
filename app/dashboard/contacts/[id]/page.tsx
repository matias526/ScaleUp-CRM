"use client"

import { useState, useEffect } from "react"
import { ContactService, type Contact } from "@/lib/services/contact-service"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Phone, MapPin, Linkedin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const DEPARTMENT_COLORS: Record<string, string> = {
  sales: "bg-blue-100 text-blue-800",
  technical: "bg-purple-100 text-purple-800",
  marketing: "bg-green-100 text-green-800",
  operations: "bg-orange-100 text-orange-800",
  finance: "bg-red-100 text-red-800",
  hr: "bg-pink-100 text-pink-800",
  executive: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800",
}

const DEPARTMENT_LABELS: Record<string, string> = {
  sales: "Ventas",
  technical: "Técnico",
  marketing: "Marketing",
  operations: "Operaciones",
  finance: "Finanzas",
  hr: "Recursos Humanos",
  executive: "Ejecutiva",
  other: "Otro",
}

const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
}

export default function ViewContactPage({ params }: { params: { id: string } }) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadContact = async () => {
      try {
        const data = await ContactService.getContactById(params.id)
        if (data) {
          setContact(data)
        } else {
          setError("Contacto no encontrado")
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el contacto")
      } finally {
        setIsLoading(false)
      }
    }

    loadContact()
  }, [params.id])

  if (isLoading) {
    return (
      <main className="flex h-96 items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </main>
    )
  }

  if (error || !contact) {
    return (
      <main className="space-y-6 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error || "Contacto no encontrado"}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/contacts")}>
          Volver a contactos
        </Button>
      </main>
    )
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {contact.first_name} {contact.last_name}
          </h1>
          <p className="text-gray-600">{contact.position}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/dashboard/contacts/${contact.id}/edit`)}>
          Editar Contacto
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              </div>

              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {contact.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Linkedin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">LinkedIn</p>
                    <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Ver Perfil
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información Profesional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Departamento</p>
                <Badge className={DEPARTMENT_COLORS[contact.department] || DEPARTMENT_COLORS.other}>
                  {DEPARTMENT_LABELS[contact.department] || contact.department}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600">Idioma Preferido</p>
                <Badge variant="outline">
                  {LANGUAGE_LABELS[contact.preferred_language] || contact.preferred_language}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Card */}
      {contact.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-gray-700">{contact.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>ID:</span>
            <span className="font-mono">{contact.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Creado:</span>
            <span>{new Date(contact.created_at).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
          {contact.updated_at && (
            <div className="flex justify-between">
              <span>Actualizado:</span>
              <span>{new Date(contact.updated_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <Button variant="outline" onClick={() => router.push("/dashboard/contacts")}>
        Volver a Contactos
      </Button>
    </main>
  )
}
