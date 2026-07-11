import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Search, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'
import { useLocalizedName } from '../../utils/localization'

interface Category {
  id: number
  name_th: string
  name_en: string
  name_jp: string | null
}

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
  category: Category | null
  status: string
  origin_country: string | null
}

export const Catalog: React.FC = () => {
  const { t } = useTranslation()
  const getName = useLocalizedName()
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const [activeBrand, setActiveBrand] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const { addItem } = useCart()

  // Fetch categories from API
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories')
      return res.data.data as Category[]
    }
  })

  // Fetch products from API
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', activeCategoryId],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 }
      if (activeCategoryId) params.category_id = activeCategoryId
      const res = await api.get('/products', { params })
      return res.data.data as Product[]
    }
  })

  // Extract unique brands from products data
  const brands = useMemo(() => {
    if (!products) return []
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[]
    return uniqueBrands.sort()
  }, [products])

  const filteredProducts = (products || []).filter(p => {
    if (activeBrand && p.brand !== activeBrand) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-foreground mb-4">{t('catalog.title')}</h1>
        <p className="text-muted-foreground">{t('catalog.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 font-bold text-lg mb-6 text-foreground">
              <Filter className="w-5 h-5" />
              <span>{t('catalog.filters')}</span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('catalog.categories')}</h3>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={() => setActiveCategoryId(null)}
                      className={`text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${activeCategoryId === null ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                      {t('catalog.allCategories')}
                    </button>
                  </li>
                  {(categories || []).map(cat => (
                    <li key={cat.id}>
                      <button 
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${activeCategoryId === cat.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
                      >
                        {getName(cat)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('catalog.brands')}</h3>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={() => setActiveBrand('')}
                      className={`text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${activeBrand === '' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
                    >
                      {t('catalog.allBrands')}
                    </button>
                  </li>
                  {brands.map(brand => (
                    <li key={brand}>
                      <button 
                        onClick={() => setActiveBrand(brand)}
                        className={`text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${activeBrand === brand ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
                      >
                        {brand}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
            <h1 className="text-3xl font-bold text-foreground">{t('catalog.title')}</h1>
            <div className="flex items-center space-x-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder={t('catalog.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                />
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{t('catalog.sortBy')}</span>
                <button className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-colors">
                  <span>{t('catalog.recommended')}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center text-destructive bg-destructive/10 p-4 rounded-xl">
              <AlertCircle className="w-5 h-5 mr-2" />
              {t('catalog.errorLoading')}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="group bg-card rounded-xl overflow-hidden border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20 flex flex-col">
                  <Link to={`/product/${product.id}`} className="block aspect-square overflow-hidden bg-muted relative shrink-0">
                    <img 
                      src={product.img || 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=2942&auto=format&fit=crop'} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-muted-foreground font-medium mb-1">{product.brand || t('catalog.noBrand')}</p>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors">{getName(product)}</h3>
                    </Link>
                    <div className="mt-auto pt-4 flex items-end justify-between">
                      <p className="text-lg font-bold text-primary">฿{(product.price_tentative_thb || product.price_thb) ? (product.price_tentative_thb || product.price_thb || 0).toLocaleString() : 'N/A'}</p>
                      <button 
                        onClick={() => addItem({ id: product.id, name: getName(product), brand: product.brand || t('catalog.noBrand'), price_thb: product.price_tentative_thb || product.price_thb || 0, image: product.img || '' })}
                        className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground font-medium rounded-md transition-colors shrink-0"
                      >
                        {t('catalog.addToCart')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">{t('catalog.noProducts')}</p>
              <button 
                onClick={() => { setActiveBrand(''); setActiveCategoryId(null); setSearchQuery('') }}
                className="text-primary font-medium hover:underline mt-2"
              >
                {t('catalog.clearFilters')}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
