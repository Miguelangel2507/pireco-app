'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

interface DeleteClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  onDeleted: () => void
}

export default function DeleteClientModal({ isOpen, onClose, client, onDeleted }: DeleteClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!client) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('clients').delete().eq('id', client.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    onDeleted()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar cliente">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          ¿Seguro que quieres eliminar a{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{client?.name}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
