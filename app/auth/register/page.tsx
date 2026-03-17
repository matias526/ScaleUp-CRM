import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[300px]">Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
