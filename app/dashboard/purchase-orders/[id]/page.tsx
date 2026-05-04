"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Loader2, Download, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { v4 as uuidv4 } from "uuid"

export default function PurchaseOrderDetailPage() {
  const { t } = useTranslations(DICT_LANG_PO)
  const params = useParams()
  const poId = params.id as string
  
  const [po, setPo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [shippings, setShippings] = useState<any[]>([])
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadPurchaseOrder()
    }
  }, [currentUser, poId])

  const loadCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, role")
          .eq("id", data.user.id)
          .single()
        
        if (userData) {
          setCurrentUser(userData)
        }
      }
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }

  const loadPurchaseOrder = async () => {
    try {
      setLoading(true)
      
      // Load PO details
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", poId)
        .single()
      
      if (poError) throw poError
      setPo(poData)

      // Load documents
      const { data: docsData, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .eq("parent_id", poId)
        .eq("parent_type", "purchase_order")
      
      if (!docsError) {
        setDocuments(docsData || [])
      }

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("po_milestones")
        .select("*")
        .eq("purchase_order_id", poId)
        .order("scheduled_date")
      
      if (!milestonesError) {
        setMilestones(milestonesData || [])
      }

      // Load shippings
      const { data: shippingsData, error: shippingsError } = await supabase
        .from("shippings")
        .select("*")
        .eq("purchase_order_id", poId)
        .order("created_at")
      
      if (!shippingsError) {
        setShippings(shippingsData || [])
      }
    } catch (error) {
      console.error("Error loading purchase order:", error)
      toast({
        title: t("common.error"),
        description: t("po.errorLoadingOrder"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePO = async () => {
    try {
      setApproving(true)
      const userRole = currentUser?.role?.code || currentUser?.role
      
      if (!["Admin", "BDD"].includes(userRole)) {
        toast({
          title: t("common.error"),
          description: t("po.unauthorizedApprove"),
          variant: "destructive",
        })
        return
      }

      // Update PO status to accepted
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({ 
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by: currentUser.id,
        })
        .eq("id", poId)
      
      if (poError) throw poError

      // Update associated document status to accepted
      const { error: docError } = await supabase
        .from("documents")
        .update({ status: "accepted" })
        .eq("parent_id", poId)
        .eq("parent_type", "purchase_order")
      
      if (docError) throw docError

      // Find opportunities linked to this PO and update them to "won"
      const { data: opportunities, error: oppError } = await supabase
        .from("opportunities")
        .select("id")
        .eq("purchase_order_id", poId)
      
      if (oppError) throw oppError

      if (opportunities && opportunities.length > 0) {
        const { error: updateOppError } = await supabase
          .from("opportunities")
          .update({ pipeline_stage_id: "82056c9d-0bdb-4db4-9097-f6f1a72d4db2" })
          .in("id", opportunities.map((o) => o.id))
        
        if (updateOppError) throw updateOppError
      }

      // Create note
      const { error: noteError } = await supabase
        .from("notes")
        .insert([
          {
            opportunity_id: opportunities?.[0]?.id,
            user_id: currentUser.id,
            content: `${currentUser.first_name} ${currentUser.last_name} aprobó la PO (${po.po_number})`,
          } as any,
        ])

      if (noteError) throw noteError

      toast({
        title: t("common.success"),
        description: t("po.approveSuccess"),
      })

      setShowApproveDialog(false)
      await loadPurchaseOrder()
    } catch (error) {
      console.error("Error approving PO:", error)
      toast({
        title: t("common.error"),
        description: t("po.errorApproving"),
        variant: "destructive",
      })
    } finally {
      setApproving(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const canApprove = po?.status === "sent" && ["Admin", "BDD"].includes(currentUser?.role?.code || currentUser?.role)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!po) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          {t("po.notFound")}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{po.po_number}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={getStatusBadgeColor(po.status)}>
              {t(`po.status.${po.status}`)}
            </Badge>
            <span className="text-gray-600">
              {format(new Date(po.created_at), "dd/MM/yyyy HH:mm")}
            </span>
          </div>
        </div>
        {canApprove && (
          <Button 
            onClick={() => setShowApproveDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {t("po.approvePO")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.totalAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${po.total_amount?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.subtotal")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${po.subtotal_amount?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.shipping")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${po.shipping_amount?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">{t("po.tab.general")}</TabsTrigger>
              <TabsTrigger value="milestones">{t("po.tab.milestones")}</TabsTrigger>
              <TabsTrigger value="logistics">{t("po.tab.logistics")}</TabsTrigger>
              <TabsTrigger value="documents">{t("po.tab.documents")}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">{t("po.poNumber")}</label>
                  <p className="font-medium">{po.po_number}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">{t("po.status")}</label>
                  <p className="font-medium">{t(`po.status.${po.status}`)}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4 pt-4">
              {milestones.length === 0 ? (
                <p className="text-gray-500">{t("po.noMilestones")}</p>
              ) : (
                <div className="space-y-2">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="p-3 border rounded">
                      <div className="font-medium">{milestone.title}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(milestone.scheduled_date), "dd/MM/yyyy")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logistics" className="space-y-4 pt-4">
              {shippings.length === 0 ? (
                <p className="text-gray-500">{t("po.noShippings")}</p>
              ) : (
                <div className="space-y-2">
                  {shippings.map((shipping) => (
                    <div key={shipping.id} className="p-3 border rounded">
                      <div className="font-medium">{shipping.tracking_number}</div>
                      <div className="text-sm text-gray-600">
                        {shipping.carrier}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 pt-4">
              {documents.length === 0 ? (
                <p className="text-gray-500">{t("po.noDocuments")}</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <div className="font-medium">{doc.doc_type}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(doc.created_at), "dd/MM/yyyy")}
                        </div>
                      </div>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("po.confirmApprove")}</DialogTitle>
            <DialogDescription>
              {t("po.approveDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={approving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleApprovePO}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700"
            >
              {approving ? t("common.approving") : t("po.approvePO")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
