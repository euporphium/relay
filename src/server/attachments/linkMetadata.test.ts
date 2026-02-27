import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
}));

describe('linkMetadata', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('rejects localhost links', async () => {
    const module = await import('./linkMetadata');

    await expect(
      module.normalizeAttachmentLink('http://localhost:3000/path'),
    ).rejects.toThrow('Local/private hosts are not allowed');
  });

  test('rejects redirects to private hosts', async () => {
    const dns = await import('node:dns/promises');
    vi.mocked(dns.lookup).mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as never);

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/private' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const module = await import('./linkMetadata');

    await expect(
      module.fetchLinkMetadata('https://example.com/start'),
    ).rejects.toThrow('Local/private hosts are not allowed');
  });

  test('prefers og metadata over fallback tags', async () => {
    const dns = await import('node:dns/promises');
    vi.mocked(dns.lookup).mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as never);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          `
            <html>
              <head>
                <title>Title Tag</title>
                <meta name="description" content="Description Tag" />
                <meta property="og:title" content="OG Title" />
                <meta property="og:description" content="OG Description" />
                <meta property="og:image" content="/preview.png" />
              </head>
            </html>
          `,
          {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          },
        ),
      ),
    );

    const module = await import('./linkMetadata');
    const result = await module.fetchLinkMetadata(
      'https://example.com/article',
    );

    expect(result.title).toBe('OG Title');
    expect(result.description).toBe('OG Description');
    expect(result.previewImageUrl).toBe('https://example.com/preview.png');
    expect(result.canonicalUrl).toBe('https://example.com/article');
    expect(result.domain).toBe('example.com');
  });
});
