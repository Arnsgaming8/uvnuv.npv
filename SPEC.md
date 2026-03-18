# Free VPN Site - Specification

## Project Overview

**Project Name:** FreeVPN
**Type:** Web Application (VPN Client + Backend)
**Core Functionality:** A browser-based VPN service that allows users to connect to proxy servers worldwide, encrypting their traffic and masking their IP address.
**Target Users:** Privacy-conscious users who want to browse securely without paying for commercial VPNs.

---

## UI/UX Specification

### Layout Structure

**Page Sections:**
1. **Header** - Logo, navigation, connection status indicator
2. **Hero/Main** - VPN connect button, server selector, connection stats
3. **Server List** - Grid of available VPN server locations
4. **Features** - Security features explanation
5. **Footer** - Links, copyright

**Responsive Breakpoints:**
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (full layout)

### Visual Design

**Color Palette:**
- Background: `#0a0a0f` (deep dark)
- Surface: `#12121a` (card background)
- Primary: `#00ff88` (neon green - connected state)
- Secondary: `#00d4ff` (cyan - accent)
- Warning: `#ff6b35` (orange - disconnected)
- Text Primary: `#ffffff`
- Text Secondary: `#8888aa`
- Border: `#2a2a3a`

**Typography:**
- Headings: "JetBrains Mono", monospace
- Body: "IBM Plex Sans", sans-serif
- Sizes: H1: 48px, H2: 32px, H3: 24px, Body: 16px, Small: 14px

**Visual Effects:**
- Glow effect on connected state (box-shadow with primary color)
- Smooth transitions (300ms ease)
- Pulse animation on connect button when disconnected
- Glassmorphism cards with backdrop-blur

### Components

1. **Connect Button** - Large circular button with status indicator
2. **Server Card** - Shows country flag, name, latency, load
3. **Stats Display** - Upload/download speed, data used, session time
4. **IP Display** - Shows current IP (real or masked)
5. **Protocol Selector** - WireGuard, OpenVPN, HTTP Proxy options
6. **Connection Log** - Shows connection events

---

## Functionality Specification

### Core Features

1. **Server Selection**
   - List of 10+ global servers with country flags
   - Real-time latency ping display
   - Server load indicator (green/yellow/red)
   - Auto-select fastest server option

2. **VPN Connection**
   - One-click connect/disconnect
   - WebSocket-based tunnel to backend
   - HTTP/HTTPS proxy for traffic routing
   - Connection status with visual feedback

3. **Connection Statistics**
   - Real-time upload/download speed
   - Total data transferred
   - Session duration
   - Current server location

4. **IP Masking**
   - Display current (real) IP when disconnected
   - Display masked IP when connected
   - IP lookup on connection

5. **Backend API**
   - Server list management
   - Connection initialization
   - Tunnel management via WebSocket
   - Statistics aggregation

### User Interactions

1. User lands on page → sees "Disconnected" state
2. User selects a server from the list
3. User clicks "Connect" button
4. System establishes WebSocket tunnel
5. Traffic routed through proxy server
6. UI shows connected state with stats
7. User can disconnect at any time

### Data Handling

- Server list: Static JSON with server configurations
- Connection state: React state management
- Stats: Real-time updates via WebSocket
- No persistent storage required

---

## Acceptance Criteria

1. ✅ Page loads with all UI components visible
2. ✅ Server list displays at least 10 servers with flags
3. ✅ Clicking "Connect" changes UI to connected state
4. ✅ Server selection highlights chosen server
5. ✅ Stats display shows (or simulates) upload/download
6. ✅ IP address display updates on connection
7. ✅ Responsive design works on mobile/tablet/desktop
8. ✅ WebSocket connection establishes successfully
9. ✅ Backend API returns server list
10. ✅ No critical console errors on load

---

## Technical Architecture

### Frontend (Next.js)
- React 19 with Server Components
- Client-side VPN state management
- WebSocket client for tunnel communication

### Backend (API Routes)
- `/api/servers` - GET server list
- `/api/connect` - POST initiate connection
- WebSocket server for actual tunneling

### Tunnel Implementation
- HTTP CONNECT proxy method
- WebSocket for client-server communication
- Server-side proxy forwarding requests
