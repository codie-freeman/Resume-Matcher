import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bulkUpdateStatus,
  bulkDeleteApplications,
  createApplication,
  createTag,
  deleteApplication,
  deleteTag,
  listTags,
  setApplicationTags,
  updateApplication,
  updateTag,
} from '@/lib/api/tracker';
import { llmProviderToKeyProvider } from '@/lib/api/config';

/**
 * Tracker API client contracts: the wrappers must hit the right method/URL and
 * send the right payloads, and the provider-axis mapping (used by the Settings
 * key store) must mirror the backend `_PROVIDER_KEY_MAP`.
 */

describe('llmProviderToKeyProvider', () => {
  it('maps gemini to the google key-store slot and passes others through', () => {
    expect(llmProviderToKeyProvider('gemini')).toBe('google');
    expect(llmProviderToKeyProvider('openai')).toBe('openai');
    expect(llmProviderToKeyProvider('anthropic')).toBe('anthropic');
    expect(llmProviderToKeyProvider('openai_compatible')).toBe('openai_compatible');
    expect(llmProviderToKeyProvider('ollama')).toBe('ollama');
  });
});

describe('tracker API client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, options] = fetchMock.mock.calls.at(-1)!;
    return { url: String(url), options: options as RequestInit };
  };

  it('bulkUpdateStatus PATCHes /applications/bulk with ids + status', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok', affected: 2 }), { status: 200 })
    );
    await bulkUpdateStatus(['a', 'b'], 'interview');
    const { url, options } = lastCall();
    expect(url).toContain('/applications/bulk');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(String(options.body))).toEqual({
      application_ids: ['a', 'b'],
      status: 'interview',
    });
  });

  it('updateApplication PATCHes /applications/{id} with the partial', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ application_id: 'x' }), { status: 200 })
    );
    await updateApplication('x', { status: 'rejected', position: 0 });
    const { url, options } = lastCall();
    expect(url).toContain('/applications/x');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(String(options.body))).toEqual({ status: 'rejected', position: 0 });
  });

  it('createApplication POSTs the manual-add payload', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ application_id: 'x' }), { status: 200 })
    );
    await createApplication({ resume_id: 'r1', job_description: 'JD', status: 'saved' });
    const { url, options } = lastCall();
    expect(url).toContain('/applications');
    expect(options.method).toBe('POST');
    expect(JSON.parse(String(options.body))).toMatchObject({ resume_id: 'r1', status: 'saved' });
  });

  it('deleteApplication DELETEs /applications/{id}', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok', affected: 1 }), { status: 200 })
    );
    await deleteApplication('x');
    const { url, options } = lastCall();
    expect(url).toContain('/applications/x');
    expect(options.method).toBe('DELETE');
  });

  it('bulkDeleteApplications POSTs to /applications/bulk-delete', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok', affected: 2 }), { status: 200 })
    );
    await bulkDeleteApplications(['a', 'b']);
    const { url, options } = lastCall();
    expect(url).toContain('/applications/bulk-delete');
    expect(options.method).toBe('POST');
    expect(JSON.parse(String(options.body))).toEqual({ application_ids: ['a', 'b'] });
  });

  it('surfaces the backend detail message on failure', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: 'boom' }), { status: 500 }));
    await expect(deleteApplication('x')).rejects.toThrow('boom');
  });
});

describe('tracker tag API client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, options] = fetchMock.mock.calls.at(-1)!;
    return { url: String(url), options: options as RequestInit };
  };

  it('listTags GETs /tags', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ tags: [] }), { status: 200 }));
    await listTags();
    const { url, options } = lastCall();
    expect(url).toContain('/tags');
    // GET is the default; the wrapper must not force another verb.
    expect(options.method ?? 'GET').toBe('GET');
  });

  it('createTag POSTs the label, category and color', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ tag_id: 't1' }), { status: 200 }));
    await createTag({ label: 'Psychometric', category: 'activity', color: 'blue' });
    const { url, options } = lastCall();
    expect(url).toContain('/tags');
    expect(options.method).toBe('POST');
    expect(JSON.parse(String(options.body))).toEqual({
      label: 'Psychometric',
      category: 'activity',
      color: 'blue',
    });
  });

  it('updateTag PATCHes /tags/{id} with the partial', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ tag_id: 't1' }), { status: 200 }));
    await updateTag('t1', { label: 'Recruiter call' });
    const { url, options } = lastCall();
    expect(url).toContain('/tags/t1');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(String(options.body))).toEqual({ label: 'Recruiter call' });
  });

  it('deleteTag DELETEs /tags/{id}', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok', affected: 1 }), { status: 200 })
    );
    await deleteTag('t1');
    const { url, options } = lastCall();
    expect(url).toContain('/tags/t1');
    expect(options.method).toBe('DELETE');
  });

  it('setApplicationTags PUTs the full tag_ids set to the card', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ application_id: 'a1', tags: [] }), { status: 200 })
    );
    await setApplicationTags('a1', ['t1', 't2']);
    const { url, options } = lastCall();
    expect(url).toContain('/applications/a1/tags');
    // PUT, not PATCH — the endpoint has set semantics, not delta semantics.
    expect(options.method).toBe('PUT');
    expect(JSON.parse(String(options.body))).toEqual({ tag_ids: ['t1', 't2'] });
  });

  it('setApplicationTags sends an empty list when clearing every tag', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ application_id: 'a1', tags: [] }), { status: 200 })
    );
    await setApplicationTags('a1', []);
    expect(JSON.parse(String(lastCall().options.body))).toEqual({ tag_ids: [] });
  });

  it('surfaces the backend detail message when a tag write fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'A tag with that name already exists.' }), {
        status: 409,
      })
    );
    await expect(updateTag('t1', { label: 'x' })).rejects.toThrow(
      'A tag with that name already exists.'
    );
  });
});
