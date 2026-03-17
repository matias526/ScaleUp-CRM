import { NextResponse } from "next/server"

// Almacén simple en memoria para los logs (en un entorno de producción usarías una base de datos)
let debugLogs: any[] = []

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Añadir timestamp
    const logEntry = {
      ...data,
      timestamp: new Date().toISOString(),
    }

    // Guardar el log
    debugLogs.push(logEntry)

    // Limitar el tamaño del array para evitar problemas de memoria
    if (debugLogs.length > 100) {
      debugLogs = debugLogs.slice(-100)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar el log" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ logs: debugLogs })
}
