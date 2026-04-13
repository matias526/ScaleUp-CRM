import type { ReactNode } from "react"
import { DesktopSidebar } from "@/components/dashboard/desktop-sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
import { Header } from "@/components/dashboard/header"
import { Footer } from "@/components/dashboard/footer"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TermsAndConditionsWrapper } from "@/components/auth/terms-and-conditions-wrapper"
import { ForceTranslationReload } from "@/components/force-translation-reload"
import { DashboardProviders } from "@/components/dashboard/dashboard-providers"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <TermsAndConditionsWrapper />
      <ForceTranslationReload />
      <DashboardProviders>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <DesktopSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 p-4 md:p-4 overflow-auto">{children}</main>
            <Footer />
          </div>
          <MobileSidebar />
        </div>
      </DashboardProviders>
    </ProtectedRoute>
  )
}
