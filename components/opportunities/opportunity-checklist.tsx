"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarDays, Check, ChevronDown, ChevronRight, ClipboardCheck, Loader2, MessageSquare, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

type ChecklistItem = {
  id: string
  parent_id: string | null
  title: Record<string, string> | null
  description: Record<string, string> | null
  weight: number
  order_index: number
  is_completed: boolean
  user_selected_date: string | null
  completed_at: string | null
  completed_by: string | null
  comment: string | null
}

const language = () => {
  const value = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "es"
  return ["es", "en", "pt"].includes(value) ? value : "es"
}

export function OpportunityChecklist({ opportunityId, canEdit = true }: { opportunityId: string; canEdit?: boolean }) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ChecklistItem | null>(null)
  const [comment, setComment] = useState("")
  const [date, setDate] = useState("")
  const [saving, setSaving] = useState(false)
  const lang = language()

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("opportunity_checklist_items" as any).select("*").eq("opportunity_id", opportunityId).order("order_index", { ascending: true })
    if (error) toast({ title: "No se pudo cargar el checklist", description: error.message, variant: "destructive" })
    setItems((data as unknown as ChecklistItem[]) || [])
    setLoading(false)
  }, [opportunityId])

  useEffect(() => { void load() }, [load])

  const roots = useMemo(() => items.filter((item) => !item.parent_id), [items])
  const children = (id: string) => items.filter((item) => item.parent_id === id)
  const calculateProgress = useCallback((currentItems: ChecklistItem[]) => {
    const childrenOf = (id: string) => currentItems.filter((item) => item.parent_id === id)
    const calculateNode = (item: ChecklistItem): number => {
      const nested = childrenOf(item.id)
      if (!nested.length) return item.is_completed ? 100 : 0
      const total = nested.reduce((sum, child) => sum + Number(child.weight || 0), 0) || 100
      return nested.reduce((sum, child) => sum + (Number(child.weight || 0) / total) * calculateNode(child), 0)
    }
    const total = currentItems.filter((item) => !item.parent_id).reduce((sum, root) => sum + Number(root.weight || 0), 0) || 100
    return Math.round(currentItems.filter((item) => !item.parent_id).reduce((sum, root) => sum + (Number(root.weight || 0) / total) * calculateNode(root), 0))
  }, [])
  const progress = calculateProgress(items)

  const persist = async (item: ChecklistItem, completed: boolean, nextComment = item.comment, nextDate = item.user_selected_date) => {
    setSaving(true)
    const { data: user } = await supabase.auth.getUser()
    if (completed && (!nextDate || !(nextComment || "").trim())) {
      toast({ title: "Faltan datos", description: "Para completar el ítem debes indicar fecha y comentario.", variant: "destructive" })
      setSaving(false)
      return
    }
    const normalizedComment = nextComment || ""
    const now = new Date().toISOString()
    const patch = { is_completed: completed, comment: completed ? normalizedComment.trim() : null, user_selected_date: completed ? nextDate : null, completed_at: completed ? now : null, completed_by: completed ? user.user?.id || null : null }
    let next = items.map((current) => current.id === item.id ? { ...current, ...patch } : current) as ChecklistItem[]
    const updatedParents = new Set<string>()
    let changed = true
    while (changed) {
      changed = false
      for (const parent of next.filter((current) => next.some((child) => child.parent_id === current.id))) {
        const nested = next.filter((child) => child.parent_id === parent.id)
        const shouldComplete = nested.length > 0 && nested.every((child) => child.is_completed)
        if (parent.is_completed !== shouldComplete) {
          next = next.map((current) => current.id === parent.id ? { ...current, is_completed: shouldComplete, completed_at: shouldComplete ? now : null, completed_by: shouldComplete ? user.user?.id || null : null } : current)
          updatedParents.add(parent.id)
          changed = true
        }
      }
    }
    const parentUpdates = Array.from(updatedParents).map((id) => { const parent = next.find((current) => current.id === id)!; return { id, patch: { is_completed: parent.is_completed, completed_at: parent.completed_at, completed_by: parent.completed_by } } })
    const { error } = await supabase.from("opportunity_checklist_items" as any).update(patch).eq("id", item.id).eq("opportunity_id", opportunityId)
    if (!error) for (const parentUpdate of parentUpdates) await supabase.from("opportunity_checklist_items" as any).update(parentUpdate.patch).eq("id", parentUpdate.id).eq("opportunity_id", opportunityId)
    if (error) toast({ title: "No se pudo actualizar el ítem", description: error.message, variant: "destructive" })
    else {
      setItems(next)
      const nextProgress = calculateProgress(next)
      await supabase.from("opportunities").update({ probability: nextProgress }).eq("id", opportunityId)
      toast({ title: completed ? "Ítem completado" : "Ítem desmarcado" })
    }
    setSaving(false)
  }

  const selectItem = (item: ChecklistItem) => { setSelected(item); setComment(item.comment || ""); setDate(item.user_selected_date || ""); setOpen(true) }
  const title = (item: ChecklistItem) => item.title?.[lang] || item.title?.es || item.title?.en || "Ítem"
  const description = (item: ChecklistItem) => item.description?.[lang] || item.description?.es || item.description?.en || ""

  const renderItem = (item: ChecklistItem, level = 0) => {
    const nested = children(item.id)
    return <div key={item.id} className="border-b last:border-b-0">
      <div className="flex items-start gap-3 py-3" style={{ paddingLeft: `${level * 1.25}rem` }}>
        <Checkbox checked={item.is_completed} disabled={!canEdit || saving} onClick={(event) => { if (!item.is_completed) { event.preventDefault(); selectItem(item) } }} onCheckedChange={(checked) => { if (checked !== true && item.is_completed) void persist(item, false) }} aria-label={title(item)} />
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => selectItem(item)}><p className={item.is_completed ? "font-medium line-through text-muted-foreground" : "font-medium"}>{title(item)}</p><p className="text-sm text-muted-foreground">{description(item)}</p></div>
        <Badge variant={item.is_completed ? "default" : "secondary"}>{item.is_completed ? "100%" : `${item.weight}%`}</Badge>{canEdit && !item.is_completed && <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => selectItem(item)}>Completar</Button>}
        {nested.length > 0 && (item.is_completed ? <ChevronDown className="mt-1 size-4" /> : <ChevronRight className="mt-1 size-4" />)}
      </div>
      {nested.length > 0 && <div>{nested.map((child) => renderItem(child, level + 1))}</div>}
    </div>
  }

  if (loading) return <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Cargando checklist...</CardContent></Card>
  if (!items.length) return null

  return <>
    <Card className="mb-5 border-muted shadow-none">
      <CardContent className="flex cursor-pointer items-center gap-4 px-4 py-3" onClick={() => setOpen(true)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setOpen(true) }}>
        <ClipboardCheck className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>Probabilidad</span><span className="font-medium text-foreground">{progress}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="flex shrink-0 items-center gap-2">{roots.map((root) => <Badge key={root.id} variant={root.is_completed ? "default" : "outline"}>{title(root)} {root.is_completed ? "✓" : "·"}</Badge>)}</div>
        <span className="shrink-0 text-xs text-muted-foreground">{items.filter((item) => item.is_completed).length}/{items.length}</span>
      </CardContent>
    </Card>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>Checklist de calificación</SheetTitle><SheetDescription>Selecciona un ítem para ver sus detalles y registrar evidencia.</SheetDescription></SheetHeader><div className="flex flex-col gap-0 py-6">{roots.map((item) => renderItem(item))}</div>{selected && <div className="border-t pt-5"><SheetTitle className="text-base">{title(selected)}</SheetTitle><SheetDescription>{description(selected)}</SheetDescription><div className="flex flex-col gap-5 py-6"><p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Para completar este ítem, indica la fecha y agrega un comentario o evidencia.</p><div className="flex items-center gap-2"><Badge>{selected.is_completed ? "Completado" : "Pendiente"}</Badge><span className="text-sm text-muted-foreground">Peso: {selected.weight}%</span></div><div className="flex flex-col gap-2"><Label htmlFor="checklist-date"><CalendarDays className="mr-1 inline size-4" />Fecha de cumplimiento *</Label><Input id="checklist-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={!canEdit || saving} /></div><div className="flex flex-col gap-2"><Label htmlFor="checklist-comment"><MessageSquare className="mr-1 inline size-4" />Comentario / evidencia *</Label><Textarea id="checklist-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Agrega evidencia o comentarios..." disabled={!canEdit || saving} /></div><div className="flex gap-2"><Button className="flex-1" disabled={!canEdit || saving || !date || !comment.trim()} onClick={() => void persist(selected, true, comment, date)}><Check data-icon="inline-start" />Completar</Button><Button variant="outline" disabled={!canEdit || saving || !selected.is_completed} onClick={() => void persist(selected, false, comment, date)}><RotateCcw data-icon="inline-start" />Desmarcar</Button></div></div></div>}</SheetContent></Sheet>
  </>
}
