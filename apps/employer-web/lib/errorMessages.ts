/**
 * Translates BE error envelopes into user-facing copy. The BE message field
 * is often technical ("Constraint violation on column foo") — this module
 * substitutes a friendlier title+description keyed on the stable `code`.
 *
 * Codes here are the ones actually thrown by the FE codebase today; unknown
 * codes fall through to the BE message with a generic "Something went wrong"
 * title so we never leak a raw stack to the user.
 */

import { ApiError } from './api';

export interface FriendlyError {
  title: string;
  description?: string;
}

const CODE_MESSAGES: Record<string, FriendlyError> = {
  // Auth / access
  AUTH_REQUIRED: {
    title: 'Sign in to continue',
    description: 'Your session expired. We’re redirecting you back to sign in.',
  },
  INVALID_CREDENTIALS: {
    title: 'Email or password is wrong',
    description: 'Double-check both and try again.',
  },
  TOKEN_INVALID: {
    title: 'This link expired',
    description: 'Request a new one to continue.',
  },
  INVITATION_INVALID: {
    title: 'This invitation is no longer valid',
    description: 'Ask your admin to resend it.',
  },
  NO_EMPLOYER_SCOPE: {
    title: 'No business linked to your account',
    description: 'Reach out to support — your access is not yet configured.',
  },
  EMPLOYER_REQUIRED: {
    title: 'No business context',
    description: 'Reload the page or sign in again.',
  },
  FORBIDDEN: {
    title: 'You don’t have access to this',
    description: 'Ask an owner or admin to grant the right role.',
  },

  // Validation
  VALIDATION_FAILED: {
    title: 'Please fix the highlighted fields',
    description: 'Some fields didn’t pass validation.',
  },
  INVALID_RANGE: {
    title: 'Date range looks off',
    description: '“From” must come before “to”.',
  },

  // Funds / payments
  INSUFFICIENT_FUNDS: {
    title: 'Not enough wallet balance',
    description: 'Top up your wallet and try again.',
  },
  PAYMENT_PROVIDER_UNAVAILABLE: {
    title: 'Squad is temporarily unavailable',
    description: 'Try again in a moment — your action is safe to retry.',
  },
  PDF_NOT_READY: {
    title: 'Document still generating',
    description: 'Hold on a few seconds and refresh.',
  },

  // Credit
  NO_LENDERS_AVAILABLE: {
    title: 'No matching lenders right now',
    description: 'Adjust your loan size or try again later.',
  },

  // State / conflicts
  INVALID_STATE: {
    title: 'Already handled',
    description: 'Someone else (or the system) acted on this. We refreshed the page.',
  },
  CONFLICT: {
    title: 'Conflict with the current state',
    description: 'Refresh and try again.',
  },

  // Not found
  NOT_FOUND: {
    title: 'Not found',
    description: 'This item may have been removed.',
  },
  SESSION_NOT_FOUND: {
    title: 'Session no longer exists',
    description: 'It may have been auto-released or removed.',
  },

  // Generic
  RATE_LIMITED: {
    title: 'Easy there — please slow down',
    description: 'Wait a moment and retry.',
  },
  INTERNAL: {
    title: 'Something went wrong on our end',
    description: 'We’ve been notified. Please retry in a moment.',
  },
};

/**
 * Best-effort translation from an arbitrary error into a toast-friendly copy
 * object. Pass `overrideTitle` to keep the mapped description but customize
 * the title (e.g., "Couldn't publish the job" instead of generic copy).
 */
export function humanMessageForError(
  err: unknown,
  overrideTitle?: string,
): FriendlyError {
  if (err instanceof ApiError) {
    const mapped = CODE_MESSAGES[err.code];
    if (mapped) {
      return {
        title: overrideTitle ?? mapped.title,
        description: mapped.description,
      };
    }
    // Unknown 5xx / network — collapse the BE message to a generic line.
    if (err.status === 0 || (err.status >= 500 && err.status < 600)) {
      return {
        title: overrideTitle ?? 'Network hiccup',
        description: 'Check your connection and try again.',
      };
    }
    return {
      title: overrideTitle ?? 'Couldn’t complete that action',
      description: err.message,
    };
  }
  if (err instanceof Error) {
    return {
      title: overrideTitle ?? 'Something went wrong',
      description: err.message,
    };
  }
  return { title: overrideTitle ?? 'Something went wrong' };
}
