"use client"

import { useState } from "react"
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
import { Check, Clock, Plus, Trash2, Upload } from "lucide-react"
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

interface POMilestonesTabProps {
  po: any
  milestones: any[]
  subtotal: number
  userRole?: string
  onMilestonesUpdate?: () => void
}

export function POMilestonesTab({
  po,
  milestones,
  subtotal,
  userRole = "",
  onMilestonesUpdate,
}: POMilestonesTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    amountType: "fixed", // "fixed" or "percentage"
    amount: 0,
    dueDate: "",
  })

  const isEditable = ["Admin", "BDD"].includes(userRole)

  // Calculate milestone amounts
  const getMilestoneAmount = (milestone: any) => {
    // Amount is already calculated and stored directly
    return milestone.amount
  }

  const totalMilestoneAmount = milestones.reduce((sum, milestone) => {
    return sum + getMilestoneAmount(milestone)
  }, 0)

  const collectedAmount = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, milestone) => {
      return sum + getMilestoneAmount(milestone)
    }, 0)

  const pendingAmount = totalMilestoneAmount - collectedAmount

  // Calculate percentage of total PO
  const milestonesTotalPercent = (totalMilestoneAmount / subtotal) * 100

  const handleAddMilestone = async () => {
    try {
      setLoading(true)

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

      // Calculate actual amount based on type (for UI only)
      const actualAmount =
        formData.amountType === "percentage"
          ? (subtotal * formData.amount) / 100
          : formData.amount

      // Check if total would exceed PO amount
      const currentTotal = editingId
        ? totalMilestoneAmount - (milestones.find((m) => m.id === editingId)?.amount || 0)
        : totalMilestoneAmount
      const newTotal = currentTotal + actualAmount
      if (newTotal > subtotal) {
        toast({
          title: t("common.error"),
          description: t("po.milestone.exceedsTotal"),
          variant: "destructive",
        })
        return
      }

      if (editingId) {
        // Update existing milestone - only save the calculated amount
        const { error } = await supabase
          .from("po_milestones")
          .update({
            title: formData.title,
            amount: actualAmount,
            due_date: formData.dueDate || null,
          })
          .eq("id", editingId)

        if (error) throw error
        toast({
          title: "Éxito",
          description: t("po.milestone.updated"),
        })
      } else {
        // Create new milestone - only save the calculated amount
        const { error } = await supabase.from("po_milestones").insert([
          {
            po_id: po.id,
            title: formData.title,
            amount: actualAmount,
            due_date: formData.dueDate || null,
            status: "pending",
          },
        ])

        if (error) throw error
        toast({
          title: "Éxito",
          description: t("po.milestone.created"),
        })
      }

      setFormData({ title: "", amountType: "fixed", amount: 0, dueDate: "" })
      setEditingId(null)
      setShowAddDialog(false)
      onMilestonesUpdate?.()
    } catch (error) {
      console.error("[v0] Error saving milestone:", error)
      toast({
        title: t("common.error"),
        description: t("po.milestone.saveFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm(t("po.milestone.confirmDelete"))) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from("po_milestones")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast({
        title: "Éxito",
        description: t("po.milestone.deleted"),
      })
      onMilestonesUpdate?.()
    } catch (error) {
      console.error("[v0] Error deleting milestone:", error)
      toast({
        title: t("common.error"),
        description: t("po.milestone.deleteFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (milestone: any) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from("po_milestones")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", milestone.id)

      if (error) throw error
      toast({
        title: "Éxito",
        description: t("po.milestone.markedAsPaid"),
      })
      onMilestonesUpdate?.()
    } catch (error) {
      console.error("[v0] Error updating milestone:", error)
      toast({
        title: t("common.error"),
        description: t("po.milestone.updateFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditMilestone = (milestone: any) => {
    setFormData({
      title: milestone.title,
      amountType: "fixed", // Default to fixed when editing
      amount: milestone.amount,
      dueDate: milestone.due_date || "",
    })
    setEditingId(milestone.id)
    setShowAddDialog(true)
  }

  const handleAmountTypeChange = (type: string) => {
    setFormData({ ...formData, amountType: type })
  }

  const handleAmountChange = (value: string) => {
    const num = parseFloat(value) || 0
    if (formData.amountType === "percentage") {
      if (num > 100) {
        toast({
          title: t("common.warning"),
          description: t("po.milestone.percentageMax"),
        })
        return
      }
    }
    setFormData({ ...formData, amount: num })
  }

  // Auto-calculate amount when percentage changes
  const autoCalculatedAmount =
    formData.amountType === "percentage"
      ? (subtotal * formData.amount) / 100
      : formData.amount

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.milestone.totalAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMilestoneAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">{milestonesTotalPercent.toFixed(1)}% del Total</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">
              {t("po.milestone.collected")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${collectedAmount.toFixed(2)}</div>
            <div className="text-xs text-green-700 mt-1">
              {milestones.filter((m) => m.status === "paid").length} de {milestones.length}{" "}
              pagados
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-900">
              {t("po.milestone.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</div>
            <div className="text-xs text-orange-700 mt-1">
              {milestones.filter((m) => m.status === "pending").length} pendientes
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">
              {t("po.detail.total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${subtotal.toFixed(2)}</div>
            <div className="text-xs text-blue-700 mt-1">Presupuesto Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Milestone Button */}
      {isEditable && (
        <Button onClick={() => setShowAddDialog(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          {t("po.milestone.addMilestone")}
        </Button>
      )}

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("po.detail.milestones")}</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("po.detail.noMilestones")}
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => {
                const amount = getMilestoneAmount(milestone)
                const isCompleted = milestone.status === "paid"

                return (
                  <div
                    key={milestone.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition"
                  >
                    {/* Header with title and status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full mt-0.5 flex-shrink-0 ${
                            isCompleted
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-lg">{milestone.title}</div>
                          {milestone.due_date && (
                            <div className="text-sm text-gray-600 mt-1">
                              {t("po.milestone.dueDate")}: {format(new Date(milestone.due_date), "dd/MM/yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-lg">${amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {milestone.amount_type === "percentage"
                            ? `${milestone.amount}% del total`
                            : "Monto fijo"}
                        </div>
                      </div>
                    </div>

                    {/* Status and dates */}
                    <div className="flex items-center gap-3 ml-11">
                      <Badge
                        className={
                          isCompleted
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                        }
                      >
                        {isCompleted ? t("po.milestone.paid") : t("po.milestone.pending")}
                      </Badge>

                      {milestone.paid_at && (
                        <div className="text-xs text-green-700">
                          {t("po.milestone.paidDate")}: {format(new Date(milestone.paid_at), "dd/MM/yyyy")}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isEditable && (
                      <div className="flex gap-2 ml-11">
                        {!isCompleted && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMilestone(milestone)}
                            >
                              {t("common.edit")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100"
                              onClick={() => handleMarkAsPaid(milestone)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              {t("po.milestone.markAsPaid")}
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Milestone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("po.milestone.editMilestone")
                : t("po.milestone.addMilestone")}
            </DialogTitle>
            <DialogDescription>
              {t("po.milestone.configureDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("po.milestone.title")}</Label>
              <Input
                id="title"
                placeholder={t("po.milestone.titlePlaceholder")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Amount Type */}
            <div className="space-y-2">
              <Label htmlFor="amountType">{t("po.milestone.amountType")}</Label>
              <Select value={formData.amountType} onValueChange={handleAmountTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t("po.milestone.fixed")}</SelectItem>
                  <SelectItem value="percentage">{t("po.milestone.percentage")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                {formData.amountType === "percentage"
                  ? t("po.milestone.percentage")
                  : t("po.milestone.amount")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount || ""}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  step={formData.amountType === "percentage" ? "1" : "0.01"}
                  min="0"
                  max={formData.amountType === "percentage" ? "100" : undefined}
                />
                {formData.amountType === "percentage" && (
                  <div className="flex items-center px-3 bg-gray-100 rounded text-sm font-medium">
                    %
                  </div>
                )}
              </div>
              {autoCalculatedAmount > 0 && (
                <div className="text-sm text-gray-600">
                  {formData.amountType === "percentage"
                    ? `${t("po.milestone.calculatedAmount")}: $${autoCalculatedAmount.toFixed(2)}`
                    : `Equivale a ${((autoCalculatedAmount / subtotal) * 100).toFixed(2)}% del total`}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">{t("po.milestone.dueDate")}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            {/* Validation warning */}
            {totalMilestoneAmount + autoCalculatedAmount > subtotal && !editingId && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                {t("po.milestone.exceedsTotal")}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setFormData({ title: "", amountType: "fixed", amount: 0, dueDate: "" })
                setEditingId(null)
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddMilestone} disabled={loading}>
              {loading ? "Guardando..." : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
