import { createServerClient } from "@/lib/supabase/server"
//import { cookies } from "next/headers"
import { UserProfileForm } from "@/components/users/user-profile-form"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  //const cookieStore = cookies()
  //const supabase = createServerClient(cookieStore)
  const supabase = createServerClient()

  // Verificar si el usuario está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Obtener datos del usuario actual
  const { data: userData, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (error) {
    console.error("Error al obtener datos del usuario:", error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Actualiza tu información personal y preferencias
        </p>
      </div>

      <UserProfileForm initialData={userData} />
    </div>
  )
}
