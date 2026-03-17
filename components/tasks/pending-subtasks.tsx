"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, Edit } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import SubtaskDialog from "./subtask-dialog"

export interface PendingSubtask {
  id: string
  title: string
  description?: string
  due_date?: Date
  assigned_to?: string
  assigned_to_name?: string
}

interface PendingSubtasksProps {
  pendingSubtasks: PendingSubtask[]
  onAddSubtask: (subtask: PendingSubtask) => void
  onUpdateSubtask: (subtask: PendingSubtask) => void
  onDeleteSubtask: (id: string) => void
  users: any[]
}

export function PendingSubtasks({
  pendingSubtasks,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  users,
}: PendingSubtasksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<PendingSubtask | null>(null)

  const handleOpenDialog = (subtask?: PendingSubtask) => {
    if (subtask) {
      setEditingSubtask(subtask)
    } else {
      setEditingSubtask(null)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSubtask(null)
  }

  const handleSaveSubtask = (subtask: PendingSubtask) => {
    if (editingSubtask) {
      onUpdateSubtask(subtask)
    } else {
      onAddSubtask(subtask)
    }
    handleCloseDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Subtasks</h3>
        <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Subtask
        </Button>
      </div>

      {pendingSubtasks.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingSubtasks.map((subtask) => (
              <TableRow key={subtask.id}>
                <TableCell className="font-medium">{subtask.title}</TableCell>
                <TableCell>{subtask.assigned_to_name || "Not assigned"}</TableCell>
                <TableCell>
                  {subtask.due_date ? format(new Date(subtask.due_date), "PPP", { locale: es }) : "No due date"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(subtask)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteSubtask(subtask.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No subtasks added yet. Click "Add Subtask" to create one.
        </div>
      )}

      <SubtaskDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveSubtask}
        users={users}
        initialData={editingSubtask || undefined}
        mode={editingSubtask ? "edit" : "create"}
      />
    </div>
  )
}
