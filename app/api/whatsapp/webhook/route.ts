import { NextResponse } from 'next/server';
import { processIncomingWhatsAppMessage } from '@/lib/bot-engine';
import { sendWhatsAppMessage } from '@/lib/whatsapp-api';

// Verification challenge for Meta WhatsApp Cloud API
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'innoveg_secret_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// Inbound webhook handler (Meta WhatsApp Cloud API or n8n Automation)
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. Check if payload is from n8n / custom format
    if (payload.from && (payload.body || payload.location || payload.photoUrl)) {
      const response = await processIncomingWhatsAppMessage({
        fromMobile: payload.from,
        body: payload.body,
        location: payload.location,
        photoUrl: payload.photoUrl,
      });
      return NextResponse.json({ success: true, ...response });
    }

    // 2. Parse Meta WhatsApp Cloud API format
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: 'ignored_no_message' });
    }

    const fromMobile = message.from;
    let body: string | undefined;
    let location: { latitude: number; longitude: number; name?: string } | undefined;
    let photoUrl: string | undefined;

    if (message.type === 'text') {
      body = message.text?.body;
    } else if (message.type === 'location') {
      location = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        name: message.location.name || message.location.address,
      };
    } else if (message.type === 'image') {
      photoUrl = message.image?.url || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=600&auto=format&fit=crop&q=80';
      body = message.image?.caption;
    } else if (message.type === 'interactive') {
      body = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title;
    }

    const botResponse = await processIncomingWhatsAppMessage({
      fromMobile,
      body,
      location,
      photoUrl,
    });

    if (botResponse?.replyText) {
      await sendWhatsAppMessage(fromMobile, botResponse.replyText);
    }

    return NextResponse.json({
      success: true,
      botResponse,
    });
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
