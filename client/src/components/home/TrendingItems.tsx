import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useLocalizedName } from '../../utils/localization'

interface Product {
  id: number
  name: string
  name_th: string | null
  name_jp: string | null
  desc: string | null
  brand: string | null
  price_tentative_jpy: number | null
  price_thb: number | null
  price_tentative_thb: number | null
  img: string | null
  tag: string | null
  category_id: number | null
  status: string
}

interface Props {
  hideViewAll?: boolean
  areaId?: number
  title?: string
}

export const TrendingItems: React.FC<Props> = ({ hideViewAll, areaId, title }) => {
  const { addItem } = useCart()
  const { t } = useTranslation()
  const getName = useLocalizedName()

  const {
    data: products,
    isLoading,
    error
  } = useQuery({
    queryKey: ['products', 'trending', areaId],
    queryFn: async () => {
      const url = areaId ? `/products/trending?area_id=${areaId}` : `/products/trending`
      const res = await api.get(url)
      return res.data.data as Product[]
    }
  })

  return (
    <section className="pt-4 pb-12 bg-secondary/30">
      <div className="section-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div className="max-w-2xl mb-6 md:mb-0">
            <h2 className="section-title mb-4">{title || t('home.trending.title')}</h2>
          </div>
          {!hideViewAll && (
            <Link to="/catalog?show=trending" className="link-view-all">
              <span>{t('home.trending.viewAll')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="loading-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="error-alert">
            <AlertCircle className="w-5 h-5 mr-2" />
            {t('home.trending.errorLoading')}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((item) => (
              <div key={item.id} className="product-card group">
                <Link to={`/product/${item.id}`} className="product-card-img-container">
                  <img
                    src={(item.img && item.img.length > 0) ? item.img[0] : 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=2942&auto=format&fit=crop'}
                    alt={item.name}
                    className="product-card-img"
                  />
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  {item.brand && <p className="text-xs text-muted-foreground font-medium mb-1">{item.brand}</p>}
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors">{getName(item)}</h3>
                  </Link>
                  <div className="mt-auto pt-4 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary">฿{item.price_tentative_thb || item.price_thb ? (item.price_tentative_thb || item.price_thb || 0).toLocaleString() : 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => addItem({ id: item.id, name: getName(item), brand: item.brand || '', price_thb: item.price_tentative_thb || item.price_thb || 0, image: (item.img && item.img.length > 0) ? item.img[0] : '' })}
                      className="btn-add-to-cart"
                    >
                      {t('home.trending.addToCart')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">{t('home.trending.noItems')}</div>
        )}

        {!hideViewAll && (
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/catalog?show=trending"
              className="inline-flex items-center text-primary font-medium hover:underline"
            >
              {t('home.trending.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
