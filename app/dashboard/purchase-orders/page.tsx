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
        .select("id, po_number, total_amount, status, created_at, partner_user_id, partner_id, partners(name)")

      // Role-based filtering
      const userRole = userInfo.roleCode
      console.log("[v0] User role:", userRole)
      
      if (userRole === "PartnerUser" && userInfo.partnerId) {
        // PartnerUser solo ve sus propias POs
        console.log("[v0] Filtering for PartnerUser:", userInfo.id)
        query = query.eq("partner_user_id", userInfo.id)
      } else if (userRole === "TechLogistic") {
        console.log("[v0] TechLogistic - showing all POs")
      } else if (["Admin", "BDD"].includes(userRole)) {
        // Admin/BDD pueden aplicar filtros adicionales
        if (selectedPartner) {
          query = query.eq("partner_id", selectedPartner)
        }
        if (selectedTechCompany) {
          query = query.eq("partner_user_id", selectedTechCompany)
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
                    <TableHead>{t("po.poNumber")}</TableHead>
                    <TableHead>{t("po.partner")}</TableHead>
                    <TableHead>{t("po.totalAmount")}</TableHead>
                    <TableHead>{t("po.status")}</TableHead>
                    <TableHead>{t("po.date")}</TableHead>
                    <TableHead>{t("po.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.partner?.name || "-"}</TableCell>
                      <TableCell>${po.total_amount?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(po.status)}>
                          {t(`po.status.${po.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(po.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/purchase-orders/${po.id}`}>
                          <Button variant="outline" size="sm">
                            {t("po.view")}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
