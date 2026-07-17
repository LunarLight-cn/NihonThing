import React from 'react'
import { ClipboardList, ShoppingCart, Store, Plane, Ticket, MapPin, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardLayout } from './DashboardLayout'
import type { DashboardNavItem } from './DashboardLayout'

export const AgentLayout: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  const navItems: DashboardNavItem[] = [
    { name: t('agent.nav.dashboard'), path: '/agent', icon: ClipboardList },
    { name: t('agent.nav.purchases'), path: '/agent/purchases', icon: ShoppingCart },
    { name: t('agent.nav.catalog'), path: '/agent/catalog', icon: Store },
    { name: t('agent.nav.trips'), path: '/agent/trips', icon: Plane },
    { name: t('agent.nav.tickets'), path: '/agent/tickets', icon: Ticket },
    { name: t('agent.nav.locations'), path: '/agent/locations', icon: MapPin }
  ]

  return (
    <DashboardLayout
      brand="NihonThing Agent"
      mobileTitle="Agent"
      roleLabel={user?.role === 'admin' ? 'Admin' : 'Agent'}
      navItems={navItems}
      crossLinks={user?.role === 'admin' ? [{ name: t('nav.adminDashboard'), path: '/admin', icon: Shield }] : []}
    />
  )
}
