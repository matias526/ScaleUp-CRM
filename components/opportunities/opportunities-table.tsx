"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"
import type { Opportunity } from "@/types/supabase"

interface OpportunitiesTableProps {
  opportunities: Opportunity[]
}

// Exportamos el componente como una exportación nombrada
export const OpportunitiesTable = ({ opportunities }: OpportunitiesTableProps) => {
  const { t } = useTranslations()
  const router = useRouter()
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const formatStageCode = (code: string) => {
    if (!code) return "Sin etapa"
    return code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const handleViewDetails = (id: string) => {
    console.log(`Navigating to opportunity details: ${id}`)
    router.push(`/dashboard/opportunities/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/opportunities/${id}/edit`)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("opportunity.name")}</TableHead>
            <TableHead>{t("opportunity.stage")}</TableHead>
            <TableHead>{t("opportunity.value")}</TableHead>
            <TableHead>{t("opportunity.probability")}</TableHead>
            <TableHead>{t("opportunity.expected_close_date")}</TableHead>
            <TableHead>{t("opportunity.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                {t("opportunity.no_opportunities")}
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opportunity) => (
              <TableRow key={opportunity.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  {opportunity.name}
                  {opportunity.end_customer && ` - ${opportunity.end_customer.name}`}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {opportunity.stage ? formatStageCode(opportunity.stage.code) : "Sin etapa"}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(opportunity.estimated_value)}</TableCell>
                <TableCell>{opportunity.probability}%</TableCell>
                <TableCell>{formatDate(opportunity.expected_close_date)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(opportunity.id)}>
                      {t("common.view")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(opportunity.id)}>
                      {t("common.edit")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Mantenemos la exportación por defecto para compatibilidad
export default OpportunitiesTable
