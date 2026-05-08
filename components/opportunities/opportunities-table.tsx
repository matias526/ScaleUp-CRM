"use client"

import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities"
import type { OpportunityWithRelations } from "@/lib/services/opportunity-service"

interface OpportunitiesTableProps {
  opportunities: OpportunityWithRelations[]
  userRole?: string
}

export const OpportunitiesTable = ({ opportunities, userRole }: OpportunitiesTableProps) => {
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const router = useRouter()
  
  // Determinar si es TechUser o TechLogistic
  const isTechUser = ["TechUser", "TechLogistic"].includes(userRole || "")
  
  // Calcular el número de columnas dinámicamente
  const columnCount = isTechUser ? 6 : 7

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/opportunities/${id}`)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("opp.table.name")}</TableHead>
            {!isTechUser && <TableHead>{t("opp.table.techCompany")}</TableHead>}
            <TableHead>{t("opp.table.partner")}</TableHead>
            <TableHead>{t("opp.table.country")}</TableHead>
            <TableHead>{t("opp.table.estimatedAmount")}</TableHead>
            <TableHead>{t("opp.table.estimatedCloseDate")}</TableHead>
            <TableHead className="w-12">{t("opp.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="text-center py-8">
                {t("opp.table.noOpportunities")}
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opportunity) => (
              <TableRow key={opportunity.id} className="hover:bg-gray-50">
                <TableCell className="font-medium max-w-xs truncate">
                  {opportunity.title || t("opp.table.noData")}
                </TableCell>
                {!isTechUser && (
                  <TableCell>
                    {opportunity.tech_company?.name || t("opp.table.noData")}
                  </TableCell>
                )}
                <TableCell>
                  {opportunity.partner?.name || t("opp.table.noData")}
                </TableCell>
                <TableCell>
                  {opportunity.country || t("opp.table.noData")}
                </TableCell>
                <TableCell>
                  {opportunity.estimated_value ? formatCurrency(opportunity.estimated_value) : t("opp.table.noData")}
                </TableCell>
                <TableCell>
                  {opportunity.estimated_close_date ? formatDate(opportunity.estimated_close_date) : t("opp.table.noData")}
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => handleViewDetails(opportunity.id)}
                    className="inline-flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors"
                    title={t("opp.table.view")}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default OpportunitiesTable
