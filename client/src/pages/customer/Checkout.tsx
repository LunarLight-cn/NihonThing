import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ShoppingBag, Loader2, MapPin, PlaneTakeoff, Ship as ShipIcon,
  Calendar, CheckCircle2, QrCode, Upload, AlertCircle
} from 'lucide-react'
import { api } from '../../services/api'
import { useCart } from '../../contexts/CartContext'
import { getImageUrl } from '../../utils/image'

interface Trip {
  id: number
  type: string
  ship_date: string
  status: string
  max_cap: string
  current_cap: string
  is_closed: boolean
}

interface Address {
  id: number
  title?: string
  fullname: string
  surname: string
  tel: string
  address_line: string
}

type Step = 'review' | 'payment' | 'done'

export const Checkout: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()

  const [step, setStep] = useState<Step>('review')
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Created order + payment
  const [orderId, setOrderId] = useState<number | null>(null)
  const [qr, setQr] = useState<{ amount: number; qrBase64: string } | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [submittingSlip, setSubmittingSlip] = useState(false)

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['ships'],
    queryFn: async () => (await api.get('/ships')).data.data as Trip[]
  })

  const { data: addresses, isLoading: addrLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: async () => (await api.get('/users/me/addresses')).data.data as Address[]
  })

  const openTrips = (trips || []).filter((tr) => !tr.is_closed && tr.status !== 'closed')

  const handlePlaceOrder = async () => {
    if (!selectedTrip || !selectedAddress) return
    setPlacing(true)
    setError(null)
    try {
      const res = await api.post('/orders', {
        trip_id: selectedTrip,
        address_id: selectedAddress,
        items: items.map((i) => ({ type: 'product' as const, id: i.id, quantity: i.quantity, options: i.selectedOptions }))
      })
      const newId = res.data.data.id as number
      setOrderId(newId)
      clearCart()
      setStep('payment')
      loadQr(newId)
    } catch (e: any) {
      setError(e.response?.data?.message || t('checkout.orderError'))
    } finally {
      setPlacing(false)
    }
  }

  const loadQr = async (id: number) => {
    setQrLoading(true)
    setError(null)
    try {
      const res = await api.get('/payments/qrcode', { params: { order_id: id, type: 'deposit' } })
      setQr(res.data.data)
    } catch (e: any) {
      setError(e.response?.data?.message || t('checkout.qrError'))
    } finally {
      setQrLoading(false)
    }
  }

  const handleSubmitSlip = async () => {
    if (!slipFile || !orderId || !qr) return
    setSubmittingSlip(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('order_id', String(orderId))
      form.append('amount', String(qr.amount))
      form.append('payment_type', 'deposit')
      form.append('file', slipFile)
      await api.post('/payments/slip', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setStep('done')
    } catch (e: any) {
      setError(e.response?.data?.message || t('checkout.slipError'))
    } finally {
      setSubmittingSlip(false)
    }
  }

  // Empty cart (and not mid-flow)
  if (items.length === 0 && step === 'review') {
    return (
      <div className="section-container py-16 text-center space-y-4">
        <ShoppingBag className="w-14 h-14 mx-auto text-border" />
        <h1 className="text-2xl font-bold text-foreground">{t('checkout.empty')}</h1>
        <p className="text-muted-foreground">{t('checkout.emptyDesc')}</p>
        <Link to="/catalog" className="btn-primary inline-flex px-6 py-2">{t('checkout.browseCatalog')}</Link>
      </div>
    )
  }

  return (
    <div className="section-container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-foreground mb-6">{t('checkout.title')}</h1>

      {error && (
        <div className="error-alert mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          {error}
        </div>
      )}

      {step === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: selections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip */}
            <section className="card-panel p-5">
              <h2 className="font-bold text-lg mb-1">{t('checkout.selectTrip')}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t('checkout.selectTripHint')}</p>
              {tripsLoading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : openTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('checkout.noTrips')}</p>
              ) : (
                <div className="space-y-2">
                  {openTrips.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => setSelectedTrip(tr.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${selectedTrip === tr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        {tr.type === 'sea'
                          ? <ShipIcon className="w-4 h-4 text-primary" />
                          : <PlaneTakeoff className="w-4 h-4 text-primary" />}
                        {tr.type.charAt(0).toUpperCase() + tr.type.slice(1)}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {t('checkout.shipDate', { date: new Date(tr.ship_date).toLocaleDateString() })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Address */}
            <section className="card-panel p-5">
              <h2 className="font-bold text-lg mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                {t('checkout.selectAddress')}
              </h2>
              {addrLoading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (addresses || []).length === 0 ? (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>{t('checkout.noAddresses')}</p>
                  <Link to="/settings" className="text-primary font-medium hover:underline">{t('checkout.addAddress')}</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {(addresses || []).map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{addr.title || `${addr.fullname} ${addr.surname}`}</span>
                        {addr.title && <span className="text-sm text-muted-foreground">{addr.fullname} {addr.surname}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{addr.address_line}</p>
                      <p className="text-sm text-muted-foreground">Tel: {addr.tel}</p>
                    </button>
                  ))}
                  <Link to="/settings" className="inline-block text-sm text-primary hover:underline pt-1">{t('checkout.manageAddresses')}</Link>
                </div>
              )}
            </section>
          </div>

          {/* Right: summary */}
          <div className="space-y-4">
            <section className="card-panel p-5">
              <h2 className="font-bold text-lg mb-4">{t('checkout.orderSummary')}</h2>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.lineId} className="flex gap-3">
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-14 h-14 object-cover rounded-md border border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-xs text-muted-foreground">{Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                      )}
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary whitespace-nowrap">฿{(item.price_thb * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('checkout.subtotal')}</span>
                  <span className="font-medium">฿{totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('checkout.shippingNote')}</p>
              </div>
              <p className="text-xs text-muted-foreground italic mt-4">{t('checkout.tentativeNote')}</p>
              <button
                onClick={handlePlaceOrder}
                disabled={!selectedTrip || !selectedAddress || placing}
                className="btn-primary-lg w-full mt-4 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('checkout.placing')}</>
                  : t('checkout.placeOrder')}
              </button>
            </section>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="max-w-md mx-auto card-panel p-6 text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold">{t('checkout.orderCreated', { id: orderId })}</span>
          </div>

          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            {t('checkout.payTitle')}
          </h2>

          {qrLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : qr ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">{t('checkout.depositAmount')}</p>
                <p className="text-3xl font-bold text-primary">฿{qr.amount.toLocaleString()}</p>
              </div>
              <img src={qr.qrBase64} alt="PromptPay QR" className="w-56 h-56 mx-auto" />
              <p className="text-sm text-muted-foreground">{t('checkout.scanToPay')}</p>

              <div className="border-t border-border pt-5 space-y-3 text-left">
                <label className="font-medium text-sm flex items-center">
                  <Upload className="w-4 h-4 mr-2 text-primary" />
                  {t('checkout.uploadSlip')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                  className="file-upload"
                />
                <button
                  onClick={handleSubmitSlip}
                  disabled={!slipFile || submittingSlip}
                  className="btn-primary w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingSlip
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('checkout.submitting')}</>
                    : t('checkout.submitSlip')}
                </button>
              </div>
            </>
          ) : null}

          <button onClick={() => navigate('/orders')} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            {t('checkout.payLater')}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="max-w-md mx-auto text-center py-12 space-y-4">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
          <h2 className="text-2xl font-bold">{t('checkout.doneTitle')}</h2>
          <p className="text-muted-foreground">{t('checkout.doneDesc')}</p>
          <div className="flex gap-3 justify-center pt-2">
            <Link to="/orders" className="btn-primary px-6 py-2">{t('checkout.viewOrders')}</Link>
            <Link to="/catalog" className="btn-secondary px-6">{t('checkout.continueShopping')}</Link>
          </div>
        </div>
      )}
    </div>
  )
}
