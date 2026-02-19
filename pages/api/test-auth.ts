import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth/[...nextauth]"
import { handleApiError } from '@/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing getServerSession...')
    
    const session = await getServerSession(req, res, authOptions)
    
    if (session) {
      return res.status(200).json({ 
        success: true, 
        authenticated: true,
        user: session.user,
        message: 'Session working correctly'
      })
    } else {
      return res.status(401).json({ 
        success: false, 
        authenticated: false,
        message: 'No session found'
      })
    }
  } catch (error) {
    // Error logged by handleApiError
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
