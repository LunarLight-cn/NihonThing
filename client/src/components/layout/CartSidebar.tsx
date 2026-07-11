import { Link } from 'react-router-dom'
import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useTranslation } from 'react-i18next'

export const CartSidebar: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, totalPrice } = useCart()
  const { t } = useTranslation()

  if (!isCartOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-card border-l border-border z-[70] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            {t('cart.title')}
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4">
              <ShoppingBag className="w-12 h-12 text-border" />
              <div>
                <p className="font-medium text-foreground">{t('cart.empty')}</p>
                <p className="text-sm mt-1">{t('cart.emptyDesc')}</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors"
              >
                {t('cart.startShopping')}
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex space-x-4 border border-border p-3 rounded-lg bg-background">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 bg-secondary rounded-md">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:text-primary transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-primary text-sm">฿{(item.price_thb * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-card">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                <span className="font-medium">฿{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.shipping')}</span>
                <span className="text-muted-foreground italic">{t('cart.shippingCalc')}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold text-foreground">{t('cart.total')}</span>
                <span className="font-bold text-primary text-lg">฿{totalPrice.toLocaleString()}</span>
              </div>
            </div>
            
            <Link 
              to="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all flex justify-center items-center"
            >
              {t('cart.checkout')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
