import React from 'react'
import { Hero } from '../../components/home/Hero'
import { TripSchedule } from '../../components/home/TripSchedule'
import { TrendingItems } from '../../components/home/TrendingItems'
import { ShoppingAreasMap } from '../../components/home/ShoppingAreasMap'

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <TripSchedule />
      <ShoppingAreasMap />
      <TrendingItems />
    </div>
  )
}
