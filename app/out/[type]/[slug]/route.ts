import { after } from 'next/server';
import {
  recordOutboundClick,
  type OutboundDestinationType,
} from '@/lib/outbound-clicks';

const destinationTypes = new Set<OutboundDestinationType>([
  'dealer',
  'provider',
]);

function toValidDestinationUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      type: string;
      slug: string;
    }>;
  }
) {
  const { type, slug } = await context.params;

  if (!destinationTypes.has(type as OutboundDestinationType)) {
    return new Response('Invalid outbound destination.', { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const destinationUrl = toValidDestinationUrl(requestUrl.searchParams.get('url'));

  if (!destinationUrl) {
    return new Response('Invalid outbound destination.', { status: 400 });
  }

  const name = requestUrl.searchParams.get('name')?.trim() || slug;
  const lake = requestUrl.searchParams.get('lake')?.trim() || 'Unknown';
  const category = requestUrl.searchParams.get('category')?.trim() || 'unknown';
  const sourcePage =
    requestUrl.searchParams.get('sourcePage')?.trim() || '/dealers';

  // Present only when the click originated from a completed plan. Validated
  // as a UUID here so a malformed value never reaches the database.
  const sessionParam = requestUrl.searchParams.get('session')?.trim();
  const sessionId =
    sessionParam &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      sessionParam
    )
      ? sessionParam
      : undefined;

  // Route outbound clicks internally so LakeLifeIQ can measure directory engagement
  // without attaching personal user information to the destination visit.
  after(async () => {
    await recordOutboundClick({
      destinationType: type as OutboundDestinationType,
      sessionId,
      slug,
      name,
      lake,
      category,
      sourcePage,
      destinationUrl,
      timestamp: new Date().toISOString(),
    });
  });

  return Response.redirect(destinationUrl, 307);
}
