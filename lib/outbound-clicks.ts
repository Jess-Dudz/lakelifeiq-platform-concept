export type OutboundDestinationType = 'dealer' | 'provider';

export type OutboundClickPayload = {
  destinationType: OutboundDestinationType;
  slug: string;
  name: string;
  lake: string;
  category: string;
  sourcePage: string;
  destinationUrl: string;
  timestamp: string;
};

type BuildOutboundHrefInput = {
  destinationType: OutboundDestinationType;
  name: string;
  lake: string;
  category: string;
  sourcePage: string;
  destinationUrl: string;
};

export function slugifyOutboundName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildOutboundHref({
  destinationType,
  name,
  lake,
  category,
  sourcePage,
  destinationUrl,
}: BuildOutboundHrefInput) {
  const params = new URLSearchParams({
    name,
    lake,
    category,
    sourcePage,
    url: destinationUrl,
  });

  return `/out/${destinationType}/${slugifyOutboundName(name)}?${params.toString()}`;
}

export async function recordOutboundClick(payload: OutboundClickPayload) {
  try {
    const webhookUrl = process.env.DEALER_CLICK_WEBHOOK_URL?.trim();
    const ingestSecret = process.env.CLICK_INGEST_SECRET?.trim();

    // Keep outbound attribution privacy-safe by recording only minimal click metadata.
    if (!webhookUrl) {
      console.info(JSON.stringify({ event: 'outbound_click', ...payload }));
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Only sent when configured, so local dev without the secret still works.
        ...(ingestSecret ? { 'x-ingest-secret': ingestSecret } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        'Failed to record outbound click webhook response',
        response.status
      );
    }
  } catch (error) {
    console.error('Failed to record outbound click', error);
  }
}
