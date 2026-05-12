"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type SpanishCalendarProps = React.ComponentProps<typeof DayPicker>

export function SpanishCalendar({ className, classNames, showOutsideDays = true, ...props }: SpanishCalendarProps) {
  // Definir explícitamente los nombres de los días de la semana en español
  const weekdayLabels = ["lu", "ma", "mi", "ju", "vi", "sá", "do"]

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={es}
      weekStartsOn={1} // Semana comienza el lunes (1)
      formatters={{
        // Sobrescribir el formateador de días de la semana para usar nuestras etiquetas personalizadas
        formatWeekdayName: (date) => {
          const day = date.getDay()
          // Convertir de 0-6 (domingo-sábado) a 0-6 (lunes-domingo)
          const adjustedDay = day === 0 ? 6 : day - 1
          return weekdayLabels[adjustedDay]
        },
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-semibold",
        nav: "space-x-1 flex items-center justify-between w-full",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 p-0 hover:opacity-100 hover:bg-accent",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "grid grid-cols-7 gap-1 mb-2",
        head_cell: "text-muted-foreground text-center text-xs font-semibold w-9 h-9 py-2",
        row: "grid grid-cols-7 gap-1",
        cell: "relative p-0 text-center text-sm [&:has([aria-selected])]:bg-primary/20 rounded-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal cursor-pointer relative z-10 hover:bg-accent/50 transition-colors",
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold",
        day_today: "bg-accent text-accent-foreground font-semibold",
        day_outside: "text-muted-foreground opacity-50 pointer-events-none",
        day_disabled: "text-muted-foreground opacity-50 pointer-events-none",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

// Exportar SpanishCalendar también como Calendar para mantener compatibilidad
export { SpanishCalendar as Calendar }
