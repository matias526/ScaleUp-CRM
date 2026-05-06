"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/hooks/use-translations"
import { useAuth } from "@/components/auth/auth-provider"
import { DICT_LANG_PO } from "@/lib/constants/dict-lang-po"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { TableSkeleton } from "@/components/purchase-orders/skeletons"
import { Eye, MessageSquare, TrendingUp, Truck, CheckCircle, Clock, Package } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function PurchaseOrdersPage() {
  const { t } = useTranslations(DICT_LANG_PO)
  const { userInfo, loading: authLoading } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partners, setPartners] = useState<any[]>([])
  const [techCompanies, setTechCompanies] = useState<any[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string>("")
  const [selectedTechCompany, setSelectedTechCompany] = useState<string>("")

  useEffect(() => {
    if (!authLoading && userInfo) {
      loadPurchaseOrders()
      // Only load filter options for Admin/BDD
      if (["Admin", "BDD"].includes(userInfo.roleCode)) {
        loadPartners()
        loadTechCompanies()
      }
    } else if (!authLoading && !userInfo) {
      setError(t("po.errorNotAuthenticated"))
      setLoading(false)
    }
  }, [userInfo, authLoading, selectedPartner, selectedTechCompany])

  const loadPurchaseOrders = async () => {
    try {
      if (!userInfo) {
        setError(t("po.errorNotAuthenticated"))
        setLoading(false)
        return
      }

      console.log("[v0] Loading purchase orders for user:", userInfo.id)
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from("purchase_orders")
        .select("id, po_number, subtotal_amount, shipping_amount, total_amount, status, created_at, partner_user_id, partner_id, tech_company_id, partners!partner_id(name), tech_companies!tech_company_id(name), milestones(id, status, amount), shipping(id, status, carrier, tracking_number)")

      // Role-based filtering
      const userRole = userInfo.roleCode
      console.log("[v0] User role:", userRole)
      
      if (userRole === "PartnerUser" && userInfo.partnerId) {
        // PartnerUser solo ve POs de su partner
        console.log("[v0] Filtering for PartnerUser with partner_id:", userInfo.partnerId)
        query = query.eq("partner_id", userInfo.partnerId)
      } else if (userRole === "TechUser" && userInfo.techCompanyId) {
        // TechUser solo ve POs de su tech company
        console.log("[v0] Filtering for TechUser with tech_company_id:", userInfo.techCompanyId)
        query = query.eq("tech_company_id", userInfo.techCompanyId)
      } else if (userRole === "TechLogistic" && userInfo.techCompanyId) {
        // TechLogistic solo ve POs de su tech company
        console.log("[v0] Filtering for TechLogistic with tech_company_id:", userInfo.techCompanyId)
        query = query.eq("tech_company_id", userInfo.techCompanyId)
      } else if (["Admin", "BDD"].includes(userRole)) {
        // Admin/BDD pueden aplicar filtros adicionales
        if (selectedPartner) {
          query = query.eq("partner_id", selectedPartner)
        }
        if (selectedTechCompany) {
          query = query.eq("tech_company_id", selectedTechCompany)
        }
      }

      console.log("[v0] Executing query...")
      const { data, error: queryError } = await query
        .order("created_at", { ascending: false })
      
      console.log("[v0] Query result - Error:", queryError?.message, "Data count:", data?.length)
      
      if (queryError) {
        console.error("[v0] Query error:", queryError)
        setError(t("po.errorLoadingOrders"))
        setLoading(false)
        return
      }
      
      setPurchaseOrders(data || [])
    } catch (error) {
      console.error("[v0] Error loading purchase orders:", error)
      setError(t("po.errorLoadingOrders"))
      toast({
        title: t("common.error"),
        description: t("po.errorLoadingOrders"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name")
        .order("name")
      
      if (!error) {
        setPartners(data || [])
      }
    } catch (error) {
      console.error("[v0] Error loading partners:", error)
    }
  }

  const loadTechCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name")
        .eq("type", "tech")
        .order("name")
      
      if (!error) {
        setTechCompanies(data || [])
      }
    } catch (error) {
      console.error("[v0] Error loading tech companies:", error)
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

  const getMilestonesStatus = (milestones: any[] | null) => {
    if (!milestones || milestones.length === 0) return { paid: 0, total: 0, percentage: 0 }
    const paidCount = milestones.filter(m => m.status === "paid").length
    const percentage = milestones.length > 0 ? Math.round((paidCount / milestones.length) * 100) : 0
    return { paid: paidCount, total: milestones.length, percentage }
  }

  const getLogisticsStatus = (shipping: any[] | null) => {
    if (!shipping || shipping.length === 0) return { status: "not_started", carrier: null }
    const lastShipping = shipping[0]
    return { status: lastShipping.status || "not_started", carrier: lastShipping.carrier }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <TableSkeleton rows={5} />
      </div>
    )
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("po.title")}</h1>
          <p className="text-gray-600 mt-1">{t("po.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("po.listTitle")}</CardTitle>
        </CardHeader>
        {["Admin", "BDD"].includes(userInfo?.roleCode || "") && (
          <div className="px-6 pt-0 pb-4 flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium block mb-2">{t("po.filter.byPartner")}</label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">{t("po.filter.selectPartner")}</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium block mb-2">{t("po.filter.byTechCompany")}</label>
              <select
                value={selectedTechCompany}
                onChange={(e) => setSelectedTechCompany(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">{t("po.filter.selectTechCompany")}</option>
                {techCompanies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("po.noOrders")}
            </div>
          ) : loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("po.table.poNumber")}</TableHead>
                    <TableHead>{t("po.table.partner")}</TableHead>
                    <TableHead>{t("po.table.techCompany")}</TableHead>
                    <TableHead className="text-right">{t("po.table.totalAmount")}</TableHead>
                    <TableHead>{t("po.table.date")}</TableHead>
                    <TableHead colSpan={3} className="text-center">{t("po.table.statusGroup")}</TableHead>
                    <TableHead className="text-center">{t("po.table.actions")}</TableHead>
                  </TableRow>
                  {/* Subheader for status columns */}
                  <TableRow className="bg-gray-50">
                    <TableHead colSpan={5}></TableHead>
                    <TableHead className="text-center text-xs font-normal">{t("po.table.poStatus")}</TableHead>
                    <TableHead className="text-center text-xs font-normal">{t("po.table.milestonesStatus")}</TableHead>
                    <TableHead className="text-center text-xs font-normal">{t("po.table.logisticsStatus")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => {
                    const milestonesStatus = getMilestonesStatus(po.milestones)
                    const logisticsStatus = getLogisticsStatus(po.shipping)
                    
                    return (
                      <TableRow key={po.id} className="hover:bg-gray-50">
                        {/* PO Number */}
                        <TableCell className="font-medium font-mono">{po.po_number}</TableCell>
                        
                        {/* Partner */}
                        <TableCell>{po.partners?.name || "-"}</TableCell>
                        
                        {/* Tech Company */}
                        <TableCell>{po.tech_companies?.name || "-"}</TableCell>
                        
                        {/* Total Amount with breakdown */}
                        <TableCell className="text-right">
                          <div className="font-semibold">${po.total_amount?.toFixed(2) || "0.00"}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <div>{t("po.table.subtotal")}: ${po.subtotal_amount?.toFixed(2) || "0.00"}</div>
                            <div>{t("po.table.shipping")}: ${po.shipping_amount?.toFixed(2) || "0.00"}</div>
                          </div>
                        </TableCell>
                        
                        {/* Date */}
                        <TableCell className="text-sm">{format(new Date(po.created_at), "dd/MM/yyyy")}</TableCell>
                        
                        {/* PO Status */}
                        <TableCell className="text-center">
                          <Badge className={getStatusBadgeColor(po.status)} variant="secondary">
                            {t(`po.status.${po.status}`)}
                          </Badge>
                        </TableCell>
                        
                        {/* Milestones Status */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-xs font-semibold text-gray-700">
                              {milestonesStatus.paid}/{milestonesStatus.total}
                            </div>
                            <Progress value={milestonesStatus.percentage} className="w-16 h-1" />
                            <div className="text-xs text-gray-500">{milestonesStatus.percentage}%</div>
                          </div>
                        </TableCell>
                        
                        {/* Logistics Status */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            {logisticsStatus.status === "delivered" && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs font-semibold text-emerald-600">{t("po.logistics.delivered")}</span>
                              </div>
                            )}
                            {logisticsStatus.status === "shipped" && (
                              <div className="flex items-center gap-1">
                                <Truck className="h-4 w-4 text-amber-600" />
                                <span className="text-xs font-semibold text-amber-600">{t("po.logistics.shipped")}</span>
                              </div>
                            )}
                            {logisticsStatus.status === "in_process" && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-600">{t("po.logistics.inProcess")}</span>
                              </div>
                            )}
                            {logisticsStatus.status === "not_started" && (
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4 text-gray-500" />
                                <span className="text-xs font-semibold text-gray-500">{t("po.logistics.notStarted")}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Link href={`/dashboard/purchase-orders/${po.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t("po.table.view")}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              title={t("po.table.messages")}
                              onClick={() => {
                                // Aquí irá la lógica de mensajes
                                console.log("[v0] Messages clicked for PO:", po.id)
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
