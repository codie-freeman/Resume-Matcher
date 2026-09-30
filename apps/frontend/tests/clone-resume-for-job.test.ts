import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneResumeForJob } from '@/lib/api/resume';

/**
 * cloneResumeForJob posts to the no-AI resume-creation endpoint and unwraps
 * the response the same way fetchResume/updateResume do. `fetch` is stubbed
 * so nothing hits the network.
 */
describe('cloneResumeForJob', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('fetch', (fetchMock = vi.fn()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('POSTs resume_id and job_id to /resumes/clone-for-job and returns the data payload', async () => {
    const responseBody = {
      request_id: 'req-1',
      data: {
        resume_id: 'tailored-123',
        raw_resume: {
          id: null,
          content: '{}',
          content_type: 'json',
          created_at: '2026-01-01T00:00:00Z',
          processing_status: 'ready',
        },
        processed_resume: { personalInfo: { name: 'Jane Doe' } },
        parent_id: 'master-1',
      },
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(responseBody), { status: 200 }));

    const result = await cloneResumeForJob('master-1', 'job-1');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/resumes/clone-for-job',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ resume_id: 'master-1', job_id: 'job-1' }),
      })
    );
    expect(result).toEqual(responseBody.data);
  });

  it('throws when the backend responds with a non-OK status', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Job description not found' }), { status: 404 })
    );

    await expect(cloneResumeForJob('master-1', 'missing-job')).rejects.toThrow(/404/);
  });
});
