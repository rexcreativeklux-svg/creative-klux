import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { access_token } =
      await req.json();

    // A missing/blank developer token is sent to Google as the literal "undefined",
    // which it rejects with an opaque "Request contains an invalid argument." Guard it
    // here so the cause is obvious instead of the generic Google error.
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
    if (!devToken) {
      return NextResponse.json(
        { error: 'GOOGLE_ADS_DEVELOPER_TOKEN is not configured on the server. Add an approved Google Ads developer token to the prod environment.' },
        { status: 500 }
      );
    }
    if (!access_token) {
      return NextResponse.json(
        { error: 'Missing Google access token — reconnect Google Ads.' },
        { status: 400 }
      );
    }

    const res = await fetch(
      'https://googleads.googleapis.com/v20/customers:listAccessibleCustomers',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'developer-token': devToken,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      // Surface the richest detail Google gives + log the full body for diagnosis.
      console.error('google/ad-accounts error:', JSON.stringify(data));
      const ge = data.error;
      const raw = ge?.message || 'Google Ads API error';
      // "Request contains an invalid argument" on listAccessibleCustomers almost always
      // means the developer token is unapproved/invalid (not an OAuth problem).
      const friendly = /invalid argument/i.test(raw)
        ? `${raw} — this usually means the Google Ads developer token is invalid or not approved (Basic/Standard access required).`
        : raw;
      return NextResponse.json(
        { error: friendly, status: ge?.status, details: ge?.details },
        { status: res.status === 401 ? 401 : 400 }
      );
    }

    const accounts = (
      data.resourceNames || []
    ).map((r) => {
      const id = r.split('/')[1];

      return {
        id,
        name: `Customer ${id}`,
      };
    });

    return NextResponse.json({
      accounts,
    });

  } catch (err) {
    return NextResponse.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}