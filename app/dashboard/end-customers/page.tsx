import { Suspense } from "react"
import { getEndCustomers } from "@/lib/services/end-customer-service-server"
import { EndCustomersPageClient } from "@/components/end-customers/end-customers-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Clientes Finales | ScaleUp CRM",
  description: "Gestiona los clientes finales del sistema",
}

async function EndCustomersContent() {
  const customers = await getEndCustomers()

  return <EndCustomersPageClient initialCustomers={customers} />
}

export default function EndCustomersPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <EndCustomersContent />
      </Suspense>
    </div>
  )
}
