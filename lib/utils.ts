import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A"

  const dateObj = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj)
}

export function getLocale(): string {
  // Verificar si estamos en el navegador
  if (typeof window !== "undefined") {
    // Intentar obtener el idioma de localStorage primero (si la app lo guarda ahí)
    const savedLocale = localStorage.getItem("locale")
    if (savedLocale) {
      return savedLocale
    }

    // Si no hay idioma guardado, usar el idioma del navegador
    const browserLocale = navigator.language.split("-")[0] // 'es-ES' -> 'es'

    // Verificar si el idioma está soportado, de lo contrario usar español como predeterminado
    const supportedLocales = ["es", "en", "pt"]
    return supportedLocales.includes(browserLocale) ? browserLocale : "es"
  }

  // En el servidor, devolver español como predeterminado
  return "es"
}
