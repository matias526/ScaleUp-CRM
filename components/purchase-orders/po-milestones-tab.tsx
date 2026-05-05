'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Edit2, Trash2, Upload, FileText, Check, Eye, X } from 'lucide-react'
import { format } from 'date-fns'
import { put, del } from '@vercel/blob'

interface POMilestonesTabProps {
  po: any
  milestones: any[]
  subtotal: number
  userRole: string
  onMilestonesUpdate: () => void
}

export function POMilestonesTab({ po, milestones: initialMilestones, subtotal, userRole, onMilestonesUpdate }: POMilestonesTabProps) {
  const { t } = useTranslation()
  const supabase = createClient()

  const [milestones, setMilestones] = useState<any[]>(initialMilestones || [])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showConfirmPaymentDialog, setShowConfirmPaymentDialog] = useState(false)
  const [showViewDocumentDialog, setShowViewDocumentDialog] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null)
  const [editFormData, setEditFormData] = useState({ title: '', amount: 0, due_date: '' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<{ [key: string]: any }>({})

  // Role-based permissions
  const isAdmin = ['Admin', 'BDD'].includes(userRole)
  const isPartner = userRole === 'PartnerUser'
  const isTech = ['TechUser', 'TechLogistic'].includes(userRole)

  // Get milestone status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_process':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Load document for milestone
  const loadMilestoneDocument = async (milestoneId: string) => {
    if (documents[milestoneId]) return documents[milestoneId]
    
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('parent_id', milestoneId)
        .eq('parent_type', 'po_milestone')
        .single()
      
      if (data) {
        setDocuments(prev => ({ ...prev, [milestoneId]: data }))
      }
      return data
    } catch (error) {
      return null
    }
  }

  // Handle edit milestone
  const handleEditMilestone = (milestone: any) => {
    setSelectedMilestone(milestone)
    setEditFormData({
      title: milestone.title,
      amount: milestone.amount,
      due_date: milestone.due_date || '',
    })
    setShowEditDialog(true)
  }

  // Save edited milestone
  const handleSaveEdit = async () => {
    if (!selectedMilestone || !editFormData.title || editFormData.amount <= 0) {
      toast({
        title: t('common.error'),
        description: t('po.milestone.titleRequired'),
        variant: 'destructive',
      })
      return
    }

    // Validate total doesn't exceed PO
    const otherMilestonesTotal = milestones
      .filter(m => m.id !== selectedMilestone.id)
      .reduce((sum, m) => sum + (m.amount || 0), 0)
    
    if (otherMilestonesTotal + editFormData.amount > subtotal) {
      toast({
        title: t('common.error'),
        description: t('po.milestone.exceedsTotal'),
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
          amount: editFormData.amount,
          due_date: editFormData.due_date || null,
        })
        .eq('id', selectedMilestone.id)

      if (error) throw error

      toast({
        title: t('common.success'),
        description: t('po.milestone.updated'),
      })
      setShowEditDialog(false)
      onMilestonesUpdate()
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete milestone
  const handleDeleteMilestone = async (milestone: any) => {
    setIsLoading(true)
    try {
      // Delete associated document if exists
      const doc = documents[milestone.id]
      if (doc) {
        await del(doc.file_url)
        await supabase.from('documents').delete().eq('id', doc.id)
      }

      // Delete milestone
      const { error } = await supabase
        .from('po_milestones')
        .delete()
        .eq('id', milestone.id)

      if (error) throw error

      toast({
        title: t('common.success'),
        description: t('po.milestone.deleted'),
      })
      onMilestonesUpdate()
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle upload document
  const handleUploadDocument = async () => {
    if (!selectedMilestone || !uploadFile) {
      toast({
        title: t('common.error'),
        description: t('po.milestone.selectFile'),
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Upload file to blob
      const fileExtension = uploadFile.name.split('.').pop()
      const fileName = `po-${po.id}-milestone-${selectedMilestone.id}-${Date.now()}.${fileExtension}`
      const filePath = `po-documents/${fileName}`

      const blob = await put(filePath, uploadFile, {
        access: 'private',
        addRandomSuffix: false,
      })

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert([
          {
            parent_id: selectedMilestone.id,
            parent_type: 'po_milestone',
            doc_type: 'invoice',
            file_url: blob.url,
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (docError) throw docError

      // Update milestone status to 'in_process'
      const { error: updateError } = await supabase
        .from('po_milestones')
        .update({ status: 'in_process', invoiced_at: new Date().toISOString() })
        .eq('id', selectedMilestone.id)

      if (updateError) throw updateError

      setDocuments(prev => ({ ...prev, [selectedMilestone.id]: doc }))

      toast({
        title: t('common.success'),
        description: t('po.milestone.documentUploaded'),
      })
      setShowUploadDialog(false)
      setUploadFile(null)
      onMilestonesUpdate()
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete document
  const handleDeleteDocument = async (milestone: any) => {
    const doc = documents[milestone.id]
    if (!doc) return

    setIsLoading(true)
    try {
      // Delete from blob
      await del(doc.file_url)

      // Delete document record
      await supabase.from('documents').delete().eq('id', doc.id)

      // Update milestone status back to 'pending'
      await supabase
        .from('po_milestones')
        .update({ status: 'pending', invoiced_at: null })
        .eq('id', milestone.id)

      setDocuments(prev => {
        const updated = { ...prev }
        delete updated[milestone.id]
        return updated
      })

      toast({
        title: t('common.success'),
        description: t('po.milestone.documentDeleted'),
      })
      onMilestonesUpdate()
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle confirm payment
  const handleConfirmPayment = async () => {
    if (!selectedMilestone) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('po_milestones')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          achieved_at: new Date().toISOString(),
        })
        .eq('id', selectedMilestone.id)

      if (error) throw error

      toast({
        title: t('common.success'),
        description: t('po.milestone.markedAsPaid'),
      })
      setShowConfirmPaymentDialog(false)
      onMilestonesUpdate()
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get allowed actions for milestone based on role and status
  const getActionPermissions = (milestone: any) => {
    const status = milestone.status?.toLowerCase()
    
    return {
      canEdit: isAdmin && status === 'pending',
      canDelete: isAdmin && status === 'pending',
      canUploadDocument: (isAdmin || isPartner) && status === 'pending',
      canDeleteDocument: (isAdmin || isPartner) && status === 'in_process',
      canConfirmPayment: (isAdmin || isTech) && status === 'in_process',
      canViewDocument: status === 'in_process' || status === 'paid',
    }
  }

  // Calculate totals
  const totalMilestones = milestones.reduce((sum, m) => sum + (m.amount || 0), 0)
  const paidMilestones = milestones
    .filter(m => m.status?.toLowerCase() === 'paid')
    .reduce((sum, m) => sum + (m.amount || 0), 0)
  const pendingMilestones = totalMilestones - paidMilestones

  return (
    <div className="space-y-6">
      {/* Dashboard Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('po.milestone.totalMilestones')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMilestones.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {totalMilestones > 0 ? ((totalMilestones / subtotal) * 100).toFixed(1) : '0'}% {t('po.milestone.ofTotal')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('po.milestone.collected')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${paidMilestones.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {totalMilestones > 0 ? ((paidMilestones / totalMilestones) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('po.milestone.pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${pendingMilestones.toFixed(2)}</div>
            <p className="text-xs text-gray-600 mt-1">
              {totalMilestones > 0 ? ((pendingMilestones / totalMilestones) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              {t('po.milestone.noMilestones')}
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone) => {
            const permissions = getActionPermissions(milestone)
            const doc = documents[milestone.id]
            
            return (
              <Card key={milestone.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    {/* Milestone Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{milestone.title}</h3>
                      <p className="text-sm text-gray-600">
                        {t('po.milestone.amount')}: ${milestone.amount?.toFixed(2) || '0.00'}
                      </p>
                      {milestone.due_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('po.milestone.dueDate')}: {format(new Date(milestone.due_date), 'dd/MM/yyyy')}
                        </p>
                      )}
                      {milestone.paid_at && (
                        <p className="text-xs text-gray-500">
                          {t('po.milestone.paidDate')}: {format(new Date(milestone.paid_at), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="mx-6">
                      <Badge className={getStatusBadgeColor(milestone.status)}>
                        {t(`po.milestone.status.${milestone.status?.toLowerCase() || 'pending'}`)}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        {/* Edit */}
                        {permissions.canEdit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditMilestone(milestone)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('common.edit')}</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Delete */}
                        {permissions.canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('po.milestone.delete')}</TooltipContent>
                              </Tooltip>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('common.warning')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('po.milestone.confirmDelete')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMilestone(milestone)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t('po.milestone.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Upload Document */}
                        {permissions.canUploadDocument && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMilestone(milestone)
                                  setShowUploadDialog(true)
                                  setUploadFile(null)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('po.milestone.uploadDocument')}</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Delete Document */}
                        {permissions.canDeleteDocument && doc && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('po.milestone.deleteDocument')}</TooltipContent>
                              </Tooltip>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('common.warning')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('po.milestone.confirmDeleteDocument')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(milestone)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t('po.milestone.deleteDocument')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* View Document */}
                        {permissions.canViewDocument && doc && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('po.milestone.viewDocument')}</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Confirm Payment */}
                        {permissions.canConfirmPayment && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMilestone(milestone)
                                  setShowConfirmPaymentDialog(true)
                                }}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('po.milestone.confirmPayment')}</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('po.milestone.editMilestone')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('po.milestone.title')}</Label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('po.milestone.amount')}</Label>
              <Input
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>{t('po.milestone.dueDate')}</Label>
              <Input
                type="date"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('po.milestone.uploadDocument')}</DialogTitle>
            <DialogDescription>
              {t('po.milestone.selectFileDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('po.milestone.selectFile')}</Label>
              <Input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.png,.doc,.docx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUploadDocument} disabled={isLoading || !uploadFile}>
              {t('common.upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={showConfirmPaymentDialog} onOpenChange={setShowConfirmPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('po.milestone.confirmPayment')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMilestone && (
              <>
                <div>
                  <p className="text-sm text-gray-600">{t('po.milestone.title')}</p>
                  <p className="font-medium">{selectedMilestone.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('po.milestone.amount')}</p>
                  <p className="font-medium">${selectedMilestone.amount?.toFixed(2)}</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmPaymentDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isLoading}>
              {t('po.milestone.confirmPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
