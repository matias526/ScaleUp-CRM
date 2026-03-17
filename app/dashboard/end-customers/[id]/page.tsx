import { notFound } from "next/navigation"
import Link from "next/link"
import { getEndCustomerById } from "@/lib/services/end-customer-service-server"
import { getEndCustomerPartners } from "@/lib/services/end-customer-partners-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Globe, Mail, MapPin, Phone, User, FileText } from "lucide-react"
import { EndCustomerPartners } from "@/components/end-customers/end-customer-partners"

interface EndCustomerDetailPageProps {
  params: {
    id: string
  }
}

export default async function EndCustomerDetailPage({ params }: EndCustomerDetailPageProps) {
  const [customer, partners] = await Promise.all([getEndCustomerById(params.id), getEndCustomerPartners(params.id)])

  if (!customer) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{customer.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/end-customers">Volver</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/end-customers/${customer.id}/edit`}>Editar</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(customer.industries?.name || customer.industry) && (
              <div className="flex items-start gap-2">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Industria</p>
                  <p>{customer.industries?.name || customer.industry}</p>
                </div>
              </div>
            )}

            {customer.website && (
              <div className="flex items-start gap-2">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Sitio Web</p>
                  <a
                    href={customer.website.startsWith("http") ? customer.website : `https://${customer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {customer.website}
                  </a>
                </div>
              </div>
            )}

            {(customer.city || customer.countries?.name) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p>{[customer.city, customer.countries?.name].filter(Boolean).join(", ")}</p>
                </div>
              </div>
            )}

            {customer.tax_id && (
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">ID Fiscal</p>
                  <p>{customer.tax_id}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contacto Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.primary_contact_name ? (
              <>
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p>{customer.primary_contact_name}</p>
                  </div>
                </div>

                {customer.primary_contact_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${customer.primary_contact_email}`} className="text-primary hover:underline">
                        {customer.primary_contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {customer.primary_contact_phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p>{customer.primary_contact_phone}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No hay información de contacto registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección de Partners Relacionados */}
      <EndCustomerPartners partners={partners} />
    </div>
  )
}
