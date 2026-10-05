import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CardDetailModal } from '@/components/tracker/card-detail-modal';
import type { ApplicationDetail, TagWithUsage } from '@/lib/api/tracker';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}|${Object.values(params).join(',')}` : key,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const getApplicationDetail = vi.fn();
const updateApplication = vi.fn();
const setApplicationTags = vi.fn();
const createTag = vi.fn();
const deleteTag = vi.fn();

vi.mock('@/lib/api/tracker', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/tracker')>();
  return {
    ...actual,
    getApplicationDetail: (...args: unknown[]) => getApplicationDetail(...args),
    updateApplication: (...args: unknown[]) => updateApplication(...args),
    setApplicationTags: (...args: unknown[]) => setApplicationTags(...args),
    createTag: (...args: unknown[]) => createTag(...args),
    deleteTag: (...args: unknown[]) => deleteTag(...args),
  };
});

function detail(overrides: Partial<ApplicationDetail> = {}): ApplicationDetail {
  return {
    application_id: 'a1',
    job_id: 'j1',
    resume_id: 'r1',
    master_resume_id: null,
    status: 'response',
    company: 'Acme',
    role: 'Engineer',
    applied_at: null,
    notes: 'first pass',
    position: 0,
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    job_content: 'JD text',
    resume: { resume_id: 'r1' },
    ...overrides,
  };
}

const allTags: TagWithUsage[] = [
  {
    tag_id: 't1',
    label: 'Psychometric',
    category: 'activity',
    color: 'blue',
    usage_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

function renderModal(onUpdated = vi.fn(), onTagsChanged = vi.fn()) {
  render(
    <CardDetailModal
      applicationId="a1"
      open
      onOpenChange={vi.fn()}
      onUpdated={onUpdated}
      allTags={allTags}
      onTagsChanged={onTagsChanged}
    />
  );
  return { onUpdated, onTagsChanged };
}

const companyInput = () => screen.getByLabelText('tracker.modal.company') as HTMLInputElement;
const roleInput = () => screen.getByLabelText('tracker.modal.role') as HTMLInputElement;
const saveButton = () => screen.getByRole('button', { name: 'tracker.modal.saveDetails' });

describe('CardDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApplicationDetail.mockResolvedValue(detail());
    updateApplication.mockImplementation(async (_id: string, patch: Record<string, unknown>) => ({
      ...detail(),
      ...patch,
    }));
    setApplicationTags.mockResolvedValue({ ...detail(), tags: allTags });
  });

  it('prefills the company and role inputs from the card', async () => {
    renderModal();
    await waitFor(() => expect(companyInput().value).toBe('Acme'));
    expect(roleInput().value).toBe('Engineer');
  });

  it('leaves the inputs empty when company and role are unset', async () => {
    getApplicationDetail.mockResolvedValue(detail({ company: null, role: null }));
    renderModal();
    await waitFor(() => expect(companyInput()).toBeInTheDocument());
    expect(companyInput().value).toBe('');
    expect(roleInput().value).toBe('');
  });

  it('keeps save disabled until something actually changes', async () => {
    renderModal();
    await waitFor(() => expect(saveButton()).toBeDisabled());
    fireEvent.change(companyInput(), { target: { value: 'Globex' } });
    expect(saveButton()).toBeEnabled();
  });

  it('treats whitespace-only edits as no change', async () => {
    renderModal();
    await waitFor(() => expect(saveButton()).toBeDisabled());
    fireEvent.change(companyInput(), { target: { value: '  Acme  ' } });
    expect(saveButton()).toBeDisabled();
  });

  it('PATCHes the trimmed company and role together with the notes', async () => {
    const { onUpdated } = renderModal();
    await waitFor(() => expect(companyInput().value).toBe('Acme'));

    fireEvent.change(companyInput(), { target: { value: '  Globex  ' } });
    fireEvent.change(roleInput(), { target: { value: ' Staff Engineer ' } });
    fireEvent.change(screen.getByLabelText('tracker.modal.notes'), {
      target: { value: 'moved to onsite' },
    });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(updateApplication).toHaveBeenCalledWith('a1', {
        company: 'Globex',
        role: 'Staff Engineer',
        notes: 'moved to onsite',
      })
    );
    // The board must re-read so the card shows the new company.
    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
  });

  it('sends a blank company so the server can clear it', async () => {
    renderModal();
    await waitFor(() => expect(companyInput().value).toBe('Acme'));
    fireEvent.change(companyInput(), { target: { value: '' } });
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(updateApplication).toHaveBeenCalledWith('a1', {
        company: '',
        role: 'Engineer',
        notes: 'first pass',
      })
    );
  });

  it('settles back to clean after a successful save', async () => {
    renderModal();
    await waitFor(() => expect(companyInput().value).toBe('Acme'));
    fireEvent.change(companyInput(), { target: { value: 'Globex' } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(saveButton()).toBeDisabled());
  });

  it('shows a generic error and keeps the edit when saving fails', async () => {
    updateApplication.mockRejectedValue(new Error('db exploded'));
    renderModal();
    await waitFor(() => expect(companyInput().value).toBe('Acme'));
    fireEvent.change(companyInput(), { target: { value: 'Globex' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(screen.getByText('common.error')).toBeInTheDocument());
    expect(screen.queryByText(/db exploded/)).not.toBeInTheDocument();
    // The typed value survives so the user can retry without retyping.
    expect(companyInput().value).toBe('Globex');
  });

  it('renders the card tags and persists a tag change through the picker', async () => {
    getApplicationDetail.mockResolvedValue(detail({ tags: allTags }));
    const { onUpdated } = renderModal();
    await waitFor(() => expect(screen.getByText('Psychometric')).toBeInTheDocument());

    setApplicationTags.mockResolvedValue({ ...detail(), tags: [] });
    fireEvent.click(screen.getByLabelText('tracker.tags.removeAria|Psychometric'));

    await waitFor(() => expect(setApplicationTags).toHaveBeenCalledWith('a1', []));
    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
  });

  it('asks the board to refresh the registry after creating a tag', async () => {
    const { onTagsChanged } = renderModal();
    await waitFor(() => expect(companyInput()).toBeInTheDocument());
    createTag.mockResolvedValue({ ...allTags[0], tag_id: 't9', label: 'Second interview' });

    fireEvent.click(screen.getByText('tracker.tags.add'));
    fireEvent.change(screen.getByLabelText('tracker.tags.createLabel'), {
      target: { value: 'Second interview' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'tracker.tags.create' }));

    await waitFor(() =>
      expect(createTag).toHaveBeenCalledWith({
        label: 'Second interview',
        category: 'activity',
        color: 'blue',
      })
    );
    await waitFor(() => expect(onTagsChanged).toHaveBeenCalled());
    await waitFor(() => expect(setApplicationTags).toHaveBeenCalledWith('a1', ['t9']));
  });

  it('falls back to the load-failed message when the card cannot be fetched', async () => {
    getApplicationDetail.mockRejectedValue(new Error('nope'));
    renderModal();
    await waitFor(() => expect(screen.getByText('tracker.modal.loadFailed')).toBeInTheDocument());
  });
});
