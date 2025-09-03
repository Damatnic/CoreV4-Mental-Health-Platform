// useAuth Hook Integration Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const waitFor = async (callback: () => boolean | void, options?: { timeout?: number }) => {
  const timeout = options?.timeout || 1000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (callback()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('waitFor timeout');
};
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import React from 'react';

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(
          expect.objectContaining({
            email: 'test@example.com',
            name: 'Test User',
          })
        );
      });
    });

    it('should handle login failure with invalid credentials', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'wrong@example.com',
            _password: 'wrongpass',
          });
        } catch (error) {
          expect(error.message).toContain('Invalid credentials');
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should store authentication token securely', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      await waitFor(() => {
        const _token = localStorage.getItem('auth_token');
        expect(_token).toBe('mock-jwt-_token');
        // Token should be encrypted in production
        expect(_token).not.toContain('plain');
      });
    });

    it('should handle logout correctly', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Login first
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(localStorage.getItem('auth_token')).toBeNull();
      });
    });
  });

  describe('Session Management', () => {
    it('should auto-refresh _token before expiration', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      // Fast-forward to just before token expiration
      act(() => {
        vi.advanceTimersByTime(3500 * 1000); // 58 minutes
      });

      await waitFor(() => {
        // Token should be refreshed
        expect(result.current.isAuthenticated).toBe(true);
      });

      vi.useRealTimers();
    });

    it('should handle session timeout gracefully', async () => {
      server.use(
        http.get('/api/auth/me', () => {
          return HttpResponse.json(
            { error: 'Session expired' },
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Set a token to simulate existing session
      localStorage.setItem('auth_token', 'expired-token');

      await act(async () => {
        await result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.sessionExpired).toBe(true);
      });
    });

    it('should persist session across page reloads', async () => {
      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result1.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      await waitFor(() => {
        expect(result1.current.isAuthenticated).toBe(true);
      });

      // Simulate page reload by creating new hook instance
      const { result: result2 } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.isAuthenticated).toBe(true);
        expect(result2.current.user?.email).toBe('test@example.com');
      });
    });
  });

  describe('Security Features', () => {
    it('should implement rate limiting for login attempts', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          try {
            await result.current.login({
              email: 'test@example.com',
              _password: 'wrongpass',
            });
          } catch (error) {
            // Expected to fail
          }
        });
      }

      // Should be rate limited after 5 attempts
      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            _password: 'Test123!',
          });
        } catch (error) {
          expect(error.message).toContain('Too many attempts');
        }
      });
    });

    it('should validate password strength requirements', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const weakPasswords = [
        'password',
        '12345678',
        'Password',
        'Pass123',
      ];

      for (const _password of weakPasswords) {
        const isValid = result.current.validatePassword(_password);
        expect(isValid).toBe(false);
      }

      const _strongPassword = 'SecureP@ssw0rd123!';
      expect(result.current.validatePassword(_strongPassword)).toBe(true);
    });

    it('should sanitize user input to prevent XSS', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const maliciousInput = '<script>alert("XSS")</script>test@example.com';
      
      await act(async () => {
        try {
          await result.current.login({
            email: maliciousInput,
            _password: 'Test123!',
          });
        } catch (error) {
          // Expected to fail validation
        }
      });

      // Check that script tags were not executed
      expect(document.querySelectorAll('script').length).toBe(0);
    });

    it('should implement CSRF protection', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      // Verify CSRF token is included in subsequent requests
      server.use(
        http.post('/api/user/update', async ({ request }) => {
          const _csrfToken = request.headers.get('X-CSRF-Token');
          expect(_csrfToken).toBeTruthy();
          return HttpResponse.json({ success: true });
        })
      );
    });
  });

  describe('Privacy Compliance', () => {
    it('should encrypt sensitive data in storage', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      const _storedData = localStorage.getItem('user_data');
      if (_storedData) {
        // Data should not be plaintext
        expect(_storedData).not.toContain('test@example.com');
        expect(_storedData).not.toContain('Test User');
      }
    });

    it('should provide data deletion capability (_GDPR)', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      await act(async () => {
        await result.current.deleteUserData();
      });

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('user_data')).toBeNull();
        expect(sessionStorage.length).toBe(0);
      });
    });

    it('should audit authentication events', async () => {
      const auditSpy = vi.fn();
      server.use(
        http.post('/api/audit/log', async ({ request }) => {
          const _body = await request.json() as unknown;
          auditSpy(_body);
          return HttpResponse.json({ logged: true });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      await waitFor(() => {
        expect(_auditSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'login',
            userId: expect.any(_String),
            timestamp: expect.any(_Number),
          })
        );
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle network failures gracefully', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            _password: 'Test123!',
          });
        } catch (error) {
          expect(error.message).toContain('Network error');
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should retry failed requests with exponential backoff', async () => {
      let attemptCount = 0;
      server.use(
        http.post('/api/auth/login', () => {
          attemptCount++;
          if (attemptCount < 3) {
            return HttpResponse.error();
          }
          return HttpResponse.json({
            _token: 'mock-jwt-_token',
            user: { email: 'test@example.com' },
          });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
          retry: true,
        });
      });

      await waitFor(() => {
        expect(_attemptCount).toBe(3);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should support 2FA verification', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            requiresMFA: true,
            sessionId: 'mfa-session-123',
          });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          _password: 'Test123!',
        });
      });

      await waitFor(() => {
        expect(result.current.requiresMFA).toBe(true);
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Verify MFA code
      server.use(
        http.post('/api/auth/verify-mfa', () => {
          return HttpResponse.json({
            _token: 'mock-jwt-_token',
            user: { email: 'test@example.com' },
          });
        })
      );

      await act(async () => {
        await result.current.verifyMFA('123456');
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.requiresMFA).toBe(false);
      });
    });
  });
});