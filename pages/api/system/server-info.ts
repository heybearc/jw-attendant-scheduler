import { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const STATE_FILE = '/opt/theoshift/deployment-state.json';

// Query HAProxy config to determine which backend is active
async function queryHAProxyConfig(): Promise<'BLUE' | 'GREEN' | null> {
  try {
    // SSH to HAProxy and read the config file to see which backend is configured
    // Look for the main routing line: "use_backend theoshift.*if is_theoshift$" (not is_theoshift_blue/is_theoshift_green)
    const { stdout } = await execAsync(
      'ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no -i ~/.ssh/id_ed25519 root@10.92.3.26 "grep \'use_backend theoshift.*if is_theoshift$\' /etc/haproxy/haproxy.cfg"',
      { timeout: 3000 }
    );
    
    // Parse the line: "use_backend theoshift_green if is_theoshift" or "use_backend theoshift_blue if is_theoshift"
    if (stdout.includes('theoshift_green')) {
      return 'GREEN';
    } else if (stdout.includes('theoshift_blue')) {
      return 'BLUE';
    }
  } catch (error) {
    console.error('HAProxy config query failed:', error);
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Determine which server we're on by checking local IP
    let server: 'BLUE' | 'GREEN' = 'BLUE';
    let container = 134;
    let ip = '10.92.3.24';
    
    try {
      const { stdout } = await execAsync('hostname -I 2>/dev/null || hostname -i 2>/dev/null');
      const localIp = stdout.trim().split(' ')[0];
      
      if (localIp.includes('10.92.3.22')) {
        server = 'GREEN';
        container = 132;
        ip = '10.92.3.22';
      } else if (localIp.includes('10.92.3.24')) {
        server = 'BLUE';
        container = 134;
        ip = '10.92.3.24';
      }
    } catch (error) {
      // Fallback to environment variable if IP detection fails
      if (process.env.SERVER_NAME === 'GREEN') {
        server = 'GREEN';
        container = 132;
        ip = '10.92.3.22';
      }
    }
    
    // Determine LIVE/STANDBY status - HAProxy config is source of truth
    let status: 'LIVE' | 'STANDBY' = 'STANDBY';
    let statusSource = 'default';
    
    // Primary: Query HAProxy config file (actual routing configuration)
    const haproxyLiveServer = await queryHAProxyConfig();
    if (haproxyLiveServer) {
      status = haproxyLiveServer === server ? 'LIVE' : 'STANDBY';
      statusSource = 'haproxy-config';
    } else {
      // Fallback: Read state file (updated by MCP tool alongside HAProxy)
      try {
        const stateData = await fs.readFile(STATE_FILE, 'utf-8');
        const state = JSON.parse(stateData);
        
        status = state.liveServer === server ? 'LIVE' : 'STANDBY';
        statusSource = 'statefile-fallback';
      } catch (error) {
        // Last resort: Environment variable
        if (process.env.SERVER_STATUS) {
          status = process.env.SERVER_STATUS as 'LIVE' | 'STANDBY';
          statusSource = 'env';
        }
        console.error('Failed to determine status:', error);
      }
    }
    
    return res.status(200).json({
      server,
      status,
      ip,
      container,
      hostname: os.hostname(),
      statusSource // For debugging
    });
  } catch (error) {
    console.error('Error getting server info:', error);
    return res.status(500).json({ error: 'Failed to get server info' });
  }
}
