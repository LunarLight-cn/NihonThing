import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Loader2, Plus, X } from 'lucide-react'
import { SearchableSelect } from '../../components/admin/SearchableSelect'

interface Product {
  id: number
  name_en: string
  name_th?: string
  name_jp?: string
  amount: number
  remain: number
  price_tentative_jpy?: number
  price_tentative_thb?: number
  img?: string[]
}

interface Purchase {
  id: number
  order_item_id?: number
  product_id?: number
  quantity: number
  actual_cost_jpy: number
  actual_cost_thb: number
  shop_name?: string
  receipt_img?: string[]
  cdate: string
}

export const AdminPurchases: React.FC = () => {
  const queryClient = useQueryClient()
  const [isAddingPurchase, setIsAddingPurchase] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const [purchaseForm, setPurchaseForm] = useState({
    product_id: '',
    quantity: '',
    actual_cost_jpy: '',
    shop_name: ''
  })

  // -- Queries --
  const { data: purchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['admin-purchases'],
    queryFn: async () => {
      const res = await api.get('/purchases')
      return res.data.data as Purchase[]
    }
  })

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data.data.data as Product[] // Paginated response
    }
  })

  // -- Mutations --
  const addPurchaseMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/purchases', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchases'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setIsAddingPurchase(false)
      setPurchaseForm({
        product_id: '',
        quantity: '',
        actual_cost_jpy: '',
        shop_name: ''
      })
      setSelectedFiles([])
    }
  })

  // -- Handlers --
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let uploadedImgUrls: string[] = []
    
    if (selectedFiles.length > 0) {
      setIsUploading(true)
      try {
        const token = localStorage.getItem('token')
        const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
        
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData()
          formData.append('folder', 'slips/purchase')
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
        
        uploadedImgUrls = await Promise.all(uploadPromises)
      } catch (error) {
        console.error('Upload failed', error)
        alert('Upload failed: ' + (error as Error).message)
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    const payload = {
      product_id: purchaseForm.product_id ? Number(purchaseForm.product_id) : undefined,
      quantity: Number(purchaseForm.quantity),
      actual_cost_jpy: Number(purchaseForm.actual_cost_jpy),
      shop_name: purchaseForm.shop_name,
      receipt_img: uploadedImgUrls.length > 0 ? uploadedImgUrls : undefined
    }

    addPurchaseMutation.mutate(payload)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases / Restock</h1>
          <p className="text-muted-foreground mt-2">Log inventory purchases to add to your stock.</p>
        </div>
        <button
          onClick={() => setIsAddingPurchase(!isAddingPurchase)}
          className="btn-primary"
        >
          {isAddingPurchase ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Add Purchase</>}
        </button>
      </div>

      {isAddingPurchase && (
        <form onSubmit={handleSubmit} className="card-panel space-y-4">
          <h2 className="text-xl font-bold">New Purchase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-admin">Product</label>
              <SearchableSelect
                options={products?.map(p => ({ id: p.id, label: p.name_en + (p.remain !== undefined ? ` (Stock: ${p.remain})` : '') })) || []}
                value={purchaseForm.product_id}
                onChange={(val: string | number) => setPurchaseForm({ ...purchaseForm, product_id: val.toString() })}
                placeholder="Search Product to Restock..."
              />
            </div>
            <div>
              <label className="label-admin">Quantity</label>
              <input
                required
                type="number"
                min="1"
                value={purchaseForm.quantity}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">Total Cost (JPY)</label>
              <input
                required
                type="number"
                step="0.01"
                value={purchaseForm.actual_cost_jpy}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, actual_cost_jpy: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">Shop Name</label>
              <input
                type="text"
                value={purchaseForm.shop_name}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, shop_name: e.target.value })}
                className="input-admin"
                placeholder="e.g. Donki Shibuya"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-admin">Receipt / Slip Images</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="file-upload"
                />
                {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setIsAddingPurchase(false)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || addPurchaseMutation.isPending}
              className="btn-primary"
            >
              {addPurchaseMutation.isPending || isUploading ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      )}

      <div className="card-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium text-muted-foreground">ID</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Product ID</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Quantity</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Cost (JPY)</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Cost (THB)</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Shop</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Slips</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingPurchases ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Loading purchases...</td></tr>
              ) : purchases?.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No purchases found.</td></tr>
              ) : (
                purchases?.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{purchase.id}</td>
                    <td className="px-6 py-4">{purchase.product_id || purchase.order_item_id || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        +{purchase.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-500 font-medium">{purchase.actual_cost_jpy?.toLocaleString()} ¥</td>
                    <td className="px-6 py-4 text-rose-500 font-medium">{purchase.actual_cost_thb?.toLocaleString()} ฿</td>
                    <td className="px-6 py-4">{purchase.shop_name || '-'}</td>
                    <td className="px-6 py-4">
                      {purchase.receipt_img && purchase.receipt_img.length > 0 ? (
                        <div className="flex -space-x-2">
                          {purchase.receipt_img.map((img, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-secondary">
                              <img src={img.startsWith('http') ? img : `${(import.meta.env.VITE_API_BASE_URL || '').replace('/api', '')}${img}`} alt="slip" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(purchase.cdate).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
