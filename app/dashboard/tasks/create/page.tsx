import { getTaskTypes } from "@/lib/services/task-type-service"
import TaskForm from "@/components/tasks/task-form"

export const dynamic = "force-dynamic"

export default async function CreateTaskPage() {
  const taskTypes = await getTaskTypes()

  return (
    <div className="p-0 sm:p-0">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
      <TaskForm taskTypes={taskTypes} />
    </div>
  )
}
