export async function POST(request: Request) {
  try {
    const body = await request.json();

    const googleResponse = await fetch(
      'https://script.google.com/macros/s/AKfycbxiWTAt4Ttbf-8qZvunlE7-I-HS9PkZPO7HrxhXrQC86a96ehbfOvkjXTf4t33tjlQ-/exec',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    );

    const rawText = await googleResponse.text();
    console.log('Google raw response:', rawText);

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      return Response.json(
        {
          success: false,
          error: 'Google Apps Script returned non-JSON response',
          raw: rawText,
          googleStatus: googleResponse.status,
        },
        { status: 500 }
      );
    }

    return Response.json(parsed, {
      status: googleResponse.ok ? 200 : 500,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}