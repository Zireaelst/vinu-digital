import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // URL parametrelerinden timestamp al (son sync zamanı)
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    
    // Backend'den gerçek transfer verilerini al
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/transfers/recent${since ? `?since=${since}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      transfers: data.transfers || [],
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching recent transfers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}
