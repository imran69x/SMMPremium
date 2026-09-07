import { NextResponse } from 'next/server';
import { smmSun } from '@/lib/providers/smmsun';

export async function GET() {
  try {
    const data = await smmSun.getBalance();
    if (!data || data.error) {
      return NextResponse.json({ 
        success: false, 
        error: data?.error || 'Failed to fetch provider balance',
        balance: '0.00',
        currency: 'USD'
      });
    }

    return NextResponse.json({
      success: true,
      balance: data.balance || '0.00',
      currency: data.currency || 'USD'
    });
  } catch (error: any) {
    console.error('Failed to get provider balance:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error',
      balance: '0.00',
      currency: 'USD'
    }, { status: 500 });
  }
}
