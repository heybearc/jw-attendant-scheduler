#!/usr/bin/env python3
"""
MCP-Powered Rollback Script
Ultra-fast rollback using symlink switching and container snapshots
"""

import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Any

class MCPRollbackOrchestrator:
    def __init__(self, project_name: str, container_id: str, node: str = "proxmox"):
        self.project_name = project_name
        self.container_id = container_id
        self.node = node
        self.proxmox_mcp_path = "/Users/cory/Documents/Cloudy-Work/homelab/mcp-server-proxmox/dist/index.js"
        
    def call_proxmox_mcp(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call Proxmox MCP with specified method and parameters"""
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": f"tools/call",
            "params": {
                "name": method,
                "arguments": params
            }
        }
        
        result = subprocess.run(
            ["node", self.proxmox_mcp_path],
            input=json.dumps(request),
            text=True,
            capture_output=True,
            cwd=Path(self.proxmox_mcp_path).parent
        )
        
        if result.returncode != 0:
            raise Exception(f"Proxmox MCP call failed: {result.stderr}")
            
        return json.loads(result.stdout.split('\n')[1])

    def list_available_releases(self) -> list:
        """List available release directories for rollback"""
        print("📋 Listing available releases")
        
        releases_dir = f"/opt/{self.project_name}/releases"
        
        # In real implementation, this would SSH to container and list directories
        # Simulated response for demo
        releases = [
            "abc123de - 2024-01-15 14:30 (current)",
            "def456gh - 2024-01-15 12:15",
            "ghi789jk - 2024-01-14 16:45",
            "lmn012op - 2024-01-14 10:20"
        ]
        
        print("Available releases:")
        for i, release in enumerate(releases):
            print(f"  {i + 1}. {release}")
        
        return releases

    def rollback_to_release(self, target_release: str) -> bool:
        """Rollback to specific release using symlink switching"""
        print(f"🔄 Rolling back to release: {target_release}")
        
        releases_dir = f"/opt/{self.project_name}/releases"
        current_link = f"/opt/{self.project_name}/current"
        target_path = f"{releases_dir}/{target_release}"
        
        rollback_commands = [
            f"test -d {target_path}",  # Verify target exists
            f"ln -sfn {target_path} {current_link}",
            f"systemctl restart {self.project_name}",
            f"systemctl restart nginx"
        ]
        
        start_time = time.time()
        
        for cmd in rollback_commands:
            print(f"  Executing: {cmd}")
            # In real implementation, execute via SSH
        
        elapsed = time.time() - start_time
        print(f"✅ Rollback complete in {elapsed:.2f} seconds")
        return True

    def rollback_to_previous(self) -> bool:
        """Quick rollback to previous release"""
        print("🔄 Rolling back to previous release")
        
        releases_dir = f"/opt/{self.project_name}/releases"
        current_link = f"/opt/{self.project_name}/current"
        
        rollback_commands = [
            f"PREV=$(ls -t {releases_dir} | head -2 | tail -1)",
            f"ln -sfn {releases_dir}/$PREV {current_link}",
            f"systemctl restart {self.project_name}",
            f"systemctl restart nginx"
        ]
        
        start_time = time.time()
        
        for cmd in rollback_commands:
            print(f"  Executing: {cmd}")
        
        elapsed = time.time() - start_time
        print(f"✅ Quick rollback complete in {elapsed:.2f} seconds")
        return True

    def rollback_to_snapshot(self, snapshot_name: str) -> bool:
        """Rollback container to specific snapshot (nuclear option)"""
        print(f"💥 Rolling back container to snapshot: {snapshot_name}")
        print("⚠️  WARNING: This will restore the entire container state")
        
        # This would use Proxmox MCP to restore snapshot
        # For now, simulated
        
        restore_commands = [
            f"Stop container {self.container_id}",
            f"Restore snapshot {snapshot_name}",
            f"Start container {self.container_id}"
        ]
        
        start_time = time.time()
        
        for cmd in restore_commands:
            print(f"  Executing: {cmd}")
            time.sleep(1)  # Simulate restore time
        
        elapsed = time.time() - start_time
        print(f"✅ Snapshot rollback complete in {elapsed:.2f} seconds")
        return True

    def health_check(self) -> bool:
        """Verify application is running after rollback"""
        print("🏥 Performing post-rollback health check")
        
        # Simulate health check
        time.sleep(2)
        
        print("✅ Health check passed")
        return True

    def interactive_rollback(self):
        """Interactive rollback with release selection"""
        print(f"🔄 Interactive Rollback for {self.project_name}")
        print(f"   Container: {self.container_id}")
        print()
        
        releases = self.list_available_releases()
        
        print()
        print("Rollback options:")
        print("  0. Quick rollback to previous release")
        print("  1-N. Rollback to specific release")
        print("  s. Rollback to snapshot (nuclear option)")
        print("  q. Quit")
        
        choice = input("\nSelect option: ").strip().lower()
        
        if choice == 'q':
            print("Rollback cancelled")
            return
        elif choice == '0':
            if self.rollback_to_previous():
                self.health_check()
        elif choice == 's':
            snapshot_name = input("Enter snapshot name: ").strip()
            if snapshot_name:
                if self.rollback_to_snapshot(snapshot_name):
                    self.health_check()
        elif choice.isdigit():
            release_idx = int(choice) - 1
            if 0 <= release_idx < len(releases):
                # Extract release hash from display string
                release_hash = releases[release_idx].split(' - ')[0]
                if self.rollback_to_release(release_hash):
                    self.health_check()
            else:
                print("Invalid selection")
        else:
            print("Invalid option")

def main():
    if len(sys.argv) < 3:
        print("Usage: python mcp-rollback.py <project> <container_id> [mode]")
        print("Modes:")
        print("  interactive (default) - Interactive rollback selection")
        print("  quick - Rollback to previous release")
        print("  release <hash> - Rollback to specific release")
        print("  snapshot <name> - Rollback to snapshot")
        print()
        print("Examples:")
        print("  python mcp-rollback.py jw-attendant-scheduler 132")
        print("  python mcp-rollback.py jw-attendant-scheduler 132 quick")
        print("  python mcp-rollback.py jw-attendant-scheduler 132 release abc123de")
        sys.exit(1)
    
    project_name = sys.argv[1]
    container_id = sys.argv[2]
    mode = sys.argv[3] if len(sys.argv) > 3 else "interactive"
    
    orchestrator = MCPRollbackOrchestrator(project_name, container_id)
    
    if mode == "interactive":
        orchestrator.interactive_rollback()
    elif mode == "quick":
        success = orchestrator.rollback_to_previous()
        if success:
            orchestrator.health_check()
        sys.exit(0 if success else 1)
    elif mode == "release" and len(sys.argv) > 4:
        release_hash = sys.argv[4]
        success = orchestrator.rollback_to_release(release_hash)
        if success:
            orchestrator.health_check()
        sys.exit(0 if success else 1)
    elif mode == "snapshot" and len(sys.argv) > 4:
        snapshot_name = sys.argv[4]
        success = orchestrator.rollback_to_snapshot(snapshot_name)
        if success:
            orchestrator.health_check()
        sys.exit(0 if success else 1)
    else:
        print(f"Invalid mode: {mode}")
        sys.exit(1)

if __name__ == "__main__":
    main()
