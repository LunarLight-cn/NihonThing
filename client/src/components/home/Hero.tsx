import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PlaneTakeoff, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'

interface Ship {
  id: number
  type: string
  ship_date: string
  close_date: string | null
  status: string
  is_closed: boolean
}

export const Hero: React.FC = () => {
  const { t } = useTranslation()

  const { data: ships, isLoading } = useQuery({
    queryKey: ['ships', 'hero'],
    queryFn: async () => {
      const res = await api.get('/ships')
      return res.data.data as Ship[]
    }
  })

  // Find the first upcoming trip that is not closed
  const nextTrip = ships?.find((s) => !s.is_closed && s.status !== 'closed')
  return (
    <section className="relative overflow-hidden bg-secondary/50 py-20 lg:py-32">
      {/* Abstract Zen background element */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

      <div className="section-container relative z-10">
        <div className="max-w-3xl">
          {isLoading ? (
            <div className="badge-pill bg-primary/10 text-primary mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('hero.checkingTrip')}</span>
            </div>
          ) : nextTrip ? (
            <div className="badge-pill bg-primary/10 text-primary mb-6">
              <PlaneTakeoff className="w-4 h-4" />
              <span>{t('hero.nextTrip', { date: new Date(nextTrip.ship_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })}</span>
            </div>
          ) : (
            <div className="badge-pill bg-secondary text-muted-foreground mb-6">
              <PlaneTakeoff className="w-4 h-4" />
              <span>{t('hero.stayTuned')}</span>
            </div>
          )}

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight mb-6">
            {t('hero.title1')} <br />
            <span className="text-primary">{t('hero.title2')}</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-xl">{t('hero.subtitle')}</p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/catalog"
              className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-all flex items-center space-x-2 shadow-lg shadow-primary/20"
            >
              <span>{t('hero.explore')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/request"
              className="px-6 py-3 bg-card text-foreground border border-border font-medium rounded-md hover:bg-secondary transition-all"
            >
              {t('hero.request')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
