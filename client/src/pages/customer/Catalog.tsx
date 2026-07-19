import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ShoppingBag, Filter, SlidersHorizontal, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, fetchAllProducts } from '../../services/api'
import { useCart } from '../../contexts/CartContext'
import { useTranslation } from 'react-i18next'
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
  category?: { id: number; name_en: string; name_th: string; name_jp: string | null }
}

interface Category {
  id: number
  name_en: string
  name_th: string
  name_jp: string | null
}

export const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const showParam = searchParams.get('show')
  const { addItem } = useCart()
  const { t } = useTranslation()
  const getName = useLocalizedName()
  const [search, setSearch] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(showParam || null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', 'catalog', selectedCollection],
    queryFn: async () => {
      if (selectedCollection === 'new-arrivals' || selectedCollection === 'trending') {
        const res = await api.get(`/products/${selectedCollection}`)
        return res.data.data as Product[]
      }
      return await fetchAllProducts<Product>()
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories')
      return res.data.data as Category[]
    }
  })

  // Unique brands (localized display names)
  const brands = [...new Set(products?.map((p) => (p.brand ? getName(p.brand) : null)).filter(Boolean) as string[] || [])]

  const filteredProducts = products?.filter((p) => {
    // Inactive is an admin-side state; customers never see those items.
    if (p.status === 'inactive') return false
    const brandName = p.brand ? getName(p.brand) : ''
    if (selectedCategory && p.category_id !== selectedCategory) return false
    if (selectedBrand && brandName !== selectedBrand) return false
    if (search) {
      const q = search.toLowerCase()
      const cat = p.category
      const parts = [
        getName(p), (p as { name_en?: string }).name_en, p.name_th, p.name_jp,
        brandName, p.brand?.name_en, p.brand?.name_th, p.brand?.name_jp,
        p.tag,
        cat ? getName(cat) : '', cat?.name_en, cat?.name_th, cat?.name_jp
      ]
      const hay = parts.filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    }
    return true
  })

  const handleCollectionChange = (collection: string | null) => {
    setSelectedCollection(collection)
    if (collection) {
      setSearchParams({ show: collection })
    } else {
      setSearchParams({})
    }
  }

  const clearFilters = () => {
    handleCollectionChange(null)
    setSelectedCategory(null)
    setSelectedBrand(null)
    setSearch('')
  }

  return (
    <div className="py-8">
      <div className="section-container">
        {/* Hero banner - rounded asymmetric panel, Japanese red on washi white */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground mb-8 animate-fade-in">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary-foreground/10" />
          <div className="absolute -right-4 bottom-0 w-40 h-40 rounded-full bg-primary-foreground/10" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-2">{t('catalog.heroKicker')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">{t('catalog.heroTitle')}</h2>
            <p className="text-sm opacity-90 mb-5 max-w-md">{t('catalog.heroSubtitle')}</p>
            <button onClick={() => handleCollectionChange('new-arrivals')} className="btn-pill btn-pill-outline bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/25">
              {t('home.newArrivals.title')}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="card-panel sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  {t('catalog.filters')}
                </h3>
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary underline">
                  {t('catalog.clearFilters')}
                </button>
              </div>
              {/* Collections */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('catalog.collections')}</h4>
                <div className="space-y-1">
                  <button onClick={() => handleCollectionChange(null)} className={`filter-btn ${!selectedCollection ? 'is-active' : ''}`}>
                    {t('catalog.allProducts')}
                  </button>
                  <button onClick={() => handleCollectionChange('new-arrivals')} className={`filter-btn ${selectedCollection === 'new-arrivals' ? 'is-active' : ''}`}>
                    {t('home.newArrivals.title')}
                  </button>
                  <button onClick={() => handleCollectionChange('trending')} className={`filter-btn ${selectedCollection === 'trending' ? 'is-active' : ''}`}>
                    {t('home.trending.title')}
                  </button>
                </div>
              </div>
              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('catalog.categories')}</h4>
                <div className="space-y-1">
                  <button onClick={() => setSelectedCategory(null)} className={`filter-btn ${!selectedCategory ? 'is-active' : ''}`}>
                    {t('catalog.allCategories')}
                  </button>
                  {categories?.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`filter-btn ${selectedCategory === cat.id ? 'is-active' : ''}`}>
                      {getName(cat)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Brands */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('catalog.brands')}</h4>
                <div className="space-y-1">
                  <button onClick={() => setSelectedBrand(null)} className={`filter-btn ${!selectedBrand ? 'is-active' : ''}`}>
                    {t('catalog.allBrands')}
                  </button>
                  {brands.map((brand) => (
                    <button key={brand} onClick={() => setSelectedBrand(brand!)} className={`filter-btn ${selectedBrand === brand ? 'is-active' : ''}`}>
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="section-title-lg">{t('catalog.title')}</h1>
                <p className="text-muted-foreground text-sm mt-1">{filteredProducts?.length || 0} {t('catalog.itemsFound')}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('catalog.search')} className="pl-9 pr-4 py-2 border border-border rounded-lg bg-card text-sm w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary" />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden p-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="card-panel mb-6 lg:hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{t('catalog.filters')}</h3>
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary underline">
                    {t('catalog.clearFilters')}
                  </button>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('catalog.collections')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleCollectionChange(null)} className={`filter-btn ${!selectedCollection ? 'is-active' : ''}`}>
                      {t('catalog.allProducts')}
                    </button>
                    <button onClick={() => handleCollectionChange('new-arrivals')} className={`filter-btn ${selectedCollection === 'new-arrivals' ? 'is-active' : ''}`}>
                      {t('home.newArrivals.title')}
                    </button>
                    <button onClick={() => handleCollectionChange('trending')} className={`filter-btn ${selectedCollection === 'trending' ? 'is-active' : ''}`}>
                      {t('home.trending.title')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('catalog.categories')}</h4>
                    <div className="space-y-1">
                      <button onClick={() => setSelectedCategory(null)} className={`filter-btn ${!selectedCategory ? 'is-active' : ''}`}>
                        {t('catalog.allCategories')}
                      </button>
                      {categories?.map((cat) => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`filter-btn ${selectedCategory === cat.id ? 'is-active' : ''}`}>
                          {getName(cat)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('catalog.brands')}</h4>
                    <div className="space-y-1">
                      <button onClick={() => setSelectedBrand(null)} className={`filter-btn ${!selectedBrand ? 'is-active' : ''}`}>
                        {t('catalog.allBrands')}
                      </button>
                      {brands.map((brand) => (
                        <button key={brand} onClick={() => setSelectedBrand(brand!)} className={`filter-btn ${selectedBrand === brand ? 'is-active' : ''}`}>
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="loading-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="error-alert">
                <AlertCircle className="w-5 h-5 mr-2" />
                {t('catalog.errorLoading')}
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((item) => (
                  <div key={item.id} className="product-card group">
                    <Link to={`/product/${item.id}`} className="product-card-img-container">
                      <img
                        src={(item.img && item.img.length > 0) ? getImageUrl(item.img[0]) : 'https://images.unsplash.com/photo-1582793988951-9aed5509eb97?q=80&w=2942&auto=format&fit=crop'}
                        alt={item.name}
                        className="product-card-img"
                      />
                    </Link>
                    <div className="p-3 flex flex-col flex-1">
                      {item.brand && <p className="text-xs text-muted-foreground font-medium mb-1">{getName(item.brand)}</p>}
                      <Link to={`/product/${item.id}`}>
                        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors">{getName(item)}</h3>
                      </Link>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <p className="text-base font-bold text-primary">
                          ฿{item.price_tentative_thb || item.price_thb ? (item.price_tentative_thb || item.price_thb || 0).toLocaleString() : 'N/A'}
                        </p>
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
            ) : (
              <div className="empty-state">
                <p className="text-lg font-medium">{t('catalog.noResults')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
