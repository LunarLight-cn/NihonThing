import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Package, Loader2, PlaneTakeoff, Ship as ShipIcon,
  QrCode, Upload, AlertCircle, CheckCircle2, X, ClipboardList,
  MapPin, ChevronRight, Receipt, FileText, Banknote, ShoppingBag,
  PackageCheck, Truck
} from 'lucide-react'
import { api } from '../../services/api'
import { getImageUrl } from '../../utils/image'
import { useLocalizedName } from '../../utils/localization'

interface OrderItem {
  quantity: number
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
interface CountryName { name_en?: string; name_th?: string; name_jp?: string }
interface Order {
  id: number
  order_code?: string | null
  cdate: string
  status: string
  payment_status: string
  item_price_total: number
  shipping_fee_jp_th?: number | null
  shipping_fee_th_th?: number | null
  grand_total?: number | null
  track_no?: string | null
  courier_name?: string | null
  shipped_date?: string | null
  deliv_date?: string | null
  ship?: { type: string; ship_date: string; destination?: CountryName | null } | null
  address?: OrderAddress | null
  payments?: OrderPayment[]
  items: OrderItem[]
}

// Human-facing order code; falls back to NT-<id> for rows created before codes existed.
const orderNo = (order: Order) => order.order_code || `NT-${order.id}`

const STATUS_RANK: Record<string, number> = { pending: 0, purchasing: 1, arrived_th: 2, shipped: 3, delivered: 4 }
const PAY_RANK: Record<string, number> = { pending_deposit: 0, deposit_paid: 1, pending_remaining: 2, fully_paid: 3 }
interface Ticket {
  id: number
  item_name: string
  img?: string | string[]
  status: string
  expected_price?: number | null
  proposed_price_thb?: number | null
}

const badgeClass = (kind: 'ok' | 'warn' | 'muted' | 'info') => ({
  ok: 'badge-success',
  warn: 'badge-warning',
  muted: 'badge-muted',
  info: 'badge-info'
}[kind])

const payBadge = (status: string) =>
  status === 'fully_paid' ? 'ok' : status === 'pending_deposit' ? 'warn' : 'info'
const fulfillBadge = (status: string) =>
  status === 'delivered' ? 'ok' : status === 'cancelled' ? 'muted' : 'info'

// ── Payment modal ──────────────────────────────────────────
const PaymentModal: React.FC<{
  orderId: number
  type: 'deposit' | 'remaining'
  onClose: () => void
  onPaid: () => void
}> = ({ orderId, type, onClose, onPaid }) => {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { data: qr, isLoading, isError } = useQuery({
    queryKey: ['qr', orderId, type],
    queryFn: async () =>
      (await api.get('/payments/qrcode', { params: { order_id: orderId, type } })).data.data as { amount: number; qrBase64: string }
  })

  const submit = async () => {
    if (!file || !qr) return
    setSubmitting(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('order_id', String(orderId))
      form.append('amount', String(qr.amount))
      form.append('payment_type', type)
      form.append('file', file)
      await api.post('/payments/slip', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDone(true)
    } catch (e: any) {
      setError(e.response?.data?.message || t('myOrders.pay.slipError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card max-w-md" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500" />
            <p className="text-lg font-bold">{t('myOrders.pay.success')}</p>
            <button onClick={() => { onPaid(); onClose() }} className="btn-primary px-6 py-2 mx-auto">
              {t('myOrders.pay.close')}
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-primary" />
              {t('myOrders.pay.title', { id: orderId })}
            </h3>

            {error && (
              <div className="error-alert mb-4 flex items-center text-sm">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />{error}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : isError || !qr ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('myOrders.pay.qrError')}</p>
            ) : (
              <div className="text-center space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('myOrders.pay.amountDue')}</p>
                  <p className="text-3xl font-bold text-primary">฿{qr.amount.toLocaleString()}</p>
                </div>
                <img src={qr.qrBase64} alt="PromptPay QR" className="w-52 h-52 mx-auto" />
                <p className="text-sm text-muted-foreground">{t('myOrders.pay.scan')}</p>

                <div className="border-t border-border pt-4 space-y-3 text-left">
                  <label className="font-medium text-sm flex items-center">
                    <Upload className="w-4 h-4 mr-2 text-primary" />{t('myOrders.pay.uploadSlip')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="file-upload"
                  />
                  <button onClick={submit} disabled={!file || submitting} className="btn-primary w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('myOrders.pay.submitting')}</>
                      : t('myOrders.pay.submit')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const firstImg = (img?: string | string[] | null) => (Array.isArray(img) ? img[0] : img) || undefined

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : undefined)

// ── Status timeline (Shopee-style vertical stepper) ────────
const StatusTimeline: React.FC<{ order: Order }> = ({ order }) => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()

  if (order.status === 'cancelled') {
    return (
      <div className="error-alert flex items-center text-sm">
        <AlertCircle className="w-4 h-4 mr-2 shrink-0" />{t('myOrders.detail.cancelled')}
      </div>
    )
  }

  const sr = STATUS_RANK[order.status] ?? 0
  const pr = PAY_RANK[order.payment_status] ?? 0
  const tripType = order.ship?.type === 'sea' ? t('myOrders.timeline.sea') : t('myOrders.timeline.flight')
  const country = order.ship?.destination ? localizedName(order.ship.destination) : ''
  const deposit = (order.payments || []).find((p) => p.payment_type === 'deposit')
  const remaining = (order.payments || []).find((p) => p.payment_type === 'remaining')
  const ArrivedIcon = order.ship?.type === 'sea' ? ShipIcon : PlaneTakeoff

  const steps: { icon: React.ElementType; label: string; sub?: string; done: boolean; date?: string }[] = [
    { icon: FileText, label: t('myOrders.timeline.ordered'), done: true, date: fmtDate(order.cdate) },
    { icon: Banknote, label: t('myOrders.timeline.depositPaid'), done: pr >= 1, date: fmtDate(deposit?.cdate) },
    { icon: ShoppingBag, label: t('myOrders.timeline.purchased'), done: sr >= 1 },
    { icon: Banknote, label: t('myOrders.timeline.balancePaid'), done: pr >= 3, date: fmtDate(remaining?.cdate) },
    {
      icon: ArrivedIcon,
      label: country ? t('myOrders.timeline.arrived', { country }) : t('myOrders.timeline.arrivedGeneric'),
      sub: t('myOrders.timeline.shippedVia', { type: tripType }),
      done: sr >= 2,
      date: fmtDate(order.ship?.ship_date)
    },
    {
      icon: Truck,
      label: t('myOrders.timeline.localDelivery'),
      sub: order.courier_name ? t('myOrders.timeline.localVia', { courier: order.courier_name }) : undefined,
      done: sr >= 3,
      date: fmtDate(order.shipped_date)
    },
    { icon: PackageCheck, label: t('myOrders.timeline.delivered'), done: sr >= 4, date: fmtDate(order.deliv_date) }
  ]

  const currentIdx = steps.findIndex((s) => !s.done)

  return (
    <div className="space-y-0">
      {steps.map((s, i) => {
        const Icon = s.icon
        const isCurrent = i === currentIdx
        const active = s.done || isCurrent
        return (
          <div key={i} className="flex gap-3">
            {/* Rail */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${s.done ? 'bg-primary border-primary text-primary-foreground' : isCurrent ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
              </div>
              {i < steps.length - 1 && <div className={`w-0.5 flex-1 min-h-6 ${s.done ? 'bg-primary' : 'bg-border'}`} />}
            </div>
            {/* Text */}
            <div className={`pb-6 pt-1.5 ${active ? '' : 'opacity-50'}`}>
              <p className={`text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{s.label}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
              {s.date && <p className="text-xs text-muted-foreground mt-0.5">{s.date}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Order detail modal (Shopee-style) ──────────────────────
const OrderDetailModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()
  const shipFee = (order.shipping_fee_jp_th || 0) + (order.shipping_fee_th_th || 0)

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-xl font-mono tracking-wide">{orderNo(order)}</h2>
        <p className="text-sm text-muted-foreground">{t('myOrders.placedOn', { date: new Date(order.cdate).toLocaleString() })}</p>

        <div className="flex gap-2 mt-3">
          <span className={`badge ${badgeClass(fulfillBadge(order.status))}`}>{t(`myOrders.status.${order.status}`)}</span>
          <span className={`badge ${badgeClass(payBadge(order.payment_status))}`}>{t(`myOrders.payment.${order.payment_status}`)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-6">
        {/* Left column: timeline */}
        <section>
          <h3 className="detail-heading">{t('myOrders.timeline.title')}</h3>
          <StatusTimeline order={order} />
        </section>

        {/* Right column */}
        <div>
        {/* Items */}
        <section>
          <h3 className="detail-heading">{t('myOrders.detail.items')}</h3>
          <div className="space-y-2">
            {order.items.map((it, idx) => {
              const label = it.product ? localizedName(it.product) : (it.ticket?.item_name || '—')
              const img = firstImg(it.product?.img) || firstImg(it.ticket?.img)
              return (
                <div key={idx} className="flex items-center gap-3">
                  <img src={getImageUrl(img)} alt={label} className="w-12 h-12 object-cover rounded-md border border-border" />
                  <span className="text-sm flex-1 min-w-0 truncate">{label}</span>
                  <span className="text-sm text-muted-foreground">x{it.quantity}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Shipping & delivery */}
        <section className="mt-5">
          <h3 className="detail-heading"><Truck className="w-4 h-4" />{t('myOrders.detail.shipment')}</h3>
          <div className="rounded-lg border border-border divide-y divide-border text-sm">
            {/* International leg */}
            {order.ship && (
              <div className="p-3 space-y-1">
                <p className="font-medium flex items-center gap-1.5">
                  {order.ship.type === 'sea' ? <ShipIcon className="w-4 h-4 text-primary" /> : <PlaneTakeoff className="w-4 h-4 text-primary" />}
                  {t('myOrders.detail.intlLeg')}
                </p>
                <div className="flex justify-between text-muted-foreground">
                  <span>{order.ship.type === 'sea' ? t('myOrders.sea') : t('myOrders.flight')}</span>
                  <span>{new Date(order.ship.ship_date).toLocaleDateString()}</span>
                </div>
              </div>
            )}
            {/* Local leg */}
            <div className="p-3 space-y-1">
              <p className="font-medium flex items-center gap-1.5"><Truck className="w-4 h-4 text-primary" />{t('myOrders.detail.localLeg')}</p>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('myOrders.detail.courier')}</span>
                <span>{order.courier_name || t('myOrders.detail.notYet')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('myOrders.detail.trackingNo')}</span>
                <span className="font-mono">{order.track_no || t('myOrders.detail.notYet')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('myOrders.detail.shippedDate')}</span>
                <span>{fmtDate(order.shipped_date) || t('myOrders.detail.notYet')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('myOrders.detail.deliveredDate')}</span>
                <span>{fmtDate(order.deliv_date) || t('myOrders.detail.notYet')}</span>
              </div>
            </div>
            {/* Recipient */}
            <div className="p-3">
              <p className="font-medium flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4 text-primary" />{t('myOrders.detail.deliverTo')}</p>
              {order.address ? (
                <div className="text-muted-foreground">
                  <p className="text-foreground font-medium">{order.address.fullname} {order.address.surname}</p>
                  <p>{order.address.address_line}</p>
                  <p>Tel: {order.address.tel}</p>
                </div>
              ) : <p className="text-muted-foreground">{t('myOrders.detail.noAddress')}</p>}
            </div>
          </div>
        </section>

        {/* Totals */}
        <section className="mt-5 border-t border-border pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('myOrders.itemsTotal')}</span>
            <span>฿{(order.item_price_total || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('myOrders.shippingFee')}</span>
            <span>{shipFee > 0 ? `฿${shipFee.toLocaleString()}` : <span className="italic text-muted-foreground">{t('myOrders.pendingCalc')}</span>}</span>
          </div>
          <div className="flex justify-between font-bold pt-1">
            <span>{t('myOrders.grandTotal')}</span>
            <span className="text-primary">{order.grand_total ? `฿${order.grand_total.toLocaleString()}` : <span className="italic text-sm text-muted-foreground font-normal">{t('myOrders.pendingCalc')}</span>}</span>
          </div>
        </section>

        {/* Payments */}
        <section className="mt-5">
          <h3 className="detail-heading"><Receipt className="w-4 h-4" />{t('myOrders.detail.payments')}</h3>
          {(order.payments || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('myOrders.detail.noPayments')}</p>
          ) : (
            <div className="space-y-2">
              {(order.payments || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium">{t('myOrders.detail.paymentType', { type: p.payment_type === 'deposit' ? t('myOrders.detail.deposit') : t('myOrders.detail.remaining') })}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.cdate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">฿{p.amount.toLocaleString()}</span>
                    {p.slip_img && <a href={getImageUrl(p.slip_img)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{t('myOrders.detail.viewSlip')}</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>{/* right column */}
        </div>{/* grid */}

        <button onClick={onClose} className="btn-primary w-full justify-center mt-6">{t('myOrders.detail.close')}</button>
      </div>
    </div>
  )
}

// ── Orders page ────────────────────────────────────────────
export const Orders: React.FC = () => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'orders' | 'requests'>('orders')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [payFor, setPayFor] = useState<{ id: number; type: 'deposit' | 'remaining' } | null>(null)

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/orders/me')).data.data as Order[]
  })
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => (await api.get('/tickets/me')).data.data as Ticket[]
  })

  return (
    <div className="section-container py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{t('myOrders.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('myOrders.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Package className="w-4 h-4 inline mr-1.5" />{t('myOrders.tabOrders')}
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <ClipboardList className="w-4 h-4 inline mr-1.5" />{t('myOrders.tabRequests')}
        </button>
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        ordersLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (orders || []).length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-14 h-14 mx-auto text-border" />
            <h2 className="text-xl font-bold">{t('myOrders.empty')}</h2>
            <p className="text-muted-foreground">{t('myOrders.emptyDesc')}</p>
            <Link to="/catalog" className="btn-primary inline-flex px-6 py-2">{t('myOrders.browse')}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(orders || []).map((order) => {
              const shipFee = (order.shipping_fee_jp_th || 0) + (order.shipping_fee_th_th || 0)
              return (
                <div key={order.id} onClick={() => setDetailOrder(order)} className="card-panel p-5 cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-lg font-mono tracking-wide">{orderNo(order)}</h3>
                      <p className="text-sm text-muted-foreground">{t('myOrders.placedOn', { date: new Date(order.cdate).toLocaleDateString() })}</p>
                      {order.ship && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          {order.ship.type === 'sea' ? <ShipIcon className="w-3.5 h-3.5" /> : <PlaneTakeoff className="w-3.5 h-3.5" />}
                          {t('myOrders.shipVia', {
                            type: order.ship.type === 'sea' ? t('myOrders.sea') : t('myOrders.flight'),
                            date: new Date(order.ship.ship_date).toLocaleDateString()
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`badge ${badgeClass(fulfillBadge(order.status))}`}>{t(`myOrders.status.${order.status}`)}</span>
                      <span className={`badge ${badgeClass(payBadge(order.payment_status))}`}>{t(`myOrders.payment.${order.payment_status}`)}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((it, idx) => {
                      const label = it.product ? localizedName(it.product) : (it.ticket?.item_name || '—')
                      const img = firstImg(it.product?.img) || firstImg(it.ticket?.img)
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <img src={getImageUrl(img)} alt={label} className="w-11 h-11 object-cover rounded-md border border-border" />
                          <span className="text-sm flex-1 min-w-0 truncate">{label}</span>
                          <span className="text-sm text-muted-foreground">x{it.quantity}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('myOrders.itemsTotal')}</span>
                      <span>฿{(order.item_price_total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('myOrders.shippingFee')}</span>
                      <span>{shipFee > 0 ? `฿${shipFee.toLocaleString()}` : <span className="italic text-muted-foreground">{t('myOrders.pendingCalc')}</span>}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1">
                      <span>{t('myOrders.grandTotal')}</span>
                      <span className="text-primary">{order.grand_total ? `฿${order.grand_total.toLocaleString()}` : <span className="italic text-sm text-muted-foreground font-normal">{t('myOrders.pendingCalc')}</span>}</span>
                    </div>
                  </div>

                  {order.track_no && (
                    <p className="text-sm text-muted-foreground mt-3">{t('myOrders.trackNo', { no: order.track_no })}</p>
                  )}

                  {/* Pay action */}
                  {order.payment_status === 'pending_deposit' && (
                    <button onClick={(e) => { e.stopPropagation(); setPayFor({ id: order.id, type: 'deposit' }) }} className="btn-primary w-full mt-4 justify-center">{t('myOrders.payDeposit')}</button>
                  )}
                  {order.payment_status === 'pending_remaining' && (
                    <button onClick={(e) => { e.stopPropagation(); setPayFor({ id: order.id, type: 'remaining' }) }} className="btn-primary w-full mt-4 justify-center">{t('myOrders.payRemaining')}</button>
                  )}

                  <div className="flex items-center justify-end text-sm text-primary mt-3 pt-3 border-t border-border/60">
                    {t('myOrders.viewDetail')}<ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        ticketsLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (tickets || []).length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ClipboardList className="w-14 h-14 mx-auto text-border" />
            <h2 className="text-xl font-bold">{t('myOrders.emptyRequests')}</h2>
            <p className="text-muted-foreground">{t('myOrders.emptyRequestsDesc')}</p>
            <Link to="/request" className="btn-primary inline-flex px-6 py-2">{t('myOrders.makeRequest')}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(tickets || []).map((tk) => (
              <div key={tk.id} className="card-panel p-5 flex gap-4">
                <img src={getImageUrl(firstImg(tk.img))} alt={tk.item_name} className="w-16 h-16 object-cover rounded-md border border-border shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{tk.item_name}</h3>
                      <p className="text-xs text-muted-foreground">{t('myOrders.request.reqNum', { id: tk.id })}</p>
                    </div>
                    <span className={`badge shrink-0 ${badgeClass(tk.status === 'negotiating' ? 'warn' : tk.status === 'rejected' || tk.status === 'cancelled' ? 'muted' : tk.status === 'completed' ? 'ok' : 'info')}`}>
                      {t(`myOrders.request.status.${tk.status}`)}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('myOrders.request.budget')}</p>
                      <p className="font-medium">{tk.expected_price ? `¥${tk.expected_price.toLocaleString()}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('myOrders.request.ourPrice')}</p>
                      <p className="font-medium text-primary">{tk.proposed_price_thb ? `฿${tk.proposed_price_thb.toLocaleString()}` : <span className="italic text-muted-foreground font-normal">{t('myOrders.request.notProposed')}</span>}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}

      {payFor && (
        <PaymentModal
          orderId={payFor.id}
          type={payFor.type}
          onClose={() => setPayFor(null)}
          onPaid={() => qc.invalidateQueries({ queryKey: ['my-orders'] })}
        />
      )}
    </div>
  )
}
