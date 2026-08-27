"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Home,
  CircleDollarSign,
  Settings,
  Building2,
  Users,
  Handshake,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  PresentationIcon,
  Building,
  BookOpen,
  Sparkles,
  UserCheck,
  Zap,
  ChartNoAxesCombined,
} from "lucide-react"
import { OrderIcon } from "@/components/icons/order-icon"
import { useTranslations } from "@/hooks/use-translations"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import Image from "next/image"
import { TranslationService } from "@/lib/services/translation-service"

const sidebarTranslations = {
  en: {
    "sidebar.dashboard": "Dashboard",
    "sidebar.opportunities": "Opportunities",
    "sidebar.forecasts": "Forecasts",
    "sidebar.orders": "Orders",
    "sidebar.partners": "Partners",
    "sidebar.prospect_partners": "Prospect Partners",
    "sidebar.contacts": "Contacts",
    "sidebar.tech_companies": "Tech Companies",
    "sidebar.users": "Users",
    "sidebar.tasks": "Tasks",
    "sidebar.follow_up_meetings": "Follow-up Meetings",
    "sidebar.internal_meetings": "Internal Meetings",
    "sidebar.end_customers": "End Customers",
    "sidebar.pulse": "Pulse",
    "sidebar.pulse_templates": "Message Templates",
    "sidebar.pulse_messages": "Send Message",
    "sidebar.pulse_unverified_contacts": "Unverified Contacts",
    "sidebar.settings": "Settings",
    "sidebar.settings.general": "General",
    "sidebar.settings.custom_fields": "Custom Fields",
    "sidebar.settings.opportunity_checklist": "Opportunity Checklist",
    "sidebar.settings.translations": "Translations",
    "sidebar.settings.supabase": "Supabase Setup",
    "sidebar.knowledge_base": "Knowledge Base",
    "sidebar.ai_knowledge_base": "AI Knowledge Base",
    "sidebar.ai_knowledge_base.chat": "Chat with Mika",
    "sidebar.ai_knowledge_base.documents": "Documents",
    "sidebar.ai_knowledge_base.feedback": "Feedback",
    "sidebar.mika_chat": "Chat with Mika",
  },
  es: {
    "sidebar.dashboard": "Dashboard",
    "sidebar.opportunities": "Oportunidades",
    "sidebar.forecasts": "Forecasts",
    "sidebar.orders": "Órdenes",
    "sidebar.partners": "Socios",
    "sidebar.prospect_partners": "Socios Potenciales",
    "sidebar.contacts": "Contactos",
    "sidebar.tech_companies": "Empresas Tech",
    "sidebar.users": "Usuarios",
    "sidebar.tasks": "Tareas",
    "sidebar.follow_up_meetings": "Reunión de Seguimiento",
    "sidebar.internal_meetings": "Reuniones Internas",
    "sidebar.end_customers": "Clientes Finales",
    "sidebar.pulse": "Pulse",
    "sidebar.pulse_templates": "Plantillas de Mensaje",
    "sidebar.pulse_messages": "Enviar Mensaje",
    "sidebar.pulse_unverified_contacts": "Contactos No Verificados",
    "sidebar.settings": "Configuración",
    "sidebar.settings.general": "General",
    "sidebar.settings.custom_fields": "Campos Personalizados",
    "sidebar.settings.opportunity_checklist": "CheckList en Oportunidades",
    "sidebar.settings.translations": "Traducciones",
    "sidebar.settings.supabase": "Configuración Supabase",
    "sidebar.knowledge_base": "Base de Conocimiento",
    "sidebar.ai_knowledge_base": "Base de Conocimiento IA",
    "sidebar.ai_knowledge_base.chat": "Chat con Mika",
    "sidebar.ai_knowledge_base.documents": "Documentos",
    "sidebar.ai_knowledge_base.feedback": "Feedback",
    "sidebar.mika_chat": "Chat con Mika",
  },
  pt: {
    "sidebar.dashboard": "Dashboard",
    "sidebar.opportunities": "Oportunidades",
    "sidebar.forecasts": "Forecasts",
    "sidebar.orders": "Pedidos",
    "sidebar.partners": "Parceiros",
    "sidebar.prospect_partners": "Parceiros Potenciais",
    "sidebar.contacts": "Contatos",
    "sidebar.tech_companies": "Empresas Tech",
    "sidebar.users": "Usuários",
    "sidebar.tasks": "Tarefas",
    "sidebar.follow_up_meetings": "Reunião de Acompanhamento",
    "sidebar.internal_meetings": "Reuniões Internas",
    "sidebar.end_customers": "Clientes Finales",
    "sidebar.pulse": "Pulse",
    "sidebar.pulse_templates": "Modelos de Mensagem",
    "sidebar.pulse_messages": "Enviar Mensagem",
    "sidebar.pulse_unverified_contacts": "Contatos Não Verificados",
    "sidebar.settings": "Configurações",
    "sidebar.settings.general": "Geral",
    "sidebar.settings.custom_fields": "Campos Personalizados",
    "sidebar.settings.opportunity_checklist": "Checklist em Oportunidades",
    "sidebar.settings.translations": "Traduções",
    "sidebar.settings.supabase": "Configuração Supabase",
    "sidebar.knowledge_base": "Base de Conhecimento",
    "sidebar.ai_knowledge_base": "Base de Conocimiento IA",
    "sidebar.ai_knowledge_base.chat": "Chat com Mika",
    "sidebar.ai_knowledge_base.documents": "Documentos",
    "sidebar.ai_knowledge_base.feedback": "Feedback",
    "sidebar.mika_chat": "Chat com Mika",
  },
}

