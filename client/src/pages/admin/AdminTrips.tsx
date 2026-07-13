import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Plane, Plus, Loader2, Edit2, Save, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Trip {
  id: number
  type: string
  ship_date: string
  close_date: string
  status: 'open' | 'closed' | 'in_transit' | 'arrived'
  max_cap: number
  current_cap: number
}

export const AdminTrips: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingTripId, setEditingTripId] = useState<number | null>(null)

  const { data: trips, isLoading } = useQuery({
    queryKey: ['admin-trips'],
    queryFn: async () => {
      const res = await api.get('/ships')
      return res.data.data as Trip[]
    }
  })

  const addTripMutation = useMutation({
    mutationFn: (newTrip: Partial<Trip>) => api.post('/ships', newTrip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
      setIsAdding(false)
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/ships/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
    }
  })

  const editTripMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Trip> }) => api.put(`/ships/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
      setIsAdding(false)
      setEditingTripId(null)
    }
  })

  const columns: ColumnDef<Trip>[] = [
    { accessorKey: 'id', header: t('admin.trips.id') },
    { accessorKey: 'type', header: t('admin.trips.type') },
    {
      accessorKey: 'ship_date',
      header: t('admin.trips.ship_date'),
      cell: ({ row }) => new Date(row.original.ship_date).toLocaleDateString()
    },
    {
      accessorKey: 'close_date',
      header: t('admin.trips.close_date'),
      cell: ({ row }) => (row.original.close_date ? new Date(row.original.close_date).toLocaleDateString() : '-')
    },
    {
      accessorKey: 'status',
      header: t('admin.trips.status'),
      cell: ({ row }) => {
        const status = row.original.status
        const colors = {
          open: 'bg-green-100 text-green-800',
          closed: 'bg-yellow-100 text-yellow-800',
          in_transit: 'bg-blue-100 text-blue-800',
          arrived: 'bg-gray-100 text-gray-800'
        }
        return (
          <select
            value={status}
            onChange={(e) => updateStatusMutation.mutate({ id: row.original.id, status: e.target.value })}
            className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status] || 'bg-gray-100'} border-0 cursor-pointer`}
          >
            <option value="open">{t('admin.trips.status_open')}</option>
            <option value="closed">{t('admin.trips.status_closed')}</option>
            <option value="in_transit">{t('admin.trips.status_in_transit')}</option>
            <option value="arrived">{t('admin.trips.status_arrived')}</option>
          </select>
        )
      }
    },
    {
      accessorKey: 'max_cap',
      header: t('admin.trips.capacity'),
      cell: ({ row }) => `${row.original.current_cap || 0} / ${row.original.max_cap || '-'} kg`
    },
    {
      id: 'actions',
      header: t('admin.trips.actions'),
      cell: ({ row }) => (
        <button
          onClick={() => {
            setNewTripForm({
              type: row.original.type || 'flight',
              ship_date: row.original.ship_date ? new Date(row.original.ship_date).toISOString().split('T')[0] : '',
              close_date: row.original.close_date ? new Date(row.original.close_date).toISOString().split('T')[0] : '',
              max_cap: row.original.max_cap || 0,
              origin_id: (row.original as any).origin_id || 2,
              destination_id: (row.original as any).destination_id || 1
            })
            setEditingTripId(row.original.id)
            setIsAdding(true)
          }}
          className="btn-icon"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ]

  const [newTripForm, setNewTripForm] = useState({
    type: 'flight',
    ship_date: '',
    close_date: '',
    max_cap: 30,
    origin_id: 2, // JP
    destination_id: 1 // TH
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTripId) {
      editTripMutation.mutate({ id: editingTripId, payload: newTripForm })
    } else {
      addTripMutation.mutate(newTripForm)
    }
  }

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <Plane className="w-8 h-8 mr-3" />
          {t('admin.trips.trips_title')}
        </h1>
        <button onClick={() => setIsAdding(!isAdding)} className="btn-primary">
          {isAdding ? <><X className="w-4 h-4 mr-2" /> {t('admin.trips.cancel')}</> : <><Plus className="w-4 h-4 mr-2" /> {t('admin.trips.add_trip')}</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="card-panel space-y-4">
          <h2 className="text-xl font-bold">{editingTripId ? t('admin.trips.edit_trip') : t('admin.trips.add_trip')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-admin">{t('admin.trips.type')}</label>
              <select value={newTripForm.type} onChange={(e) => setNewTripForm({ ...newTripForm, type: e.target.value })} className="input-admin">
                <option value="flight">{t('admin.trips.flight')}</option>
                <option value="sea">{t('admin.trips.sea_freight')}</option>
              </select>
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.origin')}</label>
              <select value={newTripForm.origin_id} onChange={(e) => setNewTripForm({ ...newTripForm, origin_id: Number(e.target.value) })} className="input-admin">
                <option value={1}>{t('admin.trips.thailand')}</option>
                <option value={2}>{t('admin.trips.japan')}</option>
              </select>
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.destination')}</label>
              <select value={newTripForm.destination_id} onChange={(e) => setNewTripForm({ ...newTripForm, destination_id: Number(e.target.value) })} className="input-admin">
                <option value={1}>{t('admin.trips.thailand')}</option>
                <option value={2}>{t('admin.trips.japan')}</option>
              </select>
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.max_cap')}</label>
              <input type="number" step="0.1" value={newTripForm.max_cap} onChange={(e) => setNewTripForm({ ...newTripForm, max_cap: Number(e.target.value) })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.ship_date')}</label>
              <input type="date" required value={newTripForm.ship_date} onChange={(e) => setNewTripForm({ ...newTripForm, ship_date: e.target.value })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.close_date')}</label>
              <input type="date" required value={newTripForm.close_date} onChange={(e) => setNewTripForm({ ...newTripForm, close_date: e.target.value })} className="input-admin" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={addTripMutation.isPending} className="btn-primary px-6">
              {addTripMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('admin.trips.save')}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={trips || []} searchKey="type" searchPlaceholder={t('admin.trips.search_trips')} />
      )}
    </div>
  )
}
