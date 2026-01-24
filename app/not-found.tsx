import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
          <Link href="/product" className="btn-secondary">
            View Products
          </Link>
        </div>

        {/* Help Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Need help?</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/track" className="text-primary hover:underline">
              Track Order
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/faq" className="text-primary hover:underline">
              FAQ
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
