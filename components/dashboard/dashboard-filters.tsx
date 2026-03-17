"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "@/hooks/use-translations"
import { Calendar, Filter, RefreshCw, Save } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

export function DashboardFilters() {
  const { t } = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          {t("dashboard.filters.title")}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Save className="h-4 w-4" />
            {t("dashboard.filters.saveView")}
          </Button>
          <Button variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("dashboard.filters.dateRange")}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <DatePicker date={dateRange} setDate={setDateRange} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("dashboard.filters.country")}</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder={t("dashboard.filters.allCountries")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.filters.allCountries")}</SelectItem>
                    <SelectItem value="es">España</SelectItem>
                    <SelectItem value="mx">México</SelectItem>
                    <SelectItem value="co">Colombia</SelectItem>
                    <SelectItem value="br">Brasil</SelectItem>
                    <SelectItem value="ar">Argentina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("dashboard.filters.partner")}</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder={t("dashboard.filters.allPartners")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.filters.allPartners")}</SelectItem>
                    <SelectItem value="1">TechSolutions Inc.</SelectItem>
                    <SelectItem value="2">Global Innovations</SelectItem>
                    <SelectItem value="3">Digital Partners</SelectItem>
                    <SelectItem value="4">Future Systems</SelectItem>
                    <SelectItem value="5">Tech Innovate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("dashboard.filters.techCompany")}</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder={t("dashboard.filters.allTechCompanies")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.filters.allTechCompanies")}</SelectItem>
                    <SelectItem value="1">CloudTech</SelectItem>
                    <SelectItem value="2">SecureNet</SelectItem>
                    <SelectItem value="3">DataInsights</SelectItem>
                    <SelectItem value="4">AILabs</SelectItem>
                    <SelectItem value="5">DevOpsFlow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
