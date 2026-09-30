import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TailorPage from '@/app/(default)/tailor/page';
import {
  fetchResumeList,
  uploadJobDescriptions,
  cloneResumeForJob,
  type ResumeListItem,
} from '@/lib/api/resume';
import { fetchPromptConfig } from '@/lib/api/config';

const push = vi.fn();
const back = vi.fn();
// A stable object: the real Next.js useRouter() returns a memoized router,
// and TailorPage's `[router]`-dependent effect relies on that stability — a
// mock that returns a fresh object per render would re-fire it on every
// re-render and stomp any local state changes (e.g. the base-resume pick).
const mockRouter = { push, back };

vi.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
vi.mock('@/lib/i18n', () => ({ useTranslations: () => ({ t: (key: string) => key }) }));
vi.mock('@/lib/context/status-cache', () => ({
  useStatusCache: () => ({
    status: { llm_configured: true },
    isLoading: false,
    incrementJobs: vi.fn(),
    incrementImprovements: vi.fn(),
    incrementResumes: vi.fn(),
  }),
}));
vi.mock('@/components/common/resume_previewer_context', () => ({
  useResumePreview: () => ({ setImprovedData: vi.fn() }),
}));
vi.mock('@/lib/api/resume', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/resume')>();
  return {
    ...actual,
    fetchResumeList: vi.fn(),
    uploadJobDescriptions: vi.fn(),
    previewImproveResume: vi.fn(),
    confirmImproveResume: vi.fn(),
    cloneResumeForJob: vi.fn(),
  };
});
vi.mock('@/lib/api/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/config')>();
  return { ...actual, fetchPromptConfig: vi.fn() };
});

const mockedFetchResumeList = vi.mocked(fetchResumeList);
const mockedUploadJobDescriptions = vi.mocked(uploadJobDescriptions);
const mockedCloneResumeForJob = vi.mocked(cloneResumeForJob);
const mockedFetchPromptConfig = vi.mocked(fetchPromptConfig);

const master: ResumeListItem = {
  resume_id: 'master-1',
  filename: 'master.pdf',
  is_master: true,
  parent_id: null,
  processing_status: 'ready',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  title: 'Master Resume Title',
};

const tailored: ResumeListItem = {
  resume_id: 'tailored-1',
  filename: 'tailored.json',
  is_master: false,
  parent_id: 'master-1',
  processing_status: 'ready',
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z',
  title: 'Acme Corp Resume',
};

const longJobDescription =
  'We are looking for a software engineer with experience in TypeScript and React. '.repeat(2);

// This test's jsdom environment has no working global localStorage
// (setItem/getItem/clear are all undefined), which is unrelated to the
// behavior under test here — stub in a minimal in-memory implementation so
// the page's `localStorage.getItem('master_resume_id')` read works.
function createLocalStorageStub() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('TailorPage base resume selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', createLocalStorageStub());
    localStorage.setItem('master_resume_id', master.resume_id);
    mockedFetchPromptConfig.mockResolvedValue({
      prompt_options: [],
      default_prompt_id: 'keywords',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hides the base-resume picker when only the master resume exists', async () => {
    mockedFetchResumeList.mockResolvedValueOnce([master]);

    render(<TailorPage />);

    await waitFor(() => expect(mockedFetchResumeList).toHaveBeenCalled());
    expect(screen.queryByText('tailor.selectResume')).not.toBeInTheDocument();
  });

  it('defaults to the master resume, and lets the user pick a tailored resume as the base for Create Without AI', async () => {
    mockedFetchResumeList.mockResolvedValueOnce([master, tailored]);
    mockedUploadJobDescriptions.mockResolvedValueOnce('job-1');
    mockedCloneResumeForJob.mockResolvedValueOnce({ resume_id: 'new-resume-1' } as never);

    render(<TailorPage />);

    // Picker appears once a second (tailored) resume exists, defaulting to master.
    expect(await screen.findByText('tailor.selectResume')).toBeInTheDocument();
    expect(screen.getByText('tailor.masterResumeOption')).toBeInTheDocument();

    // Switch the base resume to the previously-tailored one.
    fireEvent.click(screen.getByRole('button', { name: 'tailor.selectResume' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: /Acme Corp Resume/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'tailor.selectResume' })).toHaveTextContent(
        'Acme Corp Resume'
      )
    );

    fireEvent.change(screen.getByPlaceholderText('tailor.jobDescriptionPlaceholder'), {
      target: { value: longJobDescription },
    });
    fireEvent.click(screen.getByRole('button', { name: 'tailor.createWithoutAi' }));

    await waitFor(() => {
      expect(mockedUploadJobDescriptions).toHaveBeenCalledWith(
        [longJobDescription.trim()],
        tailored.resume_id
      );
    });
    expect(mockedCloneResumeForJob).toHaveBeenCalledWith(tailored.resume_id, 'job-1');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/builder?id=new-resume-1'));
  });
});
