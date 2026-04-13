"use client"

import { ContactModalProvider, useContactModal } from "@/contexts/contact-modal-context"
import { ContactFormModal } from "@/components/contacts/contact-form-modal"
import type { ReactNode } from "react"

function ContactModalWrapper({ children }: { children: ReactNode }) {
  const { isOpen, onOpenChange: handleOpenChange, onSuccess, setOnSuccess, initialData } = useContactModal()

  return (
    <>
      {children}
      <ContactFormModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        onSuccess={onSuccess}
        initialData={initialData}
      />
    </>
  )
}

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <ContactModalProvider>
      <ContactModalWrapper>{children}</ContactModalWrapper>
    </ContactModalProvider>
  )
}
