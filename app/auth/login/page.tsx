import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image
            src="/images/scaleup-logo-color.png"
            alt="ScaleUp Logo"
            width={220}
            height={60}
            className="h-auto w-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-primary">Login</h1>
          <p className="text-gray-500">Inicia sesión para continuar</p>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[300px]">Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
