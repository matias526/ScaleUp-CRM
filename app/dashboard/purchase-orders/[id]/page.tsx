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
  const [techCompany, setTechCompany] = useState<any>(null)
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

      // Load PO details with partner and tech company info
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select("*, partners(name, logo_url)")
        .eq("id", poId)
        .single()

      if (poError) {
        console.error("[v0] Error loading PO:", poError)
        setError(t("po.errorLoadingOrder"))
        setLoading(false)
        return
      }

      setPo(poData)

      // Load TechCompany info (the user who created the PO)
      if (poData.partner_user_id) {
        const { data: techCompanyData } = await supabase
          .from("users")
          .select("id, firstName, lastName, company_name, logo_url")
          .eq("id", poData.partner_user_id)
          .single()

        if (techCompanyData) {
          setTechCompany(techCompanyData)
        }
      }

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("po_milestones")
        .select("*")
        .eq("po_id", poId)
        .order("scheduled_date")

      if (!milestonesError) {
        setMilestones(milestonesData || [])
      }

      // Load shippings
      const { data: shippingsData, error: shippingsError } = await supabase
        .from("shippings")
        .select("*")
        .eq("po_id", poId)
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
      {/* Compact Header - Horizontal Layout */}
<div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
  
  {/* Left Section: Partner & PO Info */}
  <div className="flex items-center gap-6">
    {/* Partner Logo */}
    {po.partners?.name && (
      <OrganizationAvatar
        name={po.partners.name || ""}
        imageUrl={po.partners.logo_url}
        size="md"
      />
    )}

    {/* PO Status, Number & Date */}
    <div className="flex flex-col">
      {/* Status Badge moved on top of PO Number per your sketch */}
      <div className="mb-1">
        <Badge className={`${getStatusBadgeColor(po.status)} text-[10px] px-2 py-0 uppercase`}>
          {t(`po.status.${po.status}`)}
        </Badge>
      </div>
      
      <h1 className="text-2xl font-black text-gray-900 leading-none">
        {po.po_number}
      </h1>
      
      <span className="text-xs text-gray-500 mt-1 font-medium">
        {po.created_at ? format(new Date(po.created_at), "dd/MM/yyyy HH:mm") : "-"}
      </span>
    </div>
  </div>

  {/* Center Section: Total Amount (Clean & Big) */}
  <div className="flex flex-col items-center px-10 border-l border-r border-gray-100">
    <span className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-bold mb-1">
      {t("po.detail.total")}
    </span>
    <div className="text-4xl font-black text-gray-900 tracking-tight">
      ${po.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
    <div className="flex gap-3 mt-1 text-[10px] text-gray-500 font-medium">
      <span>Sub: ${po.subtotal_amount?.toFixed(2)}</span>
      <span>Ship: ${po.shipping_amount?.toFixed(2)}</span>
    </div>
  </div>

  {/* Right Section: TechCompany & Partner Name */}
  <div className="flex items-center gap-4 flex-grow justify-end px-6">
    <div className="text-right">
      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-1">
        {t("po.detail.partner")}
      </p>
      <p className="text-sm font-bold text-gray-900 mb-2">
        {po.partners?.name || t("po.noPartner")}
      </p>
      
      {/* Tech Company Label & Initials */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
          T.C.
        </span>
        <span className="text-xs font-semibold text-gray-700">
          {techCompany?.company_name || "No Tech assigned"}
        </span>
      </div>
    </div>

    {/* TechCompany Visual Avatar/Initial */}
    {techCompany?.company_name && (
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 shadow-md shadow-blue-100 flex-shrink-0">
        <span className="text-lg font-black text-white">
          {techCompany.company_name.substring(0, 2).toUpperCase()}
        </span>
      </div>
    )}
  </div>

  {/* Final Action: Approve Button */}
  {canApprove && (
    <div className="pl-6 border-l border-gray-100">
      <Button
        onClick={handleApprovePO}
        disabled={approving}
        className="bg-green-600 hover:bg-green-700 h-12 px-6 rounded-xl font-bold transition-all shadow-lg shadow-green-100 flex gap-2 items-center"
      >
        {approving ? (
          <span className="animate-spin text-lg">◌</span>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            {t("po.approvePO")}
          </>
        )}
      </Button>
    </div>
  )}
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
