'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from '@/hooks/use-translations'
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface POMilestonesTabProps {
  po: any
  milestones: any[]
  subtotal: number
  userRole: string
  onMilestonesUpdate: () => void
}

interface LocalMilestone {
  tempId: string
  title: string
  amount: number
  type: 'fixed' | 'percentage'
  due_date: string
}

export function POMilestonesTab({ po, milestones: initialMilestones, subtotal, userRole, onMilestonesUpdate }: POMilestonesTabProps) {
  const { t } = useTranslations(DICT_LANG_PO)
  const supabase = createClient()

  // State for milestones being created (not yet in BD)
  const [localMilestones, setLocalMilestones] = useState<LocalMilestone[]>([])
  
  // State for existing milestones (from BD)
  const [dbMilestones, setDbMilestones] = useState<any[]>(initialMilestones || [])

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'fixed' as 'fixed' | 'percentage',
    due_date: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [mismatchAlert, setMismatchAlert] = useState(false)

  // Role-based permissions
  const isAdmin = ['Admin', 'BDD'].includes(userRole)
  const canCreate = isAdmin

  // Calculate totals
  const calculateTotal = () => {
    return localMilestones.reduce((sum, m) => {
      if (m.type === 'percentage') {
        return sum + (subtotal * m.amount / 100)
      }
      return sum + m.amount
    }, 0)
  }

  const totalAmount = calculateTotal()
  const remainingAmount = subtotal - totalAmount
  const isComplete = Math.abs(totalAmount - subtotal) < 0.01

  // Add milestone to local list (not DB)
  const handleAddMilestone = () => {
    if (!formData.title || !formData.amount) {
      toast({
        description: t('po.milestone.fillRequired') || 'Completa todos los campos',
        variant: 'destructive',
      })
      return
    }

    const newMilestone: LocalMilestone = {
      tempId: `temp-${Date.now()}`,
      title: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type,
      due_date: formData.due_date,
    }

    setLocalMilestones([...localMilestones, newMilestone])
    
    // Reset form
    setFormData({
      title: '',
      amount: '',
      type: 'fixed',
      due_date: '',
    })

    toast({
      description: t('po.milestone.added') || 'Hito agregado',
    })
  }

  // Delete milestone from local list
  const handleDeleteMilestone = (index: number) => {
    setDeleteIndex(index)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      setLocalMilestones(localMilestones.filter((_, i) => i !== deleteIndex))
      setShowDeleteDialog(false)
      setDeleteIndex(null)
      toast({
        description: t('po.milestone.removed') || 'Hito eliminado',
      })
    }
  }

  // Generate/Create all milestones in DB
  const handleGenerateMilestones = async () => {
    // Validate total matches exactly
    if (!isComplete) {
      setMismatchAlert(true)
      return
    }

    if (localMilestones.length === 0) {
      toast({
        description: t('po.milestone.noMilestonesToCreate') || 'Agrega al menos un hito',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Insert all milestones at once
      const milestonesToInsert = localMilestones.map(m => ({
        po_id: po.id,
        title: m.title,
        amount: m.type === 'percentage' ? (subtotal * m.amount / 100) : m.amount,
        due_date: m.due_date || null,
        status: 'pending',
      }))

      const { error } = await supabase
        .from('po_milestones')
        .insert(milestonesToInsert)

      if (error) {
        toast({
          description: t('common.error') || 'Error al generar hitos',
          variant: 'destructive',
        })
        console.error('[v0] Error creating milestones:', error)
        return
      }

      toast({
        description: t('po.milestone.createdSuccess') || 'Hitos generados exitosamente',
      })

      // Clear local list
      setLocalMilestones([])
      
      // Refresh milestones from DB
      onMilestonesUpdate()
    } catch (error) {
      console.error('[v0] Error:', error)
      toast({
        description: t('common.error') || 'Error al generar hitos',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing Milestones from DB */}
      {dbMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('po.milestone.existingMilestones') || 'Hitos Existentes'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('po.milestone.title')}</TableHead>
                  <TableHead className="text-right">{t('po.milestone.amount')}</TableHead>
                  <TableHead>{t('po.milestone.dueDate')}</TableHead>
                  <TableHead>{t('po.milestone.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dbMilestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell className="font-medium">{milestone.title}</TableCell>
                    <TableCell className="text-right">${milestone.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {milestone.due_date 
                        ? new Date(milestone.due_date).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{milestone.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form to Add New Milestones */}
      {canCreate && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>{t('po.milestone.createNew') || 'Crear Nuevos Hitos'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">{t('po.milestone.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('po.milestone.titlePlaceholder') || 'Ej: Depósito inicial'}
                />
              </div>

              {/* Type Selection */}
              <div>
                <Label>{t('po.milestone.amountType') || 'Tipo'}</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      checked={formData.type === 'fixed'}
                      onChange={(e) => setFormData({ ...formData, type: 'fixed' as const })}
                    />
                    <span className="text-sm">{t('po.milestone.fixedAmount') || 'Monto Fijo'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="percentage"
                      checked={formData.type === 'percentage'}
                      onChange={(e) => setFormData({ ...formData, type: 'percentage' as const })}
                    />
                    <span className="text-sm">{t('po.milestone.percentage') || 'Porcentaje'}</span>
                  </label>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">
                  {formData.type === 'percentage' 
                    ? (t('po.milestone.percentageValue') || '%')
                    : (t('po.milestone.amount') || 'Monto')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step={formData.type === 'percentage' ? '0.01' : '0.01'}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                  />
                  {formData.type === 'percentage' && <span className="flex items-center text-sm text-gray-600">%</span>}
                </div>
                {formData.type === 'percentage' && formData.amount && (
                  <p className="text-xs text-gray-600 mt-1">
                    = ${((subtotal * parseFloat(formData.amount)) / 100).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <Label htmlFor="due_date">{t('po.milestone.dueDate')}</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            {/* Add Button */}
            <Button 
              onClick={handleAddMilestone}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('po.milestone.addToList') || 'Agregar a la lista'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary and Local Milestones Preview */}
      {localMilestones.length > 0 && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <div className="flex justify-between items-center">
              <CardTitle>{t('po.milestone.previewToCreate') || 'Vista Previa de Hitos a Crear'}</CardTitle>
              <Badge variant={isComplete ? 'default' : 'destructive'}>
                {isComplete ? '✓ ' : ''}{t('po.milestone.totalMatches') || 'Total correcto'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('po.milestone.title')}</TableHead>
                  <TableHead className="text-right">{t('po.milestone.value')}</TableHead>
                  <TableHead className="text-right">{t('po.milestone.finalAmount')}</TableHead>
                  <TableHead>{t('po.milestone.dueDate')}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localMilestones.map((milestone, index) => {
                  const finalAmount = milestone.type === 'percentage' 
                    ? (subtotal * milestone.amount / 100)
                    : milestone.amount

                  return (
                    <TableRow key={milestone.tempId}>
                      <TableCell className="font-medium">{milestone.title}</TableCell>
                      <TableCell className="text-right">
                        {milestone.type === 'percentage' ? `${milestone.amount}%` : `$${milestone.amount.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right">${finalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        {milestone.due_date 
                          ? new Date(milestone.due_date).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMilestone(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Summary */}
            <div className="mt-6 space-y-2 p-4 bg-gray-50 rounded">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('po.milestone.total') || 'Total PO'}:</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('po.milestone.assignedAmount') || 'Asignado'}:</span>
                <span className="font-bold">${totalAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-sm ${isComplete ? 'text-green-700' : 'text-red-700'}`}>
                <span>{t('po.milestone.remainingAmount') || 'Pendiente'}:</span>
                <span className="font-bold">${remainingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateMilestones}
              disabled={isLoading || !isComplete}
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (t('common.generating') || 'Generando...') : (t('po.milestone.generateMilestones') || 'Generar Hitos')}
            </Button>

            {!isComplete && (
              <p className="text-xs text-red-600 text-center mt-2">
                {t('po.milestone.totalMustMatch') || 'El total debe coincidir exactamente con el monto del PO'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('po.milestone.confirmDelete') || '¿Eliminar hito?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('po.milestone.deleteWarning') || 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mismatch Alert */}
      <AlertDialog open={mismatchAlert} onOpenChange={setMismatchAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('po.milestone.totalMismatch') || 'Error: Total no coincide'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('po.milestone.mismatchMessage') || `El total asignado ($${totalAmount.toFixed(2)}) no coincide con el total del PO ($${subtotal.toFixed(2)}). Ajusta los hitos para que coincida exactamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMismatchAlert(false)}>
              {t('common.understood')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
