// Obtener los datos reales de pipeline_stages
const response = await fetch(
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pipeline_stages_rows-HFlqZDdIBjSkU2ZHkQ9gQARtUkowOG.csv",
)
const csvText = await response.text()

console.log("=== CONTENIDO DEL CSV ===")
console.log(csvText)

// Parsear CSV manualmente
const lines = csvText.trim().split("\n")
const headers = lines[0].split(",")
const rows = lines.slice(1).map((line) => {
  const values = line.split(",")
  const row = {}
  headers.forEach((header, index) => {
    row[header] = values[index]
  })
  return row
})

console.log("\n=== DATOS PARSEADOS ===")
console.log("Headers:", headers)
console.log("Total rows:", rows.length)

console.log("\n=== CÓDIGOS DE PIPELINE STAGES ===")
rows.forEach((row, index) => {
  console.log(`${index + 1}. ID: ${row.id}, Code: "${row.code}", Display Order: ${row.display_order}`)
})

// Generar mapeo para el código
console.log("\n=== MAPEO PARA CÓDIGO ===")
const stageMapping = {}
rows.forEach((row) => {
  const code = row.code
  // Generar nombre en español basado en el código
  let spanishName = code

  // Mapeo manual basado en códigos comunes
  const commonMappings = {
    Lead: "Lead",
    Qualified: "Calificado",
    Proposal: "Propuesta",
    Negotiation: "Negociación",
    Won: "Ganado",
    Lost: "Perdido",
    "On Hold": "En Espera",
    "Follow Up": "Seguimiento",
    Discovery: "Descubrimiento",
    Demo: "Demostración",
    Contract: "Contrato",
    "Closed Won": "Cerrado Ganado",
    "Closed Lost": "Cerrado Perdido",
  }

  spanishName = commonMappings[code] || code
  stageMapping[code.toLowerCase().replace(/\s+/g, "_")] = spanishName
})

console.log("const stageNames = {")
Object.entries(stageMapping).forEach(([key, value]) => {
  console.log(`  "${key}": "${value}",`)
})
console.log("};")
