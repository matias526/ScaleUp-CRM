import { Suspense } from "react"
import { OpportunityCreateFormDataPersistenceFix } from "@/components/opportunities/opportunity-create-form-data-persistence-fix"
import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunityCreateDataPersistenceFixPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <OpportunityCreateFormDataPersistenceFix />
      </Suspense>
    </div>
  )
}
