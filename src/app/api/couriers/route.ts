import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const apiUser = req.headers.get('api-user');
    const apiToken = req.headers.get('api-token');

    if (!apiUser || !apiToken) {
      return NextResponse.json(
        { error: 'API credentials (api-user, api-token) missing in headers' },
        { status: 400 }
      );
    }

    const endpoint = 'https://app.heyvoila.io/api/couriers/v1/list-couriers';

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-user': apiUser,
        'api-token': apiToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.message || data.error || `Authentication failed (${response.status})`,
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('List couriers proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal proxy server error' },
      { status: 500 }
    );
  }
}
