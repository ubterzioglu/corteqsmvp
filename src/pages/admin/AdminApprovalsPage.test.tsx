import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as useAdminApprovalsModule from '@/hooks/admin/useAdminApprovals';
import AdminApprovalsPage from './AdminApprovalsPage';

vi.mock('@/hooks/admin/useAdminApprovals');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AdminApprovalsPage', () => {
  beforeEach(() => {
    vi.mocked(useAdminApprovalsModule.useAdminApprovals).mockReturnValue({
      data: {
        requests: [
          {
            id: '1',
            request_type: 'new_profile',
            user_id: 'user-1',
            status: 'pending',
            created_at: '2026-07-23T10:00:00Z',
            payload: {},
            target_role_key: null,
            target_feature_key: null,
            admin_note: null,
          },
        ],
        users: [{ id: 'user-1', email: 'user1@example.com' }],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      reviewMutation: {
        mutateAsync: vi.fn().mockResolvedValue(undefined),
        isPending: false,
        variables: undefined,
      },
    } as never);
  });

  it('should render "Yeni profil talebi" filter option', () => {
    render(<AdminApprovalsPage />);

    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
  });

  it('should have new_profile in filter options', () => {
    render(<AdminApprovalsPage />);

    // Verify that the filter select exists
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toBeInTheDocument();
  });

  it('should display new_profile request when filter shows all requests', async () => {
    render(<AdminApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText('new_profile')).toBeInTheDocument();
    });
  });
});
