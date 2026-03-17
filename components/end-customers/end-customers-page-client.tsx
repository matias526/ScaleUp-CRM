"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EndCustomersTable } from "./end-customers-table"
import { useDebounce } from "@/hooks/use-debounce"
import { searchEndCustomers } from "@/lib/services/end-customer-service-client"
import type { EndCustomer } from "@/lib/services/end-customer-service-server"

interface EndCustomersPageClientProps {
  initialCustomers: EndCustomer[]
}

export function EndCustomersPageClient({ initialCustomers }: EndCustomersPageClientProps) {
  const router = useRouter()
  const [customers, setCustomers] = useState<EndCustomer[]>(initialCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsSearching(true)
      searchEndCustomers(debouncedSearchTerm)
        .then(setCustomers)
        .catch(console.error)
        .finally(() => setIsSearching(false))
    } else {
      setCustomers(initialCustomers)
    }
  }, [debouncedSearchTerm, initialCustomers])

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes Finales</h1>
          <p className="text-muted-foreground">Gestiona los clientes finales del sistema</p>
        </div>
        <Button onClick={() => router.push("/dashboard/end-customers/create")}>Nuevo Cliente</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes Finales</CardTitle>
          <CardDescription>Gestiona los clientes finales del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={handleRefresh}>
              Actualizar
            </Button>
          </div>

          <EndCustomersTable customers={customers} onDelete={handleRefresh} isLoading={isSearching} />
        </CardContent>
      </Card>
    </div>
  )
}