// Función para obtener una traducción con respaldo garantizado
function getSidebarTranslation(
  key: string,
  language: string,
  t: (key: string, defaultValue?: string) => string,
): string {
  // Intentar obtener la traducción usando el hook
  const translation = t(key)

  // Si la traducción es igual a la clave, significa que no se encontró
  if (translation === key) {
    // Intentar obtener la traducción del respaldo
    return (
      sidebarTranslations[language as keyof typeof sidebarTranslations]?.[
        key as keyof (typeof sidebarTranslations)[keyof typeof sidebarTranslations]
      ] || key
    )
  }

  return translation
}

type SidebarItemType = {
  href: string
  icon: any
  labelKey: string
  adminOnly?: boolean
  bddOnly?: boolean
  adminOrBdd?: boolean // Nuevo flag para elementos visibles por Admin O BDD
  adminOrMarketing?: boolean // Nuevo flag para elementos visibles por Admin O Marketing
  adminOrBddOrMarketing?: boolean // Nuevo flag para elementos visibles por Admin O BDD O Marketing
  excludeMarketing?: boolean // Ocultar para Marketing
  excludeTechUserAndLogistic?: boolean // Ocultar para TechUser y TechLogistic
  settingsSubItems?: { href: string; labelKey: string }[]
}

export function Sidebar() {
  const pathname = usePathname()
  const { t, language } = useTranslations()
  const { userInfo } = useAuth()
  const isAdmin = userInfo?.isAdmin || false
  const isBDD = userInfo?.roleCode?.toLowerCase() === "bdd" || false
  const isMarketing = userInfo?.roleCode?.toLowerCase() === "marketing" || false
  const isTechUser = userInfo?.roleCode?.toLowerCase() === "techuser" || false
  const isTechLogistic = userInfo?.roleCode?.toLowerCase() === "techlogistic" || false

  console.log("[v0] Sidebar - User Info:", {
    roleCode: userInfo?.roleCode, // Mostrar roleCode en lugar de role
    isAdmin,
    isBDD,
    userInfo,
  })

  const [collapsed, setCollapsed] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [translationsLoaded, setTranslationsLoaded] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Asegurarse de que las traducciones estén cargadas
  useEffect(() => {
    const loadTranslations = async () => {
      if (!TranslationService.isInitialized) {
        await TranslationService.initialize()
      }
      setTranslationsLoaded(true)
    }

    loadTranslations()
  }, [])

  // Manejar eventos de mouse para expandir/colapsar
  const handleMouseEnter = () => {
    if (collapsed) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setHovering(true)
      }, 300) // Pequeño retraso para evitar expansiones no deseadas
    }
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHovering(false)
  }

  // Función para alternar el estado colapsado
  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev)
    // Asegurarse de que hovering se resetee cuando cambiamos manualmente
    setHovering(false)
  }

  // Definir los elementos del sidebar con enlaces directos a los listados
  const sidebarItems: SidebarItemType[] = [
    {
      href: "/dashboard",
      icon: Home,
      labelKey: "sidebar.dashboard",
    },
    {
      href: "/dashboard/tech-companies",
      icon: Building2,
      labelKey: "sidebar.tech_companies",
      adminOnly: true,
    },
    {
      href: "/dashboard/partners",
      icon: Handshake,
      labelKey: "sidebar.partners",
      adminOnly: true,
    },
    {
      href: "/dashboard/prospect-partners",
      icon: Handshake,
      labelKey: "sidebar.prospect_partners",
      adminOrBddOrMarketing: true,
    },
    {
      href: "/dashboard/contacts",
      icon: UserCheck,
      labelKey: "sidebar.contacts",
      adminOnly: true,
    },
    {
      href: "/dashboard/users",
      icon: Users,
      labelKey: "sidebar.users",
      adminOnly: true,
    },
    {
      href: "/dashboard/end-customers",
      icon: Building,
      labelKey: "sidebar.end_customers",
      adminOnly: true,
    },
    {
      href: "/dashboard/opportunities",
      icon: CircleDollarSign,
      labelKey: "sidebar.opportunities",
    },
    {
      href: "/dashboard/forecasts",
      icon: ChartNoAxesCombined,
      labelKey: "sidebar.forecasts",
      adminOrBdd: true,
    },
    {
      href: "/dashboard/purchase-orders",
      icon: OrderIcon,
      labelKey: "sidebar.orders",
      excludeMarketing: true,
    },
    {
      href: "/dashboard/tasks",
      icon: ClipboardList,
      labelKey: "sidebar.tasks",
    },
    {
      href: "/dashboard/follow-up-meetings",
      icon: PresentationIcon,
      labelKey: "sidebar.follow_up_meetings",
      excludeMarketing: true,
      excludeTechUserAndLogistic: true,
    },
    {
      href: "/dashboard/internal-meetings",
      icon: Users,
      labelKey: "sidebar.internal_meetings",
      adminOnly: true,
    },
    {
      href: "/dashboard/ai-knowledge-base/chat",
      icon: Sparkles, // Cambiado de Bot a Sparkles
      labelKey: "sidebar.mika_chat",
      adminOrBdd: true, // Visible para Admin O BDD
    },
    {
      href: "/dashboard/ai-knowledge-base/documents",
      icon: BookOpen,
      labelKey: "sidebar.ai_knowledge_base",
      adminOnly: true,
      settingsSubItems: [
        {
          href: "/dashboard/ai-knowledge-base/documents",
          labelKey: "sidebar.ai_knowledge_base.documents",
        },
        {
          href: "/dashboard/ai-knowledge-base/feedback",
          labelKey: "sidebar.ai_knowledge_base.feedback",
        },
      ],
    },
    {
      href: "/dashboard/settings/pulse-templates",
      icon: Zap,
      labelKey: "sidebar.pulse",
      adminOrMarketing: true,
      settingsSubItems: [
        {
          href: "/dashboard/settings/pulse-templates",
          labelKey: "sidebar.pulse_templates",
        },
        {
          href: "/dashboard/settings/pulse-messages",
          labelKey: "sidebar.pulse_messages",
        },
        {
          href: "/dashboard/settings/pulse-unverified-contacts",
          labelKey: "sidebar.pulse_unverified_contacts",
        },
      ],
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      labelKey: "sidebar.settings",
      adminOnly: true,
      settingsSubItems: [
        {
          href: "/dashboard/settings",
          labelKey: "sidebar.settings.general",
        },
        {
          href: "/dashboard/settings/custom-fields",
          labelKey: "sidebar.settings.custom_fields",
        },
        {
          href: "/dashboard/settings/opportunity-checklist",
          labelKey: "sidebar.settings.opportunity_checklist",
        },
        {
          href: "/dashboard/settings/translations",
          labelKey: "sidebar.settings.translations",
        },
        {
          href: "/dashboard/settings/supabase-setup",
          labelKey: "sidebar.settings.supabase",
        },
      ],
    },
  ]

  // Filtrar los elementos del sidebar según el rol del usuario
  const filteredSidebarItems = sidebarItems.filter((item) => {
    const shouldShow = (() => {
      // Si el elemento está marcado como excluido para Marketing y el usuario es Marketing
      if (item.excludeMarketing && isMarketing) {
        return false
      }
      // Si el elemento debe excluirse para TechUser y TechLogistic
      if (item.excludeTechUserAndLogistic && (isTechUser || isTechLogistic)) {
        return false
      }
      // Si el elemento es para Admin O BDD O Marketing, mostrar si el usuario es cualquiera de los tres
      if (item.adminOrBddOrMarketing) {
        return isAdmin || isBDD || isMarketing
      }
      // Si el elemento es para admin O Marketing, mostrar si el usuario es cualquiera de los dos
      if (item.adminOrMarketing) {
        return isAdmin || isMarketing
      }
      // Si el elemento es para admin O BDD, mostrar si el usuario es cualquiera de los dos
      if (item.adminOrBdd) {
        return isAdmin || isBDD
      }
      // Si el elemento es solo para admin y el usuario no es admin, no mostrarlo
      if (item.adminOnly && !isAdmin) {
        return false
      }
      // Si el elemento es solo para BDD y el usuario no es BDD ni admin, no mostrarlo
      if (item.bddOnly && !isBDD && !isAdmin) {
        return false
      }
      return true
    })()

    console.log("[v0] Sidebar - Item filter:", {
      labelKey: item.labelKey,
      adminOrBddOrMarketing: item.adminOrBddOrMarketing,
      adminOrMarketing: item.adminOrMarketing,
      adminOrBdd: item.adminOrBdd,
      adminOnly: item.adminOnly,
      bddOnly: item.bddOnly,
      excludeMarketing: item.excludeMarketing,
      excludeTechUserAndLogistic: item.excludeTechUserAndLogistic,
      shouldShow,
      isAdmin,
      isBDD,
      isMarketing,
      isTechUser,
      isTechLogistic,
    })

    return shouldShow
  })

  // Función para obtener la traducción
  const getTranslation = (key: string) => {
    return getSidebarTranslation(key, language || "en", t)
  }

  // Determinar si un elemento está activo
  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Si las traducciones no están cargadas, mostrar un placeholder
  if (!translationsLoaded) {
    return (
      <div className="flex flex-col h-full bg-white w-64">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 border-r border-gray-100">
          <div className="w-24 h-6 bg-gray-200 animate-pulse rounded"></div>
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full"></div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 border-r border-gray-100">
          <div className="px-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
            ))}
          </div>
        </div>
        {/* Footer placeholder con altura exacta */}
        <div className="bg-primary py-4 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <div className="h-5"></div>
            <div className="flex gap-4 mt-2 md:mt-0">
              <div className="h-5 w-16"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Determinar el ancho del sidebar
  const sidebarWidth = collapsed ? (hovering ? "w-64" : "w-20") : "w-64"

  return (
    <div
      ref={sidebarRef}
      className={cn("flex flex-col h-full bg-white transition-all duration-300", sidebarWidth)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 border-r border-gray-100">
        {(!collapsed || hovering) && (
          <div className="flex items-center">
            <Image
              src="/images/scaleup-logo-color.png"
              alt="ScaleUp Logo"
              width={120}
              height={30}
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <button onClick={toggleCollapsed} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          {collapsed ? (
            <ChevronRight size={20} className="text-gray-500" />
          ) : (
            <ChevronLeft size={20} className="text-gray-500" />
          )}
        </button>
      </div>

      {/* Contenido del sidebar */}
      <div className="flex-1 overflow-y-auto py-4 border-r border-gray-100">
        <nav className="px-3 space-y-1">
          {filteredSidebarItems.map((item) => {
            const isActive = isItemActive(item.href)

            // Si tiene subelementos (configuración o AI knowledge base)
            if (item.settingsSubItems && (!collapsed || hovering)) {
              return (
                <div key={item.labelKey} className="space-y-1">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{getTranslation(item.labelKey)}</span>
                  </Link>

                  <div className="pl-10 space-y-1">
                    {item.settingsSubItems.map((subItem) => (
                      <Link
                        href={subItem.href}
                        key={subItem.labelKey}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                          pathname === subItem.href
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                        )}
                      >
                        <span>{getTranslation(subItem.labelKey)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            }

            // Para todos los demás elementos
            return (
              <Link
                href={item.href}
                key={item.labelKey}
                className={cn(
                  "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100",
                  collapsed && !hovering && "justify-center",
                )}
              >
                <item.icon className={cn("h-5 w-5", (!collapsed || hovering) && "mr-3")} />
                {(!collapsed || hovering) && <span>{getTranslation(item.labelKey)}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer del sidebar - SIN BORDE para continuidad visual */}
      <div className="bg-primary py-4 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="h-5"></div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <div className="h-5 w-0"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
