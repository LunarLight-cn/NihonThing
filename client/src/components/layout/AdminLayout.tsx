import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, Package, Plane, Ticket, Users, Settings, LogOut, Store, Menu, Calendar, Home, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { name: t('admin.overview'), path: '/admin', icon: LayoutDashboard },
    { name: t('admin.orders'), path: '/admin/orders', icon: Package },
    { name: t('admin.trips'), path: '/admin/trips', icon: Plane },
    { name: t('admin.tickets'), path: '/admin/tickets', icon: Ticket },
    { name: t('admin.catalog'), path: '/admin/products', icon: Store },
    { name: 'Areas', path: '/admin/areas', icon: MapPin },
    { name: 'Shops', path: '/admin/shops', icon: Store },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: t('admin.users'), path: '/admin/users', icon: Users },
    { name: t('admin.settings'), path: '/admin/settings', icon: Settings }
  ]

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="text-xl font-bold text-primary">
            NihonThing Admin
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`admin-nav-link ${isActive ? 'is-active' : ''}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-4 px-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-primary font-bold">{user?.username?.charAt(0).toUpperCase() || 'A'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">Admin</p>
            </div>
          </div>
          <Link
            to="/"
            className="admin-nav-link mb-2"
          >
            <Home className="w-5 h-5" />
            <span>Back to Store</span>
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('admin.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 md:hidden flex items-center justify-between px-4 bg-card border-b border-border">
          <span className="text-lg font-bold text-primary">Admin</span>
          <button className="p-2">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
