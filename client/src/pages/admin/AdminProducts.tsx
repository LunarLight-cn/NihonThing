import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import { SearchableSelect } from '../../components/admin/SearchableSelect'
import { SearchableMultiSelect } from '../../components/admin/SearchableMultiSelect'
import type { ColumnDef } from '@tanstack/react-table'
import { Package, Tags, Plus, Loader2, Save, X, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react'

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
  img: string
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
  const queryClient = useQueryClient()
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
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data.data as Product[]
    }
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setIsAddingProduct(false)
      setEditingProductId(null)
    }
  })

  const updateProductStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/products/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
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
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'img',
      header: 'Image',
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary">
          {row.original.img ? (
            <img
              src={row.original.img}
              alt="Product"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 m-3 text-muted-foreground" />
          )}
        </div>
      )
    },
    { accessorKey: 'name_en', header: 'Name (EN)' },
    {
      accessorKey: 'price_tentative_thb',
      header: 'Price (THB)',
      cell: ({ row }) => `฿${row.original.price_tentative_thb?.toLocaleString() || 0}`
    },
    { accessorKey: 'amount', header: 'Stock' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <select
          value={row.original.status}
          onChange={(e) => updateProductStatusMutation.mutate({ id: row.original.id, status: e.target.value })}
          className="input-inline-select"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      )
    },
    {
      accessorKey: 'tag',
      header: 'Tag',
      cell: ({ row }) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row.original.tag === 'trending' ? 'bg-orange-100 text-orange-600' :
          row.original.tag === 'new_arrival' ? 'bg-blue-100 text-blue-600' :
          'bg-gray-100 text-gray-500'
        }`}>
          {row.original.tag === 'trending' ? 'Trending' : row.original.tag === 'new_arrival' ? 'New Arrival' : 'None'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
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
              img: row.original.img || '',
              category_id: (row.original as any).category_id || 1,
              status: row.original.status || 'active',
              tag: row.original.tag || '',
              origin_country_id: (row.original as any).origin_country_id || '',
              shopIds: []
            })
            setEditingProductId(row.original.id)
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
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name_en', header: 'Name (EN)' },
    { accessorKey: 'name_th', header: 'Name (TH)' },
    { accessorKey: 'name_jp', header: 'Name (JP)' },
    {
      id: 'actions',
      header: 'Actions',
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
        </div>
      )
    }
  ]

  const brandColumns: ColumnDef<Brand>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name_en', header: 'Name (EN)' },
    { accessorKey: 'name_th', header: 'Name (TH)' },
    { accessorKey: 'name_jp', header: 'Name (JP)' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.original.status}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
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
    img: '',
    category_id: 1,
    status: 'active',
    tag: '',
    origin_country_id: '' as string | number,
    shopIds: [] as number[]
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        setProductForm((prev) => ({ ...prev, img: res.data.url }))
      }
    } catch (error) {
      console.error('Upload failed', error)
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <Package className="w-8 h-8 mr-3" />
          Catalog Management
        </h1>
      </div>

      <div className="flex space-x-4 border-b border-border">
        <button
          onClick={() => setActiveTab('products')}
          className={`tab-btn ${activeTab === 'products' ? 'is-active' : ''}`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`tab-btn ${activeTab === 'categories' ? 'is-active' : ''}`}
        >
          <Tags className="w-4 h-4 inline mr-2" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`tab-btn ${activeTab === 'brands' ? 'is-active' : ''}`}
        >
          <Tags className="w-4 h-4 inline mr-2" />
          Brands
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
                  setProductForm({
                    name_en: '', name_th: '', name_jp: '', desc_en: '', desc_th: '', desc_jp: '',
                    brand_id: '', origin_country_id: '',
                    price_tentative_jpy: '', price_tentative_thb: '', amount: '10', img: '', category_id: 1, status: 'active', tag: '', shopIds: []
                  })
                } else {
                  setIsAddingProduct(true)
                }
              }}
              className="btn-primary"
            >
              {isAddingProduct ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingProduct ? 'Cancel' : 'Add Product'}
            </button>
          </div>

          {isAddingProduct && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const basePayload = {
                  ...productForm,
                  price_tentative_jpy: productForm.price_tentative_jpy ? Number(productForm.price_tentative_jpy) : undefined,
                  price_tentative_thb: productForm.price_tentative_thb ? Number(productForm.price_tentative_thb) : undefined,
                  amount: Number(productForm.amount),
                  status: productForm.status as 'active' | 'inactive' | 'out_of_stock'
                }
                const { shopIds, ...restPayload } = basePayload
                const payload = { ...Object.fromEntries(Object.entries(restPayload).filter(([_, v]) => v !== '')), shopIds }

                if (editingProductId) {
                  editProductMutation.mutate({ id: editingProductId, payload })
                } else {
                  addProductMutation.mutate(payload)
                }
              }}
              className="card-panel space-y-4"
            >
              <h2 className="text-xl font-bold">{editingProductId ? 'Edit Product' : 'New Product'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-section-divider">Basic Info</div>
                <div>
                  <label className="label-admin">Name (EN) *</label>
                  <input
                    required
                    type="text"
                    value={productForm.name_en}
                    onChange={(e) => setProductForm({ ...productForm, name_en: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Name (TH)</label>
                  <input
                    type="text"
                    value={productForm.name_th}
                    onChange={(e) => setProductForm({ ...productForm, name_th: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Name (JP)</label>
                  <input
                    type="text"
                    value={productForm.name_jp}
                    onChange={(e) => setProductForm({ ...productForm, name_jp: e.target.value })}
                    className="input-admin"
                  />
                </div>

                <div className="form-section-divider">Descriptions & Details</div>
                <div>
                  <label className="label-admin">Description (EN)</label>
                  <textarea
                    value={productForm.desc_en}
                    onChange={(e) => setProductForm({ ...productForm, desc_en: e.target.value })}
                    className="input-admin"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="label-admin">Description (TH)</label>
                  <textarea
                    value={productForm.desc_th}
                    onChange={(e) => setProductForm({ ...productForm, desc_th: e.target.value })}
                    className="input-admin"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="label-admin">Description (JP)</label>
                  <textarea
                    value={productForm.desc_jp}
                    onChange={(e) => setProductForm({ ...productForm, desc_jp: e.target.value })}
                    className="input-admin"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="label-admin">Brand</label>
                  <SearchableSelect
                    options={brands?.map((b: any) => ({ id: b.id, label: b.name_en })) || []}
                    value={productForm.brand_id}
                    onChange={(val) => setProductForm({ ...productForm, brand_id: val })}
                    onAdd={(search) => addBrandMutation.mutate(search)}
                    placeholder="Select or Search Brand"
                    addLabel="Add Brand"
                  />
                </div>
                <div>
                  <label className="label-admin">Origin Country</label>
                  <SearchableSelect
                    options={countries?.map((c: any) => ({ id: c.id, label: c.name_en })) || []}
                    value={productForm.origin_country_id}
                    onChange={(val) => setProductForm({ ...productForm, origin_country_id: val })}
                    onAdd={(search) => addCountryMutation.mutate(search)}
                    placeholder="Select or Search Country"
                    addLabel="Add Country"
                  />
                </div>
                <div>
                  <label className="label-admin">Category</label>
                  <SearchableSelect
                    options={categories?.map((c) => ({ id: c.id, label: c.name_en })) || []}
                    value={productForm.category_id}
                    onChange={(val) => setProductForm({ ...productForm, category_id: Number(val) })}
                    placeholder="Search Category"
                  />
                </div>
                <div>
                  <label className="label-admin">Product Tag</label>
                  <select
                    value={productForm.tag}
                    onChange={(e) => setProductForm({ ...productForm, tag: e.target.value })}
                    className="input-admin"
                  >
                    <option value="">None</option>
                    <option value="new_arrival">New Arrival</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>

                <div className="form-section-divider">Pricing & Inventory</div>
                <div>
                  <label className="label-admin">Price (JPY)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price_tentative_jpy}
                    onChange={(e) => setProductForm({ ...productForm, price_tentative_jpy: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Price Override (THB)</label>
                  <input
                    type="number"
                    value={productForm.price_tentative_thb}
                    onChange={(e) => setProductForm({ ...productForm, price_tentative_thb: e.target.value })}
                    className="input-admin"
                    placeholder="Auto calculated if empty"
                  />
                </div>
                <div>
                  <label className="label-admin">Stock Amount</label>
                  <input
                    required
                    type="number"
                    value={productForm.amount}
                    onChange={(e) => setProductForm({ ...productForm, amount: e.target.value })}
                    className="input-admin"
                  />
                </div>

                <div className="form-section-divider">Locations (Shops)</div>
                <div className="col-span-3">
                  <label className="label-admin mb-2">Select Shops</label>
                  <SearchableMultiSelect
                    options={shops?.map((s: any) => ({ id: s.id, label: s.name_en })) || []}
                    values={productForm.shopIds}
                    onChange={(vals) => setProductForm({ ...productForm, shopIds: vals as number[] })}
                    placeholder="Search and select shops..."
                  />
                </div>

                <div className="form-section-divider">Media</div>
                <div className="col-span-3">
                  <label className="label-admin">Product Image</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="file-upload"
                    />
                    {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                  </div>
                  {productForm.img && (
                    <img
                      src={productForm.img}
                      alt="Preview"
                      className="mt-2 h-20 rounded-md border border-border"
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addProductMutation.isPending || isUploading}
                  className="btn-primary px-6"
                >
                  {addProductMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Product
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
              searchPlaceholder="Search products..."
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
              {isAddingCategory ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingCategory ? 'Cancel' : 'Add Category'}
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
              <h2 className="text-xl font-bold">{editingCategoryId ? 'Edit Category' : 'New Category'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label-admin">Name (EN)</label>
                  <input
                    required
                    type="text"
                    value={categoryForm.name_en}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Name (TH)</label>
                  <input
                    required
                    type="text"
                    value={categoryForm.name_th}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_th: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Name (JP)</label>
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
                  {addCategoryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Category
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
              searchPlaceholder="Search categories..."
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
              {isAddingBrand ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingBrand ? 'Cancel' : 'Add Brand'}
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
              <h2 className="text-xl font-bold">{editingBrandId ? 'Edit Brand' : 'New Brand'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-admin">Name (EN) *</label>
                  <input
                    required
                    type="text"
                    value={brandForm.name_en}
                    onChange={(e) => setBrandForm({ ...brandForm, name_en: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Name (TH)</label>
                  <input
                    type="text"
                    value={brandForm.name_th}
                    onChange={(e) => setBrandForm({ ...brandForm, name_th: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Name (JP)</label>
                  <input
                    type="text"
                    value={brandForm.name_jp}
                    onChange={(e) => setBrandForm({ ...brandForm, name_jp: e.target.value })}
                    className="input-admin"
                  />
                </div>
                <div>
                  <label className="label-admin">Status</label>
                  <select
                    value={brandForm.status}
                    onChange={(e) => setBrandForm({ ...brandForm, status: e.target.value as 'active' | 'inactive' })}
                    className="input-admin"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                  className="btn-primary px-6"
                >
                  {(createBrandMutation.isPending || updateBrandMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Brand
                </button>
              </div>
            </form>
          )}

          <DataTable
            columns={brandColumns}
            data={brands || []}
            searchKey="name_en"
            searchPlaceholder="Search brands..."
          />
        </div>
      )}
    </div>
  )
}
