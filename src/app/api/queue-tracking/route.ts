import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courierKey, payload, apiUser, apiToken } = body;

    if (!courierKey) {
      return NextResponse.json(
        { error: 'Courier Key is required.' },
        { status: 400 }
      );
    }

    if (!apiUser || !apiToken) {
      return NextResponse.json(
        { error: 'API User and API Token must be provided in request headers or body.' },
        { status: 400 }
      );
    }

    const endpoint = `https://app.heyvoila.io/api/couriers/v1/${encodeURIComponent(courierKey)}/queue-tracking`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-user': apiUser,
        'api-token': apiToken,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.message || data.error || `HeyVoila API returned status ${response.status}`,
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Queue tracking proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal proxy server error' },
      { status: 500 }
    );
  }
}
