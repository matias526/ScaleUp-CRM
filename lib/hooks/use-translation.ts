// Archivo de redirección para compatibilidad
// Exporta el hook correcto desde la ubicación correcta
export { useTranslations as useTranslation } from "@/hooks/use-translations"

// Agregamos un console.log para detectar si se está usando este archivo
console.log("⚠️ ATENCIÓN: Se está usando el archivo de redirección lib/hooks/use-translation.ts")
