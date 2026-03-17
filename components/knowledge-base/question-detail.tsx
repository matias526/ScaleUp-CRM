"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, Clock, Edit, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface QuestionDetailProps {
  questionId: string
}

export function QuestionDetail({ questionId }: QuestionDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [question, setQuestion] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [canApprove, setCanApprove] = useState(false)

  useEffect(() => {
    loadQuestion()
  }, [questionId])

  const loadQuestion = async () => {
    try {
      const response = await fetch(`/api/knowledge-base/questions/${questionId}`)
      if (!response.ok) throw new Error("Error al cargar la pregunta")

      const data = await response.json()
      setQuestion(data)
      setCanApprove(data.can_approve || false)
    } catch (error) {
      console.error("Error loading question:", error)
      toast({
        title: "Error",
        description: "Error al cargar la pregunta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/knowledge-base/questions/${questionId}/approve`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Error al aprobar la pregunta")

      toast({
        title: "Pregunta aprobada",
        description: "La pregunta ha sido aprobada correctamente",
      })

      loadQuestion()
    } catch (error) {
      console.error("Error approving question:", error)
      toast({
        title: "Error",
        description: "Error al aprobar la pregunta",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando...</div>
  }

  if (!question) {
    return <div className="flex justify-center p-8">Pregunta no encontrada</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{question.question}</h1>
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
          <p className="text-sm text-muted-foreground">
            Versión {question.version} • Creada el{" "}
            {format(new Date(question.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          {!question.is_approved && canApprove && (
            <Button onClick={handleApprove} disabled={isApproving}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/dashboard/knowledge-base/${questionId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Tecnología</p>
            <p className="font-medium">{question.tech_company?.name}</p>
          </div>

          {question.labels && question.labels.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Labels</p>
              <div className="flex flex-wrap gap-2">
                {question.labels.map((label: any) => (
                  <Badge key={label.id} variant="outline" style={{ backgroundColor: label.color + "20" }}>
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Respuesta</p>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{question.answer}</p>
            </div>
          </div>

          {question.attachments && question.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Archivos Adjuntos</p>
                <div className="space-y-2">
                  {question.attachments.map((attachment: any) => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">{attachment.file_name}</span>
                      </div>
                      <Download className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Creado por</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{question.created_by_user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <span>{question.created_by_user?.name}</span>
              </div>
            </div>
            {question.is_approved && question.approved_by_user && (
              <div>
                <p className="text-muted-foreground mb-1">Aprobado por</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{question.approved_by_user?.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <span>{question.approved_by_user?.name}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
