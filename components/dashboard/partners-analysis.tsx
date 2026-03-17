"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/hooks/use-translations"
import { BarChart, PieChart } from "lucide-react"

type PartnerData = {
  id: string
  name: string
  logo: string
  opportunities: number
  pipelineValue: number
  techCompanies: number
  countries: string[]
}

export function PartnersAnalysis() {
  const { t } = useTranslations()
  const [data, setData] = useState<PartnerData[] | null>(null)

  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    // For now, we'll use mock data
    setData([
      {
        id: "1",
        name: "TechSolutions Inc.",
        logo: "",
        opportunities: 18,
        pipelineValue: 750000,
        techCompanies: 5,
        countries: ["España", "México", "Colombia"],
      },
      {
        id: "2",
        name: "Global Innovations",
        logo: "",
        opportunities: 15,
        pipelineValue: 620000,
        techCompanies: 4,
        countries: ["Brasil", "Argentina", "Chile"],
      },
      {
        id: "3",
        name: "Digital Partners",
        logo: "",
        opportunities: 12,
        pipelineValue: 580000,
        techCompanies: 3,
        countries: ["España", "Portugal", "Italia"],
      },
      {
        id: "4",
        name: "Future Systems",
        logo: "",
        opportunities: 10,
        pipelineValue: 450000,
        techCompanies: 3,
        countries: ["México", "Colombia", "Perú"],
      },
      {
        id: "5",
        name: "Tech Innovate",
        logo: "",
        opportunities: 8,
        pipelineValue: 320000,
        techCompanies: 2,
        countries: ["España", "Francia"],
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
          <CardTitle>{t("dashboard.partnersAnalysis.title")}</CardTitle>
          <CardDescription>{t("dashboard.partnersAnalysis.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.partnersAnalysis.partner")}</TableHead>
                <TableHead className="text-right">{t("dashboard.partnersAnalysis.opportunities")}</TableHead>
                <TableHead className="text-right">{t("dashboard.partnersAnalysis.pipelineValue")}</TableHead>
                <TableHead className="text-right">{t("dashboard.partnersAnalysis.techCompanies")}</TableHead>
                <TableHead>{t("dashboard.partnersAnalysis.countries")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={partner.logo || "/placeholder.svg"} alt={partner.name} />
                        <AvatarFallback>{partner.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>{partner.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{partner.opportunities}</TableCell>
                  <TableCell className="text-right">${(partner.pipelineValue / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-right">{partner.techCompanies}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {partner.countries.map((country) => (
                        <Badge key={country} variant="outline">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.partnersAnalysis.opportunityDistribution")}</CardTitle>
              <CardDescription>{t("dashboard.partnersAnalysis.byPartner")}</CardDescription>
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-[200px] h-[200px] rounded-full border-8 border-primary relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">63</div>
                    <div className="text-xs text-muted-foreground">Total Opportunities</div>
                  </div>
                </div>
                {data.map((partner, index) => {
                  const rotation = index * (360 / data.length)
                  return (
                    <div
                      key={partner.id}
                      className="absolute w-3 h-3 bg-primary rounded-full"
                      style={{
                        transform: `rotate(${rotation}deg) translateY(-100px)`,
                        opacity: 0.7 + (partner.opportunities / 20) * 0.3,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.partnersAnalysis.valueDistribution")}</CardTitle>
              <CardDescription>{t("dashboard.partnersAnalysis.byPartner")}</CardDescription>
            </div>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-2">
              {data.map((partner) => (
                <div key={partner.id} className="flex flex-col items-center gap-2">
                  <div
                    className="bg-primary/80 w-12 rounded-t-md"
                    style={{ height: `${(partner.pipelineValue / 750000) * 200}px` }}
                  />
                  <span className="text-xs text-muted-foreground truncate w-16 text-center">
                    {partner.name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
