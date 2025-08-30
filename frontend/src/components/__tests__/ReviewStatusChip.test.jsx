import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ReviewStatusChip from '../ReviewStatusChip';

// Mock the CountdownTimer component
jest.mock('../CountdownTimer', () => {
  return function MockCountdownTimer({ targetDate }) {
    return <span data-testid='countdown-timer'>2d 5h</span>;
  };
});

const renderWithI18n = component => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('ReviewStatusChip', () => {
  describe('Status Display', () => {
    test('should display PENDING status correctly', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='PENDING'
          publishAfter={null}
          isBlind={false}
        />
      );

      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    test('should display SUBMITTED status correctly', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter={null}
          isBlind={false}
        />
      );

      expect(screen.getByText('SUBMITTED')).toBeInTheDocument();
    });

    test('should display PUBLISHED status correctly', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='PUBLISHED'
          publishAfter={null}
          isBlind={false}
        />
      );

      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    test('should display BLOCKED status correctly', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='BLOCKED'
          publishAfter={null}
          isBlind={false}
        />
      );

      expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    });

    test('should display UNKNOWN status for invalid status', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='INVALID_STATUS'
          publishAfter={null}
          isBlind={false}
        />
      );

      expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    });
  });

  describe('Double-Blind Status', () => {
    test('should display BLIND status when isBlind is true', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter='2025-01-16T00:00:00Z'
          isBlind={true}
        />
      );

      expect(screen.getByText('BLIND')).toBeInTheDocument();
    });

    test('should show countdown chip for double-blind reviews', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter='2025-01-16T00:00:00Z'
          isBlind={true}
        />
      );

      expect(screen.getByText('Publishes in')).toBeInTheDocument();
      expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();
    });

    test('should not show countdown chip for non-blind reviews', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter='2025-01-16T00:00:00Z'
          isBlind={false}
        />
      );

      expect(screen.queryByText('Publishes in')).not.toBeInTheDocument();
      expect(screen.queryByTestId('countdown-timer')).not.toBeInTheDocument();
    });

    test('should not show countdown chip for published reviews', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='PUBLISHED'
          publishAfter='2025-01-16T00:00:00Z'
          isBlind={false}
        />
      );

      expect(screen.queryByText('Publishes in')).not.toBeInTheDocument();
    });
  });

  describe('Countdown Display', () => {
    test('should display countdown with correct styling for double-blind', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter='2025-01-16T00:00:00Z'
          isBlind={true}
        />
      );

      const countdownChip = screen.getByText('Publishes in').closest('div');
      expect(countdownChip).toHaveClass(
        'bg-orange-50',
        'text-orange-700',
        'border-orange-200'
      );
    });

    test('should handle missing publishAfter date gracefully', () => {
      renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter={null}
          isBlind={true}
        />
      );

      // Should still show BLIND status but no countdown
      expect(screen.getByText('BLIND')).toBeInTheDocument();
      expect(screen.queryByText('Publishes in')).not.toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    test('should display appropriate icons for each status', () => {
      const { container } = renderWithI18n(
        <ReviewStatusChip
          status='PENDING'
          publishAfter={null}
          isBlind={false}
        />
      );

      // Check that an icon is present (Clock icon for PENDING)
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('should display Eye icon for blind status', () => {
      const { container } = renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter='2025-01-16T00:00:00Z'
          isBlind={true}
        />
      );

      // Should have Eye icon for blind status
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Styling Classes', () => {
    test('should apply correct color classes for each status', () => {
      const { container } = renderWithI18n(
        <ReviewStatusChip
          status='PENDING'
          publishAfter={null}
          isBlind={false}
        />
      );

      const statusChip = container.querySelector('.bg-yellow-100');
      expect(statusChip).toBeInTheDocument();
      expect(statusChip).toHaveClass('text-yellow-800', 'border-yellow-200');
    });

    test('should apply correct color classes for blind status', () => {
      const { container } = renderWithI18n(
        <ReviewStatusChip
          status='SUBMITTED'
          publishAfter='2025-01-16T00:00:00Z'
          isBlind={true}
        />
      );

      const statusChip = container.querySelector('.bg-orange-100');
      expect(statusChip).toBeInTheDocument();
      expect(statusChip).toHaveClass('text-orange-800', 'border-orange-200');
    });

    test('should apply correct color classes for published status', () => {
      const { container } = renderWithI18n(
        <ReviewStatusChip
          status='PUBLISHED'
          publishAfter={null}
          isBlind={false}
        />
      );

      const statusChip = container.querySelector('.bg-green-100');
      expect(statusChip).toBeInTheDocument();
      expect(statusChip).toHaveClass('text-green-800', 'border-green-200');
    });
  });
});
