"use client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Importar CalendarComponent igual que en la creación de oportunidades
// Asumiendo que CalendarComponent se importa de la siguiente manera:
import { Calendar as CalendarComponent } from "@/components/ui/spanish-calendar"

interface DatePickerProps {
  date: Date | null | undefined
  setDate: (date: Date | null) => void
  className?: string
  placeholder?: string
}

export function DatePicker({ date, setDate, className, placeholder = "Pick a date" }: DatePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* Usar CalendarComponent exactamente como en la creación de oportunidades */}
          <CalendarComponent mode="single" selected={date || undefined} onSelect={setDate} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  )
}
