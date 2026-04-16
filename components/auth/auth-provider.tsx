"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { DebugLogger } from "@/lib/debug-logger"

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
  refreshUser: async () => { },
  userInfo: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<ExtendedUserInfo | null>(null)
  const router = useRouter()

  // Añadir o modificar la función getUserInfo para incluir el roleCode
  const getUserInfo = async (user: User | null) => {
    if (!user) {
      setUserInfo(null)
      return
    }

    try {
      const { data: userData, error } = await supabase.from("users").select("*, roles(code)").eq("id", user.id).single()

      if (error) {
        console.error("Error al obtener información del usuario:", error)
        return
      }

      if (userData) {
        setUserInfo({
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          isAdmin: userData.roles?.code === "admin",
          roleCode: userData.roles?.code, // Asegurarse de incluir el roleCode
          partnerId: userData.partner_id,
          techCompanyId: userData.tech_company_id,
          language: userData.preferred_language || "es",
          isScaleUp: false, // Provide a default value or fetch from userData if available
          partnerName: null, // Provide a default value or fetch from userData if available
          techCompanyName: null, // Provide a default value or fetch from userData if available
          partnerCountries: [], // Provide a default value or fetch from userData if available
          profileImage: null, // Provide a default value or fetch from userData if available
        })
      }
    } catch (error) {
      console.error("Error inesperado al obtener información del usuario:", error)
    }
  }

  // Optimizar la función loadUserExtendedInfo para manejar mejor los errores y el estado de carga
  const loadUserExtendedInfo = useCallback(
    async (userId: string): Promise<ExtendedUserInfo | null> => {
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
          .maybeSingle() // Usar maybeSingle en lugar de single para evitar errores si no hay resultados

        if (userError) {
          console.error("Error al obtener datos del usuario:", userError)
          // Si el error es que no se encontró el usuario, redirigir al login
          if (userError.code === "PGRST116") {
            console.error("Usuario no encontrado en la base de datos. Cerrando sesión...")
            await supabase.auth.signOut()
            router.push("/auth/login")
          }
          return null
        }

        if (!userData) {
          console.error("No se encontraron datos para el usuario:", userId)
          console.error("Usuario autenticado pero no existe en la tabla users. Cerrando sesión...")
          await supabase.auth.signOut()
          router.push("/auth/login")
          return null
        }

        // Obtener el código de rol y verificar si es admin
        const roleCode = userData.roles?.code || ""
        const isAdmin = roleCode.toLowerCase() === "admin"

        // CORRECCIÓN: Añadir logs para depuración de roles
        DebugLogger.log("AuthProvider", {
          userId,
          roleId: userData.role_id,
          roleCode,
          isAdmin,
          message: "Información de rol cargada",
        })

        // 2. Obtener países del partner si aplica
        let partnerCountries: UserCountry[] = []
        if (userData.partner_id) {
          const { data: countriesData, error: countriesError } = await supabase
            .from("partner_countries")
            .select("country_id, countries:country_id (code, name)")
            .eq("partner_id", userData.partner_id)

          if (countriesError) {
            console.error("Error al obtener países del partner:", countriesError)
            // Continuamos aunque haya error, solo con un array vacío de países
          } else if (countriesData) {
            partnerCountries = countriesData.map((country) => ({
              country_id: country.country_id,
              code: country.countries?.code || "",
              name: country.countries?.name || "",
            }))
          }
        }

        // 3. Construir objeto de información extendida
        const extendedInfo: ExtendedUserInfo = {
          // Información básica
          id: userId,
          email: userData.email || "",
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",

          // Roles y permisos
          isAdmin,
          roleCode,
          language: userData.preferred_language || "es",

          // Afiliaciones
          isScaleUp: !userData.partner_id && !userData.tech_company_id,
          partnerId: userData.partner_id,
          partnerName: userData.partners?.name || null,
          techCompanyId: userData.tech_company_id,
          techCompanyName: userData.tech_companies?.name || null,
          partnerCountries,

          // Imagen de perfil
          profileImage: (userData as any).profile_image || null,
        }

        console.log("Información extendida del usuario cargada correctamente")
        return extendedInfo
      } catch (error) {
        console.error("Error al cargar información extendida del usuario:", error)
        return null
      }
    },
    [router],
  )

  // Función para refrescar el usuario
  const refreshUser = useCallback(async () => {
    try {
      console.log("Refrescando información del usuario...")
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      // Cargar información extendida si hay un usuario
      if (session?.user) {
        const extendedInfo = await loadUserExtendedInfo(session.user.id)
        setUserInfo(extendedInfo)

        // Si no se pudo cargar la información extendida, cerrar sesión
        if (!extendedInfo) {
          console.error("No se pudo obtener la información extendida del usuario. Cerrando sesión...")
          await supabase.auth.signOut()
          router.push("/auth/login")
        }
      } else {
        setUserInfo(null)
      }
    } catch (error) {
      console.error("Error al refrescar el usuario:", error)
    }
  }, [loadUserExtendedInfo, router])

  // Modificar el useEffect para evitar cargas innecesarias
  useEffect(() => {
    let mounted = true
    let isLoadingData = false // Flag para evitar cargas simultáneas

    // Obtener la sesión inicial
    const getInitialSession = async () => {
      try {
        if (isLoadingData) return // Evitar cargas simultáneas

        console.log("Obteniendo sesión inicial...")
        isLoadingData = true
        setLoading(true)

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        // Cargar información extendida si hay un usuario Y no tenemos ya la información
        if (session?.user && !userInfo) {
          console.log("Usuario autenticado, cargando información extendida...")
          const extendedInfo = await loadUserExtendedInfo(session.user.id)
          if (mounted) {
            setUserInfo(extendedInfo)

            // Si no se pudo cargar la información extendida, cerrar sesión
            if (!extendedInfo) {
              console.error("No se pudo obtener la información extendida del usuario. Cerrando sesión...")
              await supabase.auth.signOut()
              router.push("/auth/login")
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener la sesión:", error)
      } finally {
        if (mounted) {
          setLoading(false)
          isLoadingData = false
        }
      }
    }

    getInitialSession()

    // Suscribirse a cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted || isLoadingData) return

      console.log("Cambio en el estado de autenticación:", _event)

      // Actualizar sesión y usuario sin importar el evento
      setSession(session)
      setUser(session?.user ?? null)

      // Solo cargar información extendida en eventos específicos y si no tenemos ya la información
      if (session?.user && (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") && !userInfo) {
        console.log("Cargando información extendida después de evento:", _event)
        isLoadingData = true
        setLoading(true)
        const extendedInfo = await loadUserExtendedInfo(session.user.id)
        if (mounted) {
          setUserInfo(extendedInfo)
          setLoading(false)
          isLoadingData = false

          // Si no se pudo cargar la información extendida, cerrar sesión
          if (!extendedInfo) {
            console.error("No se pudo obtener la información extendida del usuario. Cerrando sesión...")
            await supabase.auth.signOut()
            router.push("/auth/login")
          }
        }
      } else if (!session) {
        setUserInfo(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserExtendedInfo, userInfo, router]) // Añadir userInfo como dependencia

  return (
    <AuthContext.Provider value={{ session, user, loading, refreshUser, userInfo }}>{children}</AuthContext.Provider>
  )
}
