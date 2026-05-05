'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from '@/hooks/use-translations'
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
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

interface POMilestonesTabProps {
  po: any
  milestones: any[]
  subtotal: number
  userRole: string
  onMilestonesUpdate: () => void
}

export function POMilestonesTab({ po, milestones: initialMilestones, subtotal, userRole, onMilestonesUpdate }: POMilestonesTabProps) {
    const { t } = useTranslations(DICT_LANG_PO)
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

  // Initialize documents from initialMilestones pre-loaded data
  useEffect(() => {
    if (initialMilestones && initialMilestones.length > 0) {
      const docsMap: { [key: string]: any } = {}
      for (const milestone of initialMilestones) {
        if (milestone._document) {
          docsMap[milestone.id] = milestone._document
        }
      }
      setDocuments(docsMap)
    }
  }, [initialMilestones])

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
        // Extract file path from signed URL
        const urlParts = doc.file_url.split('/storage/v1/object/sign/po_documents/')
        const filePath = urlParts[1]?.split('?')[0]
        
        // Delete from Supabase storage
        if (filePath) {
          await supabase.storage
            .from('po_documents')
            .remove([filePath])
        }
        
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
      // Upload file to Supabase storage
      const fileExtension = uploadFile.name.split('.').pop()
      const fileName = `po-${po.id}-milestone-${selectedMilestone.id}-${Date.now()}.${fileExtension}`
      const filePath = `milestones/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('po_documents')
        .upload(filePath, uploadFile)

      if (uploadError) throw uploadError

      // Generate signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('po_documents')
        .createSignedUrl(filePath, 604800) // 7 days

      if (signedError) throw signedError

      const fileUrl = signedData.signedUrl

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert([
          {
            parent_id: selectedMilestone.id,
            parent_type: 'po_milestone',
            doc_type: 'invoice',
            file_url: fileUrl,
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
      // Extract file path from signed URL
      const urlParts = doc.file_url.split('/storage/v1/object/sign/po_documents/')
      const filePath = urlParts[1]?.split('?')[0]

      // Delete from Supabase storage
      if (filePath) {
        await supabase.storage
          .from('po_documents')
          .remove([filePath])
      }

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
              <Card key={milestone.id} className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Milestone Info - Horizontal Layout */}
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">{milestone.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                          <div>
                            <span className="font-bold">Monto:</span> ${milestone.amount?.toFixed(2) || '0.00'}
                          </div>
                          {milestone.due_date && (
                            <div>
                              <span className="font-bold">Vencimiento:</span> {format(new Date(milestone.due_date), 'dd/MM/yyyy')}
                            </div>
                          )}
                          {milestone.paid_at && (
                            <div>
                              <span className="font-bold">Pagado:</span> {format(new Date(milestone.paid_at), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusBadgeColor(milestone.status)}>
                        {t(`po.milestone.status.${milestone.status?.toLowerCase() || 'pending'}`)}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        {/* Edit */}
                        {permissions.canEdit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditMilestone(milestone)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
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
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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
                                className="h-7 w-7 p-0"
                              >
                                <Upload className="h-3.5 w-3.5" />
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
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-3.5 w-3.5" />
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
                        {doc && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMilestone(milestone)
                                  setShowViewDocumentDialog(true)
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <FileText className="h-3.5 w-3.5" />
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
                                onClick={async () => {
                                  setSelectedMilestone(milestone)
                                  await loadMilestoneDocument(milestone.id)
                                  setShowConfirmPaymentDialog(true)
                                }}
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-3.5 w-3.5" />
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
                      <TooltipProvider>
                        {/* Edit */}
                        {permissions.canEdit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditMilestone(milestone)}
                                className="h-7 w-7 p-0 text-xs"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
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
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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
                                className="h-7 w-7 p-0"
                              >
                                <Upload className="h-3.5 w-3.5" />
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
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-3.5 w-3.5" />
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
                        {doc && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMilestone(milestone)
                                  setShowViewDocumentDialog(true)
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <FileText className="h-3.5 w-3.5" />
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
                                onClick={async () => {
                                  setSelectedMilestone(milestone)
                                  await loadMilestoneDocument(milestone.id)
                                  setShowConfirmPaymentDialog(true)
                                }}
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-3.5 w-3.5" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('po.milestone.confirmPayment')}</DialogTitle>
          </DialogHeader>
          {selectedMilestone && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-semibold">{selectedMilestone.title}</p>
                <p className="text-sm text-gray-600">Monto: ${selectedMilestone.amount?.toFixed(2)}</p>
              </div>
              
              {/* Document Preview */}
              {documents[selectedMilestone.id] && (
                <div className="border rounded p-4 bg-white">
                  <p className="text-sm font-semibold mb-3">{t('po.milestone.viewDocument')}</p>
                  <iframe
                    src={documents[selectedMilestone.id].file_url}
                    className="w-full h-96 border rounded"
                    title="Document Preview"
                  />
                  <a
                    href={documents[selectedMilestone.id].file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Abrir documento en nueva pestaña
                  </a>
                </div>
              )}
            </div>
          )}
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
