import { NextRequest, NextResponse } from 'next/server';
import { getAdminMessaging } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token gerekli' },
        { status: 400 }
      );
    }

    // Admin messaging servisini al
    const messaging = getAdminMessaging();

    // Subscribe token to largeTransfers topic
    const result = await messaging.subscribeToTopic(token, 'largeTransfers');

    console.log('Device subscribed to largeTransfers topic:', result);

    return NextResponse.json({
      success: true,
      message: 'Device successfully subscribed to largeTransfers topic',
      result
    });

  } catch (error) {
    console.error('Konuya abone etme hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Konuya abone etme işlemi başarısız', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
