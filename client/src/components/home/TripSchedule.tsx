import React from 'react'
import { Calendar, Package, MapPin, Loader2, AlertCircle, PlaneTakeoff, Ship as ShipIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'

interface Ship {
  id: number
  type: string
  ship_date: string
  close_date: string | null
  status: string
  max_cap: string
  current_cap: string
  is_closed: boolean
}

export const TripSchedule: React.FC = () => {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery({
    queryKey: ['ships'],
    queryFn: async () => {
      const res = await api.get('/ships')
      return res.data.data as Ship[]
    }
  })
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-foreground tracking-tight mb-4">{t('home.schedule.title')}</h2>
          <p className="text-muted-foreground">{t('home.schedule.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center text-destructive bg-destructive/10 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 mr-2" />
            {t('home.schedule.errorLoading')}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((trip) => {
              const capacity = Number(trip.max_cap) || 0
              const currentOrders = Number(trip.current_cap) || 0
              const isFull = trip.is_closed || trip.status === 'closed'
              const percentFilled = capacity > 0 ? Math.min(100, Math.round((currentOrders / capacity) * 100)) : 0

              return (
                <div 
                  key={trip.id} 
                  className={`bg-card border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isFull ? 'border-border/50 opacity-75' : 'border-border'}`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground flex items-center">
                          {trip.type === 'sea' ? (
                            <>
                              <ShipIcon className="w-5 h-5 mr-2 text-primary" />
                              {t('home.schedule.seaFreight')}
                            </>
                          ) : (
                            <>
                              <PlaneTakeoff className="w-5 h-5 mr-2 text-primary" />
                              {trip.type.charAt(0).toUpperCase() + trip.type.slice(1)} {t('home.schedule.flight')}
                            </>
                          )}
                        </h3>
                        {trip.close_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('home.schedule.closesOn', { date: new Date(trip.close_date).toLocaleDateString() })}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isFull ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                        {isFull ? t('home.schedule.statusClosed') : t('home.schedule.statusOpen')}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {t('home.schedule.destination')}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(trip.ship_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-medium flex items-center">
                          <Package className="w-4 h-4 mr-1.5" />
                          {t('home.schedule.capacity')}
                        </span>
                        <span className="text-muted-foreground">{t('home.schedule.capacityItems', { current: currentOrders, max: capacity })}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isFull ? 'bg-muted-foreground' : 'bg-primary'}`} 
                          style={{ width: `${percentFilled}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border text-muted-foreground">
            {t('home.schedule.stayTuned')}
          </div>
        )}
      </div>
    </section>
  )
}
