"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/hooks/use-translations"
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
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { TableSkeleton } from "@/components/purchase-orders/skeletons"

export default function PurchaseOrdersPage() {
  const { t } = useTranslations(DICT_LANG_PO)
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadPurchaseOrders()
    }
  }, [currentUser])

  const loadCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, role, partner_id")
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

  const loadPurchaseOrders = async () => {
    try {
      console.log("[v0] Loading purchase orders for user:", currentUser?.id)
      setLoading(true)
      let query = supabase
        .from("purchase_orders")
        .select("id, po_number, total_amount, status, created_at, quote_id, quotes(opportunity_id)")

      // Role-based filtering
      const userRole = currentUser?.role?.code || currentUser?.role
      console.log("[v0] User role:", userRole)
      
      if (userRole === "PartnerUser" && currentUser?.partner_id) {
        // PartnerUser solo ve sus propias POs
        console.log("[v0] Filtering for PartnerUser:", currentUser.id)
        query = query.eq("partner_user_id", currentUser.id)
      } else if (userRole === "TechLogistic") {
        console.log("[v0] TechLogistic - showing all POs")
        // TechLogistic ve POs para logística (shippings)
        // Por ahora, mostrar todas
      }
      // Admin y BDD ven todas

      console.log("[v0] Executing query...")
      const { data, error } = await query
        .order("created_at", { ascending: false })
      
      console.log("[v0] Query result - Error:", error?.message, "Data count:", data?.length)
      
      if (error) throw error
      
      // Now we need to get the opportunity names
      // Get all unique opportunity_ids from quotes
      const opportunityIds = data?.map(po => po.quotes?.opportunity_id).filter(Boolean) || []
      console.log("[v0] Opportunity IDs:", opportunityIds)
      
      if (opportunityIds.length > 0) {
        const { data: opportunities } = await supabase
          .from("opportunities")
          .select("id, name, partner_id")
          .in("id", opportunityIds)
        
        const oppMap = opportunities?.reduce((acc, opp) => {
          acc[opp.id] = opp
          return acc
        }, {} as any) || {}
        
        // Enrich purchase orders with opportunity data
        const enrichedData = data?.map(po => ({
          ...po,
          opportunity: oppMap[po.quotes?.opportunity_id]
        })) || []
        
        setPurchaseOrders(enrichedData)
      } else {
        setPurchaseOrders(data || [])
      }
    } catch (error) {
      console.error("[v0] Error loading purchase orders:", error)
      toast({
        title: t("common.error"),
        description: t("po.errorLoadingOrders"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
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
                      <TableCell>{po.opportunity?.name || "-"}</TableCell>
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
