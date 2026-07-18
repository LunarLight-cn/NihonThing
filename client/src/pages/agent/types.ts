export interface QueueProduct {
  id: number
  name_en: string
  name_th?: string
  name_jp?: string
  img?: string[]
  weight?: number
}

export interface QueueItem {
  id: number
  order_id: number
  product_id?: number | null
  ticket_id?: number | null
  quantity: number
  final_price?: number | null
  selected_options?: Record<string, string> | null
  claimed_by?: number | null
  claimed_at?: string | null
  claimedBy?: { id: number; username: string } | null
  product?: QueueProduct | null
  ticket?: { id: number; item_name: string; img?: string } | null
  bought_quantity: number
  is_complete: boolean
  actual_cost_thb: number
}

export interface QueuePayment {
  id: number
  amount: number
  payment_type: 'deposit' | 'remaining'
  status?: 'pending' | 'verified' | 'failed' | null
  slip_img: string
  cdate?: string
}

export interface QueueOrder {
  id: number
  order_code?: string | null
  status?: string | null
  payment_status?: string | null
  cdate?: string
  item_price_total?: number
  user?: { id: number; username: string; email: string } | null
  ship?: { id: number; type: string; ship_date: string; close_date?: string | null } | null
  address?: { fullname: string; surname: string; tel: string; address_line: string } | null
  payments: QueuePayment[]
  items: QueueItem[]
  is_fully_purchased: boolean
  tentative_total: number
  agent_spent_thb: number
  customer_paid_thb: number
}
