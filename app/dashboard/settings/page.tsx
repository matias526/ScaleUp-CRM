import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Settings, Languages, Database, FileText, Clock, Mail, FileSpreadsheet, HardDrive, Shield, Zap } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Traducciones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Languages className="h-5 w-5" />
              <span>Traducciones</span>
            </CardTitle>
            <CardDescription>Gestionar traducciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/translations/admin">Administrar Traducciones</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Campos Personalizados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Campos Personalizados</span>
            </CardTitle>
            <CardDescription>Configurar campos personalizados para oportunidades</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/custom-fields">Administrar Campos</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Configuración de Supabase */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Configuración de Supabase</span>
            </CardTitle>
            <CardDescription>Configurar claves de API de Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/supabase-setup">Configurar Supabase</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tareas Programadas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Tareas Programadas</span>
            </CardTitle>
            <CardDescription>Configurar tareas programadas del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/cron-jobs">Administrar Tareas</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Emails Diarios */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Emails Diarios</span>
            </CardTitle>
            <CardDescription>Configurar envío de emails diarios</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/daily-emails">Configurar Emails</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Reportes Semanales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Reportes Semanales</span>
            </CardTitle>
            <CardDescription>Configurar reportes semanales para tech companies</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/weekly-reports">Configurar Reportes</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Almacenamiento */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Almacenamiento</span>
            </CardTitle>
            <CardDescription>Administrar almacenamiento de archivos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/storage-admin">Administrar Storage</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Seguridad de Archivos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Seguridad de Archivos</span>
            </CardTitle>
            <CardDescription>Configurar políticas de seguridad para archivos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/file-security">Configurar Seguridad</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pulse Templates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Pulse Templates</span>
            </CardTitle>
            <CardDescription>Gestionar templates reutilizables para Pulse</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/settings/pulse-templates">Administrar Templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
