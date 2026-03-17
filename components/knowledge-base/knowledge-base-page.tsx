"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, BookOpen, CheckCircle, Clock, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { KnowledgeBaseService, type KnowledgeBaseQuestion } from "@/lib/services/knowledge-base-service"
import { useAuth } from "@/components/auth/auth-provider"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function KnowledgeBasePage() {
  const router = useRouter()
  const { userInfo } = useAuth()
  const [questions, setQuestions] = useState<KnowledgeBaseQuestion[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<KnowledgeBaseQuestion[]>([])
  const [techCompanies, setTechCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [labels, setLabels] = useState<Array<{ id: string; name: string; color: string | null }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTechCompany, setSelectedTechCompany] = useState<string>("all")
  const [selectedLabel, setSelectedLabel] = useState<string>("all")
  const [showApprovedOnly, setShowApprovedOnly] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [questions, searchTerm, selectedTechCompany, selectedLabel, showApprovedOnly])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [questionsData, techCompaniesData, labelsData] = await Promise.all([
        KnowledgeBaseService.getQuestions(),
        KnowledgeBaseService.getTechCompanies(),
        KnowledgeBaseService.getLabels(),
      ])

      setQuestions(questionsData)
      setTechCompanies(techCompaniesData)
      setLabels(labelsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...questions]

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por TechCompany
    if (selectedTechCompany !== "all") {
      filtered = filtered.filter((q) => q.tech_company_id === selectedTechCompany)
    }

    // Filtro por Label (esto requeriría cargar los labels de cada pregunta)
    // Por ahora lo dejamos comentado para simplificar
    // if (selectedLabel !== "all") {
    //   filtered = filtered.filter((q) => q.labels?.some((l) => l.id === selectedLabel))
    // }

    // Filtro por aprobadas
    if (showApprovedOnly) {
      filtered = filtered.filter((q) => q.is_approved)
    }

    setFilteredQuestions(filtered)
  }

  const isAdmin = userInfo?.roleCode === "Admin" // Cambiado de "admin" a "Admin" para coincidir con el código de rol en la base de datos

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Base de Conocimiento (FAQ)</h1>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => router.push("/dashboard/knowledge-base/settings")}>
              <Filter className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          )}
          <Button onClick={() => router.push("/dashboard/knowledge-base/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Pregunta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Preguntas y Respuestas</CardTitle>
          <CardDescription>Busca y filtra preguntas frecuentes sobre tecnologías</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar en preguntas y respuestas..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Select value={selectedTechCompany} onValueChange={setSelectedTechCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las tecnologías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tecnologías</SelectItem>
                {techCompanies.map((tc) => (
                  <SelectItem key={tc.id} value={tc.id}>
                    {tc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={showApprovedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowApprovedOnly(!showApprovedOnly)}
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {showApprovedOnly ? "Aprobadas" : "Todas"}
              </Button>
            </div>
          </div>

          {/* Lista de preguntas */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron preguntas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card
                  key={question.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/knowledge-base/${question.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{question.question}</h3>
                          {question.is_approved ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprobada
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{question.answer}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-medium">{question.tech_company?.name}</span>
                          <span>
                            Creada por {question.creator?.first_name} {question.creator?.last_name}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(question.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
