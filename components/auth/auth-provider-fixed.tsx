"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

// Definir tipos para la información extendida del usuario
interface UserCountry {
  country_id: string
  code: string
  name: string
}

interface ExtendedUserInfo {
  // Información básica
  id: string
  email: string
  firstName: string
  lastName: string

  // Roles y permisos
  isAdmin: boolean
  roleCode: string
  language: string

  // Afiliaciones
  isScaleUp: boolean
  partnerId: string | null
  partnerName: string | null
  techCompanyId: string | null
  techCompanyName: string | null
  partnerCountries: UserCountry[]

  // Imagen de perfil
  profileImage?: string | null
}

// Actualizar el tipo AuthContextType para incluir información extendida
type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  userInfo: ExtendedUserInfo | null
}

// Valor por defecto del contexto
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  refreshUser: async () => {},
  userInfo: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProviderFixed({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<ExtendedUserInfo | null>(null)
  const isInitializedRef = useRef(false)
  const loadingRef = useRef(false)
  const router = useRouter()

  // Función para cargar información extendida del usuario - SIN DEPENDENCIAS
  const loadUserExtendedInfo = useCallback(async (userId: string): Promise<ExtendedUserInfo | null> => {
    try {
      console.log("Cargando información extendida para el usuario:", userId)

      // 1. Obtener información del usuario con una sola consulta
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(`
          *,
          roles:role_id (id, code),
          tech_companies:tech_company_id (id, name),
          partners:partner_id (id, name)
        `)
        .eq("id", userId)
        .maybeSingle()

      if (userError) {
        console.error("Error al obtener datos del usuario:", userError)
        return null
      }

      if (!userData) {
        console.error("No se encontraron datos para el usuario:", userId)
        return null
      }

      // Obtener el código de rol y verificar si es admin
      const roleCode = userData.roles?.code || ""
      const isAdmin = roleCode.toLowerCase() === "admin"

      // 2. Obtener países del partner si aplica
      let partnerCountries: UserCountry[] = []
      if (userData.partner_id) {
        const { data: countriesData, error: countriesError } = await supabase
          .from("partner_countries")
          .select("country_id, countries:country_id (code, name)")
          .eq("partner_id", userData.partner_id)

        if (!countriesError && countriesData) {
          partnerCountries = countriesData.map((country) => ({
            country_id: country.country_id,
            code: country.countries?.code || "",
            name: country.countries?.name || "",
          }))
        }
      }

      // 3. Construir objeto de información extendida
      const extendedInfo: ExtendedUserInfo = {
        id: userId,
        email: userData.email || "",
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        isAdmin,
        roleCode,
        language: userData.preferred_language || "es",
        isScaleUp: !userData.partner_id && !userData.tech_company_id,
        partnerId: userData.partner_id,
        partnerName: userData.partners?.name || null,
        techCompanyId: userData.tech_company_id,
        techCompanyName: userData.tech_companies?.name || null,
        partnerCountries,
        profileImage: userData.profile_image || null,
      }

      console.log("Información extendida del usuario cargada correctamente")
      return extendedInfo
    } catch (error) {
      console.error("Error al cargar información extendida del usuario:", error)
      return null
    }
  }, []) // SIN DEPENDENCIAS

  // Función para refrescar el usuario - SIN DEPENDENCIAS
  const refreshUser = useCallback(async () => {
    if (loadingRef.current) return // Evitar múltiples cargas simultáneas

    try {
      console.log("Refrescando información del usuario...")
      loadingRef.current = true
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const extendedInfo = await loadUserExtendedInfo(session.user.id)
        setUserInfo(extendedInfo)
      } else {
        setUserInfo(null)
      }
    } catch (error) {
      console.error("Error al refrescar el usuario:", error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [loadUserExtendedInfo]) // SOLO loadUserExtendedInfo

  // Efecto para inicialización - SOLO SE EJECUTA UNA VEZ
  useEffect(() => {
    if (isInitializedRef.current) return

    let mounted = true

    const getInitialSession = async () => {
      try {
        console.log("Obteniendo sesión inicial...")
        loadingRef.current = true
        setLoading(true)

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log("Usuario autenticado, cargando información extendida...")
          const extendedInfo = await loadUserExtendedInfo(session.user.id)
          if (mounted) {
            setUserInfo(extendedInfo)
          }
        }
      } catch (error) {
        console.error("Error al obtener la sesión:", error)
      } finally {
        if (mounted) {
          setLoading(false)
          loadingRef.current = false
          isInitializedRef.current = true
        }
      }
    }

    getInitialSession()

    return () => {
      mounted = false
    }
  }, [loadUserExtendedInfo]) // SOLO loadUserExtendedInfo

  // Efecto para suscripción a cambios de auth - SOLO SE EJECUTA UNA VEZ
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Cambio en el estado de autenticación:", event)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        console.log("Cargando información extendida después de evento:", event)
        const extendedInfo = await loadUserExtendedInfo(session.user.id)
        setUserInfo(extendedInfo)
      } else if (!session) {
        setUserInfo(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUserExtendedInfo]) // SOLO loadUserExtendedInfo

  return (
    <AuthContext.Provider value={{ session, user, loading, refreshUser, userInfo }}>{children}</AuthContext.Provider>
  )
}
