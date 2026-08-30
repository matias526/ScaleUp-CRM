"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"
import { PortugueseTermsContent } from "@/components/auth/terms-and-conditions-portuguese"
import { EnglishTermsContent } from "@/components/auth/terms-and-conditions-english"
import { SpanishTermsContent } from "@/components/auth/terms-and-conditions-spanish"

interface TermsAndConditionsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsAndConditionsModal({ isOpen, onOpenChange }: TermsAndConditionsModalProps) {
  const { t, language } = useTranslations()

  // Contenido de los términos y condiciones en español
  const termsContentEs = (
    <div className="space-y-4 mt-4">
      <section>
        <h3 className="text-lg font-semibold">Términos y Condiciones de Uso</h3>
        <p>Última actualización: 30 de agosto de 2026</p>
      </section>

      <section>
        <h4 className="font-medium">1. Introducción</h4>
        <p>
          Bienvenido a ScaleUp CRM. Estos Términos y Condiciones rigen el uso de nuestra plataforma y servicios. Al
          acceder o utilizar ScaleUp CRM, usted acepta estar sujeto a estos Términos.
        </p>
      </section>

      <section>
        <h4 className="font-medium">2. Definiciones</h4>
        <p>&quot;Plataforma&quot; se refiere al software, sitio web y servicios de ScaleUp CRM.</p>
        <p>
          &quot;Usuario&quot;, &quot;Usted&quot; o &quot;Su&quot; se refiere a la persona o entidad que accede o utiliza
          la Plataforma.
        </p>
        <p>
          &quot;Nosotros&quot;, &quot;Nos&quot; o &quot;Nuestro&quot; se refiere a ScaleUp, la empresa propietaria y
          operadora de la Plataforma.
        </p>
      </section>

      <section>
        <h4 className="font-medium">3. Registro de Cuenta</h4>
        <p>
          Para utilizar ciertas funciones de la Plataforma, debe registrarse para obtener una cuenta. Usted acepta
          proporcionar información precisa, actual y completa durante el proceso de registro.
        </p>
        <p>
          Usted es responsable de mantener la confidencialidad de las credenciales de su cuenta y de todas las
          actividades que ocurran bajo su cuenta.
        </p>
      </section>

      <section>
        <h4 className="font-medium">4. Uso de la Plataforma</h4>
        <p>Usted acepta utilizar la Plataforma únicamente para fines lícitos y de acuerdo con estos Términos.</p>
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
          ScaleUp se compromete a proteger la privacidad de los usuarios de la Plataforma. Al utilizar nuestros
          servicios, usted acepta que recopilemos y procesemos ciertos datos personales necesarios para el
          funcionamiento del CRM, incluyendo datos de contacto, actividad dentro de la Plataforma y archivos cargados.
        </p>
        <p>
          La información será utilizada exclusivamente para fines operativos y comerciales relacionados con el uso de la
          Plataforma, y no será compartida con terceros sin su consentimiento, salvo obligación legal.
        </p>
      </section>

      <section>
        <h4 className="font-medium">6. Propiedad Intelectual</h4>
        <p>
          La Plataforma y su contenido original, características y funcionalidad son propiedad de ScaleUp y están
          protegidos por leyes internacionales de derechos de autor, marcas comerciales, patentes, secretos comerciales
          y otras leyes de propiedad intelectual.
        </p>
      </section>

      <section>
        <h4 className="font-medium">7. Terminación</h4>
        <p>
          Podemos terminar o suspender su cuenta y acceso a la Plataforma inmediatamente, sin previo aviso o
          responsabilidad, por cualquier motivo, incluyendo, sin limitación, si usted incumple estos Términos.
        </p>
      </section>

      <section>
        <h4 className="font-medium">8. Limitación de Responsabilidad</h4>
        <p>
          En ningún caso ScaleUp, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán
          responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo, incluyendo, sin
          limitación, pérdida de beneficios, datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de su
          acceso o uso o incapacidad para acceder o usar la Plataforma.
        </p>
      </section>

      <section>
        <h4 className="font-medium">9. Cambios en los Términos</h4>
        <p>
          Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es
          material, proporcionaremos al menos 30 días de aviso antes de que los nuevos términos entren en vigor.
        </p>
      </section>

      <section>
        <h4 className="font-medium">10. Contáctenos</h4>
        <p>Si tiene alguna pregunta sobre estos Términos, por favor contáctenos en support@scaleup-global.com.</p>
      </section>
    </div>
  )

