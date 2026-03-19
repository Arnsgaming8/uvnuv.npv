"use client";

import { VPNProvider, useVPN } from '@/context/VPNContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { VPNServer } from '@/types/vpn';

const servers: VPNServer[] = [
  { id: 'us-1', country: 'United States', city: 'New York', flag: '🇺🇸', address: 'us1.freevpn.io', port: 443, latency: 45, load: 'low', protocol: 'http' },
  { id: 'us-2', country: 'United States', city: 'Los Angeles', flag: '🇺🇸', address: 'us2.freevpn.io', port: 443, latency: 62, load: 'medium', protocol: 'http' },
  { id: 'uk-1', country: 'United Kingdom', city: 'London', flag: '🇬🇧', address: 'uk1.freevpn.io', port: 443, latency: 89, load: 'low', protocol: 'http' },
  { id: 'de-1', country: 'Germany', city: 'Frankfurt', flag: '🇩🇪', address: 'de1.freevpn.io', port: 443, latency: 95, load: 'low', protocol: 'http' },
  { id: 'nl-1', country: 'Netherlands', city: 'Amsterdam', flag: '🇳🇱', address: 'nl1.freevpn.io', port: 443, latency: 102, load: 'medium', protocol: 'http' },
  { id: 'jp-1', country: 'Japan', city: 'Tokyo', flag: '🇯🇵', address: 'jp1.freevpn.io', port: 443, latency: 145, load: 'low', protocol: 'http' },
  { id: 'sg-1', country: 'Singapore', city: 'Singapore', flag: '🇸🇬', address: 'sg1.freevpn.io', port: 443, latency: 168, load: 'low', protocol: 'http' },
  { id: 'au-1', country: 'Australia', city: 'Sydney', flag: '🇦🇺', address: 'au1.freevpn.io', port: 443, latency: 210, load: 'medium', protocol: 'http' },
  { id: 'ca-1', country: 'Canada', city: 'Toronto', flag: '🇨🇦', address: 'ca1.freevpn.io', port: 443, latency: 55, load: 'low', protocol: 'http' },
  { id: 'fr-1', country: 'France', city: 'Paris', flag: '🇫🇷', address: 'fr1.freevpn.io', port: 443, latency: 88, load: 'high', protocol: 'http' },
  { id: 'ch-1', country: 'Switzerland', city: 'Zurich', flag: '🇨🇭', address: 'ch1.freevpn.io', port: 443, latency: 92, load: 'low', protocol: 'http' },
  { id: 'se-1', country: 'Sweden', city: 'Stockholm', flag: '🇸🇪', address: 'se1.freevpn.io', port: 443, latency: 115, load: 'low', protocol: 'http' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getLoadColor(load: 'low' | 'medium' | 'high'): string {
  switch (load) {
    case 'low': return '#00ff88';
    case 'medium': return '#ffaa00';
    case 'high': return '#ff4444';
  }
}

function ConnectButton() {
  const { state, connect, disconnect } = useVPN();
  const { isConnected, isConnecting, selectedServer } = state;

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting || (!isConnected && !selectedServer)}
      className={`
        relative w-48 h-48 rounded-full font-bold text-xl transition-all duration-300
        flex items-center justify-center flex-col gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isConnected 
          ? 'connected-glow text-[var(--primary)]' 
          : 'disconnected-pulse bg-[var(--bg-surface)] border-2 border-[var(--warning)] text-[var(--warning)]'
        }
      `}
    >
      {isConnecting ? (
        <>
          <div className="w-8 h-8 border-4 border-[var(--warning)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Connecting...</span>
        </>
      ) : isConnected ? (
        <>
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <span>Connected</span>
        </>
      ) : (
        <>
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Connect</span>
        </>
      )}
      <span className="absolute -bottom-8 text-sm text-[var(--text-secondary)] whitespace-nowrap">
        {isConnected ? 'Protected' : 'Click to Connect'}
      </span>
    </button>
  );
}

