import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, X, Upload } from 'lucide-react'
import { api } from '../../services/api'
import { useLocalizedName } from '../../utils/localization'
import type { QueueOrder, QueueItem } from './types'

interface Props {
  order: QueueOrder
  item: QueueItem
  onClose: () => void
}

export const PurchaseModal: React.FC<Props> = ({ order, item, onClose }) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const localizedName = useLocalizedName()

  const remaining = Math.max(item.quantity - item.bought_quantity, 0)
  const [form, setForm] = useState({
    quantity: String(remaining),
    actual_cost_jpy: '',
    shop_name: ''
  })
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const name = item.product ? localizedName(item.product) : item.ticket?.item_name || '—'

  const save = useMutation({
    mutationFn: async () => {
      let receipt_img: string[] = []

      if (files.length > 0) {
        setUploading(true)
        const token = localStorage.getItem('token')
        receipt_img = await Promise.all(
          files.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'receipts')
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/uploads`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: formData
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.message)
            return data.url as string
          })
        )
        setUploading(false)
      }

      return api.post('/purchases', {
        order_id: order.id,
        order_item_id: item.id,
        product_id: item.product_id ?? undefined,
        quantity: Number(form.quantity),
        actual_cost_jpy: Number(form.actual_cost_jpy),
        shop_name: form.shop_name || undefined,
        receipt_img: receipt_img.length > 0 ? receipt_img : undefined
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-queue'] })
      qc.invalidateQueries({ queryKey: ['agent-purchases'] })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      onClose()
    },
    onError: (e: any) => {
      setUploading(false)
      setError(e.response?.data?.message || e.message || t('agent.purchase.failed'))
    }
  })

  const qty = Number(form.quantity)
  const valid = qty > 0 && qty <= remaining && Number(form.actual_cost_jpy) > 0

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">{t('agent.purchase.title')}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {name} · {order.order_code || `NT-${order.id}`}
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label-modal">
              {t('agent.purchase.quantity')} ({t('agent.purchase.remaining', { count: remaining })})
            </label>
            <input
              type="number"
              min={1}
              max={remaining}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="input-modal"
            />
          </div>

          <div>
            <label className="label-modal">{t('agent.purchase.costJpy')}</label>
            <input
              type="number"
              value={form.actual_cost_jpy}
              onChange={(e) => setForm({ ...form, actual_cost_jpy: e.target.value })}
              placeholder="3980"
              className="input-modal"
            />
            <p className="text-xs text-muted-foreground mt-1">{t('agent.purchase.costHint')}</p>
          </div>

          <div>
            <label className="label-modal">{t('agent.purchase.shop')}</label>
            <input
              type="text"
              value={form.shop_name}
              onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
              placeholder="Don Quijote Shibuya"
              className="input-modal"
            />
          </div>

          <div>
            <label className="label-modal">{t('agent.purchase.receipt')}</label>
            <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-3 cursor-pointer hover:bg-secondary/50 text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              {files.length > 0 ? t('agent.purchase.filesChosen', { count: files.length }) : t('agent.purchase.chooseFiles')}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
          </div>

          {error && <div className="error-alert text-sm">{error}</div>}

          <button
            onClick={() => save.mutate()}
            disabled={!valid || save.isPending || uploading}
            className="btn-primary w-full justify-center"
          >
            {save.isPending || uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {uploading ? t('agent.purchase.uploading') : t('agent.purchase.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
