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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit2, Trash2, Plus, Upload, FileText, Check, X } from 'lucide-react'
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

  // Milestone action modals
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [milestoneDocuments, setMilestoneDocuments] = useState<{ [key: string]: any }>({})
  
  // Edit form
  const [editFormData, setEditFormData] = useState({
    title: '',
    amount: '',
    due_date: '',
  })

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
  const handleDeleteMilestoneFromList = (index: number) => {
    setDeleteIndex(index)
    setShowDeleteDialog(true)
  }

  // Delete milestone from DB
  const handleDeleteMilestone = async (milestone: any) => {
    setSelectedMilestone(milestone)
    if (window.confirm(t('po.milestone.confirmDelete'))) {
      setIsLoading(true)
      try {
        const { error } = await supabase
          .from('po_milestones')
          .delete()
          .eq('id', milestone.id)

        if (error) throw error

        // Refresh milestones
        setDbMilestones(dbMilestones.filter(m => m.id !== milestone.id))
        toast({
          description: t('po.milestone.removed') || 'Hito eliminado',
        })
        onMilestonesUpdate()
      } catch (error) {
        toast({
          description: 'Error al eliminar hito',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
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

  // Edit milestone
  const handleEditMilestone = (milestone: any) => {
    setSelectedMilestone(milestone)
    setEditFormData({
      title: milestone.title,
      amount: milestone.amount.toString(),
      due_date: milestone.due_date ? milestone.due_date.split('T')[0] : '',
    })
    setShowEditModal(true)
  }

  const handleSaveEditMilestone = async () => {
    if (!editFormData.title || !editFormData.amount) {
      toast({
        description: t('po.milestone.fillRequired'),
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('po_milestones')
        .update({
          title: editFormData.title,
          amount: parseFloat(editFormData.amount),
          due_date: editFormData.due_date || null,
        })
        .eq('id', selectedMilestone.id)

      if (error) throw error

      setDbMilestones(dbMilestones.map(m => 
        m.id === selectedMilestone.id 
          ? { ...m, ...editFormData, amount: parseFloat(editFormData.amount) }
          : m
      ))
      setShowEditModal(false)
      toast({
        description: 'Hito actualizado correctamente',
      })
      onMilestonesUpdate()
    } catch (error) {
      toast({
        description: 'Error al actualizar hito',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Upload document
  const handleOpenUploadModal = (milestone: any) => {
    setSelectedMilestone(milestone)
    setUploadFile(null)
    setShowUploadModal(true)
  }

  const handleUploadDocument = async () => {
    if (!uploadFile) {
      toast({
        description: 'Selecciona un archivo',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Upload file to bucket
      const fileName = `${selectedMilestone.id}-${Date.now()}-${uploadFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('po_documents')
        .upload(fileName, uploadFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('po_documents')
        .getPublicUrl(fileName)

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          parent_id: selectedMilestone.id,
          parent_type: 'po_milestone',
          doc_type: 'proof',
          file_url: data.publicUrl,
          uploaded_at: new Date().toISOString(),
          status: 'pending',
        })
        .select()

      if (docError) throw docError

      // Update milestone status to in_process
      const { error: updateError } = await supabase
        .from('po_milestones')
        .update({ status: 'in_process' })
        .eq('id', selectedMilestone.id)

      if (updateError) throw updateError

      setMilestoneDocuments({
        ...milestoneDocuments,
        [selectedMilestone.id]: docData[0],
      })
      setDbMilestones(dbMilestones.map(m =>
        m.id === selectedMilestone.id ? { ...m, status: 'in_process' } : m
      ))
      setShowUploadModal(false)
      toast({
        description: 'Documento cargado y hito marcado como en proceso',
      })
      onMilestonesUpdate()
    } catch (error) {
      console.error('Error:', error)
      toast({
        description: 'Error al cargar documento',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete document
  const handleDeleteDocument = async (milestone: any) => {
    if (!window.confirm(t('po.milestone.confirmDeleteDoc'))) return

    setIsLoading(true)
    try {
      // Get document
      const { data: docs } = await supabase
        .from('documents')
        .select()
        .eq('parent_id', milestone.id)
        .eq('parent_type', 'po_milestone')

      if (docs && docs.length > 0) {
        const doc = docs[0]
        
        // Delete from storage
        const fileName = doc.file_url.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('po_documents')
            .remove([fileName])
        }

        // Delete document record
        await supabase
          .from('documents')
          .delete()
          .eq('id', doc.id)
      }

      // Update milestone status back to pending
      await supabase
        .from('po_milestones')
        .update({ status: 'pending' })
        .eq('id', milestone.id)

      const newDocs = { ...milestoneDocuments }
      delete newDocs[milestone.id]
      setMilestoneDocuments(newDocs)
      setDbMilestones(dbMilestones.map(m =>
        m.id === milestone.id ? { ...m, status: 'pending' } : m
      ))
      toast({
        description: 'Documento eliminado',
      })
      onMilestonesUpdate()
    } catch (error) {
      toast({
        description: 'Error al eliminar documento',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Confirm payment
  const handleOpenConfirmPaymentModal = async (milestone: any) => {
    setSelectedMilestone(milestone)
    
    // Load document if exists
    try {
      const { data: docs } = await supabase
        .from('documents')
        .select()
        .eq('parent_id', milestone.id)
        .eq('parent_type', 'po_milestone')

      if (docs && docs.length > 0) {
        setMilestoneDocuments({
          ...milestoneDocuments,
          [milestone.id]: docs[0],
        })
      }
    } catch (error) {
      console.error('Error loading document:', error)
    }

    setShowConfirmPaymentModal(true)
  }

  const handleConfirmPayment = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('po_milestones')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', selectedMilestone.id)

      if (error) throw error

      setDbMilestones(dbMilestones.map(m =>
        m.id === selectedMilestone.id 
          ? { ...m, status: 'paid', paid_at: new Date().toISOString() }
          : m
      ))
      setShowConfirmPaymentModal(false)
      toast({
        description: 'Pago confirmado',
      })
      onMilestonesUpdate()
    } catch (error) {
      toast({
        description: 'Error al confirmar pago',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
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
                  <TableHead className="w-16">{t('common.actions')}</TableHead>
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
                      <Badge variant={milestone.status === 'paid' ? 'default' : milestone.status === 'in_process' ? 'secondary' : 'outline'}>
                        {t(`po.milestone.status.${milestone.status}`) || milestone.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Edit - Admin/BDD, Pending only */}
                        {isAdmin && milestone.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={t('po.milestone.action.edit')}
                            onClick={() => handleEditMilestone(milestone)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete - Admin/BDD, Pending only */}
                        {isAdmin && milestone.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={t('po.milestone.action.delete')}
                            onClick={() => handleDeleteMilestone(milestone)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Upload Document - Admin/BDD/PartnerUser, Pending only */}
                        {(isAdmin || userRole === 'PartnerUser') && milestone.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={t('po.milestone.action.uploadDoc')}
                            onClick={() => handleOpenUploadModal(milestone)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete Document - Admin/BDD/PartnerUser, In Process only */}
                        {(isAdmin || userRole === 'PartnerUser') && milestone.status === 'in_process' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={t('po.milestone.action.deleteDoc')}
                            onClick={() => handleDeleteDocument(milestone)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Confirm Payment - Admin/BDD/TechUser/TechLogistic, In Process only */}
                        {(['Admin', 'BDD', 'TechUser', 'TechLogistic'].includes(userRole)) && milestone.status === 'in_process' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title={t('po.milestone.action.confirmPayment')}
                            onClick={() => handleOpenConfirmPaymentModal(milestone)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
                          onClick={() => handleDeleteMilestoneFromList(index)}
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

      {/* Edit Milestone Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('po.milestone.action.edit') || 'Editar Hito'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t('po.milestone.title')}</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-amount">{t('po.milestone.amount')}</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-duedate">{t('po.milestone.dueDate')}</Label>
              <Input
                id="edit-duedate"
                type="date"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEditMilestone} disabled={isLoading}>
              {isLoading ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('po.milestone.action.uploadDoc') || 'Cargar Comprobante'}</DialogTitle>
            <DialogDescription>
              {selectedMilestone && `${t('po.milestone.title')}: ${selectedMilestone.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document">{t('po.milestone.selectFile')}</Label>
              <Input
                id="document"
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept="application/pdf,image/*"
              />
              {uploadFile && (
                <p className="text-sm text-gray-600 mt-2">{uploadFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUploadDocument} disabled={isLoading || !uploadFile}>
              {isLoading ? t('common.uploading') : t('po.milestone.action.uploadDoc')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Modal */}
      <Dialog open={showConfirmPaymentModal} onOpenChange={setShowConfirmPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('po.milestone.action.confirmPayment') || 'Confirmar Pago'}</DialogTitle>
            <DialogDescription>
              {selectedMilestone && `${t('po.milestone.title')}: ${selectedMilestone.title} - $${selectedMilestone.amount.toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedMilestone && milestoneDocuments[selectedMilestone.id] && (
            <div className="border rounded p-3 bg-gray-50 space-y-2">
              <p className="text-sm font-medium">{t('po.milestone.relatedDocument')}</p>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <a 
                  href={milestoneDocuments[selectedMilestone.id].file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate"
                >
                  {milestoneDocuments[selectedMilestone.id].file_url.split('/').pop()}
                </a>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmPaymentModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleConfirmPayment} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? t('common.confirming') : t('po.milestone.action.confirmPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
