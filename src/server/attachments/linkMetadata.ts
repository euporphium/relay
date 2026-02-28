import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { type CheerioAPI, load } from 'cheerio';

function trimToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function extractFirstAttribute(
  $: CheerioAPI,
  selectors: string[],
  attribute: string,
): string | null {
  for (const selector of selectors) {
    const value = trimToNull($(selector).first().attr(attribute));
    if (value) {
      return value;
    }
  }

  return null;
}

function extractTitle($: CheerioAPI): string | null {
  const ogTitle = extractFirstAttribute(
    $,
    ['meta[property="og:title"]', 'meta[name="twitter:title"]'],
    'content',
  );
  if (ogTitle) {
    return ogTitle;
  }

  return trimToNull($('title').first().text());
}

function isSupportedProtocol(protocol: string) {
  return protocol === 'http:' || protocol === 'https:';
}

function isLocalHostname(hostname: string) {
  const lower = hostname.toLowerCase();

  return (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local')
  );
}

function isPrivateIPv4(ip: string) {
  const parts = ip.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(ip: string) {
  const lower = ip.toLowerCase();

  if (lower === '::' || lower === '::1') {
    return true;
  }

  if (lower.startsWith('fc') || lower.startsWith('fd')) {
    return true;
  }

  if (lower.startsWith('fe8') || lower.startsWith('fe9')) {
    return true;
  }

  if (lower.startsWith('fea') || lower.startsWith('feb')) {
    return true;
  }

  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice('::ffff:'.length);
    return isPrivateIPv4(mapped);
  }

  return false;
}

function isPrivateIpAddress(ip: string) {
  const type = isIP(ip);
  if (type === 0) {
    return false;
  }

  if (type === 4) {
    return isPrivateIPv4(ip);
  }

  return isPrivateIPv6(ip);
}

async function assertPublicHostname(hostname: string) {
  if (isLocalHostname(hostname)) {
    throw new Error('Local/private hosts are not allowed');
  }

  const ipType = isIP(hostname);
  if (ipType !== 0) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error('Local/private hosts are not allowed');
    }
    return;
  }

  const resolved = await lookup(hostname, { all: true, verbatim: true });
  if (resolved.length === 0) {
    throw new Error('Unable to resolve host');
  }

  if (resolved.some((entry) => isPrivateIpAddress(entry.address))) {
    throw new Error('Local/private hosts are not allowed');
  }
}

function normalizeUrl(rawUrl: string): URL {
  const normalized = new URL(rawUrl.trim());
  if (!isSupportedProtocol(normalized.protocol)) {
    throw new Error('Only http and https links are allowed');
  }

  normalized.hash = '';
  return normalized;
}

async function assertPublicUrl(url: URL) {
  await assertPublicHostname(url.hostname);
}

const REQUEST_TIMEOUT_MS = 5_000;
const MAX_HTML_BYTES = 1_000_000;

function assertSupportedHtmlContentType(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType) {
    return;
  }

  const normalized = contentType.toLowerCase();
  if (
    normalized.includes('text/html') ||
    normalized.includes('application/xhtml+xml')
  ) {
    return;
  }

  throw new Error('Unsupported content type for metadata fetch');
}

async function readTextWithLimit(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      throw new Error('Response too large for metadata fetch');
    }
  }

  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error('Response too large for metadata fetch');
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'user-agent': 'RelayBot/1.0 (+https://relay.i258.net)',
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'AbortError' ||
        (typeof DOMException !== 'undefined' &&
          error instanceof DOMException &&
          error.name === 'AbortError'))
    ) {
      throw new Error('Metadata fetch timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export type LinkMetadata = {
  canonicalUrl: string;
  domain: string;
  title: string | null;
  description: string | null;
  previewImageUrl: string | null;
  fetchedAt: Date;
};

export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadata> {
  const maxRedirects = 5;
  let currentUrl = normalizeUrl(rawUrl);
  await assertPublicUrl(currentUrl);

  let response: Response | null = null;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    response = await fetchWithTimeout(currentUrl.toString());

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect response missing Location header');
      }

      redirectCount += 1;
      if (redirectCount > maxRedirects) {
        throw new Error('Too many redirects');
      }

      currentUrl = normalizeUrl(new URL(location, currentUrl).toString());
      await assertPublicUrl(currentUrl);
      continue;
    }

    break;
  }

  if (!response || !response.ok) {
    throw new Error(`Failed to fetch metadata (${response?.status ?? 0})`);
  }

  assertSupportedHtmlContentType(response);
  const html = await readTextWithLimit(response, MAX_HTML_BYTES);
  const $ = load(html);

  const title = extractTitle($);
  const description = extractFirstAttribute(
    $,
    [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ],
    'content',
  );
  const previewImageUrl = extractFirstAttribute(
    $,
    ['meta[property="og:image"]', 'meta[name="twitter:image"]'],
    'content',
  );

  const previewUrl =
    previewImageUrl != null
      ? (() => {
          try {
            const parsed = normalizeUrl(
              new URL(previewImageUrl, currentUrl).toString(),
            );
            return parsed.toString();
          } catch {
            return null;
          }
        })()
      : null;

  return {
    canonicalUrl: currentUrl.toString(),
    domain: currentUrl.hostname,
    title,
    description,
    previewImageUrl: previewUrl,
    fetchedAt: new Date(),
  };
}

export async function normalizeAttachmentLink(rawUrl: string): Promise<{
  canonicalUrl: string;
  domain: string;
}> {
  const normalized = normalizeUrl(rawUrl);
  await assertPublicUrl(normalized);
  return {
    canonicalUrl: normalized.toString(),
    domain: normalized.hostname,
  };
}
