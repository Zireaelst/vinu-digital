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

    // Token'ı largeTransfers konusuna abone et
    const result = await messaging.subscribeToTopic(token, 'largeTransfers');

    console.log('Cihaz largeTransfers konusuna abone edildi:', result);

    return NextResponse.json({
      success: true,
      message: 'Cihaz başarıyla largeTransfers konusuna abone edildi',
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
