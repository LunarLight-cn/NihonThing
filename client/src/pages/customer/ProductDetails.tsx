import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, Truck, Loader2, AlertCircle, MapPin, Wallet, Clock, Package } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'
import { useLocalizedName, useLocalizedDesc } from '../../utils/localization'
import { getImageUrl } from '../../utils/image'

interface LocalizedRef {
  id: number
  name_en: string
  name_th: string | null
  name_jp: string | null
}

interface Product {
  id: number
  name_en: string
  name_th: string | null
  name_jp: string | null
  desc_en: string | null
  desc_th: string | null
  desc_jp: string | null
  brand: LocalizedRef | null
  price_tentative_jpy: number | null
  price_tentative_thb: number | null
  price_thb: number | null
  img: string[] | null
  options: { name: string; values: string[] }[] | null
  tag: string | null
  category_id: number | null
  status: string
  origin_country: LocalizedRef | null
}

interface Trip {
  id: number
  type: string
  ship_date: string
  close_date: string | null
  status: string
  is_closed: boolean
  fill: { percent: number } | null
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=2942&auto=format&fit=crop'

// Live countdown to a shipping trip's close date - the product page's urgency
// cue, standing in for the reference's per-item timer.
const Countdown: React.FC<{ target: string }> = ({ target }) => {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, new Date(target).getTime() - now)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  const units: [number, string][] = [
    [d, t('product.unitDay')],
    [h, t('product.unitHour')],
    [m, t('product.unitMin')],
    [s, t('product.unitSec')]
  ]

  return (
    <div className="flex gap-2">
      {units.map(([val, label], i) => (
        <div key={i} className="flex flex-col items-center bg-card border border-border rounded-lg px-3 py-1.5 min-w-[3rem]">
          <span className="text-lg font-bold text-primary tabular-nums">{String(val).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { addItem } = useCart()
  const { t } = useTranslation()
  const getName = useLocalizedName()
  const getDesc = useLocalizedDesc()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data.data as Product,
    enabled: !!id
  })

  // Shares the ['ships'] cache with Home and Checkout so ordering (which
  // invalidates that key) refreshes the countdown and fill meter here too.
  const { data: trips } = useQuery({
    queryKey: ['ships'],
    queryFn: async () => (await api.get('/ships')).data.data as Trip[]
  })

  // Soonest trip still taking orders - drives the countdown and fill meter.
  const nextTrip = (trips || [])
    .filter((tr) => !tr.is_closed && tr.status === 'open')
    .sort((a, b) => new Date(a.ship_date).getTime() - new Date(b.ship_date).getTime())[0] ?? null

  if (isLoading) {
    return (
      <div className="section-container loading-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="section-container py-20 text-center">
        <div className="card-soft p-12 max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('product.notFound')}</h2>
          <Link to="/catalog" className="text-primary hover:underline font-medium inline-flex items-center mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('product.back')}
          </Link>
        </div>
      </div>
    )
  }

  const price = product.price_tentative_thb || product.price_thb || 0
  const deposit = price * 0.5
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  const images = product.img && product.img.length > 0 ? product.img : []
  const mainSrc = images.length > 0 ? getImageUrl(images[activeImageIndex]) : PLACEHOLDER
  const allChosen = (product.options || []).every((o) => selectedOptions[o.name])
  // Inactive is hidden from the catalog but reachable by direct URL - treat it
  // like out of stock so the order button stays off (the server rejects too).
  const outOfStock = product.status !== 'active'

  return (
    <div className="section-container py-8">
      <Link to="/catalog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('product.back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 animate-fade-in">
        {/* Gallery */}
        <div>
          <div className="group relative rounded-2xl overflow-hidden bg-secondary aspect-square">
            {product.origin_country && (
              <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span>{getName(product.origin_country)}</span>
              </div>
            )}
            <img
              src={mainSrc}
              alt={getName(product)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${activeImageIndex === idx ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                >
                  <img src={getImageUrl(url)} alt={`${getName(product)} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-5">
            {product.brand && <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">{getName(product.brand)}</p>}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{getName(product)}</h1>
          </div>

          <div className="mb-6">
            <p className="text-4xl font-bold text-primary">฿{fmt(price)}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('product.tentativePrice')}</p>
            <p className="text-sm text-muted-foreground">{t('product.excludesShipping')}</p>
          </div>

          {/* Deposit split - our installment, in place of the reference's Klarna row */}
          <div className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl px-4 py-3 mb-6">
            <Wallet className="w-5 h-5 text-primary shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-foreground">{t('product.depositLabel', { amount: fmt(deposit) })}</span>
              <span className="text-muted-foreground"> {t('product.depositHint')}</span>
            </div>
          </div>

          {/* Next trip: countdown + how full it is (real social proof from capacity) */}
          {nextTrip && (
            <div className="card-soft p-4 mb-6 hover:translate-y-0 hover:shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  {nextTrip.close_date
                    ? t('product.closesBy', { date: new Date(nextTrip.close_date).toLocaleDateString() })
                    : t('product.nextTrip')}
                </span>
                {nextTrip.fill && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    {t('product.filling', { pct: Math.round(nextTrip.fill.percent) })}
                  </span>
                )}
              </div>
              {nextTrip.close_date && <Countdown target={nextTrip.close_date} />}
              {nextTrip.fill && (
                <div className="progress-track mt-3">
                  <div
                    className={`progress-fill ${nextTrip.fill.percent >= 80 ? 'progress-fill-warning' : 'progress-fill-primary'}`}
                    style={{ width: `${Math.max(nextTrip.fill.percent, 2)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <p className="text-foreground leading-relaxed mb-6">{getDesc(product) || t('product.noDesc')}</p>

          {/* Options as chips */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-4 mb-6">
              {product.options.map((opt) => (
                <div key={opt.name}>
                  <p className="text-sm font-semibold mb-2">{opt.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))}
                        className={`chip ${selectedOptions[opt.name] === val ? 'is-active' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-muted-foreground">
              <ShieldCheck className="w-5 h-5 text-primary mr-3" />
              {t('product.authentic')}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Truck className="w-5 h-5 text-primary mr-3" />
              {t('product.delivery')}
            </div>
          </div>

          <button
            onClick={() =>
              addItem({
                id: product.id,
                name: getName(product),
                brand: (product.brand && getName(product.brand)) || t('product.noBrand'),
                price_thb: price,
                image: images.length > 0 ? getImageUrl(images[0]) : '',
                selectedOptions: (product.options && product.options.length > 0) ? selectedOptions : undefined
              })
            }
            className="btn-pill btn-pill-primary w-full py-3.5 text-base"
            disabled={outOfStock || !allChosen}
          >
            {outOfStock ? t('product.outOfStock') : t('product.addToCart')}
          </button>
          {!outOfStock && !allChosen && (
            <p className="text-sm text-muted-foreground mt-2 text-center">{t('product.selectOptions')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
