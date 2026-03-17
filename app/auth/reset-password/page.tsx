import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[300px]">Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
