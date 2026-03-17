"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog"
import { useTranslations } from "@/hooks/use-translations"
import { useRouter } from "next/navigation"

export function TaskCreateButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { t } = useTranslations()
  const router = useRouter()

  const handleTaskCreated = () => {
    setIsDialogOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("tasks.new", "New Task")}
      </Button>

      {isDialogOpen && (
        <TaskCreateDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  )
}
