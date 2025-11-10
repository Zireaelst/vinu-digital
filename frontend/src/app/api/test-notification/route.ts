import { NextResponse } from 'next/server';
import { getAdminMessaging } from '@/lib/firebase/admin';

export async function POST() {
  try {
    // Test bildirimi gönder
    const messaging = getAdminMessaging();
    
    const testMessage = {
      notification: {
        title: '🚨 Test Bildirimi',
        body: 'Bu bir test bildirimidir. Frontend ve Firebase bağlantısı test ediliyor.',
      },
      data: {
        fromAddress: '0x1234...abcd',
        toAddress: '0x5678...efgh',
        amount: '100000',
        txHash: '0x9876...5432',
        timestamp: new Date().toISOString(),
      },
      topic: 'largeTransfers',
    };

    const result = await messaging.send(testMessage);

    return NextResponse.json({
      success: true,
      message: 'Test bildirimi gönderildi',
      result
    });

  } catch (error) {
    console.error('Test bildirimi hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Test bildirimi başarısız', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
