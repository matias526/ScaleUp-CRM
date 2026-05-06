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
import { es } from "date-fns/locale"
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
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [approverName, setApproverName] = useState<string>("")
  const [creatorName, setCreatorName] = useState<string>("")
  const [approving, setApproving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

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
          .select("first_name, last_name")
          .eq("id", poData.accepted_by)
          .single()

        if (approverData) {
          setApproverName(`${approverData.first_name} ${approverData.last_name}`)
        }
      }

      // Load creator info if PO has created_by
      if (poData.created_by) {
        const { data: creatorData } = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("id", poData.created_by)
          .single()

        if (creatorData) {
          setCreatorName(`${creatorData.first_name} ${creatorData.last_name}`)
        }
      }

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("po_milestones")
        .select("*")
        .eq("po_id", poId)
        .order("due_date")

      if (!milestonesError) {
        setMilestones(milestonesData || [])
        
        // Pre-load documents for milestones
        if (milestonesData && milestonesData.length > 0) {
          const milestoneIds = milestonesData.map(m => m.id)
          const { data: docsData } = await supabase
            .from("documents")
            .select("*")
            .in("parent_id", milestoneIds)
            .eq("parent_type", "po_milestone")
          
          // Store docs info in milestones for component to use
          if (docsData) {
            const docsMap = docsData.reduce((acc, doc) => {
              acc[doc.parent_id] = doc
              return acc
            }, {} as { [key: string]: any })
            
            // Update milestones with docs info (for initial render)
            setMilestones(milestonesData.map(m => ({
              ...m,
              _document: docsMap[m.id]
            })))
          }
        }
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

      // Load related opportunities
      const { data: opportunitiesData, error: oppError } = await supabase
        .from("opportunities")
        .select("id, title, stage, amount, created_at")
        .eq("purchase_order_id", poId)
        .order("created_at", { ascending: false })

      if (!oppError) {
        setOpportunities(opportunitiesData || [])
      } else {
        console.error("[v0] Error loading opportunities:", oppError)
        // Don't fail the whole page if opportunities fail
        setOpportunities([])
      }

      // Load PO document
      const { data: poDocData } = await supabase
        .from("documents")
        .select("*")
        .eq("parent_id", poId)
        .eq("parent_type", "purchase_order")
        .single()
      
      if (poDocData) {
        setPo((prev) => prev ? { ...prev, _document: poDocData } : prev)
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
      {/* Clean Header - No Background Container */}
      <div className="flex items-start justify-between gap-8 mb-8 px-2">
        
        {/* Left: PO Info */}
        <div className="flex-1">
          <div className="mb-4">
            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-3 py-1.5 rounded-md uppercase font-bold tracking-wider">
              {po.status || "Draft"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            PO #{po.po_number || "---"}
          </h1>
          <p className="text-sm text-gray-500">
            {po.created_at ? format(new Date(po.created_at), "dd MMMM yyyy", { locale: es }) : "-"}
          </p>
        </div>

        {/* Right: Large Logos */}
        <div className="flex items-center gap-6">
          {/* Partner Logo */}
          <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
            {po.partners?.logo_url ? (
              <img src={po.partners.logo_url} alt="Partner" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">{po.partners?.name?.substring(0, 2)}</span>
              </div>
            )}
          </div>

          {/* Tech Company Logo */}
          <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
            {po.tech_companies?.logo_url ? (
              <img src={po.tech_companies.logo_url} alt="Tech" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-20 h-20 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {po.tech_companies?.name?.substring(0, 2).toUpperCase() || "TC"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Approve Button */}
        {canApprove && po.status === 'sent' && (
          <div className="flex items-center">
            <button
              onClick={handleApprovePO}
              disabled={approving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">{t("po.tab.general")}</TabsTrigger>
                <TabsTrigger value="milestones">{t("po.tab.milestones")}</TabsTrigger>
                <TabsTrigger value="logistics">{t("po.tab.logistics")}</TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="general" className="mt-0">
                  <POGeneralTab
                    po={po}
                    milestones={milestones}
                    shipping={shippings[0] || null}
                    opportunities={opportunities}
                    canApprove={canApprove}
                    onApproveClick={handleApprovePO}
                    onMilestonesTabClick={() => setActiveTab("milestones")}
                    onLogisticsTabClick={() => setActiveTab("logistics")}
                    getStatusBadgeColor={getStatusBadgeColor}
                    approverName={approverName}
                    creatorName={creatorName}
                    poDocument={po?._document}
                  />
                </TabsContent>

                <TabsContent value="milestones" className="mt-0">
                  <POMilestonesTab
                    po={po}
                    milestones={milestones}
                    subtotal={po.subtotal_amount || 0}
                    userRole={userInfo?.roleCode || ""}
                    onMilestonesUpdate={loadPurchaseOrder}
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
            userRole={userInfo?.roleCode || ""}
          />
        </div>
      </div>
    </div>
  )
}
