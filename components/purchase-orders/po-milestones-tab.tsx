"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Check, Clock, Plus, Trash2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface POMilestonesTabProps {
  po: any
  milestones: any[]
  subtotal: number
  userRole?: string
  onMilestonesUpdate?: () => void
}

export function POMilestonesTab({
  po,
  milestones: initialMilestones,
  subtotal,
  userRole = "",
  onMilestonesUpdate,
}: POMilestonesTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const [localMilestones, setLocalMilestones] = useState<any[]>(initialMilestones || [])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    amountType: "fixed", // "fixed" or "percentage"
    amount: 0,
    dueDate: "",
  })

  const isEditable = ["Admin", "BDD"].includes(userRole)

  // Update local milestones when initial milestones change
  useEffect(() => {
    setLocalMilestones(initialMilestones || [])
  }, [initialMilestones])

  // Calculate milestone amounts
  const getMilestoneAmount = (milestone: any) => {
    return milestone.amount
  }

  const totalMilestoneAmount = localMilestones.reduce((sum, milestone) => {
    return sum + getMilestoneAmount(milestone)
  }, 0)

  const collectedAmount = localMilestones
    .filter((m) => m.status === "paid")
    .reduce((sum, milestone) => {
      return sum + getMilestoneAmount(milestone)
    }, 0)

  const pendingAmount = totalMilestoneAmount - collectedAmount

  // Calculate percentage of total PO
  const milestonesTotalPercent = (totalMilestoneAmount / subtotal) * 100
  const isBalanced = Math.abs(totalMilestoneAmount - subtotal) < 0.01 // Allow for floating point rounding

  const resetForm = () => {
    setFormData({
      title: "",
      amountType: "fixed",
      amount: 0,
      dueDate: "",
    })
    setEditingId(null)
    setShowAddDialog(false)
  }

  const handleAddMilestone = () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: t("common.error"),
        description: t("po.milestone.titleRequired"),
        variant: "destructive",
      })
      return
    }

    if (formData.amount <= 0) {
      toast({
        title: t("common.error"),
        description: t("po.milestone.amountRequired"),
        variant: "destructive",
      })
      return
    }

    // Calculate actual amount based on type
    const actualAmount =
      formData.amountType === "percentage"
        ? (subtotal * formData.amount) / 100
        : formData.amount

    if (actualAmount <= 0) {
      toast({
        title: t("common.error"),
        description: t("po.milestone.amountRequired"),
        variant: "destructive",
      })
      return
    }

    // Check percentage doesn't exceed 100%
    if (formData.amountType === "percentage" && formData.amount > 100) {
      toast({
        title: t("common.error"),
        description: t("po.milestone.percentageMax"),
        variant: "destructive",
      })
      return
    }

    // Calculate new total (excluding current edit if applicable)
    const currentTotal = editingId
      ? totalMilestoneAmount - (localMilestones.find((m) => m.id === editingId)?.amount || 0)
      : totalMilestoneAmount

    const newTotal = currentTotal + actualAmount

    // Warn if exceeds PO total (but don't prevent - user can adjust)
    if (newTotal > subtotal) {
      toast({
        title: t("common.warning"),
        description: `${t("po.milestone.exceedsTotal")} (${newTotal.toFixed(2)} > ${subtotal.toFixed(2)})`,
        variant: "destructive",
      })
      return
    }

    if (editingId) {
      // Update existing milestone in local state
      setLocalMilestones(
        localMilestones.map((m) =>
          m.id === editingId
            ? {
                ...m,
                title: formData.title,
                amount: actualAmount,
                due_date: formData.dueDate || null,
              }
            : m
        )
      )
      toast({
        title: "Éxito",
        description: t("po.milestone.updated"),
      })
    } else {
      // Add new milestone to local state with temporary ID
      const tempId = `temp-${Date.now()}`
      setLocalMilestones([
        ...localMilestones,
        {
          id: tempId,
          po_id: po.id,
          title: formData.title,
          amount: actualAmount,
          due_date: formData.dueDate || null,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      toast({
        title: "Éxito",
        description: t("po.milestone.created"),
      })
    }

    resetForm()
  }

  const handleEditMilestone = (milestone: any) => {
    setFormData({
      title: milestone.title,
      amountType: "fixed", // Always show as fixed since we store final amount
      amount: milestone.amount,
      dueDate: milestone.due_date || "",
    })
    setEditingId(milestone.id)
    setShowAddDialog(true)
  }

  const handleDeleteMilestone = (id: string) => {
    if (window.confirm(t("po.milestone.confirmDelete"))) {
      setLocalMilestones(localMilestones.filter((m) => m.id !== id))
      toast({
        title: "Éxito",
        description: t("po.milestone.deleted"),
      })
    }
  }

  const handleSaveAllMilestones = async () => {
    try {
      setSaving(true)

      // Validate total equals PO amount
      if (!isBalanced) {
        toast({
          title: t("common.error"),
          description: `${t("po.milestone.exceedsTotal")} (${totalMilestoneAmount.toFixed(2)} ≠ ${subtotal.toFixed(2)})`,
          variant: "destructive",
        })
        return
      }

      // Delete all existing milestones for this PO
      const { error: deleteError } = await supabase
        .from("po_milestones")
        .delete()
        .eq("po_id", po.id)

      if (deleteError) throw deleteError

      // Insert all new milestones
      const milestonesToInsert = localMilestones.map((m) => ({
        po_id: po.id,
        title: m.title,
        amount: m.amount,
        due_date: m.due_date || null,
        status: m.status || "pending",
      }))

      const { error: insertError } = await supabase
        .from("po_milestones")
        .insert(milestonesToInsert)

      if (insertError) throw insertError

      toast({
        title: "Éxito",
        description: "Todos los hitos han sido guardados correctamente",
      })

      // Refresh parent component
      if (onMilestonesUpdate) {
        onMilestonesUpdate()
      }
    } catch (error) {
      console.error("[v0] Error saving milestones:", error)
      toast({
        title: t("common.error"),
        description: "Error al guardar los hitos",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    try {
      setLoading(true)

      // If it's a temporary ID, just update local state
      if (id.startsWith("temp-")) {
        setLocalMilestones(
          localMilestones.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: "paid",
                  paid_at: new Date().toISOString(),
                }
              : m
          )
        )
      } else {
        // Update in database
        const { error } = await supabase
          .from("po_milestones")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (error) throw error

        setLocalMilestones(
          localMilestones.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: "paid",
                  paid_at: new Date().toISOString(),
                }
              : m
          )
        )
      }

      toast({
        title: "Éxito",
        description: t("po.milestone.markedAsPaid"),
      })
    } catch (error) {
      console.error("[v0] Error marking milestone as paid:", error)
      toast({
        title: t("common.error"),
        description: t("po.milestone.updateFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.milestone.totalAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMilestoneAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-2">{milestonesTotalPercent.toFixed(1)}% del total</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.milestone.collected")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${collectedAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-2">{localMilestones.length > 0 ? `${(collectedAmount / totalMilestoneAmount * 100 || 0).toFixed(1)}%` : "0%"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.milestone.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-2">{localMilestones.length > 0 ? `${(pendingAmount / totalMilestoneAmount * 100 || 0).toFixed(1)}%` : "0%"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Alert */}
      {localMilestones.length > 0 && !isBalanced && (
        <Alert className={isBalanced ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={isBalanced ? "text-green-800" : "text-amber-800"}>
            {isBalanced
              ? `Perfectamente balanceado: $${totalMilestoneAmount.toFixed(2)} = ${subtotal.toFixed(2)}`
              : `Diferencia: $${Math.abs(totalMilestoneAmount - subtotal).toFixed(2)} ${totalMilestoneAmount > subtotal ? "exceso" : "falta"}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isEditable && (
          <>
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t("po.milestone.addMilestone")}
            </Button>
            <Button
              onClick={handleSaveAllMilestones}
              disabled={!isBalanced || localMilestones.length === 0 || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Guardando..." : "Guardar Todos los Hitos"}
            </Button>
          </>
        )}
      </div>

      {/* Milestones List */}
      {localMilestones.length > 0 ? (
        <div className="space-y-3">
          {localMilestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{milestone.title}</h3>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{t("po.milestone.amount")}:</span> ${milestone.amount.toFixed(2)}
                      </div>
                      {milestone.due_date && (
                        <div>
                          <span className="font-medium">{t("po.milestone.dueDate")}:</span>{" "}
                          {format(new Date(milestone.due_date), "dd/MM/yyyy")}
                        </div>
                      )}
                      {milestone.paid_at && (
                        <div>
                          <span className="font-medium">{t("po.milestone.paidDate")}:</span>{" "}
                          {format(new Date(milestone.paid_at), "dd/MM/yyyy")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={milestone.status === "paid" ? "default" : "secondary"}
                      className={milestone.status === "paid" ? "bg-green-600" : ""}
                    >
                      {milestone.status === "paid" ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Pagado
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Pendiente
                        </>
                      )}
                    </Badge>

                    {isEditable && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditMilestone(milestone)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}

                    {milestone.status === "pending" && isEditable && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(milestone.id)}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        {t("po.milestone.markAsPaid")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            {t("po.noMilestones")}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("po.milestone.editMilestone") : t("po.milestone.addMilestone")}
            </DialogTitle>
            <DialogDescription>{t("po.milestone.configureDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t("po.milestone.title")}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("po.milestone.titlePlaceholder")}
              />
            </div>

            <div>
              <Label>{t("po.milestone.amountType")}</Label>
              <Select value={formData.amountType} onValueChange={(val) => setFormData({ ...formData, amountType: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t("po.milestone.fixed")}</SelectItem>
                  <SelectItem value="percentage">{t("po.milestone.percentage")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">
                {formData.amountType === "percentage" ? "Porcentaje (%)" : t("po.milestone.amount")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  step="0.01"
                />
              </div>
              {formData.amount > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {t("po.milestone.calculatedAmount")}:{" "}
                  {formData.amountType === "percentage"
                    ? `$${((subtotal * formData.amount) / 100).toFixed(2)} (${formData.amount}% de $${subtotal.toFixed(2)})`
                    : `$${formData.amount.toFixed(2)}`}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="dueDate">{t("po.milestone.dueDate")}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddMilestone}>{editingId ? "Actualizar" : "Agregar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
