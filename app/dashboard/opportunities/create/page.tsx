import { Suspense } from "react"
import { OpportunityCreateForm } from "@/components/opportunities/opportunity-create-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunityCreatePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <OpportunityCreateForm />
    </Suspense>
  )
}
