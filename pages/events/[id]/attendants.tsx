import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AttendantsRedirect() {
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      router.replace(`/events/${id}/volunteers`)
    }
  }, [id, router])

  return null
}
