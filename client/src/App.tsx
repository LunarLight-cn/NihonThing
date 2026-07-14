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
import { CustomRequest } from './pages/customer/CustomRequest'
import { Checkout } from './pages/customer/Checkout'
import { Settings } from './pages/customer/Settings'
import { Support } from './pages/customer/Support'
import { Terms } from './pages/customer/Terms'
import { Privacy } from './pages/customer/Privacy'
import { ShoppingAreasMap } from './components/home/ShoppingAreasMap'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminTrips } from './pages/admin/AdminTrips'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminOverview } from './pages/admin/AdminOverview'
import { AdminEvents } from './pages/admin/AdminEvents'
import { AdminSettings } from './pages/admin/AdminSettings'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminTickets } from './pages/admin/AdminTickets'
import { AdminLocations } from './pages/admin/AdminLocations'
import { AdminPurchases } from './pages/admin/AdminPurchases'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // ปิดการยิง API ซ้ำเมื่อสลับแท็บไปมา
      staleTime: 5 * 60 * 1000,    // จำข้อมูลไว้ในหน่วยความจำ 5 นาที (ไม่ต้องยิง API ใหม่ถ้ายังไม่หมดเวลา)
      retry: 1                     // ถ้า Error ให้ลองใหม่แค่ 1 ครั้งพอ
    }
  }
})

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
              <Route path="request" element={<CustomRequest />} />
              <Route path="support" element={<Support />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="areas" element={<div className="pb-12"><ShoppingAreasMap /></div>} />
              <Route path="settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
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
              <Route index element={<AdminOverview />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="purchases" element={<AdminPurchases />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="locations" element={<AdminLocations />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
