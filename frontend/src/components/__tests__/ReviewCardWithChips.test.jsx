import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ReviewCardWithChips from '../ReviewCardWithChips';

// Mock the CountdownTimer component
jest.mock('../CountdownTimer', () => {
  return function MockCountdownTimer({ targetDate }) {
    return <span data-testid='countdown-timer'>2d 5h</span>;
  };
});

// Mock the ReviewStatusChip component
jest.mock('../ReviewStatusChip', () => {
  return function MockReviewStatusChip({ status, isBlind }) {
    return (
      <div data-testid='review-status-chip'>
        <span>{status}</span>
        {isBlind && <span data-testid='blind-indicator'>BLIND</span>}
      </div>
    );
  };
});

const renderWithI18n = component => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('ReviewCardWithChips - Role-Based Visibility', () => {
  const mockReview = {
    id: 'review-1',
    reviewerId: 'user-1',
    revieweeId: 'user-2',
    status: 'SUBMITTED',
    rating: 4,
    comment: 'Great experience with this landlord!',
    reviewStage: 'END_OF_LEASE',
    createdAt: '2025-01-01T00:00:00Z',
    submittedAt: '2025-01-02T00:00:00Z',
    publishAfter: '2025-01-16T00:00:00Z', // 14 days from submission
    property: {
      name: 'Test Property',
      address: '123 Test St',
    },
    landlord: {
      name: 'John Landlord',
      profileImage: null,
    },
    tenant: {
      name: 'Jane Tenant',
      profileImage: null,
    },
  };

  describe('Double-Blind Review Visibility', () => {
    test('should hide rating and comment from counterpart when double-blind', () => {
      // Current user is NOT the reviewer (they are the counterpart)
      renderWithI18n(
        <ReviewCardWithChips
          review={mockReview}
          isLandlord={false}
          currentUserId='user-2' // Different from reviewerId
          onWriteReview={jest.fn()}
        />
      );

      // Rating should be hidden
      expect(screen.queryByText('4')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Great experience with this landlord!')
      ).not.toBeInTheDocument();

      // Should show hidden content message
      expect(
        screen.getByText('Content hidden until published')
      ).toBeInTheDocument();
      expect(screen.getByText('Publishes in')).toBeInTheDocument();
      expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
    });

    test('should show rating and comment to reviewer when double-blind', () => {
      // Current user IS the reviewer
      renderWithI18n(
        <ReviewCardWithChips
          review={mockReview}
          isLandlord={false}
          currentUserId='user-1' // Same as reviewerId
          onWriteReview={jest.fn()}
        />
      );

      // Rating should be visible
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(
        screen.getByText('Great experience with this landlord!')
      ).toBeInTheDocument();

      // Should not show hidden content message
      expect(
        screen.queryByText('Content hidden until published')
      ).not.toBeInTheDocument();
    });

    test('should show double-blind countdown chip when status is SUBMITTED with publishAfter', () => {
      renderWithI18n(
        <ReviewCardWithChips
          review={mockReview}
          isLandlord={false}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      // Should show the countdown chip
      expect(screen.getByText('Publishes in')).toBeInTheDocument();
      expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
    });
  });

  describe('Non-Double-Blind Review Visibility', () => {
    test('should show content for published reviews', () => {
      const publishedReview = {
        ...mockReview,
        status: 'PUBLISHED',
        publishAfter: null,
        publishedAt: '2025-01-16T00:00:00Z',
      };

      renderWithI18n(
        <ReviewCardWithChips
          review={publishedReview}
          isLandlord={false}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      // Content should be visible even to counterpart
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(
        screen.getByText('Great experience with this landlord!')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Content hidden until published')
      ).not.toBeInTheDocument();
    });

    test('should show content for pending reviews', () => {
      const pendingReview = {
        ...mockReview,
        status: 'PENDING',
        publishAfter: null,
      };

      renderWithI18n(
        <ReviewCardWithChips
          review={pendingReview}
          isLandlord={false}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      // Content should be visible
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(
        screen.getByText('Great experience with this landlord!')
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing publishAfter date', () => {
      const reviewWithoutPublishAfter = {
        ...mockReview,
        publishAfter: null,
      };

      renderWithI18n(
        <ReviewCardWithChips
          review={reviewWithoutPublishAfter}
          isLandlord={false}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      // Should not be considered double-blind
      expect(
        screen.queryByText('Content hidden until published')
      ).not.toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    test('should handle expired publishAfter date', () => {
      const reviewWithExpiredPublishAfter = {
        ...mockReview,
        publishAfter: '2025-01-01T00:00:00Z', // Past date
      };

      renderWithI18n(
        <ReviewCardWithChips
          review={reviewWithExpiredPublishAfter}
          isLandlord={false}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      // Should not be considered double-blind
      expect(
        screen.queryByText('Content hidden until published')
      ).not.toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    test('should handle missing rating and comment', () => {
      const reviewWithoutContent = {
        ...mockReview,
        rating: null,
        comment: null,
      };

      renderWithI18n(
        <ReviewCardWithChips
          review={reviewWithoutContent}
          isLandlord={false}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      // Should not crash and should show hidden content message
      expect(
        screen.getByText('Content hidden until published')
      ).toBeInTheDocument();
    });
  });

  describe('Landlord vs Tenant Context', () => {
    test('should show correct target info for landlord context', () => {
      renderWithI18n(
        <ReviewCardWithChips
          review={mockReview}
          isLandlord={true}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      expect(screen.getByText('Jane Tenant')).toBeInTheDocument();
      expect(screen.getByText('Tenant')).toBeInTheDocument();
    });

    test('should show correct target info for tenant context', () => {
      renderWithI18n(
        <ReviewCardWithChips
          review={mockReview}
          isLandlord={false}
          currentUserId='user-2'
          onWriteReview={jest.fn()}
        />
      );

      expect(screen.getByText('John Landlord')).toBeInTheDocument();
      expect(screen.getByText('Landlord')).toBeInTheDocument();
    });
  });

  describe('Review Stage Labels', () => {
    test('should show correct stage label for MOVE_IN', () => {
      const moveInReview = {
        ...mockReview,
        reviewStage: 'MOVE_IN',
      };

      renderWithI18n(
        <ReviewCardWithChips
          review={moveInReview}
          isLandlord={false}
          currentUserId='user-1'
          onWriteReview={jest.fn()}
        />
      );

      expect(
        screen.getByText('Move-in check (no score impact)')
      ).toBeInTheDocument();
    });

    test('should show correct stage label for END_OF_LEASE', () => {
      renderWithI18n(
        <ReviewCardWithChips
          review={mockReview}
          isLandlord={false}
          currentUserId='user-1'
          onWriteReview={jest.fn()}
        />
      );

      expect(
        screen.getByText('Lease end review (affects score)')
      ).toBeInTheDocument();
    });
  });
});
