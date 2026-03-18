import { NextResponse } from 'next/server';
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

export async function GET() {
  return NextResponse.json({ servers });
}
