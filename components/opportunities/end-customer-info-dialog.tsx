"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  AlertOctagon,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EndCustomerInfoDialogProps {
  open: boolean
  onClose: () => void
  opportunity: any
  endCustomerId: string
}

// Función para normalizar texto (quitar acentos, convertir a minúsculas, etc.)
function normalizeText(text: string): string {
  if (!text) return ""
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Función para normalizar URLs
function normalizeUrl(url: string): string {
  if (!url) return ""
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
}

// Función para calcular la distancia de Levenshtein (para detectar typos)
function levenshteinDistance(a: string, b: string): number {
  const matrix = []

  // Inicializar la matriz
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Rellenar la matriz
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          Math.min(
            matrix[i][j - 1] + 1, // inserción
            matrix[i - 1][j] + 1, // eliminación
          ),
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Función para calcular la similitud entre dos strings (0-100%)
function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const normalizedA = normalizeText(a)
  const normalizedB = normalizeText(b)

  const maxLength = Math.max(normalizedA.length, normalizedB.length)
  if (maxLength === 0) return 100 // Ambos strings vacíos

  const distance = levenshteinDistance(normalizedA, normalizedB)
  return Math.round(((maxLength - distance) / maxLength) * 100)
}

// Función para detectar transposiciones de caracteres (como "Agrosuper" vs "Agrospuer")
function detectTranspositions(a: string, b: string): boolean {
  if (!a || !b) return false
  if (Math.abs(a.length - b.length) > 2) return false // Si la diferencia de longitud es mayor a 2, no son transposiciones

  const normalizedA = normalizeText(a)
  const normalizedB = normalizeText(b)

  // Si son exactamente iguales, no hay transposición
  if (normalizedA === normalizedB) return false

  // Si la longitud es diferente, no puede ser solo transposición
  if (normalizedA.length !== normalizedB.length) return false

  // Contar caracteres diferentes
  let differences = 0
  for (let i = 0; i < normalizedA.length; i++) {
    if (normalizedA[i] !== normalizedB[i]) {
      differences++
    }
  }

  // Si hay exactamente 2 o 4 diferencias, podría ser una transposición
  return differences === 2 || differences === 4
}

// Función para quitar sufijos legales comunes
function removeLegalSuffixes(name: string): string {
  if (!name) return ""
  const normalized = normalizeText(name)
  return normalized
    .replace(/(s\.a\.?|s\.l\.?|inc\.?|corp\.?|ltd\.?|limited|llc|gmbh|co\.?|company|corporation)(\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function EndCustomerInfoDialog({ open, onClose, opportunity, endCustomerId }: EndCustomerInfoDialogProps) {
  const [endCustomer, setEndCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [loadingDuplicates, setLoadingDuplicates] = useState(false)
  const [relatedOpportunities, setRelatedOpportunities] = useState<any[]>([])
  
  // Cargar datos completos del cliente final
  useEffect(() => {
    console.log("EndCustomerInfoDialog - Props recibidas:", {
      open,
      endCustomerId,
      opportunity: opportunity?.title,
    })
    async function loadEndCustomerData() {
      if (!endCustomerId || !open) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Consulta para obtener el cliente final con sus relaciones
        const { data, error } = await supabase
          .from("end_customers")
          .select(`
    *,
    industry:industry_id (
      id,
      name
    ),
    country:country_id (
      id,
      name,
      code
    )
  `)
          .eq("id", endCustomerId)
          .single()

        if (error) {
          throw error
        }

        setEndCustomer(data)
        console.log("Datos del cliente final cargados:", data)

        // Una vez que tenemos los datos del cliente, buscamos duplicados
        if (data) {
          findDuplicates(data)
          findRelatedOpportunities(endCustomerId)
        }
      } catch (err) {
        console.error("Error detallado al cargar datos del cliente final:", {
          error: err,
          endCustomerId,
          errorMessage: err?.message,
          errorDetails: err?.details,
        })
        setError(`Error al cargar datos: ${err?.message || "Error desconocido"}`)
      } finally {
        setLoading(false)
      }
    }

    loadEndCustomerData()
  }, [endCustomerId, open])

  // Buscar clientes finales duplicados o similares
  async function findDuplicates(customer: any) {
    if (!customer) return

    setLoadingDuplicates(true)
    try {
      // Obtener todos los clientes finales excepto el actual
      const { data: allCustomers, error } = await supabase
        .from("end_customers")
        .select(`
    *,
    industry:industry_id (
      id,
      name
    ),
    country:country_id (
      id,
      name,
      code
    )
  `)
        .neq("id", customer.id)

      if (error) throw error

      const potentialDuplicates = []

      // Normalizar los datos del cliente actual
      const normalizedName = normalizeText(customer.name)
      const simplifiedName = removeLegalSuffixes(customer.name)
      const normalizedWebsite = normalizeUrl(customer.website)

      console.log("Cliente actual:", {
        name: customer.name,
        normalizedName,
        simplifiedName,
        website: customer.website,
        normalizedWebsite,
        taxId: customer.tax_id,
      })

      // Buscar duplicados entre todos los clientes
      for (const otherCustomer of allCustomers || []) {
        const matchReasons = []
        let highestSimilarity = 0

        // Verificar ID fiscal exacto
        if (customer.tax_id && otherCustomer.tax_id && customer.tax_id === otherCustomer.tax_id) {
          matchReasons.push({
            type: "tax_id",
            description: "ID Fiscal idéntico",
            similarity: 100,
            critical: true,
          })
          console.log(`ID Fiscal coincidente: ${customer.name} vs ${otherCustomer.name}`)
        }

        // Verificar website exacto
        if (customer.website && otherCustomer.website) {
          const otherNormalizedWebsite = normalizeUrl(otherCustomer.website)
          if (normalizedWebsite && otherNormalizedWebsite && normalizedWebsite === otherNormalizedWebsite) {
            matchReasons.push({
              type: "website",
              description: "Sitio web idéntico",
              similarity: 100,
              critical: true,
            })
            console.log(`Website coincidente: ${customer.name} vs ${otherCustomer.name}`)
          }
        }

        // Verificar similitud de nombres
        const otherNormalizedName = normalizeText(otherCustomer.name)
        const otherSimplifiedName = removeLegalSuffixes(otherCustomer.name)

        // Caso especial para "Agrosuper" vs "Agrospuer"
        if (
          (normalizedName.includes("agrosuper") && otherNormalizedName.includes("agrospuer")) ||
          (normalizedName.includes("agrospuer") && otherNormalizedName.includes("agrosuper"))
        ) {
          console.log("¡CASO ESPECIAL DETECTADO! Agrosuper vs Agrospuer")
          matchReasons.push({
            type: "typo",
            description: "Posible error tipográfico",
            similarity: 95,
            critical: true,
          })
          highestSimilarity = 95
        }

        // Detectar transposiciones de caracteres (como "Agrosuper" vs "Agrospuer")
        if (detectTranspositions(normalizedName, otherNormalizedName)) {
          console.log(`Transposición detectada: ${normalizedName} vs ${otherNormalizedName}`)
          matchReasons.push({
            type: "transposition",
            description: "Transposición de caracteres",
            similarity: 90,
            critical: true,
          })
          highestSimilarity = Math.max(highestSimilarity, 90)
        }

        // Similitud con nombre completo (reducir umbral de 80% a 65%)
        const nameSimilarity = calculateSimilarity(normalizedName, otherNormalizedName)
        console.log(`Similitud de nombre: ${customer.name} vs ${otherCustomer.name} = ${nameSimilarity}%`)

        // Umbral más bajo para nombres cortos
        const similarityThreshold = normalizedName.length <= 10 ? 65 : 70

        if (nameSimilarity > similarityThreshold) {
          matchReasons.push({
            type: "name",
            description: "Nombre similar",
            similarity: nameSimilarity,
            critical: nameSimilarity > 85,
          })
          highestSimilarity = Math.max(highestSimilarity, nameSimilarity)
        }

        // Similitud con nombre simplificado (reducir umbral de 85% a 70%)
        const simplifiedSimilarity = calculateSimilarity(simplifiedName, otherSimplifiedName)
        console.log(`Similitud simplificada: ${simplifiedName} vs ${otherSimplifiedName} = ${simplifiedSimilarity}%`)

        if (simplifiedSimilarity > 70 && simplifiedSimilarity > nameSimilarity) {
          matchReasons.push({
            type: "simplified_name",
            description: "Nombre similar (sin sufijos legales)",
            similarity: simplifiedSimilarity,
            critical: simplifiedSimilarity > 85,
          })
          highestSimilarity = Math.max(highestSimilarity, simplifiedSimilarity)
        }

        // Verificar si contienen palabras clave similares
        const customerWords = normalizedName.split(" ").filter((word) => word.length > 2)
        const otherWords = otherNormalizedName.split(" ").filter((word) => word.length > 2)

        let commonWords = 0
        for (const word of customerWords) {
          if (otherWords.some((otherWord) => calculateSimilarity(word, otherWord) > 80)) {
            commonWords++
          }
        }

        const wordSimilarity = customerWords.length > 0 ? (commonWords / customerWords.length) * 100 : 0
        if (wordSimilarity > 60 && customerWords.length > 1) {
          matchReasons.push({
            type: "word_similarity",
            description: "Palabras clave similares",
            similarity: Math.round(wordSimilarity),
            critical: wordSimilarity > 80,
          })
          highestSimilarity = Math.max(highestSimilarity, wordSimilarity)
          console.log(`Similitud de palabras: ${customer.name} vs ${otherCustomer.name} = ${wordSimilarity}%`)
        }

        // Si encontramos alguna coincidencia, agregamos este cliente a los duplicados potenciales
        if (matchReasons.length > 0) {
          console.log(`Duplicado potencial encontrado: ${otherCustomer.name}`, matchReasons)
          potentialDuplicates.push({
            customer: otherCustomer,
            matchReasons,
            highestSimilarity,
            opportunities: [], // Inicializar array vacío
          })
        }
      }

      // Ordenar duplicados por criticidad y similitud
      potentialDuplicates.sort((a, b) => {
        // Primero por si tiene razones críticas
        const aCritical = a.matchReasons.some((r) => r.critical)
        const bCritical = b.matchReasons.some((r) => r.critical)

        if (aCritical && !bCritical) return -1
        if (!aCritical && bCritical) return 1

        // Luego por similitud más alta
        return b.highestSimilarity - a.highestSimilarity
      })

      console.log(`Total de duplicados encontrados: ${potentialDuplicates.length}`)

      // Para cada duplicado, buscar sus oportunidades
      for (let i = 0; i < potentialDuplicates.length; i++) {
        const duplicate = potentialDuplicates[i]
        console.log(
          `Buscando oportunidades para duplicado ${i + 1}: ${duplicate.customer.name} (ID: ${duplicate.customer.id})`,
        )

        const { data: oppData, error: oppError } = await supabase
          .from("opportunities")
          .select(`
            *,
            tech_company:tech_company_id (name),
            partner:partner_id (name),
            pipeline_stage:pipeline_stage_id (id, code)
          `)
          .eq("end_customer_id", duplicate.customer.id)

        if (oppError) {
          console.error(`Error al buscar oportunidades para ${duplicate.customer.name}:`, oppError)
        } else {
          console.log(`Encontradas ${oppData?.length || 0} oportunidades para ${duplicate.customer.name}`)
          duplicate.opportunities = oppData || []
        }
      }

      setDuplicates(potentialDuplicates)
    } catch (err) {
      console.error("Error al buscar duplicados:", err)
    } finally {
      setLoadingDuplicates(false)
    }
  }

  // Buscar oportunidades relacionadas con este cliente final
  async function findRelatedOpportunities(customerId: string) {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
    *,
    tech_company:tech_company_id (id, name),
    partner:partner_id (id, name),
    pipeline_stage:pipeline_stage_id (id, code),
    created_by_user:created_by (id, first_name, last_name),
    assigned_to_user:assigned_to (id, first_name, last_name)
  `)
        .eq("end_customer_id", customerId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setRelatedOpportunities(data || [])
    } catch (err) {
      console.error("Error al buscar oportunidades relacionadas:", err)
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No disponible"
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  // Obtener el color de badge según el estado de la oportunidad
  const getStatusColor = (stageCode: string) => {
    if (!stageCode) return "default"

    const code = stageCode.toLowerCase()
    if (code.includes("won") || code.includes("ganada")) return "success"
    if (code.includes("lost") || code.includes("perdida")) return "destructive"
    if (code.includes("negotiation") || code.includes("negociacion")) return "warning"
    if (code.includes("proposal") || code.includes("propuesta")) return "blue"
    if (code.includes("qualified") || code.includes("calificada")) return "secondary"
    return "default"
  }

  // Renderizar el indicador de similitud
  const renderSimilarityIndicator = (similarity: number) => {
    if (similarity >= 95) {
      return <span className="text-red-600 font-bold">{similarity}% ⚠️</span>
    } else if (similarity >= 85) {
      return <span className="text-amber-600 font-semibold">{similarity}% ⚠️</span>
    } else {
      return <span className="text-gray-600">{similarity}%</span>
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Building2 className="h-6 w-6 mr-2 text-primary" />
            Análisis del Cliente Final
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
          ) : (
            <Tabs defaultValue="info">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="info">Información Básica</TabsTrigger>
                <TabsTrigger value="duplicates">
                  Posibles Duplicados{" "}
                  {duplicates.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {duplicates.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="opportunities">
                  Oportunidades{" "}
                  {relatedOpportunities.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {relatedOpportunities.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                {/* Información básica del cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Nombre de la empresa</h4>
                        <p className="text-lg font-semibold">{endCustomer?.name || "No especificado"}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          Sitio web
                        </h4>
                        <p className="text-sm">
                          {endCustomer?.website ? (
                            <a
                              href={
                                endCustomer.website.startsWith("http")
                                  ? endCustomer.website
                                  : `https://${endCustomer.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              {endCustomer.website}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          ) : (
                            "No especificado"
                          )}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Ubicación
                        </h4>
                        <p className="text-sm">
                          {endCustomer?.city && endCustomer?.country?.name
                            ? `${endCustomer.city}, ${endCustomer.country.name}`
                            : endCustomer?.city || endCustomer?.country?.name || "No especificado"}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          ID Fiscal
                        </h4>
                        <p className="text-sm font-mono">{endCustomer?.tax_id || "No especificado"}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Industria</h4>
                        <p className="text-sm">{endCustomer?.industry?.name || "No especificada"}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Registrado en sistema
                        </h4>
                        <p className="text-sm">{formatDate(endCustomer?.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información de contacto */}
                {(endCustomer?.primary_contact_name ||
                  endCustomer?.primary_contact_email ||
                  endCustomer?.primary_contact_phone) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Phone className="h-5 w-5 mr-2" />
                        Contacto Principal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Nombre</h4>
                          <p className="text-sm">{endCustomer?.primary_contact_name || "No especificado"}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </h4>
                          <p className="text-sm">
                            {endCustomer?.primary_contact_email ? (
                              <a
                                href={`mailto:${endCustomer.primary_contact_email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {endCustomer.primary_contact_email}
                              </a>
                            ) : (
                              "No especificado"
                            )}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            Teléfono
                          </h4>
                          <p className="text-sm">{endCustomer?.primary_contact_phone || "No especificado"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="duplicates" className="space-y-4">
                {loadingDuplicates ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : duplicates.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <h3 className="text-lg font-medium mb-2">No se encontraron duplicados</h3>
                      <p className="text-gray-500">
                        No se detectaron clientes finales similares o duplicados en el sistema.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-800">
                            Se encontraron {duplicates.length} posibles duplicados
                          </h3>
                          <p className="text-sm text-amber-700 mt-1">
                            Revise cuidadosamente estos clientes finales que podrían ser el mismo que "
                            {endCustomer?.name}".
                          </p>
                        </div>
                      </div>
                    </div>

                    {duplicates.map((duplicate, index) => (
                      <Card
                        key={index}
                        className={
                          duplicate.matchReasons.some((r) => r.critical)
                            ? "border-red-300 shadow-sm"
                            : "border-amber-200"
                        }
                      >
                        <CardHeader
                          className={
                            duplicate.matchReasons.some((r) => r.critical)
                              ? "bg-red-50 border-b border-red-200"
                              : "bg-amber-50 border-b border-amber-200"
                          }
                        >
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg flex items-center">
                              {duplicate.matchReasons.some((r) => r.critical) ? (
                                <AlertOctagon className="h-5 w-5 mr-2 text-red-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                              )}
                              {duplicate.customer.name}
                            </CardTitle>
                            <div>
                              {duplicate.matchReasons.map((reason, i) => (
                                <Badge
                                  key={i}
                                  variant={reason.critical ? "destructive" : "outline"}
                                  className="ml-2 mb-1"
                                >
                                  {reason.description} {renderSimilarityIndicator(reason.similarity)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">ID Fiscal</h4>
                              <p className="text-sm font-mono">
                                {duplicate.customer.tax_id || "No especificado"}
                                {endCustomer?.tax_id &&
                                  duplicate.customer.tax_id &&
                                  endCustomer.tax_id === duplicate.customer.tax_id && (
                                    <Badge variant="destructive" className="ml-2">
                                      Coincidencia exacta
                                    </Badge>
                                  )}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Sitio web</h4>
                              <p className="text-sm">
                                {duplicate.customer.website ? (
                                  <a
                                    href={
                                      duplicate.customer.website.startsWith("http")
                                        ? duplicate.customer.website
                                        : `https://${duplicate.customer.website}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {duplicate.customer.website}
                                  </a>
                                ) : (
                                  "No especificado"
                                )}
                                {endCustomer?.website &&
                                  duplicate.customer.website &&
                                  normalizeUrl(endCustomer.website) === normalizeUrl(duplicate.customer.website) && (
                                    <Badge variant="destructive" className="ml-2">
                                      Coincidencia exacta
                                    </Badge>
                                  )}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Ubicación</h4>
                              <p className="text-sm">
                                {duplicate.customer.city && duplicate.customer.country?.name
                                  ? `${duplicate.customer.city}, ${duplicate.customer.country.name}`
                                  : duplicate.customer.city || duplicate.customer.country?.name || "No especificado"}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Industria</h4>
                              <p className="text-sm">{duplicate.customer.industry?.name || "No especificada"}</p>
                            </div>
                          </div>

                          {/* Oportunidades asociadas a este cliente duplicado */}
                          <div className="mt-4 border-t pt-4">
                            <h4 className="text-sm font-medium mb-3 flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Oportunidades asociadas ({duplicate.opportunities?.length || 0})
                            </h4>

                            {!duplicate.opportunities || duplicate.opportunities.length === 0 ? (
                              <div className="text-sm text-gray-500 italic">
                                No hay oportunidades asociadas a este cliente final.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {duplicate.opportunities.map((opp, i) => (
                                  <div key={i} className="bg-white border border-gray-200 rounded-md p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-sm">{opp.title}</h5>
                                      <Badge variant={getStatusColor(opp.pipeline_stage?.code || "")}>
                                        {opp.pipeline_stage?.code || "Desconocido"}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                                      <div>
                                        <span className="font-medium">Partner:</span> {opp.partner?.name || "N/A"}
                                      </div>
                                      <div>
                                        <span className="font-medium">Tech Company:</span>{" "}
                                        {opp.tech_company?.name || "N/A"}
                                      </div>
                                      <div>
                                        <span className="font-medium">Valor:</span>{" "}
                                        {opp.estimated_value ? formatCurrency(opp.estimated_value) : "N/A"}
                                      </div>
                                    </div>
                                    {opp.description && (
                                      <div className="mt-2 text-xs text-gray-500">
                                        <span className="font-medium">Descripción:</span> {opp.description}
                                      </div>
                                    )}
                                    <div className="mt-2 text-xs text-gray-400">
                                      Creada: {formatDate(opp.created_at)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="opportunities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Historial de Oportunidades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relatedOpportunities.length === 0 ? (
                      <div className="text-center py-6">
                        <Search className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          No se encontraron oportunidades adicionales para este cliente final.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-medium">Título</th>
                              <th className="text-left py-2 font-medium">Partner</th>
                              <th className="text-left py-2 font-medium">Tech Company</th>
                              <th className="text-left py-2 font-medium">Estado</th>
                              <th className="text-left py-2 font-medium">Creada</th>
                              <th className="text-right py-2 font-medium">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatedOpportunities.map((opp, i) => (
                              <tr key={i} className="border-b border-gray-100">
                                <td className="py-2">{opp.title}</td>
                                <td className="py-2">{opp.partner?.name || "N/A"}</td>
                                <td className="py-2">{opp.tech_company?.name || "N/A"}</td>
                                <td className="py-2">
                                  <Badge variant={getStatusColor(opp.pipeline_stage?.code || "")}>
                                    {opp.pipeline_stage?.code || "Sin estado"}
                                  </Badge>
                                </td>
                                <td className="py-2">{formatDate(opp.created_at)}</td>
                                <td className="py-2 text-right">
                                  {opp.estimated_value ? formatCurrency(opp.estimated_value) : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
