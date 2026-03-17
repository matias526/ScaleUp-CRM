import { Suspense } from "react"
import { OpportunityCreateFormFixed } from "@/components/opportunities/opportunity-create-form-fixed"
import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunityCreateFixedPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <OpportunityCreateFormFixed />
      </Suspense>
    </div>
  )
}
