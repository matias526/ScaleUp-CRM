"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type Lang = "es" | "en" | "pt"
type Target = "partner" | "prospect_partner"
type Localized = Record<Lang, string>
type Item = { id: string; parent_id: string | null; target_type: Target; title: Localized; description: Localized; weight: number; order_index: number; is_active: boolean }
const emptyText = (): Localized => ({ es: "", en: "", pt: "" })
const labels: Record<Lang, { name: string; target: string; empty: string }> = { es: { name: "Español", target: "Checklist de Partner", empty: "No hay ítems configurados" }, en: { name: "English", target: "Partner Checklist", empty: "No checklist items configured" }, pt: { name: "Português", target: "Checklist de Parceiro", empty: "Nenhum item configurado" } }

export function ChecklistMasterManager() {
  const [target, setTarget] = useState<Target>("partner")
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [form, setForm] = useState({ title: emptyText(), description: emptyText(), weight: 0, order_index: 0, is_active: true, parent_id: null as string | null })

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("checklist_master_items" as any).select("*").eq("target_type", target).order("order_index", { ascending: true })
    if (error) toast.error(error.message)
    setItems((data as unknown as Item[]) || [])
    setLoading(false)
  }, [target])
  useEffect(() => { void load() }, [load])

  const parents = useMemo(() => items.filter((item) => !item.parent_id), [items])
  const groupTotals = useMemo(() => {
    const totalFor = (parentId: string | null) => items
      .filter((item) => item.parent_id === parentId && item.is_active)
      .reduce((sum, item) => sum + Number(item.weight || 0), 0)
    return {
      root: totalFor(null),
      parents: items.filter((item) => !item.parent_id).map((item) => ({ id: item.id, title: item.title.es || item.title.en, total: totalFor(item.id) })),
    }
  }, [items])
  const allGroupsBalanced = groupTotals.root === 100 && groupTotals.parents.every((group) => group.total === 100)
  const children = (id: string) => items.filter((item) => item.parent_id === id)
  const openForm = (item?: Item, parent?: string | null) => {
    setEditing(item || null); setParentId(parent || null)
    setForm(item ? { title: { ...item.title }, description: { ...item.description }, weight: item.weight, order_index: item.order_index, is_active: item.is_active, parent_id: item.parent_id } : { title: emptyText(), description: emptyText(), weight: 0, order_index: items.length, is_active: true, parent_id: parent || null }); setOpen(true)
  }
  const save = async () => {
    if (!form.title.es.trim()) return toast.error("El título en español es obligatorio")
    if (form.weight < 0 || form.weight > 100) return toast.error("El peso debe estar entre 0 y 100")
    const currentItems = editing ? items.filter((item) => item.id !== editing.id) : items
    const siblingTotal = currentItems
      .filter((item) => item.parent_id === form.parent_id && item.is_active)
      .reduce((sum, item) => sum + Number(item.weight || 0), 0) + (form.is_active ? Number(form.weight || 0) : 0)
    if (siblingTotal > 100) return toast.error(`El peso del grupo supera 100% (${siblingTotal}%)`)
    setSaving(true)
    const payload = { ...form, target_type: target, title: form.title, description: form.description }
    const result = editing ? await supabase.from("checklist_master_items" as any).update(payload).eq("id", editing.id) : await supabase.from("checklist_master_items" as any).insert(payload)
    if (result.error) toast.error(result.error.message); else { toast.success("Ítem guardado"); setOpen(false); await load() }
    setSaving(false)
  }
  const remove = async () => { if (!deleteId) return; const childResult = await supabase.from("checklist_master_items" as any).delete().eq("parent_id", deleteId); if (childResult.error) return toast.error(childResult.error.message); const { error } = await supabase.from("checklist_master_items" as any).delete().eq("id", deleteId); if (error) toast.error(error.message); else { toast.success("Ítem eliminado"); await load() }; setDeleteId(null) }
  const translate = async () => {
    const source = form.title.es.trim() ? "es" : "en"
    const sourceText = `${form.title[source as Lang]}\n${form.description[source as Lang]}`
    if (!sourceText.trim()) return toast.error("Completa primero un idioma")
    setTranslating(true)
    try { const response = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: sourceText, targetLanguage: "English and Portuguese", sourceLanguage: labels[source as Lang].name }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo traducir"); const parts = String(data.translation || "").split("\n"); setForm((current) => ({ ...current, title: { ...current.title, en: current.title.en || parts[0] || current.title.es, pt: current.title.pt || parts[0] || current.title.es }, description: { ...current.description, en: current.description.en || parts.slice(1).join(" "), pt: current.description.pt || parts.slice(1).join(" ") } })) } catch (error) { toast.error(error instanceof Error ? error.message : "Error de traducción") } finally { setTranslating(false) }
  }
  const row = (item: Item, level = 0) => <div key={item.id}><div className="flex items-center gap-3 border-b px-4 py-3" style={{ paddingLeft: `${16 + level * 28}px` }}><button aria-label="Expandir" onClick={() => setExpanded((current) => { const next = new Set(current); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next })}>{children(item.id).length ? (expanded.has(item.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />) : <span className="inline-block size-4" />}</button><div className="min-w-0 flex-1"><p className="font-medium">{item.title.es || item.title.en}</p><p className="truncate text-sm text-muted-foreground">{item.description.es || item.description.en}</p></div><Badge variant="secondary">+{item.weight}%</Badge><Badge variant={item.is_active ? "default" : "outline"}>{item.is_active ? "Activo" : "Inactivo"}</Badge><div className="hidden gap-1 text-xs text-muted-foreground sm:flex">{(["es", "en", "pt"] as Lang[]).map((lang) => item.title?.[lang] ? <Check key={lang} className="size-4 text-emerald-600" aria-label={lang} /> : <span key={lang}>{lang.toUpperCase()}</span>)}</div><Button size="icon" variant="ghost" onClick={() => openForm(undefined, item.id)} aria-label="Agregar subítem"><Plus /></Button><Button size="icon" variant="ghost" onClick={() => openForm(item)} aria-label="Editar"><Pencil /></Button><Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)} aria-label="Eliminar"><Trash2 /></Button></div>{expanded.has(item.id) && children(item.id).map((child) => row(child, level + 1))}</div>

  return <main className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold tracking-tight">Checklist en Oportunidades</h1><p className="text-muted-foreground">Administra los ítems maestros para partners y partners potenciales.</p></div><Tabs value={target} onValueChange={(value) => setTarget(value as Target)}><TabsList><TabsTrigger value="partner">{labels.es.target}</TabsTrigger><TabsTrigger value="prospect_partner">Checklist de Partner Potencial</TabsTrigger></TabsList><TabsContent value={target} className="flex flex-col gap-4"><Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className={allGroupsBalanced ? "text-emerald-600" : "text-destructive"}>{groupTotals.root}%</CardTitle><CardDescription>Ítems raíz activos · deben sumar 100%. Cada grupo hijo también debe sumar 100%.</CardDescription><div className="mt-2 flex flex-wrap gap-2 text-xs">{groupTotals.parents.map((group) => <Badge key={group.id} variant={group.total === 100 ? "secondary" : "destructive"}>{group.title}: {group.total}%</Badge>)}</div></div><Button onClick={() => openForm()}><Plus data-icon="inline-start" />Nuevo ítem</Button></CardHeader><CardContent className="p-0">{loading ? <div className="flex flex-col gap-3 p-6"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : parents.length ? parents.map((item) => row(item)) : <div className="p-12 text-center text-muted-foreground">{labels.es.empty}</div>}</CardContent></Card></TabsContent></Tabs>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Editar ítem" : parentId ? "Nuevo sub-ítem" : "Nuevo ítem padre"}</DialogTitle></DialogHeader><div className="flex flex-col gap-4"><div className="grid gap-4 sm:grid-cols-3"><div><Label>Peso</Label><Input type="number" value={form.weight} onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })} /></div><div><Label>Orden</Label><Input type="number" value={form.order_index} onChange={(event) => setForm({ ...form, order_index: Number(event.target.value) })} /></div><div className="flex items-end gap-2 pb-2"><Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} /><Label>Activo</Label></div></div><div><Label>Ítem padre</Label><Select value={form.parent_id || "none"} onValueChange={(value) => setForm({ ...form, parent_id: value === "none" ? null : value })}><SelectTrigger><SelectValue placeholder="Sin padre" /></SelectTrigger><SelectContent><SelectItem value="none">Sin padre</SelectItem>{parents.filter((item) => item.id !== editing?.id).map((item) => <SelectItem key={item.id} value={item.id}>{item.title.es}</SelectItem>)}</SelectContent></Select></div><div className="flex items-center justify-between"><Label>Contenido multidioma</Label><Button type="button" variant="secondary" onClick={translate} disabled={translating}><Sparkles data-icon="inline-start" />{translating && <Loader2 className="animate-spin" />}Auto-traducir con IA</Button></div><Tabs defaultValue="es"><TabsList>{(["es", "en", "pt"] as Lang[]).map((lang) => <TabsTrigger key={lang} value={lang}>{labels[lang].name}{form.title[lang] && <Check className="ml-2 size-4 text-emerald-600" />}</TabsTrigger>)}</TabsList>{(["es", "en", "pt"] as Lang[]).map((lang) => <TabsContent key={lang} value={lang} className="flex flex-col gap-3"><Input placeholder="Título" value={form.title[lang]} onChange={(event) => setForm({ ...form, title: { ...form.title, [lang]: event.target.value } })} /><Input placeholder="Descripción" value={form.description[lang]} onChange={(event) => setForm({ ...form, description: { ...form.description, [lang]: event.target.value } })} /></TabsContent>)}</Tabs></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="animate-spin" />}Guardar</Button></DialogFooter></DialogContent></Dialog><AlertDialog open={!!deleteId} onOpenChange={(value) => !value && setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle><AlertDialogDescription>También se eliminarán sus subítems.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></main>
}