  // Contenido de los términos y condiciones en inglés
  const termsContentEn = (
    <div className="space-y-4 mt-4">
      <section>
        <h3 className="text-lg font-semibold">Terms and Conditions of Use</h3>
        <p>Last updated: August 30, 2026</p>
      </section>

      <section>
        <h4 className="font-medium">1. Introduction</h4>
        <p>
          Welcome to ScaleUp CRM. These Terms and Conditions govern the use of our platform and services. By accessing
          or using ScaleUp CRM, you agree to be bound by these Terms.
        </p>
      </section>

      <section>
        <h4 className="font-medium">2. Definitions</h4>
        <p>&quot;Platform&quot; refers to the software, website, and services of ScaleUp CRM.</p>
        <p>
          &quot;User,&quot; &quot;You,&quot; or &quot;Your&quot; refers to the person or entity accessing or using the
          Platform.
        </p>
        <p>
          &quot;We,&quot; &quot;Us,&quot; or &quot;Our&quot; refers to ScaleUp, the company that owns and operates the
          Platform.
        </p>
      </section>

      <section>
        <h4 className="font-medium">3. Account Registration</h4>
        <p>
          To use certain features of the Platform, you must register for an account. You agree to provide accurate,
          current, and complete information during the registration process.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities
          that occur under your account.
        </p>
      </section>

      <section>
        <h4 className="font-medium">4. Use of the Platform</h4>
        <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms.</p>
        <p>You agree not to use the Platform:</p>
        <ul className="list-disc pl-6">
          <li>In any way that violates any applicable law or regulation.</li>
          <li>To transmit any material that is defamatory, offensive, or otherwise objectionable.</li>
          <li>To attempt to interfere with the proper functioning of the Platform.</li>
          <li>To attempt to gain unauthorized access to any part of the Platform.</li>
        </ul>
      </section>

      <section>
        <h4 className="font-medium">5. Data Privacy</h4>
        <p>
          ScaleUp is committed to protecting the privacy of Platform users. By using our services, you agree that we may
          collect and process certain personal data necessary for the operation of the CRM, including contact
          information, activity within the Platform, and uploaded files.
        </p>
        <p>
          The information will be used exclusively for operational and commercial purposes related to the use of the
          Platform, and will not be shared with third parties without your consent, except as required by law.
        </p>
      </section>

      <section>
        <h4 className="font-medium">6. Intellectual Property</h4>
        <p>
          The Platform and its original content, features, and functionality are owned by ScaleUp and are protected by
          international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </p>
      </section>

      <section>
        <h4 className="font-medium">7. Termination</h4>
        <p>
          We may terminate or suspend your account and access to the Platform immediately, without prior notice or
          liability, for any reason, including, without limitation, if you breach these Terms.
        </p>
      </section>

      <section>
        <h4 className="font-medium">8. Limitation of Liability</h4>
        <p>
          In no event shall ScaleUp, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable
          for any indirect, incidental, special, consequential, or punitive damages, including, without limitation, loss
          of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or
          inability to access or use the Platform.
        </p>
      </section>

      <section>
        <h4 className="font-medium">9. Changes to Terms</h4>
        <p>
          We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide
          at least 30 days' notice before the new terms take effect.
        </p>
      </section>

      <section>
        <h4 className="font-medium">10. Contact Us</h4>
        <p>If you have any questions about these Terms, please contact us at support@scaleup-global.com.</p>
      </section>
    </div>
  )

