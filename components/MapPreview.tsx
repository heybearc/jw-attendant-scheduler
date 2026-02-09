import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api'

const libraries: ("places")[] = ["places"]

interface MapPreviewProps {
  latitude: number
  longitude: number
  name?: string
  className?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '200px'
}

export default function MapPreview({ latitude, longitude, name, className = '' }: MapPreviewProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  })

  const center = {
    lat: latitude,
    lng: longitude
  }

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  }

  if (loadError) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-red-600">Error loading map</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={mapOptions}
      >
        <Marker
          position={center}
          title={name}
        />
      </GoogleMap>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Get Directions →
        </a>
      </div>
    </div>
  )
}
