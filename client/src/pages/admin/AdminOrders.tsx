import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart, Loader2, Truck, X } from 'lucide-react'

interface Order {
  id: number
  order_code: string | null
  user_id: number
  trip_id: number
  status: 'pending' | 'purchasing' | 'arrived_th' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending_deposit' | 'deposit_paid' | 'pending_remaining' | 'fully_paid'
  grand_total: number | null
  item_price_total: number | null
  shipping_fee_jp_th: number | null
  shipping_fee_th_th: number | null
  track_no: string | null
  courier_name: string | null
  shipped_date: string | null
  deliv_date: string | null
  cdate: string
}

// yyyy-mm-dd for <input type=date>
const dateInput = (d?: string | null) => {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10)
}

const ShippingEditModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [feeJp, setFeeJp] = useState(order.shipping_fee_jp_th ?? 0)
  const [feeTh, setFeeTh] = useState(order.shipping_fee_th_th ?? 0)
  const [courier, setCourier] = useState(order.courier_name ?? '')
  const [trackNo, setTrackNo] = useState(order.track_no ?? '')
  const [shippedDate, setShippedDate] = useState(dateInput(order.shipped_date))
  const [delivDate, setDelivDate] = useState(dateInput(order.deliv_date))

  const grandTotal = (order.item_price_total ?? 0) + Number(feeJp || 0) + Number(feeTh || 0)

  const mutation = useMutation({
    mutationFn: () => api.put(`/orders/${order.id}`, {
      shipping_fee_jp_th: Number(feeJp || 0),
      shipping_fee_th_th: Number(feeTh || 0),
      grand_total: grandTotal,
      courier_name: courier || undefined,
      track_no: trackNo || undefined,
      shipped_date: shippedDate || undefined,
      deliv_date: delivDate || undefined
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      onClose()
    }
  })

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close"><X className="w-5 h-5" /></button>
        <h3 className="font-bold text-lg flex items-center gap-2 mb-1"><Truck className="w-5 h-5 text-primary" />{t('admin.order.manage_shipping')}</h3>
        <p className="text-sm text-muted-foreground font-mono mb-4">{order.order_code || `NT-${order.id}`}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-customer">{t('admin.order.fee_jp_th')}</label>
              <input type="number" value={feeJp} onChange={(e) => setFeeJp(Number(e.target.value))} className="input-customer" />
            </div>
            <div>
              <label className="label-customer">{t('admin.order.fee_th_th')}</label>
              <input type="number" value={feeTh} onChange={(e) => setFeeTh(Number(e.target.value))} className="input-customer" />
            </div>
          </div>
          <div className="flex justify-between text-sm border-y border-border py-2">
            <span className="text-muted-foreground">{t('admin.order.grand_total_calc')}</span>
            <span className="font-bold text-primary">฿{grandTotal.toLocaleString()}</span>
          </div>
          <div>
            <label className="label-customer">{t('admin.order.courier')}</label>
            <input type="text" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Thai Post, SPX Express..." className="input-customer" />
          </div>
          <div>
            <label className="label-customer">{t('admin.order.tracking_no')}</label>
            <input type="text" value={trackNo} onChange={(e) => setTrackNo(e.target.value)} className="input-customer font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-customer">{t('admin.order.shipped_date')}</label>
              <input type="date" value={shippedDate} onChange={(e) => setShippedDate(e.target.value)} className="input-customer" />
            </div>
            <div>
              <label className="label-customer">{t('admin.order.deliv_date')}</label>
              <input type="date" value={delivDate} onChange={(e) => setDelivDate(e.target.value)} className="input-customer" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary text-sm">{t('admin.order.cancel')}</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary px-6 disabled:opacity-50">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.order.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export const AdminOrders: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editShipping, setEditShipping] = useState<Order | null>(null)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders')
      return res.data.data as Order[]
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    }
  })

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, payment_status }: { id: number; payment_status: string }) => api.put(`/orders/${id}`, { payment_status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    }
  })

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'order_code',
      header: t('admin.order.order_id'),
      cell: ({ row }) => <span className="font-mono">{row.original.order_code || `NT-${row.original.id}`}</span>
    },
    {
      accessorKey: 'cdate',
      header: t('admin.order.date'),
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      accessorKey: 'grand_total',
      header: t('admin.order.total'),
      cell: ({ row }) => `฿${(row.original.grand_total ?? row.original.item_price_total ?? 0).toLocaleString()}`
    },
    {
      accessorKey: 'status',
      header: t('admin.order.fulfillment_status'),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value
              if (next === status) return
              if (!confirm(t('admin.order.confirm_status_change'))) return
              updateStatusMutation.mutate({ id: row.original.id, status: next })
            }}
            className="input-inline-select"
          >
            <option value="pending">{t('admin.order.status_pending')}</option>
            <option value="purchasing">{t('admin.order.status_purchasing')}</option>
            <option value="arrived_th">{t('admin.order.status_arrived_th')}</option>
            <option value="shipped">{t('admin.order.status_shipped')}</option>
            <option value="delivered">{t('admin.order.status_delivered')}</option>
            <option value="cancelled">{t('admin.order.status_cancelled')}</option>
          </select>
        )
      }
    },
    {
      accessorKey: 'payment_status',
      header: t('admin.order.payment_status'),
      cell: ({ row }) => {
        const pStatus = row.original.payment_status
        return (
          <select
            value={pStatus}
            onChange={(e) => {
              const next = e.target.value
              if (next === pStatus) return
              if (!confirm(t('admin.order.confirm_payment_change'))) return
              updatePaymentStatusMutation.mutate({ id: row.original.id, payment_status: next })
            }}
            className="input-inline-select"
          >
            <option value="pending_deposit">{t('admin.order.payment_pending_deposit')}</option>
            <option value="deposit_paid">{t('admin.order.payment_deposit_paid')}</option>
            <option value="pending_remaining">{t('admin.order.payment_pending_remaining')}</option>
            <option value="fully_paid">{t('admin.order.payment_fully_paid')}</option>
          </select>
        )
      }
    },
    {
      id: 'actions',
      header: t('admin.order.actions'),
      cell: ({ row }) => (
        <button
          onClick={() => setEditShipping(row.original)}
          className="btn-icon"
          title={t('admin.order.manage_shipping')}
        >
          <Truck className="w-4 h-4" />
        </button>
      )
    }
  ]

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <ShoppingCart className="w-8 h-8 mr-3" />
          {t('admin.order.orders_title')}
        </h1>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders || []}
          searchKey="id"
          searchPlaceholder={t('admin.order.search_order_id')}
          filters={[
            {
              columnId: 'status',
              label: t('admin.order.fulfillment_status'),
              options: [
                { value: 'pending', label: t('admin.order.status_pending') },
                { value: 'purchasing', label: t('admin.order.status_purchasing') },
                { value: 'arrived_th', label: t('admin.order.status_arrived_th') },
                { value: 'shipped', label: t('admin.order.status_shipped') },
                { value: 'delivered', label: t('admin.order.status_delivered') },
                { value: 'cancelled', label: t('admin.order.status_cancelled') }
              ]
            },
            {
              columnId: 'payment_status',
              label: t('admin.order.payment_status'),
              options: [
                { value: 'pending_deposit', label: t('admin.order.payment_pending_deposit') },
                { value: 'deposit_paid', label: t('admin.order.payment_deposit_paid') },
                { value: 'pending_remaining', label: t('admin.order.payment_pending_remaining') },
                { value: 'fully_paid', label: t('admin.order.payment_fully_paid') }
              ]
            }
          ]}
        />
      )}

      {editShipping && (
        <ShippingEditModal order={editShipping} onClose={() => setEditShipping(null)} />
      )}
    </div>
  )
}
