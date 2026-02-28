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
});
