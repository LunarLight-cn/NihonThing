import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Plane, Plus, Loader2, Edit, Save, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Trip {
  id: number
  type: string
  ship_date: string
  close_date: string
  status: 'open' | 'closed' | 'in_transit' | 'arrived'
  max_cap: string
  current_cap: string
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
    mutationFn: ({ id, status }: { id: number, status: string }) => api.put(`/ships/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
    }
  })

  const editTripMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: Partial<Trip> }) => api.put(`/ships/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
      setIsAdding(false)
      setEditingTripId(null)
    }
  })

  const columns: ColumnDef<Trip>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'ship_date',
      header: 'Ship Date',
      cell: ({ row }) => new Date(row.original.ship_date).toLocaleDateString()
    },
    {
      accessorKey: 'close_date',
      header: 'Close Date',
      cell: ({ row }) => row.original.close_date ? new Date(row.original.close_date).toLocaleDateString() : '-'
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="in_transit">In Transit</option>
            <option value="arrived">Arrived</option>
          </select>
        )
      }
    },
    {
      accessorKey: 'max_cap',
      header: 'Capacity',
      cell: ({ row }) => `${row.original.current_cap || 0} / ${row.original.max_cap || '-'}`
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button 
          onClick={() => {
            setNewTripForm({
              type: row.original.type || 'flight',
              ship_date: row.original.ship_date ? new Date(row.original.ship_date).toISOString().split('T')[0] : '',
              close_date: row.original.close_date ? new Date(row.original.close_date).toISOString().split('T')[0] : '',
              max_cap: row.original.max_cap || '',
              origin_id: (row.original as any).origin_id || 2,
              destination_id: (row.original as any).destination_id || 1
            })
            setEditingTripId(row.original.id)
            setIsAdding(true)
          }}
          className="text-xs text-primary hover:underline font-medium"
        >
          Edit
        </button>
      )
    }
  ]

  const [newTripForm, setNewTripForm] = useState({
    type: 'flight',
    ship_date: '',
    close_date: '',
    max_cap: '30kg',
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
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Plane className="w-8 h-8 mr-3" />
          Trip Management
        </h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center hover:bg-primary/90 transition-colors"
        >
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Trip'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
          <h2 className="text-xl font-bold">{editingTripId ? 'Edit Trip' : 'New Trip'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select 
                value={newTripForm.type}
                onChange={e => setNewTripForm({...newTripForm, type: e.target.value})}
                className="w-full p-2 border border-border rounded bg-background"
              >
                <option value="flight">Flight</option>
                <option value="sea">Sea Freight</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Origin Country</label>
              <select 
                value={newTripForm.origin_id}
                onChange={e => setNewTripForm({...newTripForm, origin_id: Number(e.target.value)})}
                className="w-full p-2 border border-border rounded bg-background"
              >
                <option value={1}>Thailand</option>
                <option value={2}>Japan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination Country</label>
              <select 
                value={newTripForm.destination_id}
                onChange={e => setNewTripForm({...newTripForm, destination_id: Number(e.target.value)})}
                className="w-full p-2 border border-border rounded bg-background"
              >
                <option value={1}>Thailand</option>
                <option value={2}>Japan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Capacity (e.g. 30kg)</label>
              <input 
                type="text" 
                value={newTripForm.max_cap}
                onChange={e => setNewTripForm({...newTripForm, max_cap: e.target.value})}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ship Date</label>
              <input 
                type="date" 
                required
                value={newTripForm.ship_date}
                onChange={e => setNewTripForm({...newTripForm, ship_date: e.target.value})}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Close Date</label>
              <input 
                type="date" 
                required
                value={newTripForm.close_date}
                onChange={e => setNewTripForm({...newTripForm, close_date: e.target.value})}
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={addTripMutation.isPending}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg flex items-center hover:bg-primary/90"
            >
              {addTripMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Trip
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={trips || []} searchKey="type" searchPlaceholder="Search trips..." />
      )}
    </div>
  )
}
