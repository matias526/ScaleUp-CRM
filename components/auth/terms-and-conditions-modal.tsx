"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { TermsService } from "@/lib/services/terms-service"
import { useToast } from "@/components/ui/use-toast"

interface TermsAndConditionsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAccept: () => Promise<void>
}

export function TermsAndConditionsModal({ isOpen, onOpenChange, onAccept }: TermsAndConditionsModalProps) {
  const { t } = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Detectar cuando el usuario ha hecho scroll hasta el final
  const handleScroll = () => {
    if (!scrollAreaRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20

    if (isAtBottom && !hasScrolledToBottom) {
      console.log("Usuario ha llegado al final de los términos")
      setHasScrolledToBottom(true)
    }
  }

  // Reiniciar estados cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setHasAccepted(false)
      setHasScrolledToBottom(false)
    }
  }, [isOpen])

  const handleAcceptTerms = async () => {
    if (!hasScrolledToBottom || !hasAccepted) {
      toast({
        title: "Error",
        description: "Debes leer los términos completos y marcar la casilla de aceptación",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Obtener el usuario actual
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        throw new Error("No hay usuario autenticado")
      }

      const termsService = new TermsService(supabase)
      await termsService.acceptTerms(session.user.id)

      toast({
        title: t("terms.success.title", "Términos aceptados"),
        description: t("terms.success.description", "Has aceptado los términos y condiciones correctamente"),
      })

      // Llamar a la función onAccept proporcionada por el componente padre
      await onAccept()

      // Cerrar el modal
      onOpenChange(false)
    } catch (error) {
      console.error("Error accepting terms:", error)
      toast({
        title: t("terms.error.title", "Error"),
        description: t(
          "terms.error.acceptFailed",
          "No se pudieron aceptar los términos. Por favor, inténtalo de nuevo",
        ),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("terms.title", "Términos y Condiciones")}</DialogTitle>
          <DialogDescription>Por favor, lee los términos y condiciones antes de continuar.</DialogDescription>
        </DialogHeader>

        {!hasScrolledToBottom && (
          <div className="bg-yellow-50 text-yellow-800 p-2 text-sm rounded mb-2 animate-pulse">
            Por favor, desplácese hasta el final para poder aceptar los términos
          </div>
        )}

        <div className="p-4 border rounded">
          <div className="h-[300px] overflow-auto p-2" ref={scrollAreaRef} onScroll={handleScroll}>
            <h3 className="text-lg font-semibold">Términos y Condiciones de Uso</h3>
            <p>Última actualización: 30 de agosto de 2026</p>

            <div className="space-y-4 mt-4">
              <section>
                <h4 className="font-medium">1. Introducción</h4>
                <p>
                  Bienvenido a ScaleUp CRM. Estos Términos y Condiciones rigen el uso de nuestra plataforma y servicios.
                  Al acceder o utilizar ScaleUp CRM, usted acepta estar sujeto a estos Términos.
                </p>
              </section>

              <section>
                <h4 className="font-medium">2. Definiciones</h4>
                <p>&quot;Plataforma&quot; se refiere al software, sitio web y servicios de ScaleUp CRM.</p>
                <p>
                  &quot;Usuario&quot;, &quot;Usted&quot; o &quot;Su&quot; se refiere a la persona o entidad que accede o
                  utiliza la Plataforma.
                </p>
                <p>
                  &quot;Nosotros&quot;, &quot;Nos&quot; o &quot;Nuestro&quot; se refiere a ScaleUp, la empresa
                  propietaria y operadora de la Plataforma.
                </p>
              </section>

              <section>
                <h4 className="font-medium">3. Registro de Cuenta</h4>
                <p>
                  Para utilizar ciertas funciones de la Plataforma, debe registrarse para obtener una cuenta. Usted
                  acepta proporcionar información precisa, actual y completa durante el proceso de registro.
                </p>
                <p>
                  Usted es responsable de mantener la confidencialidad de las credenciales de su cuenta y de todas las
                  actividades que ocurran bajo su cuenta.
                </p>
              </section>

              <section>
                <h4 className="font-medium">4. Uso de la Plataforma</h4>
                <p>
                  Usted acepta utilizar la Plataforma únicamente para fines lícitos y de acuerdo con estos Términos.
                </p>
                <p>Usted acepta no utilizar la Plataforma:</p>
                <ul className="list-disc pl-6">
                  <li>De cualquier manera que viole cualquier ley o regulación aplicable.</li>
                  <li>Para transmitir cualquier material que sea difamatorio, ofensivo o de otra manera objetable.</li>
                  <li>Para intentar interferir con el funcionamiento adecuado de la Plataforma.</li>
                  <li>Para intentar obtener acceso no autorizado a cualquier parte de la Plataforma.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-medium">5. Privacidad de Datos</h4>
                <p>
                  ScaleUp se compromete a proteger la privacidad de los usuarios de la Plataforma. Al utilizar nuestros servicios, usted acepta que recopilemos y procesemos ciertos datos personales necesarios para el funcionamiento del CRM, incluyendo datos de contacto, actividad dentro de la Plataforma y archivos cargados.
                </p>
                <p>
                  La información será utilizada exclusivamente para fines operativos y comerciales relacionados con el uso de la Plataforma, y no será compartida con terceros sin su consentimiento, salvo obligación legal.
                </p>
              </section>

              <section>
                <h4 className="font-medium">6. Propiedad Intelectual</h4>
                <p>
                  La Plataforma y su contenido original, características y funcionalidad son propiedad de ScaleUp y
                  están protegidos por leyes internacionales de derechos de autor, marcas comerciales, patentes,
                  secretos comerciales y otras leyes de propiedad intelectual.
                </p>
              </section>

              <section>
                <h4 className="font-medium">7. Uso de Imagen Comercial y Marcas Registradas</h4>
                <p>
                  Al registrarse y utilizar la Plataforma, Usted otorga a ScaleUp una licencia no exclusiva, gratuita y de ámbito mundial para utilizar el nombre comercial, logotipo e marca(s) de su empresa únicamente con fines de marketing, promoción y difusión en nuestras redes sociales, sitio web y otros canales de comunicación oficiales de ScaleUp.
                </p>
                <p>
                  Si no desea que utilicemos su marca o logotipo en nuestro material promocional, puede notificarlo en cualquier momento enviando un correo electrónico a support@scaleup-global.com, y procederemos a retirar dicha información en un plazo razonable.
                </p>
              </section>

              <section>
                <h4 className="font-medium">8. Terminación</h4>
                <p>
                  Podemos terminar o suspender su cuenta y acceso a la Plataforma inmediatamente, sin previo aviso o
                  responsabilidad, por cualquier motivo, incluyendo, sin limitación, si usted incumple estos Términos.
                </p>
              </section>

              <section>
                <h4 className="font-medium">9. Limitación de Responsabilidad</h4>
                <p>
                  En ningún caso ScaleUp, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán
                  responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo, incluyendo,
                  sin limitación, pérdida de beneficios, datos, uso, buena voluntad u otras pérdidas intangibles,
                  resultantes de su acceso o uso o incapacidad para acceder o usar la Plataforma.
                </p>
              </section>

              <section>
                <h4 className="font-medium">10. Cambios en los Términos</h4>
                <p>
                  Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una
                  revisión es material, proporcionaremos al menos 30 días de aviso antes de que los nuevos términos
                  entren en vigor.
                </p>
              </section>

              <section>
                <h4 className="font-medium">11. Contáctenos</h4>
                <p>Si tiene alguna pregunta sobre estos Términos, por favor contáctenos en support@scaleup-global.com.</p>
              </section>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="terms-checkbox"
            checked={hasAccepted}
            onCheckedChange={(checked) => setHasAccepted(checked === true)}
            disabled={!hasScrolledToBottom}
          />
          <Label htmlFor="terms-checkbox" className={!hasScrolledToBottom ? "text-muted-foreground" : ""}>
            {t("terms.acceptCheckbox", "He leído y acepto los Términos y Condiciones")}
          </Label>
        </div>

        <DialogFooter>
          <Button onClick={handleAcceptTerms} disabled={isLoading || !hasAccepted || !hasScrolledToBottom}>
            {isLoading ? "Procesando..." : t("terms.acceptButton", "Acepto los Términos y Condiciones")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
