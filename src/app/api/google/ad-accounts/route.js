import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { access_token } =
      await req.json();

    const res = await fetch(
      'https://googleads.googleapis.com/v20/customers:listAccessibleCustomers',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'developer-token':
            process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ||
            'Google Ads API error',
        },
        { status: 400 }
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