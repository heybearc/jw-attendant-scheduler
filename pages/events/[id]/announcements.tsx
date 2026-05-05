import { GetServerSideProps } from 'next'

/** Announcements are consolidated into Event General chat; this route stays for old links. */
export default function EventAnnouncementsRedirect() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }
  return {
    redirect: {
      destination: `/events/${id}/chat`,
      permanent: false
    }
  }
}
