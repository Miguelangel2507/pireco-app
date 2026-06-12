'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { CompanySettings, Treatment } from '@/types/database'

export default function AjustesPage() {
  const supabase = createClient()

  const [settingsId, setSettingsId] = useState<string>('')
  const [companyName, setCompanyName] = useState('')
  const [cif, setCif] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [iban, setIban] = useState('')
  const [defaultConditions, setDefaultConditions] = useState('')
  const [nextBudgetNum, setNextBudgetNum] = useState('1')
  const [nextProformaNum, setNextProformaNum] = useState('1')
  const [nextInvoiceNum, setNextInvoiceNum] = useState('1')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [newTreatmentName, setNewTreatmentName] = useState('')
  const [savingTreatment, setSavingTreatment] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [settingsRes, treatmentsRes] = await Promise.all([
        supabase.from('company_settings').select('*').single(),
        supabase.from('treatments').select('*').order('sort_order'),
      ])
      if (settingsRes.data) {
        const s = settingsRes.data as CompanySettings
        setSettingsId(s.id)
        setCompanyName(s.name ?? '')
        setCif(s.cif ?? '')
        setAddress(s.address ?? '')
        setPhone(s.phone ?? '')
        setEmail(s.email ?? '')
        setIban(s.iban ?? '')
        setDefaultConditions(s.default_conditions ?? '')
        setNextBudgetNum(String(s.next_budget_num ?? 1))
        setNextProformaNum(String(s.next_proforma_num ?? 1))
        setNextInvoiceNum(String(s.next_invoice_num ?? 1))
      }
      setTreatments((treatmentsRes.data as Treatment[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveSettings() {
    setSavingSettings(true)
    setError(null)
    try {
      const { error: err } = await supabase
        .from('company_settings')
        .update({
          name: companyName.trim() || null,
          cif: cif.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          iban: iban.trim() || null,
          default_conditions: defaultConditions.trim() || null,
          next_budget_num: parseInt(nextBudgetNum) || 1,
          next_proforma_num: parseInt(nextProformaNum) || 1,
          next_invoice_num: parseInt(nextInvoiceNum) || 1,
        })
        .eq('id', settingsId)
      if (err) throw err
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Error al guardar')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleAddTreatment() {
    const name = newTreatmentName.trim()
    if (!name) return
    setSavingTreatment(true)
    const { data, error: err } = await supabase
      .from('treatments')
      .insert({ name, is_active: true, sort_order: treatments.length })
      .select('*')
      .single()
    setSavingTreatment(false)
    if (!err && data) {
      setTreatments((prev) => [...prev, data as Treatment])
      setNewTreatmentName('')
    }
  }

  async function handleDeleteTreatment(id: string) {
    await supabase.from('treatments').delete().eq('id', id)
    setTreatments((prev) => prev.filter((t) => t.id !== id))
  }

  async function handleToggleTreatment(t: Treatment) {
    await supabase.from('treatments').update({ is_active: !t.is_active }).eq('id', t.id)
    setTreatments((prev) => prev.map((x) => x.id === t.id ? { ...x, is_active: !x.is_active } : x))
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400">
        <div className="inline-block w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajustes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuración de la empresa y valores por defecto</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Datos de la empresa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nombre de la empresa" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Pinturas Pireco SL" />
          </div>
          <Input label="CIF" value={cif} onChange={(e) => setCif(e.target.value)} placeholder="B75852400" />
          <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" type="tel" />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@empresa.com" type="email" />
          <Input label="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
          <div className="sm:col-span-2">
            <Input label="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número, ciudad..." />
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Numeración de documentos</h2>
          <p className="text-xs text-gray-400 mt-0.5">El próximo documento creado usará este número.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Próximo presupuesto (PRE-)" value={nextBudgetNum} onChange={(e) => setNextBudgetNum(e.target.value)} type="number" min={1} />
          <Input label="Próxima proforma (PRO-)" value={nextProformaNum} onChange={(e) => setNextProformaNum(e.target.value)} type="number" min={1} />
          <Input label="Próxima factura (FAC-)" value={nextInvoiceNum} onChange={(e) => setNextInvoiceNum(e.target.value)} type="number" min={1} />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Condiciones por defecto</h2>
          <p className="text-xs text-gray-400 mt-0.5">Se rellenarán automáticamente al crear un presupuesto.</p>
        </div>
        <textarea
          value={defaultConditions}
          onChange={(e) => setDefaultConditions(e.target.value)}
          rows={6}
          placeholder="Ej: Validez del presupuesto: 30 días. Forma de pago: 50% a la firma, 50% a la entrega..."
          className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent transition border-gray-300 dark:border-gray-600 resize-none"
        />
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={savingSettings}>
          <Save className="w-4 h-4" />
          {savingSettings ? 'Guardando...' : settingsSaved ? '¡Guardado!' : 'Guardar ajustes'}
        </Button>
      </div>

      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Tratamientos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Aparecen como opciones al crear presupuestos.</p>
        </div>

        <div className="space-y-2">
          {treatments.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTreatment(t)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    t.is_active ? 'bg-primary-700 border-primary-700' : 'border-gray-300 dark:border-gray-500'
                  }`}
                  title={t.is_active ? 'Desactivar' : 'Activar'}
                >
                  {t.is_active && <span className="text-white text-xs leading-none">✓</span>}
                </button>
                <span className={`text-sm ${t.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
                  {t.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteTreatment(t.id)}
                className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {treatments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aún no hay tratamientos</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTreatmentName}
            onChange={(e) => setNewTreatmentName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTreatment() } }}
            placeholder="Nombre del tratamiento..."
            className="flex-1 px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-700 border-gray-300 dark:border-gray-600"
          />
          <Button size="sm" onClick={handleAddTreatment} disabled={savingTreatment || !newTreatmentName.trim()}>
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </Button>
        </div>
      </section>
    </div>
  )
}
