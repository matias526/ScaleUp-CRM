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
  const [approverName, setApproverName] = useState<string>("")
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
        .select("*, partners!partner_id(name, logo_url), tech_companies!tech_company_id(name, logo_url)")
        .eq("id", poId)
        .single()

      if (poError) {
        console.error("[v0] Error loading PO:", poError)
        setError(t("po.errorLoadingOrder"))
        setLoading(false)
        return
      }

      setPo(poData)

      // Load approver info if PO is accepted
      if (poData.accepted_by) {
        const { data: approverData } = await supabase
          .from("users")
          .select("firstName, lastName")
          .eq("id", poData.accepted_by)
          .single()

        if (approverData) {
          setApproverName(`${approverData.firstName} ${approverData.lastName}`)
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
{/* Compact Header - Clean Layout */}
<div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-8 shadow-sm mb-6">
  
  {/* Left Section: PO Branding & Status */}
  <div className="flex flex-col gap-2">
    {/* Status Badge on top */}
    <div>
      <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-2.5 py-1 rounded-md uppercase font-black tracking-wider">
        {po.status || "Draft"}
      </span>
    </div>

    {/* PO Number - Bigger */}
    <h1 className="text-4xl font-black text-gray-900 leading-none tracking-tight">
      PO#{po.po_number || "---"}
    </h1>
    
    {/* Date - Smaller and Clean (No time) */}
    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
      {po.created_at ? format(new Date(po.created_at), "dd/MM/yyyy") : "-"}
    </span>
  </div>

  {/* Center Section: Financials (More compact) */}
  <div className="flex flex-col items-center px-12 border-x border-gray-100">
    <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1">
      Total Amount
    </span>
    <div className="text-3xl font-black text-gray-900 tracking-tighter">
      ${(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
    <div className="flex gap-4 mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
      <span>Sub: ${(po.subtotal_amount || 0).toFixed(2)}</span>
      <span>Ship: ${(po.shipping_amount || 0).toFixed(2)}</span>
    </div>
  </div>

      {/* Right Section: Logos & Names (No frames) */}
      <div className="flex items-center gap-8">
        {/* Info Text */}
        <div className="text-right flex flex-col gap-1">
          <div className="mb-2">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">
              Partner
            </p>
            <p className="text-sm font-black text-gray-900">
              {po.partners?.name || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">
              Tech Company
            </p>
            <p className="text-sm font-bold text-blue-600">
              {po.tech_companies?.name || "Unassigned"}
            </p>
          </div>
        </div>

        {/* Logos Section - Clean without borders/frames */}
        <div className="flex items-center gap-4">
          {/* Partner Logo */}
          <div className="w-16 h-16 flex items-center justify-center">
            {po.partners?.logo_url ? (
              <img src={po.partners.logo_url} alt="Partner" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-2xl font-black text-gray-200">{po.partners?.name?.substring(0, 2)}</span>
            )}
          </div>

          {/* Divider */}
          <div className="h-10 w-[1px] bg-gray-100" />

          {/* Tech Company Logo */}
          <div className="w-16 h-16 flex items-center justify-center">
            {po.tech_companies?.logo_url ? (
              <img src={po.tech_companies.logo_url} alt="Tech" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center">
                <span className="text-xl font-black text-white">
                  {po.tech_companies?.name?.substring(0, 2).toUpperCase() || "TC"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

  {/* Approve Action */}
  {canApprove && po.status === 'sent' && (
    <div className="ml-6 pl-6 border-l border-gray-100">
      <button
        onClick={handleApprovePO}
        disabled={approving}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
      >
        {approving ? "..." : "Approve"}
      </button>
    </div>
  )}
</div>
      {/* Two Column Layout */}
      <div className="grid grid-cols-5 gap-6">
        {/* Main Content - 65% */}
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
                    approverName={approverName}
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

        {/* Right Sidebar - 35% */}
        <div className="col-span-2">
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
