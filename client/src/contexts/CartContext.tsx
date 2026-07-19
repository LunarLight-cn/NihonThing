import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  lineId: string
  id: number
  name: string
  brand: string
  price_thb: number
  image: string
  quantity: number
  selectedOptions?: Record<string, string>
}

// Unique per product + chosen options — same product with a different size is a
// separate cart line. Keys are sorted so the id is stable regardless of order.
export const makeLineId = (id: number, options?: Record<string, string>) => {
  const opts = options && Object.keys(options).length
    ? Object.keys(options).sort().map((k) => `${k}=${options[k]}`).join('&')
    : ''
  return `${id}::${opts}`
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity' | 'lineId'>) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // A corrupted cart in storage must not take the whole app down.
    try {
      const saved = localStorage.getItem('cart')
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (newItem: Omit<CartItem, 'quantity' | 'lineId'>) => {
    const lineId = makeLineId(newItem.id, newItem.selectedOptions)
    setItems((current) => {
      const existing = current.find((i) => i.lineId === lineId)
      if (existing) {
        return current.map((i) => (i.lineId === lineId ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...current, { ...newItem, lineId, quantity: 1 }]
    })
    setIsCartOpen(true) // Open cart sidebar when item added
  }

  const removeItem = (lineId: string) => {
    setItems((current) => current.filter((i) => i.lineId !== lineId))
  }

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity < 1) return removeItem(lineId)
    setItems((current) => current.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)))
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price_thb * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
