import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'

export default function AttendantsRedirect() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {}
  
  return {
    redirect: {
      destination: `/events/${id}/volunteers`,
      permanent: false,
    },
  }
}
