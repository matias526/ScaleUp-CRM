import type React from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sección de imagen/branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-8 flex-col justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">CRM ScaleUp</h1>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold text-white">Plataforma integral de oportunidades</h2>
          <p className="text-white/80">
            Un sistema inteligente. Un equipo humano. Un mismo objetivo: transformar América Latina con las tecnologías más innovadoras.
          </p>
        </div>
        <div className="text-sm text-white/60">
          © {new Date().getFullYear()} ScaleUp. Todos los derechos reservados.
        </div>
      </div>

      {/* Sección de formulario */}
      <div className="flex-1 flex flex-col p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="md:hidden">
            <h1 className="text-2xl font-bold">CRM ScaleUp</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center">{children}</div>
        <div className="md:hidden text-center text-sm text-muted-foreground mt-8">
          © {new Date().getFullYear()} ScaleUp. Todos los derechos reservados.
        </div>
      </div>
    </div>
  )
}
