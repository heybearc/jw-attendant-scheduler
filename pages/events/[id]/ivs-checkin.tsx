import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function IVSCheckinRedirect() {
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      router.replace(`/events/${id}/ivs`)
    }
  }, [id, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to IVS Module...</p>
      </div>
    </div>
  )
}
