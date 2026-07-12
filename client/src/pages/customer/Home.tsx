import React from 'react'
import { TripSchedule } from '../../components/home/TripSchedule'
import { NewArrivals } from '../../components/home/NewArrivals'
import { TrendingItems } from '../../components/home/TrendingItems'

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TripSchedule />
      <NewArrivals />
      <TrendingItems />
    </div>
  )
}
