// Clase para manejar logs de depuración
export class DebugLogger {
  static log(component: string, data: any) {
    try {
      console.log(`[${component}]`, data)

      // Enviar logs al endpoint de depuración si estamos en el cliente
      if (typeof window !== "undefined") {
        fetch("/api/debug/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            component,
            data,
            type: "info",
            timestamp: new Date().toISOString(),
          }),
        }).catch((error) => {
          // Silenciar errores para evitar problemas en producción
          console.error("Error al enviar log de depuración:", error)
        })
      }
    } catch (error) {
      // Silenciar errores para evitar problemas en producción
      console.error("Error en DebugLogger:", error)
    }
  }

  static error(component: string, error: any) {
    try {
      console.error(`[${component}]`, error)

      // Enviar logs al endpoint de depuración si estamos en el cliente
      if (typeof window !== "undefined") {
        fetch("/api/debug/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            component,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            type: "error",
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => {
          // Silenciar errores para evitar problemas en producción
          console.error("Error al enviar log de depuración:", err)
        })
      }
    } catch (err) {
      // Silenciar errores para evitar problemas en producción
      console.error("Error en DebugLogger:", err)
    }
  }
}

// Función para enviar logs al endpoint de depuración (mantener por compatibilidad)
export async function logDebug(message: string, data?: any, type: "info" | "error" = "info") {
  try {
    await fetch("/api/debug/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        data,
        type,
      }),
    })
  } catch (error) {
    // Silenciar errores para evitar problemas en producción
    console.error("Error al enviar log de depuración:", error)
  }
}
