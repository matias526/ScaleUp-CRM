import { Suspense } from "react"
import type { Metadata } from "next"
import TechCompaniesTable from "@/components/tech-companies/tech-companies-table"
import Loading from "./loading"

export const metadata: Metadata = {
  title: "Tech Companies",
  description: "Manage your tech companies",
}

export default function TechCompaniesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tech Companies</h1>
        <p className="text-muted-foreground">Manage your tech companies and their details.</p>
      </div>
      <Suspense fallback={<Loading />}>
        <TechCompaniesTable />
      </Suspense>
    </div>
  )
}
