"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_OPPORTUNITIES } from "@/lib/constants/dict-lang-opportunities"
import type { OpportunityWithRelations } from "@/lib/services/opportunity-service"

interface OpportunitiesTableProps {
  opportunities: OpportunityWithRelations[]
  userRole?: string
  filterTechCompany?: string | null
  setFilterTechCompany?: (value: string | null) => void
  filterPartner?: string | null
  setFilterPartner?: (value: string | null) => void
}

export const OpportunitiesTable = ({ 
  opportunities, 
  userRole,
  filterTechCompany,
  setFilterTechCompany,
  filterPartner,
  setFilterPartner
}: OpportunitiesTableProps) => {
  const { t } = useTranslations(DICT_LANG_OPPORTUNITIES)
  const router = useRouter()
  
  // Determinar si es TechUser o TechLogistic
  const isTechUser = ["TechUser", "TechLogistic"].includes(userRole || "")
  
  // Calcular el número de columnas dinámicamente
  const columnCount = isTechUser ? 6 : 7

  // Extraer listas únicas de tech companies y partners para los filtros
  const techCompanies = useMemo(() => {
    const uniqueCompanies = Array.from(
      new Set(
        opportunities
          .filter((opp) => opp.tech_company)
          .map((opp) => JSON.stringify({ id: opp.tech_company_id, name: opp.tech_company?.name })),
      ),
    ).map((company) => JSON.parse(company))

    return uniqueCompanies.sort((a, b) => a.name.localeCompare(b.name))
  }, [opportunities])

  const partners = useMemo(() => {
    const uniquePartners = Array.from(
      new Set(
        opportunities
          .filter((opp) => opp.partner)
          .map((opp) => JSON.stringify({ id: opp.partner_id, name: opp.partner?.name })),
      ),
    ).map((partner) => JSON.parse(partner))

    return uniquePartners.sort((a, b) => a.name.localeCompare(b.name))
  }, [opportunities])

  // Aplicar filtros
  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities]

    if (filterTechCompany && filterTechCompany !== "all") {
      result = result.filter((opp) => opp.tech_company_id === filterTechCompany)
    }

    if (filterPartner && filterPartner !== "all") {
      if (filterPartner === "no-partner") {
        result = result.filter((opp) => !opp.partner_id)
      } else {
        result = result.filter((opp) => opp.partner_id === filterPartner)
      }
    }

    return result
  }, [opportunities, filterTechCompany, filterPartner])

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/opportunities/${id}`)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-end">
        {!isTechUser && (
          <div className="flex-1 max-w-xs">
            <label className="text-sm font-medium mb-2 block">
              {t("opp.table.techCompany")}
            </label>
            <Select
              value={filterTechCompany || "all"}
              onValueChange={(value) => setFilterTechCompany?.(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("opp.table.techCompany")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {techCompanies.map((company: any) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-2 block">
            {t("opp.table.partner")}
          </label>
          <Select
            value={filterPartner || "all"}
            onValueChange={(value) => setFilterPartner?.(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={t("opp.table.partner")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="no-partner">Sin Partner</SelectItem>
              {partners.map((partner: any) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
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
            {filteredOpportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center py-8">
                  {t("opp.table.noOpportunities")}
                </TableCell>
              </TableRow>
            ) : (
              filteredOpportunities.map((opportunity) => (
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
    </div>
  )
}

export default OpportunitiesTable
