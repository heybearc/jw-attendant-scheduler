import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth/[...nextauth]"
import { handleApiError } from '../src/lib/apiError'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== DEBUG SESSION ===')
    
    const session = await getServerSession(req, res, authOptions)
    
    
    if (session) {
      return res.status(200).json({ 
        success: true, 
        authenticated: true,
        user: session.user,
        session: session
      })
    } else {
      return res.status(200).json({ 
        success: false, 
        authenticated: false,
        message: 'No session found',
        cookies: req.headers.cookie || 'No cookies'
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
