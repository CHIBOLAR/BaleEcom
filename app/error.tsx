'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something Went Wrong</h2>
        <p className="text-gray-600 mb-8">
          We're sorry, but something unexpected happened. Please try again, or
          contact us if the problem persists.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => reset()} className="btn-primary">
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Go to Homepage
          </Link>
        </div>

        {/* Error Details (for debugging) */}
        {error.digest && (
          <p className="mt-8 text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}

        {/* Help Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Need help?</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/contact" className="text-primary hover:underline">
              Contact Support
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/faq" className="text-primary hover:underline">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
