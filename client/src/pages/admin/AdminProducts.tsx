import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Package, Tags, Plus, Loader2, Save, X, Image as ImageIcon } from 'lucide-react'

interface Product {
  id: number
  name_en: string
  price_tentative_thb: number
  amount: number
  status: 'active' | 'inactive' | 'out_of_stock'
  img: string
}

interface Category {
  id: number
  name_en: string
  name_th: string
  name_jp: string
}

export const AdminProducts: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)

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

  // -- Mutations --
  const addProductMutation = useMutation({
    mutationFn: (newProduct: Partial<Product>) => api.post('/products', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setIsAddingProduct(false)
    }
  })

  const updateProductStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.put(`/products/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    }
  })

  const addCategoryMutation = useMutation({
    mutationFn: (newCategory: Partial<Category>) => api.post('/categories', newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setIsAddingCategory(false)
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
          {row.original.img ? <img src={row.original.img} alt="Product" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 m-3 text-muted-foreground" />}
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
          className="text-xs px-2 py-1 rounded border border-border bg-background cursor-pointer"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      )
    }
  ]

  const categoryColumns: ColumnDef<Category>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name_en', header: 'Name (EN)' },
    { accessorKey: 'name_th', header: 'Name (TH)' },
    { accessorKey: 'name_jp', header: 'Name (JP)' }
  ]

  // -- State for Forms --
  const [productForm, setProductForm] = useState({
    name_en: '', name_th: '', name_jp: '', 
    price_tentative_thb: '', amount: '10', img: '', category_id: 1, status: 'active'
  })
  
  const [categoryForm, setCategoryForm] = useState({
    name_en: '', name_th: '', name_jp: ''
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
        setProductForm(prev => ({ ...prev, img: res.data.url }))
      }
    } catch (error) {
      console.error('Upload failed', error)
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Package className="w-8 h-8 mr-3" />
          Catalog Management
        </h1>
      </div>

      <div className="flex space-x-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('products')}
          className={`py-2 px-4 border-b-2 font-medium transition-colors ${activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Products
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`py-2 px-4 border-b-2 font-medium transition-colors ${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Tags className="w-4 h-4 inline mr-2" />
          Categories
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setIsAddingProduct(!isAddingProduct)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center hover:bg-primary/90">
              {isAddingProduct ? <X className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>} {isAddingProduct ? 'Cancel' : 'Add Product'}
            </button>
          </div>
          
          {isAddingProduct && (
            <form onSubmit={(e) => { e.preventDefault(); addProductMutation.mutate({...productForm, price_tentative_thb: Number(productForm.price_tentative_thb), amount: Number(productForm.amount), status: productForm.status as 'active' | 'inactive' | 'out_of_stock'}) }} className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
              <h2 className="text-xl font-bold">New Product</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Name (EN)</label><input required type="text" value={productForm.name_en} onChange={e => setProductForm({...productForm, name_en: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
                <div><label className="block text-sm font-medium mb-1">Name (TH)</label><input type="text" value={productForm.name_th} onChange={e => setProductForm({...productForm, name_th: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
                <div><label className="block text-sm font-medium mb-1">Name (JP)</label><input type="text" value={productForm.name_jp} onChange={e => setProductForm({...productForm, name_jp: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
                
                <div><label className="block text-sm font-medium mb-1">Price (THB)</label><input required type="number" value={productForm.price_tentative_thb} onChange={e => setProductForm({...productForm, price_tentative_thb: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
                <div><label className="block text-sm font-medium mb-1">Stock Amount</label><input required type="number" value={productForm.amount} onChange={e => setProductForm({...productForm, amount: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: Number(e.target.value)})} className="w-full p-2 border rounded bg-background">
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Product Image</label>
                  <div className="flex items-center space-x-4">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                  </div>
                  {productForm.img && <img src={productForm.img} alt="Preview" className="mt-2 h-20 rounded-md border border-border" />}
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={addProductMutation.isPending || isUploading} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg flex items-center">
                  {addProductMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Product
                </button>
              </div>
            </form>
          )}

          {isLoadingProducts ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : <DataTable columns={productColumns} data={products || []} searchKey="name_en" searchPlaceholder="Search products..." />}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setIsAddingCategory(!isAddingCategory)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center hover:bg-primary/90">
              {isAddingCategory ? <X className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>} {isAddingCategory ? 'Cancel' : 'Add Category'}
            </button>
          </div>
          
          {isAddingCategory && (
            <form onSubmit={(e) => { e.preventDefault(); addCategoryMutation.mutate(categoryForm) }} className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
              <h2 className="text-xl font-bold">New Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Name (EN)</label><input required type="text" value={categoryForm.name_en} onChange={e => setCategoryForm({...categoryForm, name_en: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
                <div><label className="block text-sm font-medium mb-1">Name (TH)</label><input required type="text" value={categoryForm.name_th} onChange={e => setCategoryForm({...categoryForm, name_th: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
                <div><label className="block text-sm font-medium mb-1">Name (JP)</label><input type="text" value={categoryForm.name_jp} onChange={e => setCategoryForm({...categoryForm, name_jp: e.target.value})} className="w-full p-2 border rounded bg-background" /></div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={addCategoryMutation.isPending} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg flex items-center">
                  {addCategoryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Category
                </button>
              </div>
            </form>
          )}

          {isLoadingCategories ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : <DataTable columns={categoryColumns} data={categories || []} searchKey="name_en" searchPlaceholder="Search categories..." />}
        </div>
      )}
    </div>
  )
}
