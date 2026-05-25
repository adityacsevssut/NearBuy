import { NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get('pin');

  if (!pin) {
    return NextResponse.json({ error: 'PIN code is required' }, { status: 400 });
  }

  try {
    // We create a custom agent that ignores SSL certificate errors 
    // because api.postalpincode.in has an expired SSL certificate.
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const fetchPromise = new Promise((resolve, reject) => {
      https.get(`https://api.postalpincode.in/pincode/${pin}`, { agent }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', (e) => {
        reject(e);
      });
    });

    const data = await fetchPromise;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to proxy postal API:', error);
    return NextResponse.json({ error: 'Failed to fetch pincode data' }, { status: 500 });
  }
}
