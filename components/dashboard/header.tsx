"use client"
import Image from "next/image"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { UserInfo } from "@/components/auth/user-info"
import { useTranslations } from "@/hooks/use-translations"
import { Bell, Search } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

interface PartnerInfo {
  id: string
  name: string
  logo_url: string | null
}

interface TechCompanyInfo {
  id: string
  name: string
  logo_url: string | null
}

export function Header() {
  const { t } = useTranslations()
  const { userInfo } = useAuth()
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [techCompanies, setTechCompanies] = useState<TechCompanyInfo[]>([])
  const [userTechCompany, setUserTechCompany] = useState<TechCompanyInfo | null>(null)
  const [loadingLogos, setLoadingLogos] = useState(false)

  // Cargar información del partner y tech companies
  useEffect(() => {
    const loadUserData = async () => {
      setLoadingLogos(true)
      try {
        // Si es usuario Partner - cargar partner y tech companies asociadas
        if (userInfo?.partnerId) {
          // Cargar información del partner
          const { data: partner, error: partnerError } = await supabase
            .from("partners")
            .select("id, name, logo_url")
            .eq("id", userInfo.partnerId)
            .single()

          if (partnerError) {
            console.error("Error loading partner info:", partnerError)
          } else {
            setPartnerInfo(partner)
          }

          // Cargar tech companies asociadas al partner
          const { data: partnerTechCompanies, error: techError } = await supabase
            .from("partner_tech_companies")
            .select(`
            tech_company_id,
            tech_companies:tech_company_id (id, name, logo_url)
          `)
            .eq("partner_id", userInfo.partnerId)

          if (techError) {
            console.error("Error loading tech companies:", techError)
          } else if (partnerTechCompanies) {
            const companies = partnerTechCompanies
              .map((item) => item.tech_companies)
              .filter(Boolean) as TechCompanyInfo[]
            setTechCompanies(companies)
          }
        }

        // Si es usuario TechUser - cargar su tech company
        else if (userInfo?.techCompanyId) {
          const { data: techCompany, error: techError } = await supabase
            .from("tech_companies")
            .select("id, name, logo_url")
            .eq("id", userInfo.techCompanyId)
            .single()

          if (techError) {
            console.error("Error loading tech company info:", techError)
          } else {
            setUserTechCompany(techCompany)
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setLoadingLogos(false)
      }
    }

    loadUserData()
  }, [userInfo?.partnerId, userInfo?.techCompanyId])

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-100 bg-white px-4 md:px-6 shadow-sm">
      <MobileNav />
      <div className="hidden md:block">
        {userInfo?.partnerId ? (
          // Mostrar logos del partner y tech companies para usuarios partner
          <div className="flex items-center gap-3">
            {partnerInfo?.logo_url && (
              <Image
                src={partnerInfo.logo_url || "/placeholder.svg"}
                alt={`${partnerInfo.name} Logo`}
                width={100}
                height={32}
                style={{
                  width: "auto",
                  height: "auto",
                  maxHeight: "32px",
                  maxWidth: "100px",
                }}
                className="object-contain"
              />
            )}
            {techCompanies.slice(0, 3).map(
              (company) =>
                company.logo_url && (
                  <Image
                    key={company.id}
                    src={company.logo_url || "/placeholder.svg"}
                    alt={`${company.name} Logo`}
                    width={80}
                    height={24}
                    style={{
                      width: "auto",
                      height: "auto",
                      maxHeight: "24px",
                      maxWidth: "80px",
                    }}
                    className="object-contain opacity-80"
                  />
                ),
            )}
            {techCompanies.length > 3 && <span className="text-sm text-gray-500">+{techCompanies.length - 3}</span>}
          </div>
        ) : userInfo?.techCompanyId && userTechCompany?.logo_url ? (
          // Mostrar logo de tech company para usuarios TechUser
          <div className="flex items-center">
            <Image
              src={userTechCompany.logo_url || "/placeholder.svg"}
              alt={`${userTechCompany.name} Logo`}
              width={120}
              height={32}
              style={{
                width: "auto",
                height: "auto",
                maxHeight: "32px",
                maxWidth: "120px",
              }}
              className="object-contain"
            />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-between">
        <div className="md:hidden">
          {userInfo?.partnerId ? (
            // Mostrar logos del partner y tech companies para usuarios partner
            <div className="flex items-center gap-2">
              {partnerInfo?.logo_url && (
                <Image
                  src={partnerInfo.logo_url || "/placeholder.svg"}
                  alt={`${partnerInfo.name} Logo`}
                  width={80}
                  height={24}
                  style={{
                    width: "auto",
                    height: "auto",
                    maxHeight: "24px",
                    maxWidth: "80px",
                  }}
                  className="object-contain"
                />
              )}
              {techCompanies.slice(0, 2).map(
                (company) =>
                  company.logo_url && (
                    <Image
                      key={company.id}
                      src={company.logo_url || "/placeholder.svg"}
                      alt={`${company.name} Logo`}
                      width={60}
                      height={20}
                      style={{
                        width: "auto",
                        height: "auto",
                        maxHeight: "20px",
                        maxWidth: "60px",
                      }}
                      className="object-contain opacity-80"
                    />
                  ),
              )}
              {techCompanies.length > 2 && <span className="text-xs text-gray-500">+{techCompanies.length - 2}</span>}
            </div>
          ) : userInfo?.techCompanyId && userTechCompany?.logo_url ? (
            // Mostrar logo de tech company para usuarios TechUser
            <div className="flex items-center">
              <Image
                src={userTechCompany.logo_url || "/placeholder.svg"}
                alt={`${userTechCompany.name} Logo`}
                width={100}
                height={28}
                style={{
                  width: "auto",
                  height: "auto",
                  maxHeight: "28px",
                  maxWidth: "100px",
                }}
                className="object-contain"
              />
            </div>
          ) : null}
        </div>

        <div className="hidden md:flex relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t("header.search") || "Search..."}
            className="pl-10 pr-4 py-2 w-full rounded-full bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100 relative">
            <Bell size={20} className="text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <UserInfo />
        </div>
      </div>
    </header>
  )
}
