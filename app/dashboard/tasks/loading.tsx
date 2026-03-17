import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <Skeleton className="h-10 w-[250px]" />
      <div className="border rounded-lg p-4">
        <Skeleton className="h-8 w-full mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
