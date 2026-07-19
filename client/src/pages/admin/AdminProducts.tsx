import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api, fetchAllProducts } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import { SearchableSelect } from '../../components/admin/SearchableSelect'
import { SearchableMultiSelect } from '../../components/admin/SearchableMultiSelect'
import type { ColumnDef } from '@tanstack/react-table'
import { Package, Tags, Plus, Loader2, Save, X, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Product {
  id: number
  name_en: string
  name_th: string
  name_jp: string
  desc_en: string
  desc_th: string
  desc_jp: string
  brand_id?: number
  origin_country_id?: number
  brand?: { id: number, name_en: string }
  origin_country?: { id: number, name_en: string }
  price_tentative_thb: number
  price_tentative_jpy: number
  amount: number
  status: 'active' | 'inactive' | 'out_of_stock'
  img: string[]
  tag?: string
}

interface Category {
  id: number
  name_en: string
  name_th: string
  name_jp: string
}

interface Brand {
  id: number
  name_en: string
  name_th: string
  name_jp: string
  status: 'active' | 'inactive'
}

export const AdminProducts: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // An agent retires a product by setting it inactive; deleting is the admin's.
  const { user } = useAuth()
  const canDelete = user?.role !== 'agent'
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands'>('products')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null)

  // -- Queries --
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => await fetchAllProducts<Product>()
  })

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/categories')
      return res.data.data as Category[]
    }
  })

  const { data: shops } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: async () => {
      const res = await api.get('/shops')
      return res.data.data
    }
  })

  const { data: brands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const res = await api.get('/brands')
      return res.data.data
    }
  })

  const { data: countries } = useQuery({
    queryKey: ['admin-countries'],
    queryFn: async () => {
      const res = await api.get('/locations/countries')
      return res.data.data
    }
  })

  // -- Mutations --
  const addProductMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { shopIds, ...productPayload } = payload
      const res = await api.post('/products', productPayload)
      const newProductId = res.data.data.id

      if (shopIds && shopIds.length > 0 && shops) {
        for (const shopId of shopIds) {
          const shop = shops.find((s: any) => s.id === shopId)
          if (shop) {
            await api.post('/product-locations', {
              product_id: newProductId,
              area_id: shop.area_id,
              shop_id: shop.id
            })
          }
        }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      // Customers read the same products under ['products'] (catalog, new
      // arrivals, trending) and ['product', id] (detail page).
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      setIsAddingProduct(false)
      setEditingProductId(null)
    }
  })

  const updateProductStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/products/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      // Customers read the same products under ['products'] (catalog, new
      // arrivals, trending) and ['product', id] (detail page).
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    }
  })

  const editProductMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { shopIds, ...productPayload } = payload
      const res = await api.put(`/products/${id}`, productPayload)

      try {
        const existingRes = await api.get(`/product-locations/product/${id}`)
        const existingLocations = existingRes.data.data
        for (const loc of existingLocations) {
          await api.delete(`/product-locations/${loc.id}`)
        }
      } catch (e) {
        console.error('Failed to delete existing locations', e)
      }

      if (shopIds && shopIds.length > 0 && shops) {
        for (const shopId of shopIds) {
          const shop = shops.find((s: any) => s.id === shopId)
          if (shop) {
            await api.post('/product-locations', {
              product_id: id,
              area_id: shop.area_id,
              shop_id: shop.id
            })
          }
        }
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      // Customers read the same products under ['products'] (catalog, new
      // arrivals, trending) and ['product', id] (detail page).
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      setIsAddingProduct(false)
      setEditingProductId(null)
    }
  })

  const addCategoryMutation = useMutation({
    mutationFn: (newCategory: Partial<Category>) => api.post('/categories', newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsAddingCategory(false)
    }
  })

  const editCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Category> }) => api.put(`/categories/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsAddingCategory(false)
      setEditingCategoryId(null)
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    }
  })

  const addBrandMutation = useMutation({
    mutationFn: (name: string) => api.post('/brands', { name_en: name, name_th: name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      setProductForm(prev => ({ ...prev, brand_id: res.data.data.id }))
    }
  })

  const addCountryMutation = useMutation({
    mutationFn: (name: string) => api.post('/locations/countries', { name_en: name, name_th: name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] })
      setProductForm(prev => ({ ...prev, origin_country_id: res.data.data.id }))
    }
  })

  const createBrandMutation = useMutation({
    mutationFn: (payload: any) => api.post('/brands', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      setIsAddingBrand(false)
    }
  })

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => api.put(`/brands/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      setIsAddingBrand(false)
      setEditingBrandId(null)
    }
  })

  const deleteBrandMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
    }
  })

  // -- Columns --
  const productColumns: ColumnDef<Product>[] = [
    { accessorKey: 'id', header: t('admin.product.id') },
    {
      accessorKey: 'img',
      header: t('admin.product.image'),
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary">
          {row.original.img && row.original.img.length > 0 ? (
            <img
              src={row.original.img[0].startsWith('http') || row.original.img[0].startsWith('blob:') ? row.original.img[0] : `${(import.meta.env.VITE_API_BASE_URL || '').replace('/api', '')}${row.original.img[0]}`}
              alt="Product"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 m-3 text-muted-foreground" />
          )}
        </div>
      )
    },
    { accessorKey: 'name_en', header: t('admin.product.name_en') },
    {
      accessorKey: 'price_tentative_thb',
      header: t('admin.product.price_thb'),
      cell: ({ row }) => `฿${row.original.price_tentative_thb?.toLocaleString() || 0}`
    },
    { accessorKey: 'amount', header: t('admin.product.stock') },
    {
      accessorKey: 'status',
      header: t('admin.product.status'),
      cell: ({ row }) => (
        <select
          value={row.original.status}
          onChange={(e) => updateProductStatusMutation.mutate({ id: row.original.id, status: e.target.value })}
          className="input-inline-select"
        >
          <option value="active">{t('admin.product.status_active')}</option>
          <option value="inactive">{t('admin.product.status_inactive')}</option>
          <option value="out_of_stock">{t('admin.product.status_out_of_stock')}</option>
        </select>
      )
    },
    {
      accessorKey: 'tag',
      header: t('admin.product.product_tag'),
      cell: ({ row }) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row.original.tag === 'trending' ? 'bg-orange-100 text-orange-600' :
          row.original.tag === 'new_arrival' ? 'bg-blue-100 text-blue-600' :
          'bg-gray-100 text-gray-500'
        }`}>
          {row.original.tag === 'trending' ? t('admin.product.tag_trending') : row.original.tag === 'new_arrival' ? t('admin.product.tag_new_arrival') : t('admin.product.tag_none')}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('admin.product.actions'),
      cell: ({ row }) => (
        <button
          onClick={async () => {
            setProductForm({
              name_en: row.original.name_en || '',
              name_th: row.original.name_th || '',
              name_jp: row.original.name_jp || '',
              desc_en: row.original.desc_en || '',
              desc_th: row.original.desc_th || '',
              desc_jp: row.original.desc_jp || '',
              brand_id: (row.original as any).brand_id || '',
              price_tentative_jpy: row.original.price_tentative_jpy?.toString() || '',
              price_tentative_thb: row.original.price_tentative_thb?.toString() || '',
              amount: row.original.amount?.toString() || '0',
              weight: (row.original as any).weight?.toString() || '0',
              img: row.original.img || [],
              category_id: (row.original as any).category_id || '',
              status: row.original.status || 'active',
              tag: row.original.tag || '',
              origin_country_id: (row.original as any).origin_country_id || '',
              shopIds: [],
              options: (row.original as any).options || []
            })
            setEditingProductId(row.original.id)
            setSelectedFiles([])
            setIsAddingProduct(true)

            try {
              const res = await api.get(`/product-locations/product/${row.original.id}`)
              const locations = res.data.data
              const shopIds = locations.map((loc: any) => loc.shop_id).filter(Boolean)
              setProductForm((prev) => ({ ...prev, shopIds }))
            } catch (e) {
              console.error('Failed to fetch product locations', e)
            }
          }}
          className="btn-icon"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ]

  const categoryColumns: ColumnDef<Category>[] = [
    { accessorKey: 'id', header: t('admin.product.id') },
    { accessorKey: 'name_en', header: t('admin.product.name_en') },
    { accessorKey: 'name_th', header: t('admin.product.name_th') },
    { accessorKey: 'name_jp', header: t('admin.product.name_jp') },
    {
      id: 'actions',
      header: t('admin.product.actions'),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setCategoryForm({
                name_en: row.original.name_en || '',
                name_th: row.original.name_th || '',
                name_jp: row.original.name_jp || ''
              })
              setEditingCategoryId(row.original.id)
              setIsAddingCategory(true)
            }}
            className="btn-icon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this category?')) {
                  deleteCategoryMutation.mutate(row.original.id)
                }
              }}
              className="btn-icon-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ]

  const brandColumns: ColumnDef<Brand>[] = [
    { accessorKey: 'id', header: t('admin.product.id') },
    { accessorKey: 'name_en', header: t('admin.product.name_en') },
    { accessorKey: 'name_th', header: t('admin.product.name_th') },
    { accessorKey: 'name_jp', header: t('admin.product.name_jp') },
    {
      accessorKey: 'status',
      header: t('admin.product.status'),
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.original.status}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('admin.product.actions'),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setBrandForm({
                name_en: row.original.name_en || '',
                name_th: row.original.name_th || '',
                name_jp: row.original.name_jp || '',
                status: row.original.status || 'active'
              })
              setEditingBrandId(row.original.id)
              setIsAddingBrand(true)
            }}
            className="btn-icon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this brand?')) {
                  deleteBrandMutation.mutate(row.original.id)
                }
              }}
              className="btn-icon-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ]

  // -- State for Forms --
  const [productForm, setProductForm] = useState({
    name_en: '',
    name_th: '',
    name_jp: '',
    desc_en: '',
    desc_th: '',
    desc_jp: '',
    brand_id: '' as string | number,
    price_tentative_jpy: '',
    price_tentative_thb: '',
    amount: '10',
    weight: '0',
    img: [] as string[],
    // Empty, not 1: the payload builder drops '' fields, and a hardcoded id
    // pointed at a category that need not exist.
    category_id: '' as string | number,
    status: 'active',
    tag: '',
    origin_country_id: '' as string | number,
    shopIds: [] as number[],
    options: [] as { name: string; values: string[] }[]
  })

  const [categoryForm, setCategoryForm] = useState({
    name_en: '',
    name_th: '',
    name_jp: ''
  })

  const [brandForm, setBrandForm] = useState({
    name_en: '',
    name_th: '',
    name_jp: '',
    status: 'active'
  })

  // -- Image Upload Handler --
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setSelectedFiles(prev => [...prev, ...files])
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setProductForm((prev) => ({ ...prev, img: [...(prev.img || []), ...newPreviews] }))
  }

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <Package className="w-8 h-8 mr-3" />
          {t('admin.product.catalog_title')}
        </h1>
      </div>

      <div className="flex space-x-4 border-b border-border">
        <button
          onClick={() => setActiveTab('products')}
          className={`tab-btn ${activeTab === 'products' ? 'is-active' : ''}`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          {t('admin.product.tab_products')}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`tab-btn ${activeTab === 'categories' ? 'is-active' : ''}`}
        >
          <Tags className="w-4 h-4 inline mr-2" />
          {t('admin.product.tab_categories')}
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`tab-btn ${activeTab === 'brands' ? 'is-active' : ''}`}
        >
          <Tags className="w-4 h-4 inline mr-2" />
          {t('admin.product.tab_brands')}
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (isAddingProduct) {
                  setIsAddingProduct(false)
                  setEditingProductId(null)
                  setSelectedFiles([])
                  setProductForm({
                    name_en: '', name_th: '', name_jp: '', desc_en: '', desc_th: '', desc_jp: '',
                    brand_id: '', origin_country_id: '',
                    price_tentative_jpy: '', price_tentative_thb: '', amount: '10', weight: '0', img: [], category_id: '', status: 'active', tag: '', shopIds: [], options: []
                  })
                } else {
                  setIsAddingProduct(true)
                }
              }}
              className="btn-primary"
            >
              {isAddingProduct ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingProduct ? t('admin.product.cancel') : t('admin.product.add_product')}
            </button>
          </div>

          {isAddingProduct && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                let uploadedImgUrls = [...(productForm.img || []).filter(url => !url.startsWith('blob:'))]
                
                if (selectedFiles.length > 0) {
                  setIsUploading(true)
                  try {
                    const token = localStorage.getItem('token')
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
                    
                    const uploadPromises = selectedFiles.map(async (file) => {
                      const formData = new FormData()
                      formData.append('folder', 'products/' + ((productForm.name_en || 'unnamed').toLowerCase().replace(/[\s/\\]+/g, '-').slice(0, 64) || 'unnamed'))
                      formData.append('file', file)
                      const res = await fetch(`${baseUrl}/uploads`, {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: formData
                      })
                      const data = await res.json()
                      if (!data.success) throw new Error(data.message)
                      return data.url as string
                    })
                    
                    const newUrls = await Promise.all(uploadPromises)
                    uploadedImgUrls = [...uploadedImgUrls, ...newUrls]
                  } catch (error) {
                    console.error('Upload failed', error)
                    alert('Upload failed: ' + (error as Error).message)
                    setIsUploading(false)
                    return
                  }
                  setIsUploading(false)
                }

                const basePayload = {
                  ...productForm,
                  img: uploadedImgUrls,
                  price_tentative_jpy: productForm.price_tentative_jpy ? Number(productForm.price_tentative_jpy) : undefined,
                  price_tentative_thb: productForm.price_tentative_thb ? Number(productForm.price_tentative_thb) : undefined,
                  weight: Number(productForm.weight),
                  status: productForm.status as 'active' | 'inactive' | 'out_of_stock'
                }
                const { shopIds, ...restPayload } = basePayload
                const payload = { ...Object.fromEntries(Object.entries(restPayload).filter(([_, v]) => v !== '')), shopIds }

                if (editingProductId) {
                  editProductMutation.mutate({ id: editingProductId, payload })
                } else {
                  addProductMutation.mutate(payload)
                }
                setSelectedFiles([])
              }}
              className="card-panel space-y-4"
            >
              <h2 className="text-xl font-bold">{editingProductId ? t('admin.product.edit_product') : t('admin.product.new_product')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-section-divider">{t('admin.product.basic_info')}</div>
                <div>
                  <label className="label-admin">{t('admin.product.name_en')} *</label>
                  <input
                    required
                    type="text"
                    value={productForm.name_en}
                    onChange={(e) => setProductForm({ ...productForm, name_en: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.name_th')}</label>
                  <input
                    type="text"
                    value={productForm.name_th}
                    onChange={(e) => setProductForm({ ...productForm, name_th: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.name_jp')}</label>
                  <input
                    type="text"
                    value={productForm.name_jp}
                    onChange={(e) => setProductForm({ ...productForm, name_jp: e.target.value })}
                    className="input-admin"
                  />
                </div>

                <div className="form-section-divider">{t('admin.product.desc_details')}</div>
                <div>
                  <label className="label-admin">{t('admin.product.desc_en')}</label>
                  <textarea
                    value={productForm.desc_en}
                    onChange={(e) => setProductForm({ ...productForm, desc_en: e.target.value })}
                    className="input-admin"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.desc_th')}</label>
                  <textarea
                    value={productForm.desc_th}
                    onChange={(e) => setProductForm({ ...productForm, desc_th: e.target.value })}
                    className="input-admin"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.desc_jp')}</label>
                  <textarea
                    value={productForm.desc_jp}
                    onChange={(e) => setProductForm({ ...productForm, desc_jp: e.target.value })}
                    className="input-admin"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.brand')}</label>
                  <SearchableSelect
                    options={brands?.map((b: any) => ({ id: b.id, label: b.name_en })) || []}
                    value={productForm.brand_id}
                    onChange={(val) => setProductForm({ ...productForm, brand_id: val })}
                    onAdd={(search) => addBrandMutation.mutate(search)}
                    placeholder={t('admin.product.select_brand')}
                    addLabel={t('admin.product.add_brand')}
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.origin_country')}</label>
                  <SearchableSelect
                    options={countries?.map((c: any) => ({ id: c.id, label: c.name_en })) || []}
                    value={productForm.origin_country_id}
                    onChange={(val) => setProductForm({ ...productForm, origin_country_id: val })}
                    onAdd={(search) => addCountryMutation.mutate(search)}
                    placeholder={t('admin.product.select_country')}
                    addLabel="Add Country"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.category')}</label>
                  <SearchableSelect
                    options={categories?.map((c) => ({ id: c.id, label: c.name_en })) || []}
                    value={productForm.category_id}
                    onChange={(val) => setProductForm({ ...productForm, category_id: val ? Number(val) : '' })}
                    placeholder={t('admin.product.search_category')}
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.product_tag')}</label>
                  <select
                    value={productForm.tag}
                    onChange={(e) => setProductForm({ ...productForm, tag: e.target.value })}
                    className="input-admin"
                  >
                    <option value="">{t('admin.product.tag_none')}</option>
                    <option value="new_arrival">{t('admin.product.tag_new_arrival')}</option>
                    <option value="trending">{t('admin.product.tag_trending')}</option>
                  </select>
                </div>

                <div className="form-section-divider">{t('admin.product.pricing_inventory')}</div>
                <div>
                  <label className="label-admin">{t('admin.product.price_jpy')}</label>
                  <input
                    type="number"
                    required
                    value={productForm.price_tentative_jpy}
                    onChange={(e) => setProductForm({ ...productForm, price_tentative_jpy: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.price_override_thb')}</label>
                  <input
                    type="number"
                    value={productForm.price_tentative_thb}
                    onChange={(e) => setProductForm({ ...productForm, price_tentative_thb: e.target.value })}
                    className="input-admin"
                    placeholder={t('admin.product.auto_calculated')}
                  />
                </div>

                <div>
                  <label className="label-admin">{t('admin.product.weight')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.weight}
                    onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                    className="input-admin"
                  />
                </div>

                <div className="form-section-divider">{t('admin.product.locations')}</div>
                <div className="col-span-3">
                  <label className="label-admin mb-2">{t('admin.product.select_shops')}</label>
                  <SearchableMultiSelect
                    options={shops?.map((s: any) => ({ id: s.id, label: s.name_en })) || []}
                    values={productForm.shopIds}
                    onChange={(vals) => setProductForm({ ...productForm, shopIds: vals as number[] })}
                    placeholder={t('admin.product.search_shops')}
                  />
                </div>

                <div className="form-section-divider">{t('admin.product.media')}</div>
                <div className="col-span-3">
                  <label className="label-admin">{t('admin.product.product_images')}</label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="product-image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="file-upload"
                    />
                    {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                  </div>
                  {productForm.img && productForm.img.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                      {productForm.img.map((imgUrl, index) => (
                        <div key={index} className="relative inline-block mt-2">
                          <img
                            src={imgUrl.startsWith('http') || imgUrl.startsWith('blob:') ? imgUrl : `${(import.meta.env.VITE_API_BASE_URL || '').replace('/api', '')}${imgUrl}`}
                            alt={`Preview ${index}`}
                            className="h-24 rounded-md border border-border object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (imgUrl.startsWith('blob:')) {
                                const localPreviewUrls = productForm.img.filter(u => u.startsWith('blob:'))
                                const blobIndex = localPreviewUrls.indexOf(imgUrl)
                                if (blobIndex > -1) {
                                  setSelectedFiles(prev => prev.filter((_, i) => i !== blobIndex))
                                }
                              }
                              setProductForm((prev) => ({ ...prev, img: prev.img.filter((_, i) => i !== index) }))
                              const fileInput = document.getElementById('product-image-upload') as HTMLInputElement
                              if (fileInput) fileInput.value = ''
                            }}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-section-divider">{t('admin.product.options_title')}</div>
                <div className="col-span-3 space-y-3">
                  <p className="text-xs text-muted-foreground">{t('admin.product.options_hint')}</p>
                  {productForm.options.map((opt, oi) => (
                    <div key={oi} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="label-admin">{t('admin.product.option_name')}</label>
                          <input
                            type="text"
                            value={opt.name}
                            placeholder={t('admin.product.option_name_ph')}
                            onChange={(e) => setProductForm((prev) => ({ ...prev, options: prev.options.map((o, i) => i === oi ? { ...o, name: e.target.value } : o) }))}
                            className="input-admin"
                          />
                        </div>
                        <button
                          type="button"
                          title={t('admin.product.remove_option')}
                          onClick={() => setProductForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== oi) }))}
                          className="btn-icon-destructive mb-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="label-admin">{t('admin.product.option_values')}</label>
                        <div className="flex flex-wrap items-center gap-2">
                          {opt.values.map((val, vi) => (
                            <span key={vi} className="badge bg-primary/10 text-primary flex items-center gap-1 normal-case text-sm">
                              {val}
                              <button
                                type="button"
                                onClick={() => setProductForm((prev) => ({ ...prev, options: prev.options.map((o, i) => i === oi ? { ...o, values: o.values.filter((_, j) => j !== vi) } : o) }))}
                                className="hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder={t('admin.product.add_value_ph')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const v = (e.target as HTMLInputElement).value.trim()
                                if (v) {
                                  setProductForm((prev) => ({ ...prev, options: prev.options.map((o, i) => i === oi ? { ...o, values: [...o.values, v] } : o) }))
                                  ;(e.target as HTMLInputElement).value = ''
                                }
                              }
                            }}
                            className="input-admin w-48 text-sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {opt.values.length === 0 ? t('admin.product.option_values_empty') : t('admin.product.option_values_hint')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProductForm((prev) => ({ ...prev, options: [...prev.options, { name: '', values: [] }] }))}
                    className="btn-secondary text-sm w-fit"
                  >
                    <Plus className="w-4 h-4 mr-1" />{t('admin.product.add_option')}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addProductMutation.isPending || isUploading}
                  className="btn-primary px-6"
                >
                  {addProductMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {t('admin.product.save_product')}
                </button>
              </div>
            </form>
          )}

          {isLoadingProducts ? (
            <div className="loading-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={productColumns}
              data={products || []}
              searchKey="name_en"
              searchPlaceholder={t('admin.product.search_products')}
            />
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="btn-primary"
            >
              {isAddingCategory ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingCategory ? t('admin.product.cancel') : t('admin.product.add_category')}
            </button>
          </div>

          {isAddingCategory && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingCategoryId) {
                  editCategoryMutation.mutate({ id: editingCategoryId, payload: categoryForm })
                } else {
                  addCategoryMutation.mutate(categoryForm)
                }
              }}
              className="card-panel space-y-4"
            >
              <h2 className="text-xl font-bold">{editingCategoryId ? t('admin.product.edit_category') : t('admin.product.new_category')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label-admin">{t('admin.product.name_en')}</label>
                  <input
                    required
                    type="text"
                    value={categoryForm.name_en}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.name_th')}</label>
                  <input
                    required
                    type="text"
                    value={categoryForm.name_th}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_th: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.name_jp')}</label>
                  <input
                    type="text"
                    value={categoryForm.name_jp}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_jp: e.target.value })}
                    className="input-admin"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addCategoryMutation.isPending}
                  className="btn-primary px-6"
                >
                  {addCategoryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {t('admin.product.save_category')}
                </button>
              </div>
            </form>
          )}

          {isLoadingCategories ? (
            <div className="loading-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={categoryColumns}
              data={categories || []}
              searchKey="name_en"
              searchPlaceholder={t('admin.product.search_categories')}
            />
          )}
        </div>
      )}

      {activeTab === 'brands' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddingBrand(!isAddingBrand)}
              className="btn-primary"
            >
              {isAddingBrand ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingBrand ? t('admin.product.cancel') : t('admin.product.add_brand')}
            </button>
          </div>

          {isAddingBrand && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (editingBrandId) {
                  updateBrandMutation.mutate({ id: editingBrandId, payload: brandForm })
                } else {
                  createBrandMutation.mutate(brandForm)
                }
              }}
              className="card-panel space-y-4"
            >
              <h2 className="text-xl font-bold">{editingBrandId ? t('admin.product.edit_brand') : t('admin.product.new_brand')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-admin">{t('admin.product.name_en')} *</label>
                  <input
                    required
                    type="text"
                    value={brandForm.name_en}
                    onChange={(e) => setBrandForm({ ...brandForm, name_en: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.name_th')}</label>
                  <input
                    type="text"
                    value={brandForm.name_th}
                    onChange={(e) => setBrandForm({ ...brandForm, name_th: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.name_jp')}</label>
                  <input
                    type="text"
                    value={brandForm.name_jp}
                    onChange={(e) => setBrandForm({ ...brandForm, name_jp: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">{t('admin.product.status')}</label>
                  <select
                    value={brandForm.status}
                    onChange={(e) => setBrandForm({ ...brandForm, status: e.target.value as 'active' | 'inactive' })}
                    className="input-admin"
                  >
                    <option value="active">{t('admin.product.status_active')}</option>
                    <option value="inactive">{t('admin.product.status_inactive')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                  className="btn-primary px-6"
                >
                  {(createBrandMutation.isPending || updateBrandMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {t('admin.product.save_brand')}
                </button>
              </div>
            </form>
          )}

          <DataTable
            columns={brandColumns}
            data={brands || []}
            searchKey="name_en"
            searchPlaceholder={t('admin.product.search_brands')}
          />
        </div>
      )}
    </div>
  )
}
