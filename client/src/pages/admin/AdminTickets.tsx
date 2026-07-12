import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Ticket, Loader2, Save, X, ExternalLink, Image as ImageIcon, Edit2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface TicketData {
  id: number
  item_name: string
  client: { username: string }
  status: string
  cdate: string
  img: string
  external_link?: string
  expected_price?: number
  proposed_price_jpy?: number
  proposed_price_thb?: number
  trip_id?: number
}

export const AdminTickets: React.FC = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets')
      return res.data.data as TicketData[]
    }
  })

  const { data: trips } = useQuery({
    queryKey: ['admin-trips-list'],
    queryFn: async () => {
      const res = await api.get('/ships')
      return res.data.data
    }
  })

  const updateTicketMutation = useMutation({
    mutationFn: (data: any) => api.put(`/tickets/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
      setSelectedTicket(null)
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update ticket')
    }
  })

  const [form, setForm] = useState({
    status: '',
    proposed_price_jpy: '',
    proposed_price_thb: '',
    trip_id: ''
  })

  const handleEdit = (ticket: TicketData) => {
    setSelectedTicket(ticket)
    setForm({
      status: ticket.status || 'pending',
      proposed_price_jpy: ticket.proposed_price_jpy?.toString() || '',
      proposed_price_thb: ticket.proposed_price_thb?.toString() || '',
      trip_id: ticket.trip_id?.toString() || ''
    })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket) return

    const basePayload = {
      status: form.status,
      proposed_price_jpy: form.proposed_price_jpy ? Number(form.proposed_price_jpy) : undefined,
      proposed_price_thb: form.proposed_price_thb ? Number(form.proposed_price_thb) : undefined,
      trip_id: form.trip_id ? Number(form.trip_id) : undefined,
      agent_id: user?.id
    }

    const payload = Object.fromEntries(Object.entries(basePayload).filter(([_, v]) => v !== undefined && v !== ''))
    updateTicketMutation.mutate({ id: selectedTicket.id, payload })
  }

  const columns: ColumnDef<TicketData>[] = [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'img',
      header: 'Item',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded overflow-hidden bg-secondary flex items-center justify-center">
            {row.original.img ? (
              <img src={row.original.img} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </div>
          <span className="font-medium max-w-[200px] truncate">{row.original.item_name}</span>
        </div>
      )
    },
    { accessorKey: 'client.username', header: 'Client' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status
        const color =
          s === 'pending'
            ? 'bg-yellow-100 text-yellow-700'
            : s === 'negotiating'
              ? 'bg-blue-100 text-blue-700'
              : s === 'accepted'
                ? 'bg-green-100 text-green-700'
                : s === 'rejected' || s === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
        return <span className={`badge ${color}`}>{s}</span>
      }
    },
    {
      accessorKey: 'expected_price',
      header: 'Client Budget',
      cell: ({ row }) => (row.original.expected_price ? `฿${row.original.expected_price.toLocaleString()}` : '-')
    },
    {
      accessorKey: 'proposed_price_thb',
      header: 'Our Price',
      cell: ({ row }) => (row.original.proposed_price_thb ? `฿${row.original.proposed_price_thb.toLocaleString()}` : '-')
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button onClick={() => handleEdit(row.original)} className="btn-icon">
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ]

  return (
    <div className="admin-page max-w-7xl">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <Ticket className="w-8 h-8 mr-3" />
          Custom Requests
        </h1>
      </div>

      {selectedTicket && (
        <div className="card-panel space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h2 className="text-xl font-bold">Manage Request #{selectedTicket.id}</h2>
            <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">Item Details</h3>
              <div className="flex space-x-4">
                <img src={selectedTicket.img} alt="" className="w-24 h-24 rounded-lg object-cover border border-border" />
                <div>
                  <p className="font-bold text-lg">{selectedTicket.item_name}</p>
                  <p className="text-sm text-muted-foreground">Client: {selectedTicket.client?.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Client's Budget: <span className="font-medium text-foreground">{selectedTicket.expected_price ? `฿${selectedTicket.expected_price}` : 'Not specified'}</span>
                  </p>
                  {selectedTicket.external_link && (
                    <a href={selectedTicket.external_link} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center mt-2">
                      <ExternalLink className="w-3 h-3 mr-1" /> View Original Link
                    </a>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 bg-secondary/50 p-4 rounded-lg">
              <h3 className="font-medium text-muted-foreground">Propose & Update</h3>

              <div>
                <label className="label-admin">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-admin">
                  <option value="pending">Pending</option>
                  <option value="negotiating">Negotiating (Waiting for client)</option>
                  <option value="accepted">Accepted (Client paid)</option>
                  <option value="purchasing">Purchasing in Japan</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-admin">Price (JPY)</label>
                  <input type="number" value={form.proposed_price_jpy} onChange={(e) => setForm({ ...form, proposed_price_jpy: e.target.value })} placeholder="e.g. 1500" className="input-admin" />
                </div>
                <div>
                  <label className="label-admin">Price (THB)</label>
                  <input type="number" value={form.proposed_price_thb} onChange={(e) => setForm({ ...form, proposed_price_thb: e.target.value })} placeholder="e.g. 500" className="input-admin" />
                </div>
              </div>

              <div>
                <label className="label-admin">Assign to Trip (Optional)</label>
                <select value={form.trip_id} onChange={(e) => setForm({ ...form, trip_id: e.target.value })} className="input-admin">
                  <option value="">-- No Trip Assigned --</option>
                  {trips?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      Trip #{t.id} ({new Date(t.ship_date).toLocaleDateString()}) - {t.type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={updateTicketMutation.isPending} className="btn-primary">
                  {updateTicketMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="card-panel-flush">
          <DataTable columns={columns} data={tickets || []} searchKey="item_name" searchPlaceholder="Search by item name..." />
        </div>
      )}
    </div>
  )
}