function ServerCard({ server, isSelected, onSelect }: { 
  server: VPNServer; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`server-card w-full p-4 text-left glass-card ${isSelected ? 'selected' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{server.flag}</span>
          <div>
            <div className="font-medium">{server.city}</div>
            <div className="text-sm text-[var(--text-secondary)]">{server.country}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono" style={{ color: server.latency < 100 ? '#00ff88' : server.latency < 150 ? '#ffaa00' : '#ff4444' }}>
            {server.latency}ms
          </div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getLoadColor(server.load) }} />
            <span className="text-xs text-[var(--text-secondary)]">{server.load}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ServerList() {
  const { state, selectServer } = useVPN();
  const { selectedServer, isConnected } = state;
  const [sortBy, setSortBy] = useState<'latency' | 'country'>('latency');

  const sortedServers = [...servers].sort((a, b) => {
    if (sortBy === 'latency') return a.latency - b.latency;
    return a.country.localeCompare(b.country);
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Select Server</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('latency')}
            className={`px-3 py-1 text-sm rounded ${sortBy === 'latency' ? 'bg-[var(--primary)] text-black' : 'bg-[var(--border)]'}`}
          >
            Fastest
          </button>
          <button
            onClick={() => setSortBy('country')}
            className={`px-3 py-1 text-sm rounded ${sortBy === 'country' ? 'bg-[var(--primary)] text-black' : 'bg-[var(--border)]'}`}
          >
            Country
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {sortedServers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            isSelected={selectedServer?.id === server.id}
            onSelect={() => !isConnected && selectServer(server)}
          />
        ))}
      </div>
    </div>
  );
}

function StatsDisplay() {
  const { state } = useVPN();
  const { stats, isConnected, selectedServer } = state;

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-6">Connection Status</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Status</div>
          <div className={`font-semibold ${isConnected ? 'text-[var(--primary)]' : 'text-[var(--warning)]'}`}>
            {isConnected ? 'Protected' : 'Unprotected'}
          </div>
        </div>
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Server</div>
          <div className="font-medium">
            {selectedServer ? `${selectedServer.flag} ${selectedServer.city}` : '-'}
          </div>
        </div>
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Upload</div>
          <div className="stat-value text-[var(--secondary)]">
            {formatSpeed(stats.uploadSpeed)}
          </div>
        </div>
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Download</div>
          <div className="stat-value text-[var(--primary)]">
            {formatSpeed(stats.downloadSpeed)}
          </div>
        </div>
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Data Sent</div>
          <div className="stat-value">{formatBytes(stats.totalUploaded)}</div>
        </div>
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Data Received</div>
          <div className="stat-value">{formatBytes(stats.totalDownloaded)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Session Time</div>
          <div className="stat-value text-2xl">{formatTime(stats.sessionTime)}</div>
        </div>
      </div>
    </div>
  );
}

function IPDisplay() {
  const { state } = useVPN();
  const { stats, isConnected } = state;

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-6">IP Address</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1">Your IP</div>
          <div className="stat-value text-lg font-mono p-3 bg-[var(--bg-dark)] rounded">
            {stats.currentIP || 'Detecting...'}
          </div>
        </div>
        {isConnected && (
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">Protected IP</div>
            <div className="stat-value text-lg font-mono p-3 bg-[var(--primary)]/10 rounded border border-[var(--primary)]">
              {stats.maskedIP || 'Assigning...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Features() {
  return (
    <div className="py-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Why Choose VreePN?</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Military-Grade Encryption</h3>
          <p className="text-[var(--text-secondary)]">Your data is protected with AES-256 encryption, the same standard used by governments worldwide.</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Global Server Network</h3>
          <p className="text-[var(--text-secondary)]">Connect to servers in 12+ countries worldwide with lightning-fast speeds.</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--warning)]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
          <p className="text-[var(--text-secondary)]">Optimized servers ensure you can browse, stream, and download without lag.</p>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const { theme, toggleTheme } = useTheme();
  const { state } = useVPN();
  const { isConnected } = state;
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    fetch('/api/vpn/myip', { method: 'HEAD' })
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
    
    const interval = setInterval(() => {
      fetch('/api/vpn/myip', { method: 'HEAD', cache: 'no-cache' })
        .then(() => setBackendStatus('online'))
        .catch(() => setBackendStatus('offline'));
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const statusColor = isConnected ? 'var(--primary)' : backendStatus === 'online' ? 'var(--warning)' : '#ff4444';
  const statusText = isConnected ? 'Protected' : backendStatus === 'online' ? 'Online' : 'Offline';
  
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-dark)', opacity: 0.95 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <span className="text-lg font-bold">VreePN</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border transition-colors hover:border-[var(--primary)]"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1z"/>
              </svg>
            )}
          </button>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{statusText}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.6' }}>
            This software is intended solely for the purpose of providing VPN services to end users.
            No portion of this software may be reproduced, modified, distributed, or used
            for any other purpose without the express written consent of the copyright holder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <span className="font-semibold">© 2026 VreePN. All Rights Reserved.</span>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Programmed by Arnav Jugessur | Designed by Kilo AI
        </div>
      </div>
    </footer>
  );
}

function MainContent() {
  const { state } = useVPN();
  const { error } = state;

  return (
    <main className="relative z-10 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Secure Your <span className="text-[var(--primary)]">Connection</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-6">
            Protect your privacy with our free, fast, and secure VPN service. 
            No registration required.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>Powered by</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#F80000"/>
              <path d="M12 6C9.24 6 7 8.24 7 11c0 2.76 2.24 5 5 5 1.1 0 2.1-.36 2.9-.97l.6.37C14.7 16.18 13.42 16.5 12 16.5c-3.87 0-7-3.13-7-7s3.13-7 7-7c.75 0 1.47.12 2.14.34l-.54.83C10.77 6.85 9.77 6.5 8.7 6.5 6.02 6.5 3.9 8.62 3.9 11.3s2.12 4.8 4.8 4.8c1.1 0 2.1-.36 2.9-.97l.6.37C11.5 16.63 10.22 17 9 17c-2.76 0-5-2.24-5-5s2.24-5 5-5h3" fill="white"/>
            </svg>
            <span className="font-semibold" style={{ color: '#F80000' }}>Oracle Cloud</span>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-center">
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <ServerList />
          </div>
          <div className="space-y-8">
            <ConnectButton />
            <IPDisplay />
          </div>
        </div>

        <StatsDisplay />

        <div id="features">
          <Features />
        </div>
      </div>
    </main>
  );
}

import { useState, useEffect } from 'react';

export default function VPNPage() {
  return (
    <ThemeProvider>
      <VPNProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <MainContent />
          <Footer />
        </div>
      </VPNProvider>
    </ThemeProvider>
  );
}
