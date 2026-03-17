import { Suspense } from "react"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[300px]">Cargando...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
