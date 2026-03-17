"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "@/hooks/use-translations"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

interface HelpFormModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpFormModal({ isOpen, onOpenChange }: HelpFormModalProps) {
  const { t, isLoaded, language } = useTranslations()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    comment: "",
  })

  // Valores por defecto para cada idioma
  const defaultTexts = {
    en: {
      title: "Help Form",
      subject: "Subject",
      subjectPlaceholder: "Enter the subject of your inquiry",
      comment: "Comment",
      commentPlaceholder: "Describe your inquiry or issue",
      send: "Send",
      sending: "Sending...",
      success: "Request Sent",
      successMessage: "Your help request has been successfully sent. We will contact you as soon as possible.",
      error: "Error",
      errorMessage: "An error occurred while sending your request. Please try again later.",
      fieldsRequired: "All fields are required",
    },
    es: {
      title: "Formulario de Ayuda",
      subject: "Tema",
      subjectPlaceholder: "Ingrese el tema de su consulta",
      comment: "Comentario",
      commentPlaceholder: "Describa su consulta o problema",
      send: "Enviar",
      sending: "Enviando...",
      success: "Solicitud enviada",
      successMessage:
        "Su solicitud de ayuda ha sido enviada correctamente. Nos pondremos en contacto con usted lo antes posible.",
      error: "Error",
      errorMessage: "Ha ocurrido un error al enviar su solicitud. Por favor, inténtelo de nuevo más tarde.",
      fieldsRequired: "Todos los campos son obligatorios",
    },
  }

  // Función para obtener el texto por defecto según el idioma
  const getDefaultText = (key: keyof typeof defaultTexts.en) => {
    return defaultTexts[language as keyof typeof defaultTexts]?.[key] || defaultTexts.es[key]
  }

  // Función segura para obtener traducciones
  const safeT = (key: string, defaultKey: keyof typeof defaultTexts.en) => {
    if (!isLoaded) {
      return getDefaultText(defaultKey)
    }
    const translation = t(key)
    if (translation === key) {
      return getDefaultText(defaultKey)
    }
    return translation
  }

  // Log para depuración
  useEffect(() => {
    if (isLoaded) {
      console.log("HelpFormModal - Estado de traducciones:", {
        isLoaded,
        language,
        title: t("help.form.title"),
        subject: t("help.form.subject"),
        subjectPlaceholder: t("help.form.subjectPlaceholder"),
      })
    }
  }, [isLoaded, language, t])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject.trim() || !formData.comment.trim()) {
      toast({
        title: safeT("help.form.error", "error"),
        description: safeT("help.form.fieldsRequired", "fieldsRequired"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/send-help-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: formData.subject,
          comment: formData.comment,
          userEmail: user?.email || "Usuario no identificado",
          userName: user?.user_metadata?.full_name || user?.email || "Usuario no identificado",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: safeT("help.form.success", "success"),
          description: safeT("help.form.successMessage", "successMessage"),
        })
        setFormData({ subject: "", comment: "" })
        onOpenChange(false)
      } else {
        throw new Error(data.message || "Error al enviar el formulario")
      }
    } catch (error) {
      console.error("Error al enviar el formulario de ayuda:", error)
      toast({
        title: safeT("help.form.error", "error"),
        description: safeT("help.form.errorMessage", "errorMessage"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{safeT("help.form.title", "title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{safeT("help.form.subject", "subject")}</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder={safeT("help.form.subjectPlaceholder", "subjectPlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">{safeT("help.form.comment", "comment")}</Label>
            <Textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder={safeT("help.form.commentPlaceholder", "commentPlaceholder")}
              rows={5}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? safeT("help.form.sending", "sending") : safeT("help.form.send", "send")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
