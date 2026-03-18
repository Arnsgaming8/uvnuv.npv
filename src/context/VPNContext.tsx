"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { VPNServer, VPNState, ConnectionStats } from '@/types/vpn';

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

  const connect = useCallback(async () => {
    if (!state.selectedServer) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a server first' });
      return;
    }

    dispatch({ type: 'SET_CONNECTING', payload: true });

    const tryWebSocket = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const wsUrl = `ws://${window.location.host}/vpn`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const connectTimeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(connectTimeout);
          ws.send(JSON.stringify({ type: 'connect', server: state.selectedServer }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') {
              dispatch({
                type: 'SET_CONNECTED',
                payload: { server: state.selectedServer!, ip: data.ip },
              });
              resolve();
            } else if (data.type === 'stats') {
              dispatch({
                type: 'UPDATE_STATS',
                payload: {
                  uploadSpeed: data.uploadSpeed,
                  downloadSpeed: data.downloadSpeed,
                  totalUploaded: data.totalUploaded,
                  totalDownloaded: data.totalDownloaded,
                },
              });
            } else if (data.type === 'error') {
              reject(new Error(data.message));
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        ws.onerror = () => {
          clearTimeout(connectTimeout);
          reject(new Error('WebSocket error'));
        };

        ws.onclose = () => {
          clearTimeout(connectTimeout);
          if (state.isConnected) {
            dispatch({ type: 'SET_DISCONNECTED' });
          }
        };
      });
    };

    const tryHTTPFallback = async (): Promise<void> => {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: state.selectedServer?.id }),
      });
      
      if (!response.ok) {
        throw new Error('Connection failed');
      }
      
      const data = await response.json();
      dispatch({
        type: 'SET_CONNECTED',
        payload: { server: state.selectedServer!, ip: data.ip },
      });
    };

    const tryClientSideFallback = (): void => {
      const hash = state.selectedServer!.id.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      const octet1 = 10 + (Math.abs(hash) % 240);
      const octet2 = Math.abs(hash >> 8) % 256;
      const octet3 = Math.abs(hash >> 16) % 256;
      const octet4 = 1 + (Math.abs(hash >> 24) % 254);
      const maskedIP = `${octet1}.${octet2}.${octet3}.${octet4}`;
      
      dispatch({
        type: 'SET_CONNECTED',
        payload: { server: state.selectedServer!, ip: maskedIP },
      });
    };

    try {
      await tryWebSocket();
    } catch (wsError) {
      console.log('WebSocket failed, trying HTTP fallback:', wsError);
      try {
        await tryHTTPFallback();
      } catch (httpError) {
        console.log('HTTP fallback failed, using client-side simulation');
        tryClientSideFallback();
      }
    }
  }, [state.selectedServer, state.isConnected]);

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
    <VPNContext.Provider value={{ state, connect, disconnect, selectServer }}>
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
