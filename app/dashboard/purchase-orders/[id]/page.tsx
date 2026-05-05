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
<div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
  
  {/* Left: Partner Logo & PO Info */}
  <div className="flex items-center gap-6">
    {/* Partner Logo */}
    <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
      {po.partners?.logo_url ? (
        <img src={po.partners.logo_url} alt="" className="h-full w-full object-contain" />
      ) : (
        <span className="text-lg font-bold text-slate-400">
          {po.partners?.name?.substring(0, 2).toUpperCase() || "PO"}
        </span>
      )}
    </div>

    {/* PO Status, Number & Date */}
    <div className="flex flex-col">
      <div className="mb-1">
        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded uppercase font-bold">
          {po.status || "Draft"}
        </span>
      </div>
      
      <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tight">
        #{po.po_number || "---"}
      </h1>
      
      <span className="text-[11px] text-gray-500 mt-1 font-medium">
        📅 {po.created_at ? format(new Date(po.created_at), "dd/MM/yyyy HH:mm") : "-"}
      </span>
    </div>
  </div>

  {/* Center: Total Amount */}
  <div className="flex flex-col items-center px-10 border-l border-r border-gray-100">
    <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-bold mb-1">
      Total Amount
    </span>
    <div className="text-4xl font-black text-gray-900 tracking-tighter">
      ${(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
    <div className="flex gap-4 mt-1 text-[10px] text-gray-500 font-bold uppercase">
      <span className="opacity-70">Sub: ${(po.subtotal_amount || 0).toFixed(2)}</span>
      <span className="opacity-70">Ship: ${(po.shipping_amount || 0).toFixed(2)}</span>
    </div>
  </div>

  {/* Right: TechCompany & Partner Name */}
  <div className="flex items-center gap-4 flex-grow justify-end px-6">
    <div className="text-right">
      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
        Customer / Partner
      </p>
      <p className="text-sm font-bold text-gray-900 mb-2 truncate max-w-[150px]">
        {po.partners?.name || "N/A"}
      </p>
      
      <div className="flex items-center justify-end gap-2">
        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
          Tech Co.
        </span>
        <span className="text-xs font-bold text-gray-700">
          {techCompany?.company_name || "Unassigned"}
        </span>
      </div>
    </div>

    {/* TechCompany Visual Avatar */}
    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 flex-shrink-0 shadow-lg shadow-slate-200">
      <span className="text-lg font-black text-white">
        {techCompany?.company_name?.substring(0, 2).toUpperCase() || "TC"}
      </span>
    </div>
  </div>

  {/* Final Action: Approve Button */}
  {canApprove && po.status === 'sent' && (
    <div className="pl-6 border-l border-gray-100">
      <button
        onClick={handleApprovePO}
        disabled={approving}
        className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 rounded-xl font-bold shadow-lg shadow-emerald-100 disabled:opacity-50 transition-colors"
      >
        {approving ? "..." : "Approve Order"}
      </button>
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
