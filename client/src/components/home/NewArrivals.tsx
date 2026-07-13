import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, AlertCircle, Sparkles, ShoppingBag } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useLocalizedName } from '../../utils/localization'
import { getImageUrl } from '../../utils/image'

interface LocalizedRef {
  id: number
  name_en: string
  name_th: string | null
  name_jp: string | null
}

interface Product {
  id: number
  name: string
  name_th: string | null
  name_jp: string | null
  desc: string | null
  brand: LocalizedRef | null
  price_tentative_jpy: number | null
  price_thb: number | null
  price_tentative_thb: number | null
  img: string[] | null
  tag: string | null
  category_id: number | null
  status: string
}

interface Props {
  hideViewAll?: boolean
}

export const NewArrivals: React.FC<Props> = ({ hideViewAll }) => {
  const { addItem } = useCart()
  const { t } = useTranslation()
  const getName = useLocalizedName()

  const {
    data: products,
    isLoading,
    error
  } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: async () => {
      const res = await api.get('/products/new-arrivals')
      return res.data.data as Product[]
    }
  })

  // Avoid rendering section if empty
  if (!isLoading && (!products || products.length === 0)) return null

  return (
    <section className="pt-8 pb-4">
      <div className="section-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
          <div className="max-w-2xl mb-4 md:mb-0">
            <h2 className="section-title flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              {t('home.newArrivals.title')}
            </h2>
          </div>
          {!hideViewAll && (
            <Link to="/catalog?show=new-arrivals" className="link-view-all">
              <span>{t('home.newArrivals.viewAll')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center text-xs text-destructive bg-destructive/10 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 mr-2" />
            {t('home.newArrivals.failedToLoad')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {products?.map((item) => (
              <div key={item.id} className="product-card group rounded-lg">
                <Link to={`/product/${item.id}`} className="product-card-img-container">
                  <img
                    src={(item.img && item.img.length > 0) ? getImageUrl(item.img[0]) : 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=2942&auto=format&fit=crop'}
                    alt={item.name}
                    className="product-card-img"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">New</div>
                </Link>
                <div className="p-2.5 flex flex-col flex-1">
                  {item.brand && <p className="text-[10px] text-muted-foreground font-medium mb-0.5 line-clamp-1">{getName(item.brand)}</p>}
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-medium text-xs text-foreground line-clamp-2 mb-1.5 hover:text-primary transition-colors leading-tight">{getName(item)}</h3>
                  </Link>
                  <div className="mt-auto pt-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-primary">฿{item.price_tentative_thb || item.price_thb ? (item.price_tentative_thb || item.price_thb || 0).toLocaleString() : 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => addItem({ id: item.id, name: getName(item), brand: (item.brand && getName(item.brand)) || '', price_thb: item.price_tentative_thb || item.price_thb || 0, image: (item.img && item.img.length > 0) ? getImageUrl(item.img[0]) : '' })}
                      className="btn-add-to-cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
