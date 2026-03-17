import { Suspense } from "react"
import { OpportunitiesPage } from "@/components/opportunities/opportunities-page"
import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunitiesListPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <OpportunitiesPage />
    </Suspense>
  )
}
