import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../../services/api'

interface Area {
  id: number
  name_th: string
  name_en: string
}

interface Shop {
  id: number
  area_id: number
  name_th: string
  name_en: string
  name_jp: string | null
  map_location: string | null
  status: 'active' | 'inactive'
}

export const AdminShops: React.FC = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)

  const [formData, setFormData] = useState({
    area_id: '',
    name_en: '',
    name_th: '',
    name_jp: '',
    map_location: '',
    status: 'active'
  })

  // Fetch Areas for dropdown
  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['admin', 'areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data.data as Area[]
    }
  })

  // Fetch Shops
  const {
    data: shops,
    isLoading: shopsLoading,
    error
  } = useQuery({
    queryKey: ['admin', 'shops'],
    queryFn: async () => {
      const res = await api.get('/shops')
      return res.data.data as Shop[]
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/shops', { ...data, area_id: parseInt(data.area_id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: any }) => api.put(`/shops/${data.id}`, { ...data.payload, area_id: parseInt(data.payload.area_id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
      closeModal()
    }
  })

  const openModal = (shop?: Shop) => {
    if (shop) {
      setEditingShop(shop)
      setFormData({
        area_id: shop.area_id.toString(),
        name_en: shop.name_en,
        name_th: shop.name_th,
        name_jp: shop.name_jp || '',
        map_location: shop.map_location || '',
        status: shop.status || 'active'
      })
    } else {
      setEditingShop(null)
      setFormData({
        area_id: areas && areas.length > 0 ? areas[0].id.toString() : '',
        name_en: '',
        name_th: '',
        name_jp: '',
        map_location: '',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingShop(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingShop) {
      updateMutation.mutate({ id: editingShop.id, payload: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const getAreaName = (areaId: number) => {
    const area = areas?.find((a) => a.id === areaId)
    return area ? area.name_en : 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shops</h1>
          <p className="text-sm text-muted-foreground">Manage individual shops and assign them to areas</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Shop</span>
        </button>
      </div>

      {shopsLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="error-alert">
          <AlertCircle className="w-5 h-5 mr-2" />
          Failed to load shops
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="table-head">
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">Area</th>
                  <th className="table-th">Name (EN)</th>
                  <th className="table-th">Name (TH)</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shops?.map((shop) => (
                  <tr key={shop.id} className="table-row">
                    <td className="table-td font-medium text-foreground">#{shop.id}</td>
                    <td className="table-td">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{getAreaName(shop.area_id)}</span>
                    </td>
                    <td className="table-td">{shop.name_en}</td>
                    <td className="table-td">{shop.name_th}</td>
                    <td className="table-td">
                      <select
                        value={shop.status}
                        onChange={(e) => {
                          updateMutation.mutate({ id: shop.id, payload: { ...shop, status: e.target.value as 'active' | 'inactive' } })
                        }}
                        className="input-inline-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="table-td text-right space-x-2">
                      <button onClick={() => openModal(shop)} className="btn-icon">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {shops?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No shops found. Add your first shop to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="text-xl font-bold text-foreground">{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="shop-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-modal">Area *</label>
                  <select required value={formData.area_id} onChange={(e) => setFormData({ ...formData, area_id: e.target.value })} className="input-modal">
                    <option value="" disabled>Select Area</option>
                    {areas?.map((area) => (
                      <option key={area.id} value={area.id}>{area.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-modal">Shop Name (EN) *</label>
                  <input type="text" required value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} className="input-modal" />
                </div>

                <div>
                  <label className="label-modal">Shop Name (TH) *</label>
                  <input type="text" required value={formData.name_th} onChange={(e) => setFormData({ ...formData, name_th: e.target.value })} className="input-modal" />
                </div>

                <div>
                  <label className="label-modal">Shop Name (JP)</label>
                  <input type="text" value={formData.name_jp} onChange={(e) => setFormData({ ...formData, name_jp: e.target.value })} className="input-modal" />
                </div>

                <div>
                  <label className="label-modal">Map URL/Coordinates</label>
                  <input type="text" value={formData.map_location} onChange={(e) => setFormData({ ...formData, map_location: e.target.value })} className="input-modal" />
                </div>

                <div>
                  <label className="label-modal">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className="input-modal">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                form="shop-form"
                disabled={createMutation.isPending || updateMutation.isPending || areasLoading}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingShop ? 'Save Changes' : 'Create Shop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
