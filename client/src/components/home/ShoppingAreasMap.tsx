import React, { useState, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { MapPin, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'
import { useLocalizedName } from '../../utils/localization'
import { TrendingItems } from './TrendingItems'

// You should put your actual API key in .env
// For this demo, we'll gracefully handle missing keys or use a placeholder map
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.75rem'
}

const center = {
  lat: 35.6895, // Tokyo
  lng: 139.6917
}

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  // Custom minimalist map style (silver/light theme)
  styles: [
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f9f7f1' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#dbe2e6' }]
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#f4f1ea' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.icon',
      stylers: [{ saturation: -30 }, { lightness: 15 }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#e5e3df' }, { weight: 1.5 }]
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [{ color: '#d5d5d5' }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#7a7874' }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }, { weight: 3 }]
    }
  ]
}

interface Area {
  id: number
  name_th: string
  name_en: string
  name_jp: string | null
  map_location: string | null
  status?: 'active' | 'inactive'
  shopCount?: number
  productCount?: number
}

export const ShoppingAreasMap: React.FC = () => {
  const { t } = useTranslation()
  const getName = useLocalizedName()

  const { data: areas, isLoading: isAreasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      // Inactive areas are an admin bookkeeping state - the public map only
      // shows what is actually open.
      return (res.data.data as Area[]).filter((a) => a.status !== 'inactive')
    }
  })

  const fallbackShibuya = [
    {
      id: 1,
      name: t('home.areas.shibuyaName'),
      type: `0 ${t('home.areas.shops')}`,
      lat: 35.6595,
      lng: 139.7004,
      description: `0 ${t('home.areas.products')}`
    }
  ]

  // Map API areas to map markers
  const shoppingAreas =
    areas && areas.length > 0
      ? areas.map((area) => {
          // Default coordinates (Tokyo center)
          let lat = 35.6895
          let lng = 139.6917

          // Fallbacks for known areas if map_location is null
          if (area.name_en.toLowerCase().includes('akihabara')) {
            lat = 35.69836
            lng = 139.77313
          } else if (area.name_en.toLowerCase().includes('shibuya')) {
            lat = 35.6595
            lng = 139.7004
          } else if (area.name_en.toLowerCase().includes('shinjuku')) {
            lat = 35.6938
            lng = 139.7034
          } else if (area.name_en.toLowerCase().includes('harajuku')) {
            lat = 35.67
            lng = 139.7027
          }

          // Attempt to parse map_location "lat,lng" if exists
          if (area.map_location && area.map_location.includes(',')) {
            const parts = area.map_location.split(',')
            if (parts.length >= 2) {
              lat = parseFloat(parts[0].trim()) || lat
              lng = parseFloat(parts[1].trim()) || lng
            }
          }

          return {
            id: area.id,
            name: getName(area),
            type: `${area.shopCount || 0} ${t('home.areas.shops')}`,
            lat,
            lng,
            description: `${area.productCount || 0} ${t('home.areas.products')}`
          }
        })
      : fallbackShibuya
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [activeMarker, setActiveMarker] = useState<number | null>(null)

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, [])

  const onUnmount = useCallback(function callback() {
    setMap(null)
  }, [])

  return (
    <section className="py-16 bg-background">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="section-title-lg mb-4">{t('home.areas.title')}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card-panel-flush overflow-hidden p-2">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
              >
                {shoppingAreas.map((area) => (
                  <Marker
                    key={area.id}
                    position={{ lat: area.lat, lng: area.lng }}
                    onClick={() => setActiveMarker(area.id)}
                    icon={{
                      url:
                        'data:image/svg+xml;charset=UTF-8,' +
                        encodeURIComponent(
                          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#AD1F35" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
                        ),
                      scaledSize: new window.google.maps.Size(32, 32)
                    }}
                  >
                    {activeMarker === area.id && (
                      <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                        <div className="p-1 max-w-[200px] font-sans">
                          <h3 className="font-bold text-sm mb-1">{area.name}</h3>
                          <p className="text-xs text-primary font-medium mb-1">{area.type}</p>
                          <p className="text-xs text-gray-600">{area.description}</p>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                ))}
              </GoogleMap>
            ) : (
              <div className="w-full h-[500px] bg-secondary/50 rounded-lg flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
                  <p className="text-muted-foreground">{t('home.areas.loadingMap')}</p>
                  {!GOOGLE_MAPS_API_KEY && <p className="text-xs text-destructive mt-2">{t('home.areas.apiKeyMissing')}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('home.areas.popular')}</h3>
            {isAreasLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              shoppingAreas.map((area) => (
                <div
                  key={area.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    activeMarker === area.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setActiveMarker(area.id)
                    if (map) {
                      map.panTo({ lat: area.lat, lng: area.lng })
                      map.setZoom(14)
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-foreground">{area.name}</h4>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{area.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {activeMarker && (
          <div className="mt-12">
            <TrendingItems 
              areaId={activeMarker} 
              hideViewAll 
              title={t('home.areas.trendingIn', { area: shoppingAreas.find(a => a.id === activeMarker)?.name || '' })} 
            />
          </div>
        )}
      </div>
    </section>
  )
}
