import Link from 'next/link';
import { reviews } from '@/lib/product';

export const metadata = {
  title: 'Customer Reviews - Bale Trading Card Game',
  description: 'Read what customers are saying about Bale, the fast-paced trading card game for 3-8 players.',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (rating) => reviews.filter((r) => r.rating === rating).length
  );

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Customer Reviews</h1>
            <div className="flex items-center justify-center gap-3 mb-4">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            </div>
            <p className="text-white/80">Based on {reviews.length} verified reviews</p>
          </div>
        </div>
      </section>

      {/* Rating Breakdown */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating, index) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">{rating} star</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full"
                    style={{
                      width: `${reviews.length > 0 ? (ratingCounts[index] / reviews.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{ratingCounts[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews List */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.date).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{review.title}</h3>
                <p className="text-gray-600 mb-4">{review.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{review.name}</span>
                  <span className="text-sm text-gray-500">
                    {review.helpful} people found this helpful
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-primary-dark to-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Join the Fun?</h2>
          <p className="text-white/80 mb-6">
            Experience the excitement that our customers are raving about.
          </p>
          <Link
            href="/product"
            className="inline-block bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
}
