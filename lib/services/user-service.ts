import { supabase } from "@/lib/supabase/client"

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role_id: string
  role_code?: string
  tech_company_id: string | null
  tech_company_name?: string | null
  partner_id: string | null
  partner_name?: string | null
  is_active: boolean
  preferred_language: string
  theme_preference: string
  created_at: string
  updated_at: string
  phone?: string | null
  profile_image?: string | null
}

// Actualizar la interfaz UserFormData para incluir profile_image
export interface UserFormData {
  email: string
  password?: string
  first_name: string
  last_name: string
  role_id: string
  tech_company_id?: string | null
  partner_id?: string | null
  is_active?: boolean
  preferred_language?: string
  theme_preference?: string
  require_email_confirmation?: boolean
  phone?: string | null
  profile_image?: string | null
}

export class UserService {
  static async getUserById(userId: string) {
    try {
      // Consulta principal para obtener información del usuario
      const { data: user, error } = await supabase
        .from("users")
        .select(`
          *,
          role:roles(code),
          partner:partners(id, name),
          tech_company:tech_companies(id, name)
        `)
        .eq("id", userId)
        .maybeSingle() // Usar maybeSingle en lugar de single para evitar errores si no hay resultados

      if (error) {
        console.error("Error al obtener usuario por ID:", error)
        return null
      }

      if (!user) {
        console.error("No se encontró el usuario con ID:", userId)
        return null
      }

      // Transformar los datos para facilitar su uso
      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_code: user.role?.code || null,
        preferred_language: user.preferred_language || "es",
        partner_id: user.partner?.id || null,
        partner_name: user.partner?.name || null,
        tech_company_id: user.tech_company?.id || null,
        tech_company_name: user.tech_company?.name || null,
        created_at: user.created_at,
        updated_at: user.updated_at,
        phone: user.phone || null,
        profile_image: user.profile_image || null,
      }
    } catch (error) {
      console.error("Error al obtener usuario por ID:", error)
      return null
    }
  }

  /**
   * Obtiene todos los usuarios con paginación
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @returns Lista de usuarios y total
   */
  static async getUsers(page = 1, pageSize = 10): Promise<{ data: User[]; total: number }> {
    try {
      // Calcular el rango para la paginación
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Consulta para obtener el total de registros
      const countQuery = supabase.from("users").select("id", { count: "exact", head: true })

      // Consulta para obtener los datos paginados con información de roles, tech companies y partners
      const dataQuery = supabase
        .from("users")
        .select(`
          id, email, first_name, last_name, role_id, tech_company_id, partner_id, 
          is_active, preferred_language, theme_preference, created_at, updated_at, phone, profile_image,
          roles:role_id (code),
          tech_companies:tech_company_id (name),
          partners:partner_id (name)
        `)
        .order("first_name")
        .range(from, to)

      // Ejecutar ambas consultas en paralelo
      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery])

      if (countResult.error) {
        console.error("Error al obtener el conteo de usuarios:", countResult.error)
        return { data: [], total: 0 }
      }

      if (dataResult.error) {
        console.error("Error al obtener usuarios:", dataResult.error)
        return { data: [], total: 0 }
      }

      // Formatear los datos para incluir nombres de roles, tech companies y partners
      const formattedData = dataResult.data.map((user) => ({
        ...user,
        role_code: user.roles?.code || null,
        tech_company_name: user.tech_companies?.name || null,
        partner_name: user.partners?.name || null,
      }))

      // Eliminar los objetos anidados
      formattedData.forEach((user) => {
        delete (user as any).roles
        delete (user as any).tech_companies
        delete (user as any).partners
      })

      return {
        data: formattedData,
        total: countResult.count || 0,
      }
    } catch (error) {
      console.error("Error inesperado al obtener usuarios:", error)
      return { data: [], total: 0 }
    }
  }

  /**
   * Busca usuarios por término de búsqueda
   * @param searchTerm Término de búsqueda
   * @returns Lista de usuarios que coinciden con la búsqueda
   */
  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      if (!searchTerm.trim()) {
        const { data } = await this.getUsers(1, 10)
        return data
      }

      const term = searchTerm.toLowerCase().trim()

      // Consulta optimizada para búsqueda
      const { data, error } = await supabase
        .from("users")
        .select(`
          id, email, first_name, last_name, role_id, tech_company_id, partner_id, 
          is_active, preferred_language, theme_preference, created_at, updated_at, phone, profile_image,
          roles:role_id (code),
          tech_companies:tech_company_id (name),
          partners:partner_id (name)
        `)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .order("first_name")
        .limit(10)

      if (error) {
        console.error("Error al buscar usuarios:", error)
        return []
      }

      // Formatear los datos
      const formattedData = data.map((user) => ({
        ...user,
        role_code: user.roles?.code || null,
        tech_company_name: user.tech_companies?.name || null,
        partner_name: user.partners?.name || null,
      }))

      // Eliminar los objetos anidados
      formattedData.forEach((user) => {
        delete (user as any).roles
        delete (user as any).tech_companies
        delete (user as any).partners
      })

      return formattedData || []
    } catch (error) {
      console.error("Error inesperado al buscar usuarios:", error)
      return []
    }
  }

  /**
   * Crea un nuevo usuario
   * @param formData Datos del formulario
   * @returns El usuario creado o null si hay error
   */
  static async createUser(formData: UserFormData): Promise<User | null> {
    try {
      // Validar datos de entrada
      if (!formData.email || !formData.first_name || !formData.last_name || !formData.role_id) {
        console.error("Datos de usuario incompletos:", formData)
        throw new Error("Faltan datos obligatorios para crear el usuario")
      }

      // Validar formato de email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(formData.email)) {
        throw new Error(`El formato del email "${formData.email}" no es válido. Debe ser usuario@dominio.com`)
      }

      // Asegurarse de que el email no contenga espacios
      if (formData.email.includes(" ")) {
        throw new Error("El email no puede contener espacios")
      }

      // Validar longitud del email
      if (formData.email.length < 5 || formData.email.length > 255) {
        throw new Error("El email debe tener entre 5 y 255 caracteres")
      }

      // Generar una contraseña aleatoria si no se proporciona
      const password = formData.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

      // Si no se requiere confirmación de email, usar el endpoint de administración
      if (!formData.require_email_confirmation) {
        // Implementación de creación de usuario sin confirmación de email
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            password,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al crear usuario mediante API de administración")
        }

        const data = await response.json()
        return data.user
      }

      // Si se requiere confirmación de email, usar signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            profile_image: formData.profile_image,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        console.error("Error al crear usuario en Auth:", authError)
        throw new Error(`Error al crear usuario en Auth: ${authError.message}`)
      }

      if (!authData.user) {
        console.error("No se pudo crear el usuario en Auth")
        throw new Error("No se pudo crear el usuario en Auth")
      }

      // Esperar un momento para que el trigger de Supabase cree el registro en la tabla users
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Verificar si el usuario ya existe en la tabla users
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", authData.user.id)
        .maybeSingle() // Usar maybeSingle en lugar de single

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 es "no se encontró ningún registro"
        console.error("Error al verificar si el usuario existe:", checkError)
        throw new Error(`Error al verificar si el usuario existe: ${checkError.message}`)
      }

      let userData

      // Si el usuario no existe en la tabla users, crearlo manualmente
      if (!existingUser) {
        console.log("El trigger no creó el usuario, creándolo manualmente")
        const { data: insertedUser, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              role_id: formData.role_id,
              tech_company_id: formData.tech_company_id || null,
              partner_id: formData.partner_id || null,
              is_active: formData.is_active !== undefined ? formData.is_active : true,
              preferred_language: formData.preferred_language || "es",
              theme_preference: formData.theme_preference || "light",
              phone: formData.phone || null,
              profile_image: formData.profile_image || null,
            },
          ])
          .select()

        if (insertError) {
          console.error("Error al insertar usuario manualmente:", insertError)
          throw new Error(`Error al insertar usuario manualmente: ${insertError.message}`)
        }

        userData = insertedUser?.[0]
      } else {
        // Si el usuario ya existe, actualizar sus datos
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            role_id: formData.role_id,
            tech_company_id: formData.tech_company_id || null,
            partner_id: formData.partner_id || null,
            is_active: formData.is_active !== undefined ? formData.is_active : true,
            preferred_language: formData.preferred_language || "es",
            theme_preference: formData.theme_preference || "light",
            phone: formData.phone || null,
            profile_image: formData.profile_image || null,
          })
          .eq("id", authData.user.id)
          .select()

        if (updateError) {
          console.error("Error al actualizar datos del usuario:", updateError)
          throw new Error(`Error al actualizar datos del usuario: ${updateError.message}`)
        }

        userData = updatedUser?.[0]
      }

      if (!userData) {
        throw new Error("No se pudo obtener los datos del usuario después de crearlo/actualizarlo")
      }

      console.log("Usuario creado. Se ha enviado un correo de confirmación.")
      return userData
    } catch (error: any) {
      console.error("Error inesperado al crear usuario:", error)
      throw error // Propagar el error para que se muestre el mensaje específico
    }
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario
   * @param formData Datos del formulario
   * @returns El usuario actualizado o null si hay error
   */
  static async updateUser(id: string, formData: UserFormData): Promise<User | null> {
    try {
      // Verificar si el ID es válido
      if (!id || typeof id !== "string") {
        console.error("ID de usuario inválido:", id)
        return null
      }

      console.log("[v0] UserService.updateUser - profile_image value:", formData.profile_image)

      // Si se proporciona una nueva contraseña, usar el endpoint de administración
      if (formData.password) {
        // Implementación de actualización de usuario con nueva contraseña
        const response = await fetch(`/api/admin/users/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`Error al actualizar usuario con ID ${id}:`, errorData)
          return null
        }

        const data = await response.json()
        return data.user
      } else {
        // Si no hay nueva contraseña, actualizar solo los datos en la tabla users
        const { data, error } = await supabase
          .from("users")
          .update({
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role_id: formData.role_id,
            tech_company_id: formData.tech_company_id || null,
            partner_id: formData.partner_id || null,
            is_active: formData.is_active !== undefined ? formData.is_active : true,
            preferred_language: formData.preferred_language || "es",
            theme_preference: formData.theme_preference || "light",
            updated_at: new Date().toISOString(),
            phone: formData.phone || null,
            profile_image: formData.profile_image || null,
          })
          .eq("id", id)
          .select()
          .maybeSingle() // Usar maybeSingle en lugar de single

        if (error) {
          console.error(`Error al actualizar usuario con ID ${id}:`, error)
          return null
        }

        return data
      }
    } catch (error) {
      console.error(`Error inesperado al actualizar usuario con ID ${id}:`, error)
      return null
    }
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario
   * @returns true si se eliminó correctamente, false si hubo error
   */
  static async deleteUser(id: string): Promise<boolean> {
    try {
      // Verificar si el ID es válido
      if (!id || typeof id !== "string") {
        console.error("ID de usuario inválido:", id)
        return false
      }

      // Usar el endpoint de API para eliminar el usuario
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Error al eliminar usuario con ID ${id}:`, errorData)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error inesperado al eliminar usuario con ID ${id}:`, error)
      return false
    }
  }

  /**
   * Obtiene todos los roles disponibles
   * @returns Lista de roles
   */
  static async getRoles(): Promise<{ id: string; code: string }[]> {
    try {
      const { data, error } = await supabase.from("roles").select("id, code").order("code")

      if (error) {
        console.error("Error al obtener roles:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error inesperado al obtener roles:", error)
      return []
    }
  }
}

export const getUserById = UserService.getUserById
