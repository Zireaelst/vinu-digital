import { NextResponse } from 'next/server';
import { getAdminMessaging } from '@/lib/firebase/admin';

export async function POST() {
  try {
    // Manuel test bildirimi gönder - token kullanmadan topic'e gönder
    const messaging = getAdminMessaging();
    
    const manualTestMessage = {
      notification: {
        title: '🚨 Manuel Test - Büyük USDT Transfer',
        body: '5,000,000 USDT transferi tespit edildi! Bu manuel bir test bildirimidir.',
      },
      data: {
        fromAddress: '0x1234567890abcdef1234567890abcdef12345678',
        toAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        amount: '5000000',
        txHash: '0x9876543210fedcba9876543210fedcba98765432',
        timestamp: new Date().toISOString(),
        type: 'manual_test'
      },
      topic: 'largeTransfers',
    };

    console.log('Manuel test bildirimi gönderiliyor...');
    const result = await messaging.send(manualTestMessage);
    console.log('Manuel test bildirimi gönderildi:', result);

    return NextResponse.json({
      success: true,
      message: 'Manuel test bildirimi başarıyla gönderildi',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manuel test bildirimi hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Manuel test bildirimi başarısız', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
