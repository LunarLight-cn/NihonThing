import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart, Loader2, Truck, X, Eye, MapPin, Receipt, PlaneTakeoff, Ship as ShipIcon, User } from 'lucide-react'
import { useLocalizedName } from '../../utils/localization'
import { getImageUrl } from '../../utils/image'
import { orderStatusBadge, paymentStatusBadge } from '../../utils/status'

interface OrderItem {
  quantity: number
  selected_options?: Record<string, string> | null
  product?: { id: number; name_en?: string; name_th?: string; name_jp?: string; img?: string[] } | null
  ticket?: { id: number; item_name: string; img?: string | string[] } | null
}
interface OrderAddress {
  fullname: string
  surname: string
  tel: string
  address_line: string
}
interface OrderPayment {
  id: number
  amount: number
  payment_type: string
  method?: string | null
  slip_img?: string | null
  status: string
  cdate: string
}
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
  user?: { id: number; username: string; email: string } | null
  ship?: { type: string; ship_date: string } | null
  address?: OrderAddress | null
  payments?: OrderPayment[]
  items?: OrderItem[]
}

type TripFillAxis = 'items' | 'weight' | 'price'
interface TripAxis {
  axis: TripFillAxis
  percent: number
  current: number
  max: number
}
interface Trip {
  id: number
  type: string
  ship_date: string
  status: string
  is_closed: boolean
  max_cap: number
  current_cap: number
  max_items: number
  current_items: number
  max_price: number
  current_price: number
  axes?: TripAxis[]
  fill?: TripAxis | null
}

const firstImg = (img?: string | string[] | null) => (Array.isArray(img) ? img[0] : img) || undefined
const optionsLine = (o?: Record<string, string> | null) =>
  o && Object.keys(o).length ? Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : undefined)

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

