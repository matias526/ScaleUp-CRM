"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { ProfileImageUploader } from "./profile-image-uploader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserProfileFormProps {
  initialData?: any
}

export function UserProfileForm({ initialData }: UserProfileFormProps) {
  // Estados para información personal
  const [firstName, setFirstName] = useState(initialData?.first_name || "")
  const [lastName, setLastName] = useState(initialData?.last_name || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [language, setLanguage] = useState(initialData?.preferred_language || "es")
  const [profileImage, setProfileImage] = useState(initialData?.profile_image || "")

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Estados generales
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("personal")

  const router = useRouter()
  const { toast } = useToast()
  //const supabase = createClientComponentClient()

  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {}

    if (!firstName) newErrors.firstName = "El nombre es requerido"
    if (!lastName) newErrors.lastName = "El apellido es requerido"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordChange = () => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) newErrors.currentPassword = "La contraseña actual es requerida"

    if (!newPassword) {
      newErrors.newPassword = "La nueva contraseña es requerida"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "La contraseña debe tener al menos 8 caracteres"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Debe confirmar la nueva contraseña"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] UserProfileForm - Form submitted")
    console.log("[v0] UserProfileForm - Data:", { firstName, lastName, phone, language, profileImage })

    if (!validatePersonalInfo()) {
      console.log("[v0] UserProfileForm - Validation failed")
      return
    }

    setIsSubmitting(true)
    try {
      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No se pudo obtener el usuario actual")
      }

      console.log("[v0] UserProfileForm - Updating user:", user.id)

      // Actualizar los metadatos del usuario en Auth
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          profile_image: profileImage,
        },
      })

      if (updateAuthError) {
        console.error("[v0] UserProfileForm - Auth update error:", updateAuthError)
        throw updateAuthError
      }

      console.log("[v0] UserProfileForm - Auth updated successfully")

      // Actualizar los datos del usuario en la tabla users
      const { error: updateUserError } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          preferred_language: language,
          profile_image: profileImage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateUserError) {
        console.error("[v0] UserProfileForm - User table update error:", updateUserError)
        throw updateUserError
      }

      console.log("[v0] UserProfileForm - User table updated successfully")

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente",
      })

      console.log("[v0] UserProfileForm - Redirecting to dashboard")
      // Redirigir al dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("[v0] UserProfileForm - Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar tu perfil",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] UserProfileForm - Password change submitted")

    if (!validatePasswordChange()) {
      console.log("[v0] UserProfileForm - Password validation failed")
      return
    }

    setIsSubmitting(true)
    try {
      // Verificar la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: initialData?.email || "",
        password: currentPassword,
      })

      if (signInError) {
        console.error("[v0] UserProfileForm - Current password incorrect:", signInError)
        setErrors({ currentPassword: "La contraseña actual es incorrecta" })
        throw new Error("La contraseña actual es incorrecta")
      }

      console.log("[v0] UserProfileForm - Current password verified")

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        console.error("[v0] UserProfileForm - Password update error:", updateError)
        throw updateError
      }

      console.log("[v0] UserProfileForm - Password updated successfully")

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
      })

      // Limpiar los campos de contraseña
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      console.log("[v0] UserProfileForm - Redirecting to dashboard")
      // Redirigir al dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("[v0] UserProfileForm - Error changing password:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar tu contraseña",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="personal">Información Personal</TabsTrigger>
        <TabsTrigger value="password">Cambiar Contraseña</TabsTrigger>
      </TabsList>

      <TabsContent value="personal">
        <form onSubmit={handlePersonalInfoSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Información personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Sección de imagen de perfil */}
                <div className="flex justify-center mb-4">
                  <ProfileImageUploader
                    initialImage={profileImage}
                    userId={initialData?.id || "temp-user"}
                    onImageUpdate={(url) => {
                      console.log("[v0] UserProfileForm - Image updated:", url)
                      setProfileImage(url || "")
                    }}
                    size="xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Nombre"
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Apellido"
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>

                {/* Selector de idioma preferido */}
                <div className="grid gap-3">
                  <Label htmlFor="profileLanguage">Idioma preferido</Label>
                  <select
                    id="profileLanguage"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </TabsContent>

      <TabsContent value="password">
        <form onSubmit={handlePasswordChange}>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Cambiar contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Contraseña actual */}
                <div className="grid gap-3">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                      className={errors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword}</p>}
                </div>

                {/* Nueva contraseña */}
                <div className="grid gap-3">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ingresa tu nueva contraseña"
                      className={errors.newPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
                  <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres</p>
                </div>

                {/* Confirmar contraseña */}
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirma tu nueva contraseña"
                      className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cambiar contraseña
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  )
}
