import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Package, Loader2, PlaneTakeoff, Ship as ShipIcon,
  QrCode, Upload, AlertCircle, CheckCircle2, X, ClipboardList
} from 'lucide-react'
import { api } from '../../services/api'
import { getImageUrl } from '../../utils/image'
import { useLocalizedName } from '../../utils/localization'

interface OrderItem {
  quantity: number
  product?: { id: number; name_en?: string; name_th?: string; name_jp?: string; img?: string[] } | null
  ticket?: { id: number; item_name: string; img?: string | string[] } | null
}
interface Order {
  id: number
  cdate: string
  status: string
  payment_status: string
  item_price_total: number
  shipping_fee_jp_th?: number | null
  shipping_fee_th_th?: number | null
  grand_total?: number | null
  track_no?: string | null
  ship?: { type: string; ship_date: string } | null
  items: OrderItem[]
}
interface Ticket {
  id: number
  item_name: string
  img?: string | string[]
  status: string
  expected_price?: number | null
  proposed_price_thb?: number | null
}

const badgeClass = (kind: 'ok' | 'warn' | 'muted' | 'info') => ({
  ok: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  muted: 'bg-muted text-muted-foreground',
  info: 'bg-primary/10 text-primary'
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
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
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
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

// ── Orders page ────────────────────────────────────────────
export const Orders: React.FC = () => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'orders' | 'requests'>('orders')
  const [payFor, setPayFor] = useState<{ id: number; type: 'deposit' | 'remaining' } | null>(null)

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/orders/me')).data.data as Order[]
  })
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => (await api.get('/tickets/me')).data.data as Ticket[]
  })

  const firstImg = (img?: string | string[]) => Array.isArray(img) ? img[0] : img

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
                <div key={order.id} className="card-panel p-5">
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{t('myOrders.orderNum', { id: order.id })}</h3>
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
                    <button onClick={() => setPayFor({ id: order.id, type: 'deposit' })} className="btn-primary w-full mt-4 justify-center">{t('myOrders.payDeposit')}</button>
                  )}
                  {order.payment_status === 'pending_remaining' && (
                    <button onClick={() => setPayFor({ id: order.id, type: 'remaining' })} className="btn-primary w-full mt-4 justify-center">{t('myOrders.payRemaining')}</button>
                  )}
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
