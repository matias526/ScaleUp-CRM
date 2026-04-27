"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslations } from "@/hooks/use-translations"
import ProspectPartnersTable from "@/components/prospect-partners/prospect-partners-table"
import { ProspectPartnerFormModal } from "@/components/prospect-partners/prospect-partner-form-modal"
import { ProspectPartnerDetailDrawer } from "@/components/prospect-partners/prospect-partner-detail-drawer"
import { ProspectPartnerService, type ProspectPartner, type ProspectPartnerFilters } from "@/lib/services/prospect-partner-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DICT_LANG_PROSPECT_PARTNERS } from "@/lib/constants/dict-lang-prospect-partners"

export default function ProspectPartnersPage() {
  const [partners, setPartners] = useState<ProspectPartner[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPartners, setTotalPartners] = useState(0)
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<ProspectPartner | null>(null)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const pageSize = 10
  const { t } = useTranslations(DICT_LANG_PROSPECT_PARTNERS)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const loadPartners = useCallback(async () => {
    try {
      setIsLoading(true)

      const filters: ProspectPartnerFilters = {}
      if (debouncedSearchTerm) {
        filters.searchTerm = debouncedSearchTerm
      }
      if (leadSourceFilter) {
        filters.leadSource = leadSourceFilter
      }

      const { data, total } = await ProspectPartnerService.getProspectPartners(page, pageSize, filters)
      setPartners(data)
      setTotalPartners(total)
    } catch (error) {
      console.error("Error loading partners:", error)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, debouncedSearchTerm, leadSourceFilter])

  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  const handleRefresh = () => {
    loadPartners()
  }

  const handlePreviousPage = () => {
    setPage(Math.max(1, page - 1))
  }

  const handleNextPage = () => {
    const maxPage = Math.ceil(totalPartners / pageSize)
    setPage(Math.min(maxPage, page + 1))
  }

  const handleViewPartner = (partner: ProspectPartner) => {
    setSelectedPartner(partner)
    setIsDetailDrawerOpen(true)
  }

  const handleEditPartner = (partner: ProspectPartner) => {
    setSelectedPartner(partner)
    setIsEditModalOpen(true)
  }

  const totalPages = Math.ceil(totalPartners / pageSize)
  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("prospect_partners.page.title")}</h1>
          <p className="text-gray-600">{t("prospect_partners.page.description")}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("prospect_partners.create")}
        </Button>
      </div>

      {/* Search and Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("prospect_partners.search.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t("prospect_partners.search")}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select value={leadSourceFilter} onValueChange={(value) => {
                setLeadSourceFilter(value === "all" ? "" : value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("prospect_partners.filter.leadSource")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("prospect_partners.filter.all")}</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="trade_show">Trade Show</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setLeadSourceFilter("")
                setPage(1)
              }}
            >
              {t("prospect_partners.filter.clear")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("prospect_partners.refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("prospect_partners.title")}</CardTitle>
          <CardDescription>
            {t("prospect_partners.showing")} {partners.length} {t("prospect_partners.of")} {totalPartners} {t("message.results")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">{t("prospect_partners.message.loading")}</p>
            </div>
          ) : (
            <>
              <ProspectPartnersTable 
                partners={partners} 
                onDelete={handleRefresh} 
                onView={handleViewPartner} 
                onEdit={handleEditPartner}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    {t("prospect_partners.pagination.page")} {page} {t("prospect_partners.pagination.of")} {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={!canGoPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("prospect_partners.pagination.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!canGoNext}
                    >
                      {t("prospect_partners.pagination.next")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Partner Modal */}
      <ProspectPartnerFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadPartners()
        }}
      />

      {/* Edit Partner Modal */}
      <ProspectPartnerFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialData={selectedPartner || undefined}
        onSuccess={() => {
          setIsEditModalOpen(false)
          setSelectedPartner(null)
          loadPartners()
        }}
      />

      {/* Partner Detail Drawer */}
      <ProspectPartnerDetailDrawer
        partner={selectedPartner}
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
      />
    </main>
  )
}