  // Contenido de los términos y condiciones en portugués
  const termsContentPt = (
    <div className="space-y-4 mt-4">
      <section>
        <h3 className="text-lg font-semibold">Termos e Condições de Uso</h3>
        <p>Última atualização: 30 de agosto de 2026</p>
      </section>

      <section>
        <h4 className="font-medium">1. Introdução</h4>
        <p>
          Bem-vindo ao ScaleUp CRM. Estes Termos e Condições regem o uso de nossa plataforma e serviços. Ao acessar ou
          utilizar o ScaleUp CRM, você concorda em estar sujeito a estes Termos.
        </p>
      </section>

      <section>
        <h4 className="font-medium">2. Definições</h4>
        <p>&quot;Plataforma&quot; refere-se ao software, site e serviços do ScaleUp CRM.</p>
        <p>
          &quot;Usuário&quot;, &quot;Você&quot; ou &quot;Seu&quot; refere-se à pessoa ou entidade que acessa ou utiliza
          a Plataforma.
        </p>
        <p>
          &quot;Nós&quot;, &quot;Nos&quot; ou &quot;Nosso&quot; refere-se à ScaleUp, a empresa proprietária e operadora
          da Plataforma.
        </p>
      </section>

      <section>
        <h4 className="font-medium">3. Registro de Conta</h4>
        <p>
          Para utilizar certas funções da Plataforma, você deve se registrar para obter uma conta. Você concorda em
          fornecer informações precisas, atuais e completas durante o processo de registro.
        </p>
        <p>
          Você é responsável por manter a confidencialidade das credenciais de sua conta e por todas as atividades que
          ocorram sob sua conta.
        </p>
      </section>

      <section>
        <h4 className="font-medium">4. Uso da Plataforma</h4>
        <p>Você concorda em utilizar a Plataforma apenas para fins lícitos e de acordo com estes Termos.</p>
        <p>Você concorda em não utilizar a Plataforma:</p>
        <ul className="list-disc pl-6">
          <li>De qualquer maneira que viole qualquer lei ou regulamento aplicável.</li>
          <li>Para transmitir qualquer material que seja difamatório, ofensivo ou de outra forma objetável.</li>
          <li>Para tentar interferir com o funcionamento adequado da Plataforma.</li>
          <li>Para tentar obter acesso não autorizado a qualquer parte da Plataforma.</li>
        </ul>
      </section>

      <section>
        <h4 className="font-medium">5. Privacidade de Dados</h4>
        <p>
          A ScaleUp está comprometida em proteger a privacidade dos usuários da Plataforma. Ao utilizar nossos serviços,
          você concorda que coletemos e processemos certos dados pessoais necessários para o funcionamento do CRM,
          incluindo dados de contato, atividade dentro da Plataforma e arquivos carregados.
        </p>
        <p>
          As informações serão utilizadas exclusivamente para fins operacionais e comerciais relacionados ao uso da
          Plataforma, e não serão compartilhadas com terceiros sem o seu consentimento, exceto por obrigação legal.
        </p>
      </section>

      <section>
        <h4 className="font-medium">6. Propriedade Intelectual</h4>
        <p>
          A Plataforma e seu conteúdo original, características e funcionalidade são propriedade da ScaleUp e estão
          protegidos por leis internacionais de direitos autorais, marcas comerciais, patentes, segredos comerciais e
          outras leis de propriedade intelectual.
        </p>
      </section>

      <section>
        <h4 className="font-medium">7. Rescisão</h4>
        <p>
          Podemos encerrar ou suspender sua conta e acesso à Plataforma imediatamente, sem aviso prévio ou
          responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar estes Termos.
        </p>
      </section>

      <section>
        <h4 className="font-medium">8. Limitação de Responsabilidade</h4>
        <p>
          Em nenhum caso a ScaleUp, nem seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados,
          serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequentes ou punitivos,
          incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes
          do seu acesso ou uso ou incapacidade de acessar ou usar a Plataforma.
        </p>
      </section>

      <section>
        <h4 className="font-medium">9. Alterações nos Termos</h4>
        <p>
          Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for
          material, forneceremos pelo menos 30 dias de aviso antes que os novos termos entrem em vigor.
        </p>
      </section>

      <section>
        <h4 className="font-medium">10. Contate-nos</h4>
        <p>Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco em support@scaleup-global.com.</p>
      </section>
    </div>
  )

  // Seleccionar el contenido según el idioma
  const getTermsContent = () => {
    const locale = String(language || "es").toLowerCase().split("-")[0]
    switch (locale) {
      case "en":
        return <EnglishTermsContent />
      case "pt":
        return <PortugueseTermsContent />
      case "es":
      default:
        return <SpanishTermsContent />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("terms.title", "Términos y Condiciones")} <span className="text-sm font-normal text-muted-foreground">(v1.2)</span></DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">{getTermsContent()}</div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t("common.close", "Cerrar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
