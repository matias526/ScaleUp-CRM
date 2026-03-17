"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"
import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react"

type ActionItem = {
  id: string
  type: "validation" | "risk" | "assignment" | "task"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  dueDate?: string
}

export function ActionCenter() {
  const { t } = useTranslations()
  const [data, setData] = useState<ActionItem[] | null>(null)

  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    // For now, we'll use mock data
    setData([
      {
        id: "1",
        type: "validation",
        title: "Validar oportunidad: CloudTech - Expansión Regional",
        description: "Oportunidad de alto valor que requiere validación",
        priority: "high",
        dueDate: "2023-05-15",
      },
      {
        id: "2",
        type: "risk",
        title: "Riesgo: SecureNet - Implementación Enterprise",
        description: "Sin actividad en los últimos 30 días",
        priority: "high",
      },
      {
        id: "3",
        type: "assignment",
        title: "Asignar BDD: DataInsights - Proyecto Analytics",
        description: "Nueva oportunidad sin BDD asignado",
        priority: "medium",
      },
      {
        id: "4",
        type: "task",
        title: "Tarea vencida: Seguimiento AILabs",
        description: "Tarea de seguimiento vencida hace 2 días",
        priority: "medium",
        dueDate: "2023-05-10",
      },
      {
        id: "5",
        type: "validation",
        title: "Validar oportunidad: DevOpsFlow - Consultoría",
        description: "Nueva oportunidad que requiere validación",
        priority: "low",
      },
    ])
  }, [])

  if (!data) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "validation":
        return <CheckCircle2 className="h-4 w-4 text-warning" />
      case "risk":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "assignment":
        return <User className="h-4 w-4 text-primary" />
      case "task":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "medium":
        return <Badge variant="default">Media</Badge>
      case "low":
        return <Badge variant="outline">Baja</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.actionCenter.title")}</CardTitle>
          <CardDescription>{t("dashboard.actionCenter.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.actionCenter.action")}</TableHead>
                <TableHead>{t("dashboard.actionCenter.priority")}</TableHead>
                <TableHead>{t("dashboard.actionCenter.dueDate")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(item.type)}</div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>
                    {item.dueDate ? (
                      new Date(item.dueDate) < new Date() ? (
                        <span className="text-destructive">{item.dueDate}</span>
                      ) : (
                        item.dueDate
                      )
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm">{t("dashboard.actionCenter.resolve")}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.actionCenter.validationNeeded")}</CardTitle>
            <CardDescription>{t("dashboard.actionCenter.validationDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data
                .filter((item) => item.type === "validation")
                .map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(item.type)}</div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      {t("dashboard.actionCenter.validate")}
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.actionCenter.highRiskOpportunities")}</CardTitle>
            <CardDescription>{t("dashboard.actionCenter.riskDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data
                .filter((item) => item.type === "risk")
                .map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(item.type)}</div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      {t("dashboard.actionCenter.review")}
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
