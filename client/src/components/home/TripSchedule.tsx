import React from 'react'
import { Calendar, Package, MapPin, Loader2, AlertCircle, PlaneTakeoff, Ship as ShipIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'

type TripFillAxis = 'items' | 'weight' | 'price'
interface TripAxis {
  axis: TripFillAxis
  percent: number
  current: number
  max: number
}
interface Ship {
  id: number
  type: string
  ship_date: string
  close_date: string | null
  status: string
  max_cap: string
  current_cap: string
  is_closed: boolean
  // The axis closest to closing (highest %) — null when the trip has no caps.
  fill: TripAxis | null
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
    <section className="pt-6 pb-6 bg-background">
      <div className="section-container">
        {isLoading ? (
          <div className="loading-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="error-alert">
            <AlertCircle className="w-5 h-5 mr-2" />
            {t('home.schedule.errorLoading')}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((trip) => {
              const isFull = trip.is_closed || trip.status === 'closed'
              // Show how full the trip is on whichever axis is closest to
              // closing (items / weight / price), not weight alone.
              const percentFilled = isFull ? 100 : (trip.fill?.percent ?? 0)

              return (
                <div
                  key={trip.id}
                  className={`bg-card border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isFull ? 'border-border/50 opacity-75' : 'border-border'}`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
                          {trip.type === 'sea' ? (
                            <>
                              <ShipIcon className="w-5 h-5 text-primary shrink-0" />
                              <span className="truncate">{t('home.schedule.seaFreight')}</span>
                            </>
                          ) : (
                            <>
                              <PlaneTakeoff className="w-5 h-5 text-primary shrink-0" />
                              <span className="truncate">
                                {trip.type.charAt(0).toUpperCase() + trip.type.slice(1)} {t('home.schedule.flight')}
                              </span>
                            </>
                          )}
                        </h3>
                      </div>
                      <span
                        className={`badge shrink-0 whitespace-nowrap ${isFull ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}
                      >
                        {isFull ? t('home.schedule.statusClosed') : t('home.schedule.statusOpen')}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-y-2 mb-4 ml-1">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          Japan
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          {new Date(trip.ship_date).toLocaleDateString()}
                        </div>
                      </div>
                      {trip.close_date && (
                        <div className="text-sm text-muted-foreground whitespace-nowrap">{t('home.schedule.closesOn', { date: new Date(trip.close_date).toLocaleDateString() })}</div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-border/60">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-foreground font-semibold flex items-center">
                          <Package className="w-3.5 h-3.5 mr-1.5" />
                          {t('home.schedule.capacity')}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {trip.fill || isFull
                            ? t('home.schedule.percentFull', { pct: percentFilled })
                            : t('home.schedule.noLimit')}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${isFull ? 'progress-fill-muted' : percentFilled >= 80 ? 'progress-fill-warning' : 'progress-fill-primary'}`}
                          style={{ width: `${Math.max(percentFilled, trip.fill ? 2 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">{t('home.schedule.stayTuned')}</div>
        )}
      </div>
    </section>
  )
}
