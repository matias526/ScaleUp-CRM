"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/hooks/use-translations"
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type BddData = {
  id: string
  name: string
  avatar: string
  opportunities: number
  pipelineValue: number
  conversionRate: number
  avgCycleTime: number
  trend: number
}

export function BddPerformance() {
  const { t } = useTranslations()
  const [data, setData] = useState<BddData[] | null>(null)

  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    // For now, we'll use mock data
    setData([
      {
        id: "1",
        name: "Carlos Rodríguez",
        avatar: "",
        opportunities: 32,
        pipelineValue: 1250000,
        conversionRate: 28.5,
        avgCycleTime: 38,
        trend: 5.2,
      },
      {
        id: "2",
        name: "María González",
        avatar: "",
        opportunities: 27,
        pipelineValue: 980000,
        conversionRate: 24.1,
        avgCycleTime: 42,
        trend: -2.3,
      },
      {
        id: "3",
        name: "Juan Pérez",
        avatar: "",
        opportunities: 24,
        pipelineValue: 875000,
        conversionRate: 22.8,
        avgCycleTime: 45,
        trend: 1.7,
      },
      {
        id: "4",
        name: "Ana Martínez",
        avatar: "",
        opportunities: 22,
        pipelineValue: 820000,
        conversionRate: 21.5,
        avgCycleTime: 40,
        trend: 3.4,
      },
      {
        id: "5",
        name: "Luis Sánchez",
        avatar: "",
        opportunities: 18,
        pipelineValue: 650000,
        conversionRate: 19.2,
        avgCycleTime: 47,
        trend: -1.8,
      },
    ])
  }, [])

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.bddPerformance.title")}</CardTitle>
          <CardDescription>{t("dashboard.bddPerformance.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.bddPerformance.bdd")}</TableHead>
                <TableHead className="text-right">{t("dashboard.bddPerformance.opportunities")}</TableHead>
                <TableHead className="text-right">{t("dashboard.bddPerformance.pipelineValue")}</TableHead>
                <TableHead className="text-right">{t("dashboard.bddPerformance.conversionRate")}</TableHead>
                <TableHead className="text-right">{t("dashboard.bddPerformance.avgCycleTime")}</TableHead>
                <TableHead className="text-right">{t("dashboard.bddPerformance.trend")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((bdd) => (
                <TableRow key={bdd.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={bdd.avatar || "/placeholder.svg"} alt={bdd.name} />
                        <AvatarFallback>
                          {bdd.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>{bdd.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{bdd.opportunities}</TableCell>
                  <TableCell className="text-right">${(bdd.pipelineValue / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-right">{bdd.conversionRate}%</TableCell>
                  <TableCell className="text-right">
                    {bdd.avgCycleTime} {t("dashboard.timeAnalysis.days")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {bdd.trend > 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-success" />
                          <span className="text-success">+{bdd.trend}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-destructive" />
                          <span className="text-destructive">{bdd.trend}%</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
            <CardTitle>{t("dashboard.bddPerformance.activityDistribution")}</CardTitle>
            <CardDescription>{t("dashboard.bddPerformance.activityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.map((bdd) => (
                <div key={bdd.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {bdd.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{bdd.name}</span>
                    </div>
                    <span className="text-sm">{bdd.opportunities} opp.</span>
                  </div>
                  <Progress value={(bdd.opportunities / 32) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.bddPerformance.conversionAnalysis")}</CardTitle>
            <CardDescription>{t("dashboard.bddPerformance.conversionDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.map((bdd) => (
                <div key={bdd.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {bdd.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{bdd.name}</span>
                    </div>
                    <span className="text-sm">{bdd.conversionRate}%</span>
                  </div>
                  <Progress value={bdd.conversionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
