export interface VPNServer {
  id: string;
  country: string;
  city: string;
  flag: string;
  address: string;
  port: number;
  latency: number;
  load: 'low' | 'medium' | 'high';
  protocol: 'wireguard' | 'openvpn' | 'http';
}

export interface ConnectionStats {
  connected: boolean;
  serverId: string | null;
  uploadSpeed: number;
  downloadSpeed: number;
  totalUploaded: number;
  totalDownloaded: number;
  sessionTime: number;
  currentIP: string | null;
  maskedIP: string | null;
}

export interface VPNState {
  isConnected: boolean;
  isConnecting: boolean;
  selectedServer: VPNServer | null;
  stats: ConnectionStats;
  error: string | null;
}
