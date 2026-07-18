// One colour per status, shared by every page that shows one, so admin,
// agent and customer never disagree about what a status looks like.

export const ORDER_STATUSES = ['pending', 'purchasing', 'in_transit', 'arrived', 'local_shipping', 'delivered', 'cancelled'] as const
export const PAYMENT_STATUSES = ['pending_deposit', 'deposit_paid', 'pending_remaining', 'fully_paid'] as const

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: 'badge-muted',
  purchasing: 'badge-info',
  in_transit: 'badge-blue',
  arrived: 'badge-purple',
  local_shipping: 'badge-orange',
  delivered: 'badge-success',
  cancelled: 'badge-danger'
}

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  pending_deposit: 'badge-warning',
  deposit_paid: 'badge-info',
  pending_remaining: 'badge-warning',
  fully_paid: 'badge-success'
}

export const orderStatusBadge = (status?: string | null) =>
  ORDER_STATUS_BADGE[status ?? ''] ?? 'badge-muted'

export const paymentStatusBadge = (status?: string | null) =>
  PAYMENT_STATUS_BADGE[status ?? ''] ?? 'badge-muted'

// The deposit is what commits an order; before it, the order is a wish and
// nobody should shop for it.
export const isDepositPaid = (paymentStatus?: string | null) =>
  paymentStatus === 'deposit_paid' || paymentStatus === 'pending_remaining' || paymentStatus === 'fully_paid'
