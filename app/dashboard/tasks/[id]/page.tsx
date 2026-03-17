import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getTaskById } from "@/lib/services/task-service"
import TaskDetail from "@/components/tasks/task-detail"

interface TaskPageProps {
  params: {
    id: string
  }
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = params

  try {
    const task = await getTaskById(id)

    if (!task) {
      return notFound()
    }

    return (
      <div className="container py-6">
        <Suspense fallback={<div>Loading task details...</div>}>
          <TaskDetail task={task} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Error loading task:", error)
    return <div>Error loading task details</div>
  }
}
