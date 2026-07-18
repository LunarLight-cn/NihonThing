import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchAllProducts } from '../../services/api'
import { useLocalizedName } from '../../utils/localization'
import { getImageUrl } from '../../utils/image'

interface LocRef {
  id: number
  name_en: string
  name_th: string | null
  name_jp: string | null
}

interface SearchProduct extends LocRef {
  brand: LocRef | null
  category: LocRef | null
  tag: string | null
  price_tentative_thb: number | null
  price_thb: number | null
  img: string[] | null
}

const MAX_RESULTS = 6

// Top-bar search with a dropdown that eases open on focus and shows a spinner
// while the catalog loads, then live-filters as you type.
export const NavSearch: React.FC = () => {
  const { t } = useTranslation()
  const getName = useLocalizedName()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Catalog is fetched once, on first open; the spinner covers this window.
  const { data: products, isLoading } = useQuery({
    queryKey: ['nav-search-products'],
    queryFn: async () => await fetchAllProducts<SearchProduct>(),
    enabled: open
  })

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const results = (products || [])
    .filter((p) => {
      if (!q) return true
      const parts = [
        getName(p), p.name_en, p.name_th, p.name_jp,
        p.brand && getName(p.brand), p.brand?.name_en, p.brand?.name_th, p.brand?.name_jp,
        p.tag,
        p.category && getName(p.category), p.category?.name_en, p.category?.name_th, p.category?.name_jp
      ]
      return parts.filter(Boolean).join(' ').toLowerCase().includes(q)
    })
    .slice(0, MAX_RESULTS)

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t('catalog.search')}
          className="w-full pl-9 pr-9 py-2 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={`dropdown-panel left-0 right-0 mt-2 max-h-[70vh] overflow-y-auto ${open ? 'is-open' : ''}`}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="spinner" />
          </div>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center text-muted-foreground">{t('catalog.noResults')}</p>
        ) : (
          <div className="p-2">
            {results.map((p) => {
              const price = p.price_tentative_thb || p.price_thb || 0
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <img
                    src={p.img && p.img.length > 0 ? getImageUrl(p.img[0]) : ''}
                    alt={getName(p)}
                    className="w-10 h-10 rounded-md object-cover bg-muted shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{getName(p)}</p>
                    {p.brand && <p className="text-xs text-muted-foreground truncate">{getName(p.brand)}</p>}
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0">฿{price.toLocaleString()}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
