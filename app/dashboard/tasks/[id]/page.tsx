import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getTaskById } from "@/lib/services/task-service"
import TaskDetail from "@/components/tasks/task-detail"

// 1. La interfaz ahora define params como una Promise
interface TaskPageProps {
  params: Promise<{
    id: string
  }>
}

// 2. La función sigue siendo async, eso está perfecto
export default async function TaskPage({ params }: TaskPageProps) {
  // 3. ¡FUNDAMENTAL! Hay que esperar a que los params se resuelvan
  const { id } = await params

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