import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { CustomerLayout } from './components/layout/CustomerLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { Home } from './pages/customer/Home'
import { Catalog } from './pages/customer/Catalog'
import { ProductDetails } from './pages/customer/ProductDetails'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Customer Portal */}
            <Route path="/" element={<CustomerLayout />}>
              <Route index element={<Home />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="request" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Custom Request</h1></div>} />
              <Route path="areas" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Shopping Areas</h1></div>} />
              <Route path="orders" element={
                <ProtectedRoute>
                  <div className="p-8"><h1 className="text-3xl font-bold text-primary">My Orders</h1></div>
                </ProtectedRoute>
              } />
            </Route>

            {/* Admin Dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Overview</h1></div>} />
              <Route path="orders" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Orders</h1></div>} />
              <Route path="trips" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Trips</h1></div>} />
              <Route path="tickets" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Tickets</h1></div>} />
              <Route path="products" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Products</h1></div>} />
              <Route path="users" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Users</h1></div>} />
              <Route path="settings" element={<div className="p-8"><h1 className="text-3xl font-bold text-primary">Settings</h1></div>} />
            </Route>
          </Routes>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
