"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, CheckCircle2, XCircle, Circle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface InternalMeetingSummaryProps {
  meetingId: string
  meetingDate: string
  weeklyTopic: string | null
}

interface NewsItem {
  id: string
  title: string
  description: string
}

interface Commitment {
  id: string
  title: string
  description: string
  commitment_status: "completed" | "not_completed" | "partial" | null
  tech_company_name: string | null
  user_name: string
}

interface Participant {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function InternalMeetingSummary({ meetingId, meetingDate, weeklyTopic }: InternalMeetingSummaryProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [previousCommitments, setPreviousCommitments] = useState<Commitment[]>([])
  const [currentCommitments, setCurrentCommitments] = useState<Commitment[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [scaleupUsers, setScaleupUsers] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()
  useEffect(() => {
    loadSummaryData()
  }, [meetingId])

  const loadSummaryData = async () => {
    setLoading(true)
    try {
      // Cargar noticias
      const newsResponse = await fetch(`/api/internal-meetings/${meetingId}`)
      if (newsResponse.ok) {
        const newsResult = await newsResponse.json()
        if (newsResult.success) {
          setNewsItems(newsResult.news || [])
        }
      }

      // Cargar compromisos
      const commitmentsResponse = await fetch(`/api/internal-meetings/${meetingId}/commitments?t=${Date.now()}`)
      //const commitmentsResponse = await fetch(`/api/internal-meetings/${meetingId}/commitments`)
      if (commitmentsResponse.ok) {
        const commitmentsResult = await commitmentsResponse.json()
        if (commitmentsResult.success) {
          setPreviousCommitments(commitmentsResult.previousCommitments || [])
          setCurrentCommitments(commitmentsResult.currentCommitments || [])
        }
      }

      // Cargar participantes
      const participantsResponse = await fetch(`/api/internal-meetings/${meetingId}/participants`)
      if (participantsResponse.ok) {
        const participantsResult = await participantsResponse.json()
        if (participantsResult.success) {
          setParticipants(participantsResult.participants || [])
        }
      }

      // Cargar usuarios ScaleUp para el selector de email
      const usersResponse = await fetch("/api/users?roles=Admin,BDD")
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json()
        if (usersResult.success) {
          setScaleupUsers(usersResult.users || [])
        }
      }
    } catch (error) {
      console.error("Error loading summary data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCommitmentStats = () => {
    if (previousCommitments.length === 0) {
      return { completed: 0, notCompleted: 0, partial: 0, percentage: 0 }
    }

    const completed = previousCommitments.filter((c) => c.commitment_status === "completed").length
    const notCompleted = previousCommitments.filter((c) => c.commitment_status === "not_completed").length
    const partial = previousCommitments.filter((c) => c.commitment_status === "partial").length
    const percentage = Math.round(((completed + partial * 0.5) / previousCommitments.length) * 100)

    return { completed, notCompleted, partial, percentage }
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "not_completed":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "partial":
        return <Circle className="h-5 w-5 text-yellow-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "completed":
        return "Cumplido"
      case "not_completed":
        return "No cumplido"
      case "partial":
        return "Parcial"
      default:
        return "Sin revisar"
    }
  }

  const handleAddEmail = () => {
    if (!newEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setEmailError("Formato de email inválido")
      return
    }

    if (
      additionalEmails.includes(newEmail) ||
      selectedUsers.some((id) => scaleupUsers.find((u) => u.id === id)?.email === newEmail)
    ) {
      setEmailError("Este email ya ha sido añadido")
      return
    }

    setAdditionalEmails((prev) => [...prev, newEmail])
    setNewEmail("")
    setEmailError(null)
  }

  const handleRemoveEmail = (email: string) => {
    setAdditionalEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleSendEmail = async () => {
    console.log("[v0] handleSendEmail called")
    console.log("[v0] Selected users:", selectedUsers)
    console.log("[v0] Additional emails:", additionalEmails)

    const selectedEmails = selectedUsers
      .map((id) => scaleupUsers.find((u) => u.id === id)?.email)
      .filter(Boolean) as string[]
    const allEmails = [...selectedEmails, ...additionalEmails]

    console.log("[v0] All emails to send:", allEmails)

    if (allEmails.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un destinatario",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      console.log("[v0] Sending POST request to:", `/api/internal-meetings/${meetingId}/send-summary`)

      const response = await fetch(`/api/internal-meetings/${meetingId}/send-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: allEmails,
        }),
      })

      console.log("[v0] Response status:", response.status)

      const result = await response.json()
      console.log("[v0] Response result:", result)

      if (result.success) {
        toast({
          title: "Email enviado",
          description: `Resumen enviado a ${allEmails.length} destinatario(s)`,
        })
        setShowEmailDialog(false)
        setSelectedUsers([])
        setAdditionalEmails([])
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar el email",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error sending email:", error)
      toast({
        title: "Error",
        description: "Error al enviar el email",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const stats = calculateCommitmentStats()
  const commitmentsByUser = previousCommitments.reduce(
    (acc, commitment) => {
      if (!acc[commitment.user_name]) {
        acc[commitment.user_name] = []
      }
      acc[commitment.user_name].push(commitment)
      return acc
    },
    {} as Record<string, Commitment[]>,
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cierre y Próximos Pasos</h2>
        <Button onClick={() => setShowEmailDialog(true)} className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Enviar Resumen por Email
        </Button>
      </div>

      {/* Noticias Generales */}
      <Card>
        <CardHeader>
          <CardTitle>Noticias Generales</CardTitle>
        </CardHeader>
        <CardContent>
          {newsItems.length > 0 ? (
            <div className="space-y-4">
              {newsItems.map((news) => (
                <div key={news.id} className="border-l-4 border-blue-600 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">{news.title}</h4>
                  {news.description && <p className="text-sm text-gray-600 mt-1">{news.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay noticias generales</p>
          )}
        </CardContent>
      </Card>

      {/* Compromisos */}
      <Card>
        <CardHeader>
          <CardTitle>Compromisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compromisos Semana Anterior */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Compromisos Semana Anterior</h3>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {stats.percentage}% Cumplimiento
              </Badge>
            </div>

            {previousCommitments.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(commitmentsByUser).map(([userName, userCommitments]) => {
                  const userCompleted = userCommitments.filter((c) => c.commitment_status === "completed").length
                  const userPartial = userCommitments.filter((c) => c.commitment_status === "partial").length
                  const userPercentage = Math.round(
                    ((userCompleted + userPartial * 0.5) / userCommitments.length) * 100,
                  )

                  return (
                    <div key={userName} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{userName}</h4>
                        <Badge variant={userPercentage >= 70 ? "default" : "secondary"}>{userPercentage}%</Badge>
                      </div>
                      <div className="space-y-2">
                        {userCommitments.map((commitment) => (
                          <div key={commitment.id} className="flex items-start gap-3 bg-white p-3 rounded">
                            {getStatusIcon(commitment.commitment_status)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{commitment.title}</p>
                              {commitment.tech_company_name && (
                                <p className="text-xs text-gray-500 mt-1">{commitment.tech_company_name}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getStatusText(commitment.commitment_status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Estadística General */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Estadística General del Equipo</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                      <div className="text-xs text-gray-600">Cumplidos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
                      <div className="text-xs text-gray-600">Parciales</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.notCompleted}</div>
                      <div className="text-xs text-gray-600">No Cumplidos</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay compromisos de la semana anterior</p>
            )}
          </div>

          {/* Compromisos Asumidos Esta Reunión */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Compromisos Asumidos Esta Reunión</h3>
            {currentCommitments.length > 0 ? (
              <div className="space-y-2">
                {currentCommitments.map((commitment) => (
                  <div key={commitment.id} className="flex items-start gap-3 bg-gray-50 p-3 rounded">
                    <Circle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {commitment.user_name}: {commitment.title}
                      </p>
                      {commitment.tech_company_name && (
                        <p className="text-xs text-gray-500 mt-1">{commitment.tech_company_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No se asumieron compromisos durante esta reunión</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tema de la Semana */}
      {weeklyTopic && (
        <Card>
          <CardHeader>
            <CardTitle>Tema de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-900 font-medium">{weeklyTopic}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para seleccionar destinatarios */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="email-dialog-description">
          <DialogHeader>
            <DialogTitle>Enviar Resumen por Email</DialogTitle>
            <p id="email-dialog-description" className="text-sm text-gray-500">
              Seleccione los destinatarios para enviar el resumen de la reunión
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Usuarios ScaleUp */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Usuarios ScaleUp</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {scaleupUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers((prev) => [...prev, user.id])
                        } else {
                          setSelectedUsers((prev) => prev.filter((id) => id !== user.id))
                        }
                      }}
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Emails adicionales */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Emails Adicionales</h3>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Añadir email adicional"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value)
                    setEmailError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddEmail()
                    }
                  }}
                  className={emailError ? "border-red-300" : ""}
                />
                <Button type="button" onClick={handleAddEmail} variant="outline">
                  Añadir
                </Button>
              </div>
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}

              {additionalEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {additionalEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                      {email}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmail(email)}
                        className="h-4 w-4 p-0 hover:bg-gray-300 rounded-full"
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t text-sm text-gray-500">
              Destinatarios seleccionados:{" "}
              <span className="font-medium text-blue-600">{selectedUsers.length + additionalEmails.length}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sending || (selectedUsers.length === 0 && additionalEmails.length === 0)}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Resumen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
