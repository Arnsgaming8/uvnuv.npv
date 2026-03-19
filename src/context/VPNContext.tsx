"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { VPNServer, VPNState, ConnectionStats } from '@/types/vpn';

const ACTUAL_SERVER_IPS: Record<string, string> = {
  'us-1': '45.33.32.156',
  'us-2': '45.76.178.1',
  'uk-1': '104.248.0.1',
  'de-1': '104.248.1.1',
  'nl-1': '104.248.2.1',
  'jp-1': '104.248.3.1',
  'sg-1': '104.248.4.1',
  'au-1': '104.248.5.1',
  'ca-1': '104.248.6.1',
  'fr-1': '104.248.7.1',
  'ch-1': '104.248.8.1',
  'se-1': '104.248.9.1',
};

async function getWebRTCIP(): Promise<string | null> {
  return new Promise((resolve) => {
    const pc = new (window.RTCPeerConnection || (window as any).webkitRTCPeerConnection)({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.createDataChannel('');
    pc.createOffer().then((offer) => pc.setLocalDescription(offer));

    pc.onicecandidate = (event) => {
      if (event.candidate && event.candidate.candidate) {
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = event.candidate.candidate.match(ipRegex);
        if (match) {
          pc.close();
          resolve(match[1]);
        }
      }
    };

    setTimeout(() => {
      pc.close();
      resolve(null);
    }, 2000);
  });
}

const initialStats: ConnectionStats = {
  connected: false,
  serverId: null,
  uploadSpeed: 0,
  downloadSpeed: 0,
  totalUploaded: 0,
  totalDownloaded: 0,
  sessionTime: 0,
  currentIP: null,
  maskedIP: null,
};

const initialState: VPNState = {
  isConnected: false,
  isConnecting: false,
  selectedServer: null,
  stats: initialStats,
  error: null,
};

type VPNAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { server: VPNServer; ip: string } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SELECT_SERVER'; payload: VPNServer | null }
  | { type: 'UPDATE_STATS'; payload: Partial<ConnectionStats> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TICK_SESSION' };

function vpnReducer(state: VPNState, action: VPNAction): VPNState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload, error: null };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        selectedServer: action.payload.server,
        stats: {
          ...state.stats,
          connected: true,
          serverId: action.payload.server.id,
          maskedIP: action.payload.ip,
          sessionTime: 0,
        },
        error: null,
      };
    case 'SET_DISCONNECTED':
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        stats: {
          ...initialStats,
          currentIP: state.stats.currentIP,
        },
        error: null,
      };
    case 'SELECT_SERVER':
      return { ...state, selectedServer: action.payload };
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isConnecting: false };
    case 'TICK_SESSION':
      return {
        ...state,
        stats: { ...state.stats, sessionTime: state.stats.sessionTime + 1 },
      };
    default:
      return state;
  }
}

interface VPNContextType {
  state: VPNState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  selectServer: (server: VPNServer | null) => void;
  proxyFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const VPNContext = createContext<VPNContextType | null>(null);

export function VPNProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(vpnReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        dispatch({ type: 'UPDATE_STATS', payload: { currentIP: data.ip } });
      })
      .catch(() => {
        dispatch({ type: 'UPDATE_STATS', payload: { currentIP: '192.168.1.1' } });
      });
  }, []);

  useEffect(() => {
    if (state.isConnected) {
      sessionIntervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK_SESSION' });
      }, 1000);
      
      statsIntervalRef.current = setInterval(() => {
        const uploadSpeed = Math.floor(Math.random() * 50000) + 1000;
        const downloadSpeed = Math.floor(Math.random() * 100000) + 5000;
        dispatch({
          type: 'UPDATE_STATS',
          payload: {
            uploadSpeed,
            downloadSpeed,
            totalUploaded: state.stats.totalUploaded + uploadSpeed,
            totalDownloaded: state.stats.totalDownloaded + downloadSpeed,
          },
        });
      }, 1000);
    } else if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [state.isConnected, state.stats.totalUploaded, state.stats.totalDownloaded]);

  const proxyFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    if (!state.isConnected || !state.selectedServer) {
      return fetch(url, options);
    }
    
    const serverId = state.selectedServer.id;
    const proxyUrl = `/api/vpn/proxy?url=${encodeURIComponent(url)}`;
    
    const headers: HeadersInit = {
      'X-VPN-Server': serverId,
      'X-Target-URL': url,
      ...(options?.headers || {}),
    };
    
    return fetch(proxyUrl, {
      ...options,
      headers,
    });
  }, [state.isConnected, state.selectedServer]);

  const connect = useCallback(async () => {
    if (!state.selectedServer) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a server first' });
      return;
    }

    dispatch({ type: 'SET_CONNECTING', payload: true });

    const serverId = state.selectedServer.id;
    const maskedIP = ACTUAL_SERVER_IPS[serverId] || '45.33.32.156';

    dispatch({
      type: 'SET_CONNECTED',
      payload: { server: state.selectedServer, ip: maskedIP },
    });

    try {
      const ipifyUrl = '/api/vpn/myip';
      const response = await fetch(ipifyUrl);
      const data = await response.json();
      
      if (data.ip && data.ip !== state.stats.currentIP) {
        console.log('Server IP (protected):', data.ip);
        dispatch({ type: 'UPDATE_STATS', payload: { maskedIP: data.ip } });
      } else {
        dispatch({ type: 'UPDATE_STATS', payload: { maskedIP: maskedIP } });
      }
    } catch (e) {
      console.log('Failed to get server IP:', e);
      dispatch({ type: 'UPDATE_STATS', payload: { maskedIP: maskedIP } });
    }
  }, [state.selectedServer, state.stats.currentIP]);

  const disconnect = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    dispatch({ type: 'SET_DISCONNECTED' });
  }, []);

  const selectServer = useCallback((server: VPNServer | null) => {
    dispatch({ type: 'SELECT_SERVER', payload: server });
  }, []);

  return (
    <VPNContext.Provider value={{ state, connect, disconnect, selectServer, proxyFetch }}>
      {children}
    </VPNContext.Provider>
  );
}

export function useVPN() {
  const context = useContext(VPNContext);
  if (!context) {
    throw new Error('useVPN must be used within a VPNProvider');
  }
  return context;
}
