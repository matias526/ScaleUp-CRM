"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/hooks/use-translations"
import { useAuth } from "@/components/auth/auth-provider"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { DetailPageSkeleton } from "@/components/purchase-orders/skeletons"
import { PONotes } from "@/components/purchase-orders/po-notes"
import { POGeneralTab } from "@/components/purchase-orders/po-general-tab"
import { POMilestonesTab } from "@/components/purchase-orders/po-milestones-tab"
import { POLogisticsTab } from "@/components/purchase-orders/po-logistics-tab"

export default function PurchaseOrderDetailPage() {
  const { t } = useTranslations(DICT_LANG_PO)
  const params = useParams()
  const poId = params.id as string
  const { userInfo, loading: authLoading } = useAuth()

  const [po, setPo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [shippings, setShippings] = useState<any[]>([])
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    if (!authLoading && userInfo) {
      loadPurchaseOrder()
    } else if (!authLoading && !userInfo) {
      setError(t("po.errorNotAuthenticated"))
      setLoading(false)
    }
  }, [userInfo, authLoading, poId])

  const loadPurchaseOrder = async () => {
    try {
      if (!userInfo) {
        setError(t("po.errorNotAuthenticated"))
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Load PO details
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select("*, partners(name)")
        .eq("id", poId)
        .single()

      if (poError) {
        console.error("[v0] Error loading PO:", poError)
        setError(t("po.errorLoadingOrder"))
        setLoading(false)
        return
      }

      setPo(poData)

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
      console.error("[v0] Error loading purchase order:", error)
      setError(t("po.errorLoadingOrder"))
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
      const userRole = userInfo?.roleCode

      if (!["Admin", "BDD"].includes(userRole || "")) {
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
          accepted_by: userInfo?.id,
        })
        .eq("id", poId)

      if (poError) throw poError

      toast({
        title: "Éxito",
        description: "Orden de compra aprobada",
      })

      // Reload PO data
      await loadPurchaseOrder()
    } catch (error) {
      console.error("[v0] Error approving PO:", error)
      toast({
        title: t("common.error"),
        description: "No se pudo aprobar la orden",
        variant: "destructive",
      })
    } finally {
      setApproving(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-200 text-gray-900",
      sent: "bg-blue-200 text-blue-900",
      accepted: "bg-green-200 text-green-900",
      rejected: "bg-red-200 text-red-900",
      completed: "bg-purple-200 text-purple-900",
    }
    return colors[status] || "bg-gray-200 text-gray-900"
  }

  const canApprove = po?.status === "sent" && ["Admin", "BDD"].includes(userInfo?.roleCode || "")

  if (authLoading) {
    return <DetailPageSkeleton />
  }

  if (loading) {
    return <DetailPageSkeleton />
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <h3 className="font-semibold mb-2">{t("common.error")}</h3>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
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
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          {/* Logo Section */}
          {po.partners?.name && (
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 border-2 border-gray-200">
              <span className="text-2xl font-bold text-gray-700">
                {po.partners.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* PO Number */}
          <div>
            <div className="text-sm text-gray-600 font-medium">PO #{po.po_number}</div>
            <h1 className="text-3xl font-bold">{po.po_number}</h1>
            <span className="text-gray-600">
              {po.created_at ? format(new Date(po.created_at), "dd/MM/yyyy HH:mm") : "-"}
            </span>
          </div>
        </div>

        {canApprove && (
          <Button
            onClick={handleApprovePO}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700"
          >
            {approving ? "Aprobando..." : t("po.approvePO")}
          </Button>
        )}
      </div>

      {/* Summary Cards - Status, Amounts, Logos */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card 1: Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.status")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Badge className={getStatusBadgeColor(po.status)}>
              {t(`po.status.${po.status}`)}
            </Badge>
            <div className="text-xs text-gray-600">
              {po.accepted_at && (
                <div>
                  {t("po.detail.approvedDate")}: {format(new Date(po.accepted_at), "dd/MM/yyyy")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Amounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.detail.total")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              ${po.total_amount?.toFixed(2) || "0.00"}
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                <span className="font-medium">{t("po.subtotal")}:</span> ${po.subtotal_amount?.toFixed(2) || "0.00"}
              </div>
              <div>
                <span className="font-medium">{t("po.shipping")}:</span> ${po.shipping_amount?.toFixed(2) || "0.00"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Partner Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("po.detail.partner")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 border-2 border-blue-200">
                <span className="text-lg font-bold text-blue-700">
                  {po.partners?.name?.substring(0, 2).toUpperCase() || "?"}
                </span>
              </div>
              <div className="text-sm font-medium">
                {po.partners?.name || t("po.noPartner")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-4 gap-6">
        {/* Main Content - 75% */}
        <div className="col-span-3">
          <Card>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">{t("po.tab.general")}</TabsTrigger>
                <TabsTrigger value="milestones">{t("po.tab.milestones")}</TabsTrigger>
                <TabsTrigger value="logistics">{t("po.tab.logistics")}</TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="general" className="mt-0">
                  <POGeneralTab
                    po={po}
                    canApprove={canApprove}
                    onApprove={handleApprovePO}
                    onApproveClick={handleApprovePO}
                    getStatusBadgeColor={getStatusBadgeColor}
                  />
                </TabsContent>

                <TabsContent value="milestones" className="mt-0">
                  <POMilestonesTab
                    po={po}
                    milestones={milestones}
                    subtotal={po.subtotal_amount || 0}
                  />
                </TabsContent>

                <TabsContent value="logistics" className="mt-0">
                  <POLogisticsTab
                    po={po}
                    shippings={shippings}
                    userRole={userInfo?.roleCode || ""}
                    currentUserId={userInfo?.id || ""}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Right Sidebar - 25% */}
        <div className="col-span-1">
          <PONotes
            poId={poId}
            currentUserId={userInfo?.id || ""}
            isScaleUpMember={["Admin", "BDD"].includes(userInfo?.roleCode || "")}
          />
        </div>
      </div>
    </div>
  )
}
