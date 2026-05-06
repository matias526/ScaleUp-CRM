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
import { Eye, MessageSquare, TrendingUp, Truck, CheckCircle, Clock, Package, Plus, Search, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  const [selectedPoStatus, setSelectedPoStatus] = useState<string>("")
  const [selectedFinancialStatus, setSelectedFinancialStatus] = useState<string>("")
  const [selectedLogisticsStatus, setSelectedLogisticsStatus] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

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
  }, [userInfo, authLoading, selectedPartner, selectedTechCompany, selectedPoStatus, selectedFinancialStatus, selectedLogisticsStatus, searchTerm])

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
        .select("id, po_number, subtotal_amount, shipping_amount, total_amount, status, created_at, partner_user_id, partner_id, tech_company_id, partners!partner_id(name), tech_companies!tech_company_id(name)")

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

      // Cargar milestones y shipping para cada PO
      const posWithDetails = await Promise.all(
        (data || []).map(async (po) => {
          // Cargar milestones
          const { data: milestones } = await supabase
            .from("po_milestones")
            .select("id, status, amount")
            .eq("po_id", po.id)

          // Cargar shipping
          const { data: shipping } = await supabase
            .from("shippings")
            .select("id, status, carrier, tracking_number, estimated_delivery_date")
            .eq("po_id", po.id)

          return {
            ...po,
            milestones: milestones || [],
            shipping: shipping || [],
          }
        })
      )

      // Aplicar filtros por estado
      let filtered = posWithDetails || []

      // Filtro por búsqueda (PO Number, Partner, TechCompany)
      if (searchTerm) {
        filtered = filtered.filter((po) => {
          const poNumber = po.po_number?.toLowerCase() || ""
          const partner = po.partners?.name?.toLowerCase() || ""
          const techCompany = po.tech_companies?.name?.toLowerCase() || ""
          const searchLower = searchTerm.toLowerCase()
          return poNumber.includes(searchLower) || partner.includes(searchLower) || techCompany.includes(searchLower)
        })
      }

      // Filtro por Partner
      if (selectedPartner) {
        filtered = filtered.filter(po => po.partner_id === selectedPartner)
      }

      // Filtro por Tech Company
      if (selectedTechCompany) {
        filtered = filtered.filter(po => po.tech_company_id === selectedTechCompany)
      }

      // Filtro por PO Status
      if (selectedPoStatus) {
        filtered = filtered.filter(po => po.status === selectedPoStatus)
      }

      // Filtro por Financial Status (Milestones)
      if (selectedFinancialStatus) {
        filtered = filtered.filter(po => {
          const milestones = po.milestones || []
          const totalMilestones = milestones.length
          const paidMilestones = milestones.filter((m: any) => m.status === "paid").length

          if (selectedFinancialStatus === "none") return paidMilestones === 0
          if (selectedFinancialStatus === "partial") return paidMilestones > 0 && paidMilestones < totalMilestones
          if (selectedFinancialStatus === "full") return paidMilestones === totalMilestones && totalMilestones > 0
          return true
        })
      }

      // Filtro por Logistics Status
      if (selectedLogisticsStatus) {
        filtered = filtered.filter(po => {
          const shipping = po.shipping || []
          if (shipping.length === 0) return selectedLogisticsStatus === "not_started"
          return shipping[0].status === selectedLogisticsStatus
        })
      }

      setPurchaseOrders(filtered)
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

  const getUniqueTechCompanies = () => {
    const uniqueCompanies = new Map()
    purchaseOrders.forEach(po => {
      if (po.tech_company_id && po.tech_companies?.name) {
        uniqueCompanies.set(po.tech_company_id, po.tech_companies)
      }
    })
    return Array.from(uniqueCompanies.values())
  }

  const getUniquePartners = () => {
    const uniquePartners = new Map()
    purchaseOrders.forEach(po => {
      if (po.partner_id && po.partners?.name) {
        uniquePartners.set(po.partner_id, po.partners)
      }
    })
    return Array.from(uniquePartners.values())
  }
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
      {/* New Modern Filter Bar */}
      <CardContent className="border-b px-6 py-3 bg-muted/40">
        <div className="flex gap-2 items-center flex-wrap">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("po.search.placeholder") || "Buscar órdenes..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Tech Company Filter - for Admin/BDD/PartnerUser */}
          {["Admin", "BDD", "PartnerUser"].includes(userInfo?.roleCode || "") && (
            <Select
              value={selectedTechCompany || "all"}
              onValueChange={(value) => setSelectedTechCompany(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder={t("po.table.techCompany") || "Tech Company"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("po.table.techCompany") || "Todas"}</SelectItem>
                {getUniqueTechCompanies().map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Partner Filter - for Admin/BDD/TechUser/TechLogistic */}
          {["Admin", "BDD", "TechUser", "TechLogistic"].includes(userInfo?.roleCode || "") && (
            <Select
              value={selectedPartner || "all"}
              onValueChange={(value) => setSelectedPartner(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder={t("po.table.partner") || "Partner"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("po.table.partner") || "Todos"}</SelectItem>
                {getUniquePartners().map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* More Filters Button with Popover */}
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 bg-transparent">
                <Plus className="h-4 w-4 mr-1" />
                {t("po.filter.title") || "Filtros"}
                {(selectedPoStatus || selectedFinancialStatus || selectedLogisticsStatus) && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1">
                    {[
                      selectedPoStatus ? 1 : 0,
                      selectedFinancialStatus ? 1 : 0,
                      selectedLogisticsStatus ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">{t("po.filter.advanced") || "Filtros adicionales"}</h4>

                {/* PO Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("po.filter.byPoStatus")}</label>
                  <Select
                    value={selectedPoStatus || "all"}
                    onValueChange={(value) => setSelectedPoStatus(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("po.filter.selectPoStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("po.filter.selectPoStatus")}</SelectItem>
                      <SelectItem value="sent">{t("po.status.sent")}</SelectItem>
                      <SelectItem value="accepted">{t("po.status.accepted")}</SelectItem>
                      <SelectItem value="pending">{t("po.status.pending")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Financial Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("po.filter.byFinancialStatus")}</label>
                  <Select
                    value={selectedFinancialStatus || "all"}
                    onValueChange={(value) => setSelectedFinancialStatus(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("po.filter.selectFinancialStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("po.filter.selectFinancialStatus")}</SelectItem>
                      <SelectItem value="none">{t("po.filter.nopayment")}</SelectItem>
                      <SelectItem value="partial">{t("po.filter.somepayment")}</SelectItem>
                      <SelectItem value="full">{t("po.filter.fullpayment")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Logistics Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("po.filter.byLogisticsStatus")}</label>
                  <Select
                    value={selectedLogisticsStatus || "all"}
                    onValueChange={(value) => setSelectedLogisticsStatus(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("po.filter.selectLogisticsStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("po.filter.selectLogisticsStatus")}</SelectItem>
                      <SelectItem value="not_started">{t("po.logistics.notStarted")}</SelectItem>
                      <SelectItem value="in_process">{t("po.logistics.inProcess")}</SelectItem>
                      <SelectItem value="shipped">{t("po.logistics.shipped")}</SelectItem>
                      <SelectItem value="delivered">{t("po.logistics.delivered")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Results counter */}
          <div className="ml-auto text-sm text-muted-foreground">
            {purchaseOrders.length} {t("po.results") || "órdenes"}
          </div>
        </div>
      </CardContent>

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
                  {userInfo?.roleCode !== "PartnerUser" && (
                    <TableHead>{t("po.table.partner")}</TableHead>
                  )}
                  {!["TechUser", "TechLogistic"].includes(userInfo?.roleCode || "") && (
                    <TableHead>{t("po.table.techCompany")}</TableHead>
                  )}
                  <TableHead className="text-right">{t("po.table.totalAmount")}</TableHead>
                  <TableHead>{t("po.table.date")}</TableHead>
                  <TableHead colSpan={3} className="text-center">{t("po.table.statusGroup")}</TableHead>
                  <TableHead className="text-center">{t("po.table.actions")}</TableHead>
                </TableRow>
                {/* Subheader for status columns */}
                <TableRow className="bg-gray-50">
                  <TableHead colSpan={userInfo?.roleCode === "PartnerUser" || ["TechUser", "TechLogistic"].includes(userInfo?.roleCode || "") ? 4 : 5}></TableHead>
                  <TableHead className="text-center text-xs font-normal">{t("po.table.poStatus")}</TableHead>
                  <TableHead className="text-center text-xs font-normal">{t("po.table.financialStatus")}</TableHead>
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

                      {/* Partner - Hidden for PartnerUser */}
                      {userInfo?.roleCode !== "PartnerUser" && (
                        <TableCell>{po.partners?.name || "-"}</TableCell>
                      )}

                      {/* Tech Company - Hidden for TechUser/TechLogistic */}
                      {!["TechUser", "TechLogistic"].includes(userInfo?.roleCode || "") && (
                        <TableCell>{po.tech_companies?.name || "-"}</TableCell>
                      )}

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

                      {/* Financial Status (renamed from Milestones) */}
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
