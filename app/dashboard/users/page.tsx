"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UsersTable } from "@/components/users/users-table"
import { type User, UserService } from "@/lib/services/user-service"
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslations } from "@/hooks/use-translations"

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const pageSize = 10

  // Definir las claves de traducción que necesitamos
  const translationKeys = [
    "users.title",
    "users.new_user",
    "users.list_title",
    "users.list_description",
    "users.search_placeholder",
    "users.showing",
    "common.loading",
  ]

  // Usar el hook de traducciones
  const { t } = useTranslations(translationKeys)

  // Debounce search term para evitar demasiadas consultas
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Función para cargar usuarios optimizada con useCallback
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)

      // Limitar los campos que se solicitan para mejorar el rendimiento
      if (debouncedSearchTerm) {
        const searchResults = await UserService.searchUsers(debouncedSearchTerm)
        setUsers(searchResults)
        setTotalUsers(searchResults.length)
      } else {
        const { data, total } = await UserService.getUsers(page, pageSize)
        setUsers(data)
        setTotalUsers(total)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      setUsers([])
      setTotalUsers(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, debouncedSearchTerm])

  // Cargar usuarios cuando cambie la página o el término de búsqueda
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page on new search
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("users.title")}</h1>
        <Button onClick={() => router.push("/dashboard/users/create")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("users.new_user")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t("users.list_title")}</CardTitle>
          <CardDescription>{t("users.list_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("users.search_placeholder")}
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Button variant="outline" onClick={loadUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {t("common.loading")}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <UsersTable users={users} onDelete={loadUsers} />

              {/* Paginación simplificada */}
              {!debouncedSearchTerm && totalUsers > pageSize && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("users.showing")
                      .replace("{count}", users.length.toString())
                      .replace("{total}", totalUsers.toString())}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= totalUsers}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
