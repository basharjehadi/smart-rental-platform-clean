import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import CountdownTimer from '../CountdownTimer';

// Mock Date.now() to control time
const mockDateNow = jest.fn();

const renderWithI18n = component => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('CountdownTimer', () => {
  beforeEach(() => {
    // Reset mock
    mockDateNow.mockReset();
  });

  describe('Countdown Display', () => {
    test('should display days and hours when more than 24 hours remaining', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-03 18:00:00 (2 days, 6 hours later)
      const targetDate = '2025-01-03T18:00:00Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      expect(screen.getByText(/2d 6h/)).toBeInTheDocument();
    });

    test('should display hours and minutes when less than 24 hours remaining', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 15:30:00 (3 hours, 30 minutes later)
      const targetDate = '2025-01-01T15:30:00Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      expect(screen.getByText(/3h 30m/)).toBeInTheDocument();
    });

    test('should display minutes and seconds when less than 1 hour remaining', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 12:05:30 (5 minutes, 30 seconds later)
      const targetDate = '2025-01-01T12:05:30Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      expect(screen.getByText(/5m 30s/)).toBeInTheDocument();
    });

    test('should display only seconds when less than 1 minute remaining', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 12:00:45 (45 seconds later)
      const targetDate = '2025-01-01T12:00:45Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      expect(screen.getByText(/45s/)).toBeInTheDocument();
    });
  });

  describe('Expired Countdown', () => {
    test('should show "Publishing now..." when countdown expires', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 11:00:00 (1 hour ago - expired)
      const targetDate = '2025-01-01T11:00:00Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      expect(screen.getByText('Publishing now...')).toBeInTheDocument();
    });

    test('should show "Publishing now..." when countdown is exactly 0', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 12:00:00 (exactly now)
      const targetDate = '2025-01-01T12:00:00Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      expect(screen.getByText('Publishing now...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing targetDate gracefully', () => {
      renderWithI18n(<CountdownTimer targetDate={null} />);

      expect(screen.queryByText(/Publishing now/)).not.toBeInTheDocument();
      expect(screen.queryByText(/d/)).not.toBeInTheDocument();
      expect(screen.queryByText(/h/)).not.toBeInTheDocument();
      expect(screen.queryByText(/m/)).not.toBeInTheDocument();
      expect(screen.queryByText(/s/)).not.toBeInTheDocument();
    });

    test('should handle invalid targetDate gracefully', () => {
      renderWithI18n(<CountdownTimer targetDate='invalid-date' />);

      // Should handle invalid date gracefully
      expect(screen.queryByText(/Publishing now/)).not.toBeInTheDocument();
    });

    test('should handle very small time differences', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 12:00:01 (1 second later)
      const targetDate = '2025-01-01T12:00:01Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      expect(screen.getByText(/1s/)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('should update countdown every second', () => {
      jest.useFakeTimers();

      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 12:00:10 (10 seconds later)
      const targetDate = '2025-01-01T12:00:10Z';

      renderWithI18n(<CountdownTimer targetDate={targetDate} />);

      // Initial display should show 10 seconds
      expect(screen.getByText(/10s/)).toBeInTheDocument();

      // Fast-forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should now show 5 seconds
      expect(screen.getByText(/5s/)).toBeInTheDocument();

      // Fast-forward to expiration
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should show "Publishing now..."
      expect(screen.getByText('Publishing now...')).toBeInTheDocument();

      jest.useRealTimers();
    });

    test('should clean up timer on unmount', () => {
      jest.useFakeTimers();

      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 12:00:10 (10 seconds later)
      const targetDate = '2025-01-01T12:00:10Z';

      const { unmount } = renderWithI18n(
        <CountdownTimer targetDate={targetDate} />
      );

      // Unmount component
      unmount();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // No errors should occur after unmount
      expect(jest.getTimerCount()).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('Styling', () => {
    test('should apply correct styling classes', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 12:00:10 (10 seconds later)
      const targetDate = '2025-01-01T12:00:10Z';

      const { container } = renderWithI18n(
        <CountdownTimer targetDate={targetDate} />
      );

      const countdownElement = container.querySelector('.text-orange-600');
      expect(countdownElement).toBeInTheDocument();
      expect(countdownElement).toHaveClass('text-xs', 'font-medium');
    });

    test('should apply correct styling for expired countdown', () => {
      // Mock current time: 2025-01-01 12:00:00
      mockDateNow.mockReturnValue(new Date('2025-01-01T12:00:00Z').getTime());

      // Target time: 2025-01-01 11:00:00 (1 hour ago - expired)
      const targetDate = '2025-01-01T11:00:00Z';

      const { container } = renderWithI18n(
        <CountdownTimer targetDate={targetDate} />
      );

      const expiredElement = container.querySelector('.text-green-600');
      expect(expiredElement).toBeInTheDocument();
      expect(expiredElement).toHaveClass('text-xs', 'font-medium');
    });
  });
});
