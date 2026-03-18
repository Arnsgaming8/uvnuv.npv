import { NextRequest, NextResponse } from 'next/server';

const activeConnections: Map<string, { serverId: string; ip: string; connectedAt: number }> = new Map();

function generateMaskedIP(serverId: string): string {
  const hash = serverId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const octet1 = 10 + (Math.abs(hash) % 240);
  const octet2 = Math.abs(hash >> 8) % 256;
  const octet3 = Math.abs(hash >> 16) % 256;
  const octet4 = 1 + (Math.abs(hash >> 24) % 254);
  
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, clientId } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const connectionId = clientId || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const maskedIP = generateMaskedIP(serverId);
    
    activeConnections.set(connectionId, {
      serverId,
      ip: maskedIP,
      connectedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      connectionId,
      ip: maskedIP,
      message: 'Connection established',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to establish connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId } = body;

    if (connectionId && activeConnections.has(connectionId)) {
      activeConnections.delete(connectionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
