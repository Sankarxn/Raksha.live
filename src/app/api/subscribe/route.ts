import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { district, phone, fcm_token } = body;

    if (!district) {
      return NextResponse.json({ success: false, error: 'District is required for subscription' }, { status: 400 });
    }

    if (!phone && !fcm_token) {
      return NextResponse.json({ success: false, error: 'Phone number or FCM token is required' }, { status: 400 });
    }

    const subscription = await db.createSubscription({
      district,
      phone,
      fcm_token
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
