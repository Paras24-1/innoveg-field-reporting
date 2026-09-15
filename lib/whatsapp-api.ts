export async function sendWhatsAppMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log('WhatsApp credentials missing, simulating send to:', to);
    console.log('Message:', text);
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: true, body: text },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Failed to send WhatsApp message:', err);
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<string | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return null;

  try {
    // 1. Get media URL
    const urlRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const urlData = await urlRes.json();
    if (!urlData.url) return null;

    // 2. Download media buffer
    const mediaRes = await fetch(urlData.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const buffer = await mediaRes.arrayBuffer();
    const mimeType = mediaRes.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(buffer).toString('base64');
    
    return `data:${mimeType};base64,${base64}`;
  } catch (e) {
    console.error('Error downloading WhatsApp media:', e);
    return null;
  }
}
