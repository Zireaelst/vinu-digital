import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Backend'den veriyi çek
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/notifications/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification count from backend');
    }

    const data = await response.json();
    
    return NextResponse.json({
      count: data.count || 0,
      lastTransferAt: data.lastTransferAt || null,
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    
    // Fallback olarak 0 döndür
    return NextResponse.json({
      count: 0,
      lastTransferAt: null,
    });
  }
}
