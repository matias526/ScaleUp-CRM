"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/hooks/use-translations"
import { BarChart, PieChart } from "lucide-react"

type TechCompanyData = {
  id: string
  name: string
  logo: string
  opportunities: number
  pipelineValue: number
  partners: number
  category: string
}

export function TechCompaniesAnalysis() {
  const { t } = useTranslations()
  const [data, setData] = useState<TechCompanyData[] | null>(null)

  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    // For now, we'll use mock data
    setData([
      {
        id: "1",
        name: "CloudTech",
        logo: "",
        opportunities: 14,
        pipelineValue: 620000,
        partners: 4,
        category: "Cloud Services",
      },
      {
        id: "2",
        name: "SecureNet",
        logo: "",
        opportunities: 12,
        pipelineValue: 580000,
        partners: 3,
        category: "Cybersecurity",
      },
      {
        id: "3",
        name: "DataInsights",
        logo: "",
        opportunities: 10,
        pipelineValue: 450000,
        partners: 3,
        category: "Data Analytics",
      },
      {
        id: "4",
        name: "AILabs",
        logo: "",
        opportunities: 8,
        pipelineValue: 380000,
        partners: 2,
        category: "Artificial Intelligence",
      },
      {
        id: "5",
        name: "DevOpsFlow",
        logo: "",
        opportunities: 7,
        pipelineValue: 320000,
        partners: 2,
        category: "DevOps",
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
          <CardTitle>{t("dashboard.techCompaniesAnalysis.title")}</CardTitle>
          <CardDescription>{t("dashboard.techCompaniesAnalysis.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.techCompaniesAnalysis.techCompany")}</TableHead>
                <TableHead>{t("dashboard.techCompaniesAnalysis.category")}</TableHead>
                <TableHead className="text-right">{t("dashboard.techCompaniesAnalysis.opportunities")}</TableHead>
                <TableHead className="text-right">{t("dashboard.techCompaniesAnalysis.pipelineValue")}</TableHead>
                <TableHead className="text-right">{t("dashboard.techCompaniesAnalysis.partners")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={company.logo || "/placeholder.svg"} alt={company.name} />
                        <AvatarFallback>{company.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>{company.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{company.opportunities}</TableCell>
                  <TableCell className="text-right">${(company.pipelineValue / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-right">{company.partners}</TableCell>
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
              <CardTitle>{t("dashboard.techCompaniesAnalysis.categoryDistribution")}</CardTitle>
              <CardDescription>{t("dashboard.techCompaniesAnalysis.byCategory")}</CardDescription>
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="relative w-[250px] h-[250px]">
                <div className="absolute inset-0 rounded-full border-8 border-primary/20"></div>
                <div className="absolute inset-[20px] rounded-full border-8 border-primary/40"></div>
                <div className="absolute inset-[40px] rounded-full border-8 border-primary/60"></div>
                <div className="absolute inset-[60px] rounded-full border-8 border-primary/80"></div>
                <div className="absolute inset-[80px] rounded-full border-8 border-primary"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-xs text-muted-foreground">Categories</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.techCompaniesAnalysis.opportunityValue")}</CardTitle>
              <CardDescription>{t("dashboard.techCompaniesAnalysis.byTechCompany")}</CardDescription>
            </div>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-2">
              {data.map((company) => (
                <div key={company.id} className="flex flex-col items-center gap-2">
                  <div
                    className="bg-primary/80 w-12 rounded-t-md"
                    style={{ height: `${(company.pipelineValue / 620000) * 200}px` }}
                  />
                  <span className="text-xs text-muted-foreground truncate w-16 text-center">{company.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
