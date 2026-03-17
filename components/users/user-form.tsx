"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { UserService, type UserFormData } from "@/lib/services/user-service"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/ui/image-upload"

interface UserFormProps {
  userId?: string
  initialData?: Partial<UserFormData>
}

export function UserForm({ userId, initialData }: UserFormProps) {
  const [email, setEmail] = useState(initialData?.email || "")
  const [firstName, setFirstName] = useState(initialData?.first_name || "")
  const [lastName, setLastName] = useState(initialData?.last_name || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [language, setLanguage] = useState(initialData?.preferred_language || "es") // Idioma preferido
  const [isActive, setIsActive] = useState(initialData?.is_active !== false)
  const [requireConfirmation, setRequireConfirmation] = useState(initialData?.require_email_confirmation || false)
  const [roleId, setRoleId] = useState(initialData?.role_id || "")
  const [roles, setRoles] = useState<Array<{ id: string; code: string }>>([])
  const [techCompanies, setTechCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [partners, setPartners] = useState<Array<{ id: string; name: string }>>([])
  const [techCompanyId, setTechCompanyId] = useState(initialData?.tech_company_id || "")
  const [partnerId, setPartnerId] = useState(initialData?.partner_id || "")
  const [profileImage, setProfileImage] = useState(initialData?.profile_image || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedRoleType, setSelectedRoleType] = useState<"none" | "tech" | "partner">("none")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  //const supabase = createClientComponentClient()

  // Cargar roles disponibles
  useEffect(() => {
    async function fetchRoles() {
      setIsLoading(true)
      try {
        console.log("Cargando roles...")
        // Corregido: solo seleccionamos id y code
        const { data, error } = await supabase.from("roles").select("id, code")

        if (error) {
          console.error("Error al cargar roles:", error)
          toast({
            title: "Error",
            description: `No se pudieron cargar los roles: ${error.message}`,
            variant: "destructive",
          })
          return
        }

        console.log("Roles cargados:", data)
        setRoles(data || [])
      } catch (error) {
        console.error("Error al cargar roles:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [supabase, toast])

  // Cargar tech companies y partners
  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Cargando tech companies y partners...")
        const [techCompaniesResult, partnersResult] = await Promise.all([
          supabase.from("tech_companies").select("id, name").order("name"),
          supabase.from("partners").select("id, name").order("name"),
        ])

        if (techCompaniesResult.error) {
          console.error("Error al cargar tech companies:", techCompaniesResult.error)
        } else {
          console.log("Tech companies cargadas:", techCompaniesResult.data)
          setTechCompanies(techCompaniesResult.data || [])
        }

        if (partnersResult.error) {
          console.error("Error al cargar partners:", partnersResult.error)
        } else {
          console.log("Partners cargados:", partnersResult.data)
          setPartners(partnersResult.data || [])
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      }
    }

    fetchData()
  }, [supabase])

  // Determinar el tipo de rol cuando cambia el rol seleccionado
  useEffect(() => {
    if (!roleId) {
      setSelectedRoleType("none")
      return
    }

    const selectedRole = roles.find((role) => role.id === roleId)
    if (!selectedRole) {
      setSelectedRoleType("none")
      return
    }

    if (selectedRole.code === "TechUser") {
      setSelectedRoleType("tech")
      // Limpiar partner_id si se selecciona un rol de tech
      setPartnerId("")
    } else if (selectedRole.code === "PartnerUser") {
      setSelectedRoleType("partner")
      // Limpiar tech_company_id si se selecciona un rol de partner
      setTechCompanyId("")
    } else {
      setSelectedRoleType("none")
      // Limpiar ambos si se selecciona un rol que no requiere afiliación
      setTechCompanyId("")
      setPartnerId("")
    }
  }, [roleId, roles])

  // Inicializar el tipo de rol basado en los datos iniciales
  useEffect(() => {
    if (initialData?.role_id && roles.length > 0) {
      const role = roles.find((r) => r.id === initialData.role_id)
      if (role) {
        if (role.code === "TechUser") {
          setSelectedRoleType("tech")
        } else if (role.code === "PartnerUser") {
          setSelectedRoleType("partner")
        } else {
          setSelectedRoleType("none")
        }
      }
    }
  }, [initialData?.role_id, roles])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email) newErrors.email = "El email es requerido"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "El email no es válido"

    if (!firstName) newErrors.firstName = "El nombre es requerido"
    if (!lastName) newErrors.lastName = "El apellido es requerido"
    if (!roleId) newErrors.roleId = "El rol es requerido"

    // Validar que se seleccione una tech company si el rol es TechUser
    if (selectedRoleType === "tech" && !techCompanyId) {
      newErrors.techCompanyId = "Debe seleccionar una empresa tecnológica"
    }

    // Validar que se seleccione un partner si el rol es PartnerUser
    if (selectedRoleType === "partner" && !partnerId) {
      newErrors.partnerId = "Debe seleccionar un partner"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const userData: UserFormData = {
        email,
        password: "123456", // Contraseña fija
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        is_active: isActive,
        role_id: roleId,
        require_email_confirmation: requireConfirmation,
        preferred_language: language,
        profile_image: profileImage || null,
      }

      // Agregar tech_company_id o partner_id según el tipo de rol
      if (selectedRoleType === "tech") {
        userData.tech_company_id = techCompanyId
      } else if (selectedRoleType === "partner") {
        userData.partner_id = partnerId
      }

      console.log("[v0] Submitting user data with profile_image:", userData.profile_image)

      let result
      if (userId) {
        // Actualizar usuario existente
        result = await UserService.updateUser(userId, userData)
        if (result) {
          toast({
            title: "Usuario actualizado",
            description: "El usuario ha sido actualizado correctamente",
          })
          router.push("/dashboard/users")
        }
      } else {
        // Crear nuevo usuario
        result = await UserService.createUser(userData)
        if (result) {
          toast({
            title: "Usuario creado",
            description: "El usuario ha sido creado correctamente",
          })
          router.push("/dashboard/users")
        }
      }
    } catch (error: any) {
      console.error("Error al guardar usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (url: string) => {
    console.log("[v0] handleImageUpload called with URL:", url)
    setProfileImage(url)
  }

  // Determinar si estamos en modo edición o creación
  const isEditMode = !!userId

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Sección de imagen de perfil */}
            <div className="flex flex-col items-center mb-4">
              <Label htmlFor="profileImage" className="mb-2">
                Imagen de perfil
              </Label>
              <ImageUpload
                value={profileImage}
                onChange={handleImageUpload}
                bucketName="profile-images"
                className="w-32 h-32 rounded-full"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
              <Label htmlFor="language">Idioma preferido</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="roleId">Rol</Label>
              <select
                id="roleId"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className={`flex h-10 w-full rounded-md border ${
                  errors.roleId ? "border-destructive" : "border-input"
                } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                disabled={isLoading}
              >
                <option value="">Seleccionar rol</option>
                {isLoading ? (
                  <option value="" disabled>
                    Cargando roles...
                  </option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.code} {/* Corregido: usar solo code */}
                    </option>
                  ))
                )}
              </select>
              {errors.roleId && <p className="text-sm text-destructive">{errors.roleId}</p>}
              {roles.length === 0 && !isLoading && (
                <p className="text-sm text-amber-600">
                  No se encontraron roles. Verifique la conexión a la base de datos.
                </p>
              )}
            </div>

            {/* Selector de Tech Company (solo visible si el rol es TechUser) */}
            {selectedRoleType === "tech" && (
              <div className="grid gap-3">
                <Label htmlFor="techCompanyId">Empresa Tecnológica</Label>
                <select
                  id="techCompanyId"
                  value={techCompanyId}
                  onChange={(e) => setTechCompanyId(e.target.value)}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.techCompanyId ? "border-destructive" : "border-input"
                  } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Seleccionar empresa tecnológica</option>
                  {techCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.techCompanyId && <p className="text-sm text-destructive">{errors.techCompanyId}</p>}
              </div>
            )}

            {/* Selector de Partner (solo visible si el rol es PartnerUser) */}
            {selectedRoleType === "partner" && (
              <div className="grid gap-3">
                <Label htmlFor="partnerId">Partner</Label>
                <select
                  id="partnerId"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.partnerId ? "border-destructive" : "border-input"
                  } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Seleccionar partner</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
                {errors.partnerId && <p className="text-sm text-destructive">{errors.partnerId}</p>}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(!!checked)} />
              <Label htmlFor="isActive" className="cursor-pointer">
                Usuario activo
              </Label>
            </div>

            {/* Checkbox para requerir confirmación de email */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireConfirmation"
                checked={requireConfirmation}
                onCheckedChange={(checked) => setRequireConfirmation(!!checked)}
              />
              <Label htmlFor="requireConfirmation" className="cursor-pointer">
                Requerir confirmación de email
              </Label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/users")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
