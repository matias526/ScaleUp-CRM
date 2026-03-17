import { Suspense } from "react"
import { KnowledgeBasePage } from "@/components/knowledge-base/knowledge-base-page"
import { Skeleton } from "@/components/ui/skeleton"

export default function KnowledgeBaseListPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
      <KnowledgeBasePage />
    </Suspense>
  )
}
