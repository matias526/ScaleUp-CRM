"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useTranslation } from "@/lib/hooks/use-translation"
import { cn } from "@/lib/utils"

interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  country: string | null
  partnerId: string | null
  techCompanyId: string | null
}

interface NewAdminFiltersProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
}

export function NewAdminFilters({ filters, onFiltersChange }: NewAdminFiltersProps) {
  const { t } = useTranslation()
  const [tempFilters, setTempFilters] = useState<DashboardFilters>(filters)

  const handleDateRangeChange = (field: "from" | "to", date: Date | undefined) => {
    if (!date) return

    setTempFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date,
      },
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: DashboardFilters = {
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
        to: new Date(),
      },
      country: null,
      partnerId: null,
      techCompanyId: null,
    }
    setTempFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.dashboard.filters.dateRange")}</label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !tempFilters.dateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempFilters.dateRange.from
                    ? format(tempFilters.dateRange.from, "dd/MM/yyyy", { locale: es })
                    : "Desde"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tempFilters.dateRange.from}
                  onSelect={(date) => handleDateRangeChange("from", date)}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !tempFilters.dateRange.to && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempFilters.dateRange.to ? format(tempFilters.dateRange.to, "dd/MM/yyyy", { locale: es }) : "Hasta"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tempFilters.dateRange.to}
                  onSelect={(date) => handleDateRangeChange("to", date)}
                  disabled={(date) => date > new Date() || date < tempFilters.dateRange.from}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Country Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.dashboard.filters.country")}</label>
          <Select
            value={tempFilters.country || "all"}
            onValueChange={(value) => setTempFilters((prev) => ({ ...prev, country: value === "all" ? null : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los países" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los países</SelectItem>
              <SelectItem value="ES">España</SelectItem>
              <SelectItem value="PT">Portugal</SelectItem>
              <SelectItem value="FR">Francia</SelectItem>
              <SelectItem value="IT">Italia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Partner Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.dashboard.filters.partner")}</label>
          <Select
            value={tempFilters.partnerId || "all"}
            onValueChange={(value) =>
              setTempFilters((prev) => ({ ...prev, partnerId: value === "all" ? null : value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los partners</SelectItem>
              {/* Aquí se cargarían los partners dinámicamente */}
            </SelectContent>
          </Select>
        </div>

        {/* Tech Company Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.dashboard.filters.techCompany")}</label>
          <Select
            value={tempFilters.techCompanyId || "all"}
            onValueChange={(value) =>
              setTempFilters((prev) => ({ ...prev, techCompanyId: value === "all" ? null : value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las tech companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tech companies</SelectItem>
              {/* Aquí se cargarían las tech companies dinámicamente */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} size="sm">
          {t("admin.dashboard.filters.apply")}
        </Button>
        <Button onClick={handleClearFilters} variant="outline" size="sm">
          {t("admin.dashboard.filters.clear")}
        </Button>
      </div>
    </div>
  )
}
