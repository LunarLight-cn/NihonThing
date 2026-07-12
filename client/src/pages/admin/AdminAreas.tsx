import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Loader2, AlertCircle, MapPin } from 'lucide-react'
import { api } from '../../services/api'

interface Area {
  id: number
  name_th: string
  name_en: string
  name_jp: string | null
  map_location: string | null
  status: 'active' | 'inactive'
}

export const AdminAreas: React.FC = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)

  const [formData, setFormData] = useState({
    name_en: '',
    name_th: '',
    name_jp: '',
    map_location: '',
    status: 'active'
  })

  const {
    data: areas,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin', 'areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data.data as Area[]
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'areas'] })
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: typeof formData }) => api.put(`/areas/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'areas'] })
      closeModal()
    }
  })

  const openModal = (area?: Area) => {
    if (area) {
      setEditingArea(area)
      setFormData({
        name_en: area.name_en,
        name_th: area.name_th,
        name_jp: area.name_jp || '',
        map_location: area.map_location || '',
        status: area.status || 'active'
      })
    } else {
      setEditingArea(null)
      setFormData({
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
    setEditingArea(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, payload: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Areas</h1>
          <p className="text-sm text-muted-foreground">Manage shopping districts and areas</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Area</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="error-alert">
          <AlertCircle className="w-5 h-5 mr-2" />
          Failed to load areas
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="table-head">
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">Name (EN)</th>
                  <th className="table-th">Name (TH)</th>
                  <th className="table-th">Name (JP)</th>
                  <th className="table-th">Coordinates</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {areas?.map((area) => (
                  <tr key={area.id} className="table-row">
                    <td className="table-td font-medium text-foreground">#{area.id}</td>
                    <td className="table-td">{area.name_en}</td>
                    <td className="table-td">{area.name_th}</td>
                    <td className="table-td">{area.name_jp || '-'}</td>
                    <td className="table-td">
                      {area.map_location ? (
                        <div className="flex items-center text-primary text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {area.map_location}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="table-td">
                      <select
                        value={area.status}
                        onChange={(e) => {
                          updateMutation.mutate({ id: area.id, payload: { ...area, status: e.target.value as 'active' | 'inactive' } })
                        }}
                        className="input-inline-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="table-td text-right space-x-2">
                      <button onClick={() => openModal(area)} className="btn-icon">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {areas?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No areas found. Add your first area to get started.
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
              <h2 className="text-xl font-bold text-foreground">{editingArea ? 'Edit Area' : 'Add New Area'}</h2>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="area-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-modal">Area Name (EN) *</label>
                  <input type="text" required value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} className="input-modal" />
                </div>

                <div>
                  <label className="label-modal">Area Name (TH) *</label>
                  <input type="text" required value={formData.name_th} onChange={(e) => setFormData({ ...formData, name_th: e.target.value })} className="input-modal" />
                </div>

                <div>
                  <label className="label-modal">Area Name (JP)</label>
                  <input type="text" value={formData.name_jp} onChange={(e) => setFormData({ ...formData, name_jp: e.target.value })} className="input-modal" />
                </div>

                <div>
                  <label className="label-modal">Map Coordinates (lat,lng)</label>
                  <input type="text" placeholder="e.g. 35.6595,139.7004" value={formData.map_location} onChange={(e) => setFormData({ ...formData, map_location: e.target.value })} className="input-modal" />
                  <p className="text-xs text-muted-foreground mt-1">Used for displaying the area on the map.</p>
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
                form="area-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingArea ? 'Save Changes' : 'Create Area'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
