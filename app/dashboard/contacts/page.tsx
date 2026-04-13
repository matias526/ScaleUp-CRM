"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslations } from "@/hooks/use-translations"
import ContactsTable from "@/components/contacts/contacts-table"
import { ContactFormModal } from "@/components/contacts/contact-form-modal"
import { ContactService } from "@/lib/services/contact-service"
import type { Contact, ContactFilters } from "@/lib/services/contact-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DICT_LANG_CONTACTS } from "@/lib/constants/dict-lang-contacts"

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalContacts, setTotalContacts] = useState(0)
  const [departmentFilter, setDepartmentFilter] = useState<string>("")
  const [languageFilter, setLanguageFilter] = useState<string>("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const pageSize = 10
  const { t } = useTranslations(DICT_LANG_CONTACTS)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true)

      const filters: ContactFilters = {}
      if (debouncedSearchTerm) {
        filters.searchTerm = debouncedSearchTerm
      }
      if (departmentFilter) {
        filters.department = departmentFilter
      }
      if (languageFilter) {
        filters.preferred_language = languageFilter
      }

      const { data, total } = await ContactService.getContacts(page, pageSize, filters)
      setContacts(data)
      setTotalContacts(total)
    } catch (error) {
      console.error("Error loading contacts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, debouncedSearchTerm, departmentFilter, languageFilter])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  const handleRefresh = () => {
    loadContacts()
  }

  const handlePreviousPage = () => {
    setPage(Math.max(1, page - 1))
  }

  const handleNextPage = () => {
    const maxPage = Math.ceil(totalContacts / pageSize)
    setPage(Math.min(maxPage, page + 1))
  }

  const totalPages = Math.ceil(totalContacts / pageSize)
  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("contacts.page.title")}</h1>
          <p className="text-gray-600">{t("contacts.page.description")}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("contacts.create")}
        </Button>
      </div>

      {/* Search and Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("contacts.search.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t("contacts.search")}
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
              <Select value={departmentFilter} onValueChange={(value) => {
                setDepartmentFilter(value === "all" ? "" : value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("contacts.filter.department")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("contacts.filter.all")}</SelectItem>
                  <SelectItem value="sales">{t("contacts.department.sales")}</SelectItem>
                  <SelectItem value="technical">{t("contacts.department.technical")}</SelectItem>
                  <SelectItem value="marketing">{t("contacts.department.marketing")}</SelectItem>
                  <SelectItem value="operations">{t("contacts.department.operations")}</SelectItem>
                  <SelectItem value="finance">{t("contacts.department.finance")}</SelectItem>
                  <SelectItem value="hr">{t("contacts.department.hr")}</SelectItem>
                  <SelectItem value="executive">{t("contacts.department.executive")}</SelectItem>
                  <SelectItem value="other">{t("contacts.department.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={languageFilter} onValueChange={(value) => {
                setLanguageFilter(value === "all" ? "" : value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("contacts.filter.language")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("contacts.filter.all")}</SelectItem>
                  <SelectItem value="es">{t("contacts.language.spanish")}</SelectItem>
                  <SelectItem value="en">{t("contacts.language.english")}</SelectItem>
                  <SelectItem value="pt">{t("contacts.language.portuguese")}</SelectItem>
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
                setDepartmentFilter("")
                setLanguageFilter("")
                setPage(1)
              }}
            >
              {t("contacts.filter.clear")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("contacts.refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contacts.title")}</CardTitle>
          <CardDescription>
            {t("contacts.showing")} {contacts.length} {t("contacts.of")} {totalContacts} {t("message.results")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">{t("contacts.message.loading")}</p>
            </div>
          ) : (
            <>
              <ContactsTable contacts={contacts} onDelete={handleRefresh} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    {t("contacts.pagination.page")} {page} {t("contacts.pagination.of")} {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={!canGoPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("contacts.pagination.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!canGoNext}
                    >
                      {t("contacts.pagination.next")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Contact Modal */}
      <ContactFormModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadContacts()
        }}
      />
    </main>
  )
}
