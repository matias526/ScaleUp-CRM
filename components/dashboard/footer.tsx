"use client"

import { useTranslations } from "@/hooks/use-translations"
import { useEffect, useState } from "react"
import { TermsAndConditionsModal } from "@/components/terms-and-conditions-modal"
import { HelpFormModal } from "@/components/help-form-modal"

export function Footer() {
  const { t, isLoaded, language, reloadTranslations } = useTranslations()
  const currentYear = new Date().getFullYear()
  const [hasAttemptedReload, setHasAttemptedReload] = useState(false)
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

  // Valores por defecto para cada idioma
  const defaultTexts = {
    en: {
      rights: "All rights reserved",
      terms: "Terms and Conditions",
      help: "Help",
    },
    es: {
      rights: "Todos los derechos reservados",
      terms: "Términos y condiciones",
      help: "Ayuda",
    },
  }

  // Función para obtener el texto por defecto según el idioma
  const getDefaultText = (key: keyof typeof defaultTexts.en) => {
    return defaultTexts[language as keyof typeof defaultTexts]?.[key] || defaultTexts.es[key]
  }

  // Función segura para obtener traducciones
  const safeT = (key: string, defaultKey: keyof typeof defaultTexts.en) => {
    const translation = t(key)
    if (translation === key) {
      return getDefaultText(defaultKey)
    }
    return translation
  }

  // Intentar recargar las traducciones si no se encuentran
  useEffect(() => {
    if (isLoaded && !hasAttemptedReload) {
      const footerKeys = ["footer.rights", "footer.terms", "footer.help"]
      const missingTranslations = footerKeys.some((key) => t(key) === key)

      if (missingTranslations) {
        console.log("Faltan traducciones del footer, intentando recargar...")
        reloadTranslations()
        setHasAttemptedReload(true)
      }
    }
  }, [isLoaded, hasAttemptedReload, t, reloadTranslations])

  // Log para depuración
  useEffect(() => {
    if (isLoaded) {
      console.log("Footer - Estado de traducciones:", {
        isLoaded,
        language,
        footerRights: t("footer.rights"),
        footerTerms: t("footer.terms"),
        footerHelp: t("footer.help"),
      })
    }
  }, [isLoaded, language, t])

  return (
    <>
      <footer className="bg-gradient-to-r from-primary to-primary-light py-4 px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-white/80">
          <div>
            © {currentYear} <span className="font-medium text-white font-bold">ScaleUp</span>.{" "}
            {safeT("footer.rights", "rights")}
          </div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-white transition-colors text-left">
              {safeT("footer.terms", "terms")}
            </button>
            <button onClick={() => setIsHelpModalOpen(true)} className="hover:text-white transition-colors text-left">
              {safeT("footer.help", "help")}
            </button>
          </div>
        </div>
      </footer>

      <TermsAndConditionsModal isOpen={isTermsModalOpen} onOpenChange={setIsTermsModalOpen} />
      <HelpFormModal isOpen={isHelpModalOpen} onOpenChange={setIsHelpModalOpen} />
    </>
  )
}
