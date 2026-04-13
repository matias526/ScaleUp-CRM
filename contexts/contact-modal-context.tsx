"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { type Contact } from "@/lib/services/contact-service"

interface ContactModalContextType {
  isOpen: boolean
  openModal: (initialData?: {
    tech_company_id?: string
    partner_id?: string
    end_customer_id?: string
    first_name?: string
    last_name?: string
    email?: string
  }) => void
  closeModal: () => void
  onSuccess: ((contact: Contact) => void) | undefined
  setOnSuccess: (callback: (contact: Contact) => void | undefined) => void
  initialData?: {
    tech_company_id?: string
    partner_id?: string
    end_customer_id?: string
    first_name?: string
    last_name?: string
    email?: string
  }
}

const ContactModalContext = createContext<ContactModalContextType | undefined>(undefined)

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [onSuccess, setOnSuccess] = useState<((contact: Contact) => void) | undefined>(undefined)
  const [initialData, setInitialData] = useState<
    | {
        tech_company_id?: string
        partner_id?: string
        end_customer_id?: string
        first_name?: string
        last_name?: string
        email?: string
      }
    | undefined
  >(undefined)

  const openModal = (data?: {
    tech_company_id?: string
    partner_id?: string
    end_customer_id?: string
    first_name?: string
    last_name?: string
    email?: string
  }) => {
    setInitialData(data)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setInitialData(undefined)
  }

  return (
    <ContactModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        onSuccess,
        setOnSuccess,
        initialData,
      }}
    >
      {children}
    </ContactModalContext.Provider>
  )
}

export function useContactModal() {
  const context = useContext(ContactModalContext)
  if (!context) {
    throw new Error("useContactModal must be used within ContactModalProvider")
  }
  return context
}
