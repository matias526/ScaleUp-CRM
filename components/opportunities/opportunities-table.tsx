"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities"
import type { OpportunityWithRelations } from "@/lib/services/opportunity-service"

interface OpportunitiesTableProps {
  opportunities: OpportunityWithRelations[]
}

export const OpportunitiesTable = ({ opportunities }: OpportunitiesTableProps) => {
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const router = useRouter()

  const handleViewDetails = (id: string) => {
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
            <TableHead>{t("opp.table.name")}</TableHead>
            <TableHead>{t("opp.table.techCompany")}</TableHead>
            <TableHead>{t("opp.table.partner")}</TableHead>
            <TableHead>{t("opp.table.country")}</TableHead>
            <TableHead>{t("opp.table.estimatedAmount")}</TableHead>
            <TableHead>{t("opp.table.estimatedCloseDate")}</TableHead>
            <TableHead>{t("opp.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                {t("opp.table.noOpportunities")}
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opportunity) => (
              <TableRow key={opportunity.id} className="cursor-pointer">
                <TableCell className="font-medium max-w-xs truncate">
                  {opportunity.title || t("opp.table.noData")}
                </TableCell>
                <TableCell>
                  {opportunity.tech_company?.name || t("opp.table.noData")}
                </TableCell>
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
                  {opportunity.expected_close_date ? formatDate(opportunity.expected_close_date) : t("opp.table.noData")}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDetails(opportunity.id)}
                    >
                      {t("opp.table.view")}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(opportunity.id)}
                    >
                      {t("opp.table.edit")}
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

export default OpportunitiesTable
