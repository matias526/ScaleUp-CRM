import { notFound } from "next/navigation"
import { getPartnerById } from "@/lib/services/partner-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TranslationService } from "@/lib/services/translation-service"
import PartnerUsersSimple from "@/components/partners/partner-users-simple"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

export default async function PartnerSimplePage({ params }: { params: { id: string } }) {
  console.log("Intentando cargar partner simple con ID:", params.id)

  try {
    const partner = await getPartnerById(params.id)

    console.log("Resultado de getPartnerById (simple):", partner ? "Partner encontrado" : "Partner no encontrado")

    if (!partner) {
      console.log("Partner no encontrado en vista simple, redirigiendo a 404")
      notFound()
    }

    const t = (key: string, defaultValue = "") => TranslationService.getTranslation(key, "es", defaultValue)

    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">{partner.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>{t("partner.details", "Detalles del Partner")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                  <ImageWithFallback
                    src={partner.logo_url || ""}
                    fallbackSrc="/diverse-business-team.png"
                    alt={partner.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-semibold">{partner.name}</h2>
                <p className="text-gray-500">{partner.website || t("partner.no_website", "Sin sitio web")}</p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div>
                  <span className="font-medium">{t("partner.country", "País")}:</span>{" "}
                  <span>{partner.main_country_name || t("partner.no_country", "No especificado")}</span>
                </div>
                <div>
                  <span className="font-medium">{t("partner.address", "Dirección")}:</span>{" "}
                  <span>{partner.address || t("partner.no_address", "No especificada")}</span>
                </div>
                <div>
                  <span className="font-medium">{t("partner.city", "Ciudad")}:</span>{" "}
                  <span>{partner.city || t("partner.no_city", "No especificada")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <PartnerUsersSimple partnerId={partner.id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error al cargar la página simple del partner:", error)
    notFound()
  }
}
