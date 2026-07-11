import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, ShieldCheck, ArrowLeft, Truck, Loader2, AlertCircle, MapPin } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'
import { useLocalizedName, useLocalizedDesc } from '../../utils/localization'

interface Product {
  id: number
  name_en: string
  name_th: string | null
  name_jp: string | null
  desc_en: string | null
  desc_th: string | null
  desc_jp: string | null
  brand: string | null
  price_tentative_jpy: number | null
  price_tentative_thb: number | null
  price_thb: number | null
  img: string | null
  tag: string | null
  category_id: number | null
  status: string
  origin_country: string | null
}

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { addItem } = useCart()
  const { t } = useTranslation()
  const getName = useLocalizedName()
  const getDesc = useLocalizedDesc()
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`)
      return res.data.data as Product
    },
    enabled: !!id
  })

  return (
    <div className="container mx-auto px-4">
      <Link 
        to="/catalog" 
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('product.back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-card border border-border rounded-2xl p-6 lg:p-12 shadow-sm">
        {isLoading ? (
          <div className="col-span-2 flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : error || !product ? (
          <div className="container mx-auto px-4 py-20 text-center">
            <div className="bg-card border border-border rounded-xl p-12 max-w-lg mx-auto shadow-sm">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('product.notFound')}</h2>
              <Link to="/catalog" className="text-primary hover:underline font-medium inline-flex items-center mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('product.back')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Product Image */}
            <div className="rounded-xl overflow-hidden bg-secondary relative">
              {product.origin_country && (
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full border border-border shadow-sm z-10 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>{product.origin_country}</span>
                </div>
              )}
              <img 
                src={product.img || 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=2942&auto=format&fit=crop'} 
                alt={getName(product)} 
                className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="mb-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                  {product.brand || t('product.noBrand')}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                  {getName(product)}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('product.noReviews')}</span>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-4xl font-bold text-primary mb-1">฿{(product.price_tentative_thb || product.price_thb || 0).toLocaleString()}</p>
                {product.price_tentative_jpy && (
                  <p className="text-sm text-muted-foreground line-through">¥{product.price_tentative_jpy.toLocaleString()} {t('product.estRetail')}</p>
                )}
              </div>

              <p className="text-foreground leading-relaxed mb-8">
                {getDesc(product) || t('product.noDesc')}
              </p>

              <div className="space-y-4 mb-8">
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
                onClick={() => addItem({ id: product.id, name: getName(product), brand: product.brand || t('product.noBrand'), price_thb: product.price_tentative_thb || product.price_thb || 0, image: product.img || '' })}
                className="w-full py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                disabled={product.status === 'out_of_stock'}
              >
                {product.status === 'out_of_stock' ? t('product.outOfStock') : t('product.addToCart')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