// Capacity of the next trip to depart — how close it is to closing on each axis.
const NextTripCapacity: React.FC = () => {
  const { t } = useTranslation()
  const { data: trips } = useQuery({
    queryKey: ['ships'],
    queryFn: async () => (await api.get('/ships')).data.data as Trip[]
  })

  // Nearest upcoming trip that is still accepting orders.
  const next = (trips || [])
    .filter((tr) => !tr.is_closed && tr.status === 'open')
    .sort((a, b) => new Date(a.ship_date).getTime() - new Date(b.ship_date).getTime())[0]

  if (!next) return null

  const rows: { label: string; current: string; max: string; percent: number | null }[] = [
    {
      label: t('admin.trips.axis_items'),
      current: String(next.current_items || 0),
      max: next.max_items ? String(next.max_items) : '∞',
      percent: next.max_items ? Math.min(100, Math.round(((next.current_items || 0) / next.max_items) * 100)) : null
    },
    {
      label: t('admin.trips.axis_weight'),
      current: `${next.current_cap || 0} kg`,
      max: next.max_cap ? `${next.max_cap} kg` : '∞',
      percent: next.max_cap ? Math.min(100, Math.round(((next.current_cap || 0) / next.max_cap) * 100)) : null
    },
    {
      label: t('admin.trips.axis_price'),
      current: `฿${(next.current_price || 0).toLocaleString()}`,
      max: next.max_price ? `฿${next.max_price.toLocaleString()}` : '∞',
      percent: next.max_price ? Math.min(100, Math.round(((next.current_price || 0) / next.max_price) * 100)) : null
    }
  ]

  return (
    <div className="card-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold flex items-center gap-2">
          {next.type === 'sea' ? <ShipIcon className="w-4 h-4 text-primary" /> : <PlaneTakeoff className="w-4 h-4 text-primary" />}
          {t('admin.order.next_trip', { date: new Date(next.ship_date).toLocaleDateString() })}
        </h2>
        {next.fill && (
          <span className={`badge ${next.fill.percent >= 80 ? 'badge-warning' : 'badge-info'}`}>
            {t('admin.trips.fill_pct', { pct: next.fill.percent, axis: t(`admin.trips.axis_${next.fill.axis}`) })}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="stat-row mb-1">
              <span className="stat-row-label">{r.label}</span>
              <span className="font-medium">{r.current} / {r.max}</span>
            </div>
            <div className="progress-track progress-track-sm">
              <div
                className={`progress-fill ${r.percent !== null && r.percent >= 80 ? 'progress-fill-warning' : 'progress-fill-primary'}`}
                style={{ width: `${r.percent ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Full order detail for admin/agent — everything needed to fulfil the order.
const AdminOrderDetailModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()
  const shipFee = (order.shipping_fee_jp_th || 0) + (order.shipping_fee_th_th || 0)

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close"><X className="w-5 h-5" /></button>

        <h3 className="font-bold text-xl font-mono tracking-wide">{order.order_code || `NT-${order.id}`}</h3>
        <p className="text-sm text-muted-foreground">{new Date(order.cdate).toLocaleString()}</p>
        <div className="flex gap-2 mt-3">
          <span className={`badge ${orderStatusBadge(order.status)}`}>{t(`admin.order.status_${order.status}`)}</span>
          <span className={`badge ${paymentStatusBadge(order.payment_status)}`}>{t(`admin.order.payment_${order.payment_status}`)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-6">
          <div>
            {/* Customer */}
            <section>
              <h4 className="detail-heading"><User className="w-4 h-4" />{t('admin.order.customer')}</h4>
              <p className="text-sm font-medium">{order.user?.username || `#${order.user_id}`}</p>
              <p className="text-sm text-muted-foreground">{order.user?.email}</p>
            </section>

            {/* Items — what the agent must buy */}
            <section className="mt-5">
              <h4 className="detail-heading"><ShoppingCart className="w-4 h-4" />{t('admin.order.items')}</h4>
              <div className="space-y-2">
                {(order.items || []).map((it, idx) => {
                  const label = it.product ? localizedName(it.product) : (it.ticket?.item_name || '—')
                  const img = firstImg(it.product?.img) || firstImg(it.ticket?.img)
                  return (
                    <div key={idx} className="flex items-center gap-3 border border-border rounded-lg p-2">
                      <img src={getImageUrl(img)} alt={label} className="w-11 h-11 object-cover rounded-md border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{label}</p>
                        {optionsLine(it.selected_options) && (
                          <p className="text-xs text-primary font-medium">{optionsLine(it.selected_options)}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">x{it.quantity}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <div>
            {/* Shipping */}
            <section>
              <h4 className="detail-heading"><Truck className="w-4 h-4" />{t('admin.order.shipping')}</h4>
              <div className="text-sm space-y-1">
                {order.ship && (
                  <p className="flex items-center gap-1.5">
                    {order.ship.type === 'sea' ? <ShipIcon className="w-4 h-4 text-primary" /> : <PlaneTakeoff className="w-4 h-4 text-primary" />}
                    {order.ship.type} · {fmtDate(order.ship.ship_date)}
                  </p>
                )}
                <div className="stat-row stat-row-label"><span>{t('admin.order.courier')}</span><span>{order.courier_name || '—'}</span></div>
                <div className="stat-row stat-row-label"><span>{t('admin.order.tracking_no')}</span><span className="font-mono">{order.track_no || '—'}</span></div>
                <div className="stat-row stat-row-label"><span>{t('admin.order.shipped_date')}</span><span>{fmtDate(order.shipped_date) || '—'}</span></div>
                <div className="stat-row stat-row-label"><span>{t('admin.order.deliv_date')}</span><span>{fmtDate(order.deliv_date) || '—'}</span></div>
              </div>
            </section>

            {/* Address */}
            <section className="mt-5">
              <h4 className="detail-heading"><MapPin className="w-4 h-4" />{t('admin.order.deliver_to')}</h4>
              {order.address ? (
                <div className="text-sm text-muted-foreground">
                  <p className="text-foreground font-medium">{order.address.fullname} {order.address.surname}</p>
                  <p>{order.address.address_line}</p>
                  <p>Tel: {order.address.tel}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">—</p>}
            </section>

            {/* Totals */}
            <section className="mt-5 border-t border-border pt-3 space-y-1.5">
              <div className="stat-row"><span className="stat-row-label">{t('admin.order.items_total')}</span><span>฿{(order.item_price_total || 0).toLocaleString()}</span></div>
              <div className="stat-row"><span className="stat-row-label">{t('admin.order.shipping_fee')}</span><span>{shipFee > 0 ? `฿${shipFee.toLocaleString()}` : '—'}</span></div>
              <div className="stat-row font-bold"><span>{t('admin.order.grand_total_calc')}</span><span className="text-primary">{order.grand_total ? `฿${order.grand_total.toLocaleString()}` : '—'}</span></div>
            </section>

            {/* Payments */}
            <section className="mt-5">
              <h4 className="detail-heading"><Receipt className="w-4 h-4" />{t('admin.order.payments')}</h4>
              {(order.payments || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <div className="space-y-2">
                  {(order.payments || []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                      <div>
                        <p className="font-medium">{p.payment_type}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(p.cdate)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-primary">฿{p.amount.toLocaleString()}</span>
                        {p.slip_img && <a href={getImageUrl(p.slip_img)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{t('admin.order.view_slip')}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary w-full justify-center mt-6">{t('admin.order.close')}</button>
      </div>
    </div>
  )
}

export const AdminOrders: React.FC = () => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()
  const queryClient = useQueryClient()
  const [editShipping, setEditShipping] = useState<Order | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

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
      // Cancelling an order releases its trip capacity server-side, so the
      // capacity panel and the customer trip meters are both stale now.
      queryClient.invalidateQueries({ queryKey: ['ships'] })
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
      id: 'customer',
      header: t('admin.order.customer'),
      accessorFn: (row) => row.user?.username || `#${row.user_id}`,
      cell: ({ row }) => <span className="font-medium">{row.original.user?.username || `#${row.original.user_id}`}</span>
    },
    {
      id: 'items',
      header: t('admin.order.items'),
      accessorFn: (row) => (row.items || []).map((i) => i.product ? (i.product.name_en || '') : (i.ticket?.item_name || '')).join(' '),
      cell: ({ row }) => {
        const its = row.original.items || []
        if (its.length === 0) return <span className="text-muted-foreground">—</span>
        const first = its[0]
        const label = first.product ? localizedName(first.product) : (first.ticket?.item_name || '—')
        return (
          <span className="text-sm">
            <span className="line-clamp-1 max-w-[220px]">{label}</span>
            {its.length > 1 && <span className="text-xs text-muted-foreground">+{its.length - 1} {t('admin.order.more_items')}</span>}
          </span>
        )
      }
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
            className={`input-inline-select ${orderStatusBadge(status)}`}
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
            className={`input-inline-select ${paymentStatusBadge(pStatus)}`}
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailOrder(row.original)}
            className="btn-icon"
            title={t('admin.order.view_detail')}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditShipping(row.original)}
            className="btn-icon"
            title={t('admin.order.manage_shipping')}
          >
            <Truck className="w-4 h-4" />
          </button>
        </div>
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

      <NextTripCapacity />

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

      {detailOrder && (
        <AdminOrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}

      {editShipping && (
        <ShippingEditModal order={editShipping} onClose={() => setEditShipping(null)} />
      )}
    </div>
  )
}
