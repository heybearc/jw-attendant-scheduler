import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'

/**
 * Higher-Order Function to add event page permissions to getServerSideProps
 * 
 * This automatically adds canEdit, canDelete, and canManagePermissions
 * to your page props without manual implementation.
 * 
 * Usage:
 * ```tsx
 * export const getServerSideProps = withEventPagePermissions(async (context) => {
 *   // Your existing getServerSideProps logic
 *   return {
 *     props: {
 *       eventId: id,
 *       event,
 *       // ... your other props
 *     }
 *   }
 * })
 * ```
 * 
 * The wrapper will automatically add:
 * - canEdit: boolean
 * - canDelete: boolean  
 * - canManagePermissions: boolean
 */
export function withEventPagePermissions<P extends { [key: string]: any }>(
  getServerSidePropsFunc: (
    context: GetServerSidePropsContext
  ) => Promise<GetServerSidePropsResult<P>>
) {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<any>> => {
    const session = await getServerSession(context.req, context.res, authOptions)
    
    if (!session) {
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      }
    }

    const result = await getServerSidePropsFunc(context)

    if ('props' in result) {
      const { id } = context.params!
      const { canManageEvent, canDeleteEvent, canManagePermissions } = await import('../src/lib/eventAccess')
      
      const userId = session.user?.id || ''
      const canEdit = await canManageEvent(userId, id as string)
      const canDelete = await canDeleteEvent(userId, id as string)
      const canManagePerms = await canManagePermissions(userId, id as string)

      return {
        props: {
          ...result.props,
          canEdit,
          canDelete,
          canManagePermissions: canManagePerms,
        },
      }
    }

    return result
  }
}

/**
 * Helper to extract event permissions from existing page props
 * Use this in your component to get the permission props
 */
export interface EventPagePermissions {
  canEdit: boolean
  canDelete: boolean
  canManagePermissions: boolean
}

export function getEventPermissions(props: any): EventPagePermissions {
  return {
    canEdit: props.canEdit ?? false,
    canDelete: props.canDelete ?? false,
    canManagePermissions: props.canManagePermissions ?? false,
  }
}
