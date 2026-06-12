'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Tag } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Client, ClientTag } from '@/types/database'

type ClientWithTags = Client & { client_tags: ClientTag[] }

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: ClientWithTags | null
  onSaved: () => void
}

const PRESET_COLORS = [
  { hex: '#1E3A8A', label: 'Azul' },
  { hex: '#059669', label: 'Verde' },
  { hex: '#D97706', label: 'Ámbar' },
  { hex: '#DC2626', label: 'Rojo' },
  { hex: '#7C3AED', label: 'Violeta' },
  { hex: '#0891B2', label: 'Cian' },
]

interface TagDraft {
  id?: string
  tag_name: string
  color: string
}

export default function ClientModal({ isOpen, onClose, client, onSaved }: ClientModalProps) {
  const supabase = createClient()
  const isEdit = client !== null

  const [name, setName] = useState('')
  const [cif, setCif] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [notes, setNotes] = useState('')

  const [tags, setTags] = useState<TagDraft[]>([])
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0].hex)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setName(client.name)
        setCif(client.cif ?? '')
        setContactName(client.contact_name ?? '')
        setPhone(client.phone ?? '')
        setEmail(client.email ?? '')
        setAddress(client.address ?? '')
        setCity(client.city ?? '')
        setPostalCode(client.postal_code ?? '')
        setNotes(client.notes ?? '')
        setTags(
          client.client_tags.map((t) => ({
            id: t.id,
            tag_name: t.tag_name,
            color: t.color,
          }))
        )
      } else {
        setName('')
        setCif('')
        setContactName('')
        setPhone('')
        setEmail('')
        setAddress('')
        setCity('')
        setPostalCode('')
        setNotes('')
        setTags([])
      }
      setShowAddTag(false)
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0].hex)
      setError(null)
      setNameError(undefined)
    }
  }, [isOpen, client])

  function handleAddTag() {
    const trimmed = newTagName.trim()
    if (!trimmed) return
    setTags((prev) => [...prev, { tag_name: trimmed, color: newTagColor }])
    setNewTagName('')
    setNewTagColor(PRESET_COLORS[0].hex)
    setShowAddTag(false)
  }

  function handleRemoveTag(index: number) {
    setTags((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setError(null)
    setNameError(undefined)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      let clientId: string

      if (isEdit && client) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            name: trimmedName,
            cif: cif.trim() || null,
            contact_name: contactName.trim() || null,
            phone: phone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            city: city.trim() || null,
            postal_code: postalCode.trim() || null,
            notes: notes.trim() || null,
          })
          .eq('id', client.id)
        if (updateError) throw updateError
        clientId = client.id
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('clients')
          .insert({
            name: trimmedName,
            cif: cif.trim() || null,
            contact_name: contactName.trim() || null,
            phone: phone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            city: city.trim() || null,
            postal_code: postalCode.trim() || null,
            notes: notes.trim() || null,
          })
          .select('id')
          .single()
        if (insertError) throw insertError
        clientId = insertData.id
      }

      // Replace all tags: delete existing then insert new ones
      if (isEdit && client) {
        const { error: deleteTagsError } = await supabase
          .from('client_tags')
          .delete()
          .eq('client_id', client.id)
        if (deleteTagsError) throw deleteTagsError
      }

      if (tags.length > 0) {
        const { error: insertTagsError } = await supabase.from('client_tags').insert(
          tags.map((t) => ({
            client_id: clientId,
            tag_name: t.tag_name,
            color: t.color,
          }))
        )
        if (insertTagsError) throw insertTagsError
      }

      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? JSON.stringify(err)
      setError(msg || 'Error al guardar el cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      className="max-w-2xl"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Main fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Nombre *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              placeholder="Nombre del cliente"
            />
          </div>
          <Input
            label="CIF / NIF"
            value={cif}
            onChange={(e) => setCif(e.target.value)}
            placeholder="B12345678"
          />
          <Input
            label="Persona de contacto"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Nombre y apellidos"
          />
          <Input
            label="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            type="tel"
          />
          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@empresa.com"
            type="email"
          />
          <div className="sm:col-span-2">
            <Input
              label="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, piso..."
            />
          </div>
          <Input
            label="Ciudad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Barcelona"
          />
          <Input
            label="Código postal"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="08001"
          />
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Información adicional..."
              className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent transition border-gray-300 dark:border-gray-600 resize-none"
            />
          </div>
        </div>

        {/* Tags section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Etiquetas</span>
          </div>

          {/* Existing tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.tag_name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-0.5 hover:opacity-75 transition-opacity"
                    aria-label={`Eliminar etiqueta ${tag.tag_name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add tag inline form */}
          {showAddTag ? (
            <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <div className="flex-1 min-w-[140px]">
                <Input
                  label="Nombre de etiqueta"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ej: VIP, Obra, etc."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color
                </label>
                <div className="flex gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => setNewTagColor(c.hex)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-transform hover:scale-110',
                        newTagColor === c.hex && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110'
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddTag} disabled={!newTagName.trim()}>
                  Añadir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddTag(false)
                    setNewTagName('')
                    setNewTagColor(PRESET_COLORS[0].hex)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddTag(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir etiqueta
            </Button>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </Modal>
  )
}
