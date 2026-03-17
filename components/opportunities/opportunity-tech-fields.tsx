"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, ToggleLeft, ListFilter, Tag, Download, Eye, Edit, Save, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { getOpportunityTechFieldsClient } from "@/lib/services/opportunity-tech-field-service-client"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Eliminamos la importación de MultiSelect ya que parece estar causando problemas
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"

interface OpportunityTechFieldsProps {
  opportunityId: string
  techCompanyId: string
  onEmpty?: () => React.ReactNode
  renderHeader?: (hasFields: boolean) => React.ReactNode
  onTechFieldIdsChange?: (name: string, value: any) => void
}

export function OpportunityTechFields({
  opportunityId,
  techCompanyId,
  onEmpty = () => (
    <p className="text-muted-foreground text-center py-4">
      No hay campos técnicos definidos para esta empresa tecnológica.
    </p>
  ),
  renderHeader = (hasFields) => null,
  onTechFieldIdsChange,
}: OpportunityTechFieldsProps) {
  const [fields, setFields] = useState<any[]>([])
  const [values, setValues] = useState<Record<string, any>>({})
  const [techFieldValues, setTechFieldValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasTechFields, setHasTechFields] = useState(false)

  //const supabase = createClientComponentClient()

  // Añadir el estado para controlar qué campo está en modo de edición
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})

  // Cargar campos técnicos y sus valores
  useEffect(() => {
    async function loadTechFieldsAndValues() {
      try {
        setLoading(true)
        setError(null)

        // Si no hay techCompanyId, no podemos cargar los campos
        if (!techCompanyId) {
          setLoading(false)
          return
        }

        // Cargar los campos técnicos para esta empresa tecnológica
        const techFieldsData = await getOpportunityTechFieldsClient(techCompanyId)
        console.log("Campos técnicos cargados:", techFieldsData)

        if (techFieldsData && techFieldsData.length > 0) {
          setFields(techFieldsData)
          setHasTechFields(techFieldsData && techFieldsData.length > 0)

          // Si estamos en modo creación (opportunityId vacío), inicializar valores vacíos
          if (!opportunityId) {
            const initialValues: Record<string, any> = {}
            techFieldsData.forEach((field) => {
              // Inicializar con valores por defecto según el tipo
              switch (field.field_type) {
                case "boolean":
                  initialValues[field.id] = false
                  break
                case "multiselect":
                  initialValues[field.id] = []
                  break
                default:
                  initialValues[field.id] = ""
              }
            })
            setTechFieldValues(initialValues)

            // Notificar al componente padre sobre los IDs de campos técnicos
            if (onTechFieldIdsChange) {
              onTechFieldIdsChange(
                "tech_field_ids",
                techFieldsData.map((field) => field.id),
              )
            }

            setLoading(false)
            return
          }

          // Cargar los valores guardados para esta oportunidad
          const { data: valuesData, error: valuesError } = await supabase
            .from("opportunity_tech_values")
            .select("*")
            .eq("opportunity_id", opportunityId)

          if (valuesError) {
            console.error("Error al cargar valores de campos técnicos:", valuesError)
            setError("No se pudieron cargar los valores de los campos técnicos")
          } else if (valuesData) {
            console.log("Valores de campos técnicos cargados:", valuesData)

            // Crear un objeto con los valores actuales
            const values: Record<string, any> = {}

            valuesData.forEach((valueRecord) => {
              const fieldId = valueRecord.opportunity_tech_field_id
              const field = techFieldsData.find((f) => f.id === fieldId)

              if (field) {
                // Determinar qué columna contiene el valor según el tipo de campo
                let value = null

                switch (field.field_type) {
                  case "text":
                  case "select":
                  case "file":
                    value = valueRecord.value_text
                    break
                  case "number":
                    value = valueRecord.value_numeric
                    break
                  case "boolean":
                    value = valueRecord.value_boolean
                    break
                  case "date":
                    value = valueRecord.value_date
                    break
                  case "multiselect":
                    try {
                      value = valueRecord.value_json ? JSON.parse(valueRecord.value_json) : []
                    } catch (e) {
                      console.error("Error al parsear valor multiselect:", e)
                      value = []
                    }
                    break
                  default:
                    // Intentar obtener el valor de cualquier columna no nula
                    value =
                      valueRecord.value_text ??
                      valueRecord.value_numeric ??
                      valueRecord.value_boolean ??
                      valueRecord.value_date ??
                      valueRecord.value_json ??
                      null
                }

                console.log(`Campo ${fieldId} (${field.field_type}): valor cargado =`, value)
                values[fieldId] = value
              }
            })

            setTechFieldValues(values)
          }
        } else {
          setHasTechFields(false)
        }
      } catch (error) {
        console.error("Error al cargar campos técnicos:", error)
        setError("No se pudieron cargar los campos técnicos")
      } finally {
        setLoading(false)
      }
    }

    loadTechFieldsAndValues()
  }, [opportunityId, techCompanyId, onTechFieldIdsChange])

  // Obtener el icono según el tipo de campo
  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case "text":
        return <FileText className="h-4 w-4" />
      case "number":
        return <span className="font-mono text-xs">#</span>
      case "select":
        return <ListFilter className="h-4 w-4" />
      case "multiselect":
        return <Tag className="h-4 w-4" />
      case "date":
        return <Calendar className="h-4 w-4" />
      case "boolean":
        return <ToggleLeft className="h-4 w-4" />
      case "file":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Extraer el nombre del archivo de la ruta
  const getFileName = (filePath: string) => {
    if (!filePath) return "No hay archivo"

    // Extraer el nombre del archivo después del timestamp
    const parts = filePath.split("/").pop()?.split("_") || []
    if (parts.length > 1) {
      // Eliminar el timestamp y unir el resto
      return parts.slice(1).join("_")
    }

    return filePath.split("/").pop() || "Archivo"
  }

  // Obtener URL pública para un archivo
  const getFileUrl = async (filePath: string) => {
    try {
      console.log("Obteniendo URL para:", filePath)
      const { data, error } = await supabase.storage.from("opportunity_files").createSignedUrl(filePath, 60)

      if (error) {
        console.error("Error al crear URL firmada:", error)
        return null
      }

      console.log("URL firmada obtenida:", data?.signedUrl)
      return data?.signedUrl
    } catch (err) {
      console.error("Error al obtener URL del archivo:", err)
      return null
    }
  }

  // Añadir estas funciones después de la función getFileUrl
  // Función para activar el modo de edición de un campo
  const startEditing = (fieldId: string) => {
    setEditMode((prev) => ({ ...prev, [fieldId]: true }))
  }

  // Función para cancelar la edición de un campo
  const cancelEditing = (fieldId: string) => {
    setEditMode((prev) => ({ ...prev, [fieldId]: false }))
  }

  // Función para guardar el valor de un campo
  const saveFieldValue = async (fieldId: string, value: any, fieldType: string) => {
    try {
      console.log(`Guardando valor para campo ${fieldId}:`, value)

      if (!opportunityId) {
        console.error("No hay ID de oportunidad para guardar el valor")
        toast({
          title: "Error",
          description: "No se pudo guardar el valor del campo",
          variant: "destructive",
        })
        return
      }

      // Verificar si ya existe un registro para este campo
      const { data: existingData, error: checkError } = await supabase
        .from("opportunity_tech_values")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .eq("opportunity_tech_field_id", fieldId)
        .maybeSingle()

      if (checkError) {
        console.error("Error al verificar valor existente:", checkError)
        throw checkError
      }

      // Preparar el objeto con los valores según el tipo de campo
      const valueObject: any = {
        opportunity_id: opportunityId,
        opportunity_tech_field_id: fieldId,
        updated_at: new Date().toISOString(),
      }

      // Asignar el valor a la columna correcta según el tipo de campo
      switch (fieldType) {
        case "text":
        case "select":
        case "file":
          valueObject.value_text = value
          break
        case "number":
          valueObject.value_numeric = value
          break
        case "boolean":
          valueObject.value_boolean = value
          break
        case "date":
          valueObject.value_date = value
          break
        case "multiselect":
          valueObject.value_json = JSON.stringify(value)
          break
      }

      // Si existe, actualizar; si no, insertar
      if (existingData) {
        const { error: updateError } = await supabase
          .from("opportunity_tech_values")
          .update(valueObject)
          .eq("id", existingData.id)

        if (updateError) throw updateError
      } else {
        valueObject.created_at = new Date().toISOString()
        const { error: insertError } = await supabase.from("opportunity_tech_values").insert(valueObject)

        if (insertError) throw insertError
      }

      // Actualizar el estado local
      setTechFieldValues((prev) => ({
        ...prev,
        [fieldId]: value,
      }))

      // Desactivar el modo de edición
      cancelEditing(fieldId)

      toast({
        title: "Campo actualizado",
        description: "El valor del campo ha sido actualizado correctamente",
      })
    } catch (error) {
      console.error("Error al guardar valor del campo:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el valor del campo",
        variant: "destructive",
      })
    }
  }

  // Abrir archivo en nueva pestaña
  const handleViewFile = async (filePath: string) => {
    try {
      const url = await getFileUrl(filePath)
      if (url) {
        window.open(url, "_blank")
      } else {
        throw new Error("No se pudo obtener la URL del archivo")
      }
    } catch (error) {
      console.error("Error al abrir archivo:", error)
      toast({
        title: "Error",
        description: "No se pudo abrir el archivo",
        variant: "destructive",
      })
    }
  }

  // Descargar archivo
  const handleDownloadFile = async (filePath: string) => {
    try {
      const url = await getFileUrl(filePath)
      if (url) {
        // Crear un elemento <a> invisible
        const link = document.createElement("a")
        link.href = url
        link.download = getFileName(filePath) // Esto fuerza la descarga en lugar de abrir
        link.target = "_blank" // Asegura que se abra en una nueva pestaña
        link.rel = "noopener noreferrer" // Buena práctica de seguridad

        // Añadir al DOM, hacer clic y luego eliminar
        document.body.appendChild(link)
        link.click()

        // Pequeño retraso antes de eliminar el enlace
        setTimeout(() => {
          document.body.removeChild(link)
        }, 100)
      } else {
        throw new Error("No se pudo obtener la URL del archivo")
      }
    } catch (error) {
      console.error("Error al descargar archivo:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      })
    }
  }

  // Modificar la función renderFieldValue para incluir la edición
  const renderFieldValue = (field: any) => {
    const value = techFieldValues[field.id]
    const isEditing = editMode[field.id] || false

    // Función para manejar el cambio de valor
    const handleValueChange = (newValue: any) => {
      saveFieldValue(field.id, newValue, field.field_type)
    }

    switch (field.field_type) {
      case "text":
        return isEditing ? (
          <div className="flex items-center space-x-2">
            <Input
              value={value || ""}
              onChange={(e) => setTechFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
              placeholder="Ingrese texto"
              className="w-full"
            />
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={() => handleValueChange(value)} className="h-8 w-8 p-0">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancelEditing(field.id)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center group">
            <p className="text-gray-700 flex-grow">
              {value || <span className="text-gray-400 italic">No especificado</span>}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => startEditing(field.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )

      case "number":
        return isEditing ? (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={value !== null && value !== undefined ? value : ""}
              onChange={(e) =>
                setTechFieldValues((prev) => ({ ...prev, [field.id]: e.target.value ? Number(e.target.value) : null }))
              }
              placeholder="Ingrese número"
              className="w-full"
            />
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={() => handleValueChange(value)} className="h-8 w-8 p-0">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancelEditing(field.id)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center group">
            <p className="text-gray-700 flex-grow">
              {value !== null && value !== undefined ? (
                value
              ) : (
                <span className="text-gray-400 italic">No especificado</span>
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => startEditing(field.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )

      case "select":
        return isEditing ? (
          <div className="flex items-center space-x-2">
            <Select
              value={value || ""}
              onValueChange={(newValue) => {
                setTechFieldValues((prev) => ({ ...prev, [field.id]: newValue }))
                handleValueChange(newValue)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(field.options) &&
                  field.options.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => cancelEditing(field.id)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center group">
            <p className="text-gray-700 flex-grow">
              {value ? (
                Array.isArray(field.options) ? (
                  field.options.find((opt) => opt.value === value)?.label || value
                ) : (
                  value
                )
              ) : (
                <span className="text-gray-400 italic">No seleccionado</span>
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => startEditing(field.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )

      case "multiselect":
        return isEditing ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {Array.isArray(field.options) &&
                field.options.map((option: any) => {
                  const isSelected = Array.isArray(value) && value.includes(option.value)
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        let newValue = Array.isArray(value) ? [...value] : []
                        if (isSelected) {
                          newValue = newValue.filter((v) => v !== option.value)
                        } else {
                          newValue.push(option.value)
                        }
                        setTechFieldValues((prev) => ({ ...prev, [field.id]: newValue }))
                      }}
                    >
                      {option.label}
                    </Badge>
                  )
                })}
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" onClick={() => handleValueChange(value)}>
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancelEditing(field.id)}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center group">
            <div className="flex flex-wrap gap-1 flex-grow">
              {Array.isArray(value) && value.length > 0 ? (
                value.map((val: string, index: number) => {
                  const option = Array.isArray(field.options) ? field.options.find((opt) => opt.value === val) : null
                  return (
                    <Badge key={index} variant="secondary">
                      {option ? option.label : val}
                    </Badge>
                  )
                })
              ) : (
                <span className="text-gray-400 italic">Ninguno seleccionado</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => startEditing(field.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )

      case "date":
        return isEditing ? (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), "PPP", { locale: es }) : <span>Seleccionar fecha...</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const isoDate = date.toISOString()
                      setTechFieldValues((prev) => ({ ...prev, [field.id]: isoDate }))
                      handleValueChange(isoDate)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="ghost" onClick={() => cancelEditing(field.id)}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex items-center group">
            <p className="text-gray-700 flex-grow">
              {value ? (
                format(new Date(value), "PPP", { locale: es })
              ) : (
                <span className="text-gray-400 italic">No especificado</span>
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => startEditing(field.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )

      case "boolean":
        return isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={value === true}
                onCheckedChange={(checked) => {
                  setTechFieldValues((prev) => ({ ...prev, [field.id]: checked }))
                  handleValueChange(checked)
                }}
              />
              <span>{value === true ? "Sí" : "No"}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => cancelEditing(field.id)}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex items-center group">
            <div className="flex items-center flex-grow">
              {value === true ? (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  Sí
                </Badge>
              ) : value === false ? (
                <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-100">
                  No
                </Badge>
              ) : (
                <span className="text-gray-400 italic">No especificado</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => startEditing(field.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )

      case "file":
        // Para archivos, mantener la implementación actual por ahora
        return value ? (
          <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span className="text-sm truncate max-w-[200px]">{getFileName(value)}</span>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={() => handleViewFile(value)} title="Ver archivo" type="button">
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadFile(value)}
                title="Descargar archivo"
                type="button"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 italic">Ningún archivo</span>
        )

      default:
        return isEditing ? (
          <div className="flex items-center space-x-2">
            <Input
              value={value || ""}
              onChange={(e) => setTechFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
              placeholder="Ingrese valor"
              className="w-full"
            />
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={() => handleValueChange(value)} className="h-8 w-8 p-0">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancelEditing(field.id)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center group">
            <p className="text-gray-700 flex-grow">
              {value || <span className="text-gray-400 italic">No especificado</span>}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => startEditing(field.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <>
        {renderHeader(false)}
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        {renderHeader(false)}
        <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>
      </>
    )
  }

  if (fields.length === 0) {
    return onEmpty()
  }

  return (
    <>
      {renderHeader(true)}
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="border rounded-md p-4">
            <div className="border-b pb-4 last:border-0">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 flex items-center justify-center mr-2 text-primary">
                  {getFieldTypeIcon(field.field_type)}
                </div>
                <h4 className="font-medium">
                  {field.field_name}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </h4>
              </div>

              <div className="ml-8">{renderFieldValue(field)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
