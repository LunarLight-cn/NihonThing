import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Loader2, AlertCircle } from 'lucide-react'
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

export const TrendingItems: React.FC = () => {
  const { addItem } = useCart()
  const { t } = useTranslation()
  const getName = useLocalizedName()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 4 } })
      return res.data.data as Product[]
    }
  })

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl mb-6 md:mb-0">
            <h2 className="text-3xl font-bold text-foreground tracking-tight mb-4">{t('home.trending.title')}</h2>
            <p className="text-muted-foreground">{t('home.trending.subtitle')}</p>
          </div>
          <Link to="/catalog" className="inline-flex items-center space-x-2 text-primary font-medium hover:text-primary/80 transition-colors">
            <span>{t('home.trending.viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center text-destructive bg-destructive/10 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 mr-2" />
            {t('home.trending.errorLoading')}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((item) => (
              <div key={item.id} className="group bg-card rounded-xl overflow-hidden border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20 flex flex-col">
                <Link to={`/product/${item.id}`} className="block aspect-[4/3] overflow-hidden bg-muted relative shrink-0">
                  <img 
                    src={item.img || 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=2942&auto=format&fit=crop'} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span>4.9</span>
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{item.brand || t('home.trending.noBrand')}</p>
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors">{getName(item)}</h3>
                  </Link>
                  <div className="mt-auto pt-4 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary">฿{(item.price_tentative_thb || item.price_thb) ? (item.price_tentative_thb || item.price_thb || 0).toLocaleString() : 'N/A'}</p>
                      <p className="text-xs text-muted-foreground line-through">¥{item.price_tentative_jpy ? item.price_tentative_jpy.toLocaleString() : 'N/A'}</p>
                    </div>
                    <button 
                      onClick={() => addItem({ id: item.id, name: getName(item), brand: item.brand || t('home.trending.noBrand'), price_thb: item.price_tentative_thb || item.price_thb || 0, image: item.img || '' })}
                      className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground font-medium rounded-md transition-colors shrink-0"
                    >
                      {t('home.trending.addToCart')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border text-muted-foreground">
            {t('home.trending.noItems')}
          </div>
        )}
        
        <div className="mt-8 text-center md:hidden">
          <Link to="/catalog" className="inline-flex items-center text-primary font-medium hover:underline">
            {t('home.trending.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
