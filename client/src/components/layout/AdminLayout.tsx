import React from 'react'
import { LayoutDashboard, Package, Plane, Ticket, Users, Settings, Store, Calendar, MapPin, ShoppingCart, ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from './DashboardLayout'
import type { DashboardNavItem } from './DashboardLayout'

export const AdminLayout: React.FC = () => {
  const { t } = useTranslation()

  const navItems: DashboardNavItem[] = [
    { name: t('admin.nav.overview'), path: '/admin', icon: LayoutDashboard },
    { name: t('admin.nav.orders'), path: '/admin/orders', icon: Package },
    { name: t('admin.nav.trips'), path: '/admin/trips', icon: Plane },
    { name: t('admin.nav.tickets'), path: '/admin/tickets', icon: Ticket },
    { name: t('admin.nav.purchases'), path: '/admin/purchases', icon: ShoppingCart },
    { name: t('admin.nav.catalog'), path: '/admin/products', icon: Store },
    { name: t('admin.nav.locations'), path: '/admin/locations', icon: MapPin },
    { name: t('admin.nav.events'), path: '/admin/events', icon: Calendar },
    { name: t('admin.nav.users'), path: '/admin/users', icon: Users },
    { name: t('admin.nav.settings'), path: '/admin/settings', icon: Settings }
  ]

  return (
    <DashboardLayout
      brand="NihonThing Admin"
      mobileTitle="Admin"
      roleLabel="Admin"
      navItems={navItems}
      crossLinks={[{ name: t('nav.agentDashboard'), path: '/agent', icon: ClipboardList }]}
    />
  )
}
