"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"
import { AtSign, Users, UserCheck, Plus, X, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type EmailRecipientsSelectorProps = {
  partnerUsers: any[]
  bddUsers: any[]
  onRecipientsChange: (recipients: string[]) => void
}

export default function EmailRecipientsSelector({
  partnerUsers = [],
  bddUsers = [],
  onRecipientsChange,
}: EmailRecipientsSelectorProps) {
  const { t } = useTranslations()
  const [selectedPartnerUsers, setSelectedPartnerUsers] = useState<string[]>([])
  const [selectedBDDUsers, setSelectedBDDUsers] = useState<string[]>([])
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [selectAllPartners, setSelectAllPartners] = useState(false)
  const [selectAllBDDs, setSelectAllBDDs] = useState(false)

  // Actualizar los destinatarios cuando cambian las selecciones
  useEffect(() => {
    const allSelectedEmails = [...selectedPartnerUsers, ...selectedBDDUsers, ...additionalEmails]
    onRecipientsChange(allSelectedEmails)
  }, [selectedPartnerUsers, selectedBDDUsers, additionalEmails, onRecipientsChange])

  // Manejar la selección de todos los usuarios de partner
  const handleSelectAllPartners = (checked: boolean) => {
    setSelectAllPartners(checked)
    if (checked) {
      const allPartnerEmails = partnerUsers.map((user) => user.email).filter(Boolean)
      setSelectedPartnerUsers(allPartnerEmails)
    } else {
      setSelectedPartnerUsers([])
    }
  }

  // Manejar la selección de todos los BDDs
  const handleSelectAllBDDs = (checked: boolean) => {
    setSelectAllBDDs(checked)
    if (checked) {
      const allBDDEmails = bddUsers.map((user) => user.email).filter(Boolean)
      setSelectedBDDUsers(allBDDEmails)
    } else {
      setSelectedBDDUsers([])
    }
  }

  // Manejar la selección de un usuario de partner
  const handlePartnerUserChange = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedPartnerUsers((prev) => [...prev, email])
    } else {
      setSelectedPartnerUsers((prev) => prev.filter((e) => e !== email))
    }
  }

  // Manejar la selección de un BDD
  const handleBDDUserChange = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedBDDUsers((prev) => [...prev, email])
    } else {
      setSelectedBDDUsers((prev) => prev.filter((e) => e !== email))
    }
  }

  // Verificar si todos los usuarios de partner están seleccionados
  useEffect(() => {
    const allPartnerEmails = partnerUsers.map((user) => user.email).filter(Boolean)
    const allSelected =
      allPartnerEmails.length > 0 && allPartnerEmails.every((email) => selectedPartnerUsers.includes(email))
    setSelectAllPartners(allSelected)
  }, [selectedPartnerUsers, partnerUsers])

  // Verificar si todos los BDDs están seleccionados
  useEffect(() => {
    const allBDDEmails = bddUsers.map((user) => user.email).filter(Boolean)
    const allSelected = allBDDEmails.length > 0 && allBDDEmails.every((email) => selectedBDDUsers.includes(email))
    setSelectAllBDDs(allSelected)
  }, [selectedBDDUsers, bddUsers])

  // Validar y añadir un nuevo email
  const handleAddEmail = () => {
    if (!newEmail.trim()) return

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setEmailError(t("follow_up_meeting.invalid_email", "Formato de email inválido"))
      return
    }

    // Verificar si el email ya existe en cualquiera de las listas
    if (
      additionalEmails.includes(newEmail) ||
      selectedPartnerUsers.includes(newEmail) ||
      selectedBDDUsers.includes(newEmail)
    ) {
      setEmailError(t("follow_up_meeting.email_already_added", "Este email ya ha sido añadido"))
      return
    }

    // Añadir el nuevo email
    setAdditionalEmails((prev) => [...prev, newEmail])
    setNewEmail("")
    setEmailError(null)
  }

  // Eliminar un email adicional
  const handleRemoveEmail = (email: string) => {
    setAdditionalEmails((prev) => prev.filter((e) => e !== email))
  }

  // Formatear el nombre del usuario
  const formatUserName = (user: any) => {
    const firstName = user.first_name || user.firstName || ""
    const lastName = user.last_name || user.lastName || ""

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }

    return user.email || "Sin nombre"
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AtSign className="h-5 w-5 text-indigo-500" />
          {t("follow_up_meeting.email_recipients", "Destinatarios del Resumen")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Usuarios del Partner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium text-gray-700">
                  {t("follow_up_meeting.partner_users", "Usuarios del Partner")}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-partners"
                  checked={selectAllPartners}
                  onCheckedChange={(checked) => handleSelectAllPartners(checked === true)}
                />
                <Label htmlFor="select-all-partners" className="text-sm cursor-pointer">
                  {t("follow_up_meeting.select_all", "Seleccionar todos")}
                </Label>
              </div>
            </div>

            {partnerUsers.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {partnerUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                    <Checkbox
                      id={`partner-user-${user.id}`}
                      checked={selectedPartnerUsers.includes(user.email)}
                      onCheckedChange={(checked) => handlePartnerUserChange(user.email, checked === true)}
                    />
                    <Label htmlFor={`partner-user-${user.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">{formatUserName(user)}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 italic">
                {t("follow_up_meeting.no_partner_users", "No hay usuarios del partner disponibles")}
              </div>
            )}
          </div>

          {/* Usuarios BDD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                <h3 className="font-medium text-gray-700">
                  {t("follow_up_meeting.bdd_users", "Business Development Directors")}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-bdds"
                  checked={selectAllBDDs}
                  onCheckedChange={(checked) => handleSelectAllBDDs(checked === true)}
                />
                <Label htmlFor="select-all-bdds" className="text-sm cursor-pointer">
                  {t("follow_up_meeting.select_all", "Seleccionar todos")}
                </Label>
              </div>
            </div>

            {bddUsers.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {bddUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md">
                    <Checkbox
                      id={`bdd-user-${user.id}`}
                      checked={selectedBDDUsers.includes(user.email)}
                      onCheckedChange={(checked) => handleBDDUserChange(user.email, checked === true)}
                    />
                    <Label htmlFor={`bdd-user-${user.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">{formatUserName(user)}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 italic">
                {t("follow_up_meeting.no_bdd_users", "No hay BDDs disponibles")}
              </div>
            )}
          </div>
        </div>

        {/* Sección para añadir emails adicionales */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-green-500" />
            <h3 className="font-medium text-gray-700">
              {t("follow_up_meeting.additional_emails", "Emails adicionales")}
            </h3>
          </div>

          <div className="flex gap-2 mb-2">
            <div className="flex-grow relative">
              <Input
                placeholder={t("follow_up_meeting.add_email", "Añadir email adicional")}
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  setEmailError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddEmail()
                  }
                }}
                className={emailError ? "border-red-300 pr-10" : ""}
              />
              {emailError && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                  <span className="sr-only">Error</span>
                  <X className="h-4 w-4" />
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={handleAddEmail}
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {emailError && <p className="text-xs text-red-500 mt-1 mb-2">{emailError}</p>}

          {/* Lista de emails adicionales */}
          {additionalEmails.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {additionalEmails.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 flex items-center gap-1 bg-gray-100 hover:bg-gray-200"
                >
                  <Mail className="h-3 w-3 text-gray-500 mr-1" />
                  <span className="text-sm text-black">{email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    className="h-5 w-5 p-0 rounded-full hover:bg-gray-300"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">{t("follow_up_meeting.remove_email", "Eliminar email")}</span>
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t text-sm text-gray-500">
          {t("follow_up_meeting.recipients_count", "Destinatarios seleccionados")}:
          <span className="font-medium text-indigo-600 ml-1">
            {selectedPartnerUsers.length + selectedBDDUsers.length + additionalEmails.length}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
