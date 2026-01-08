'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const preRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number').optional().or(z.literal('')),
});

type PreRegisterFormData = z.infer<typeof preRegisterSchema>;

export default function DigitalGamePage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PreRegisterFormData>({
    resolver: zodResolver(preRegisterSchema),
  });

  const onSubmit = async (data: PreRegisterFormData) => {
    setIsSubmitting(true);

    try {
      // TODO: Send to database or email service
      console.log('Pre-registration:', data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitted(true);
      reset();
    } catch (error) {
      console.error('Pre-registration error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🎮</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Bale Digital Game
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-gray-100">
              Coming Soon to Mobile & Web
            </p>
            <p className="text-lg mb-8 text-gray-200 max-w-2xl mx-auto">
              Experience the excitement of Bale anytime, anywhere. Play with friends online,
              compete in tournaments, and earn exclusive rewards!
            </p>
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <p className="text-sm font-semibold">Pre-Register Now and Get</p>
              <p className="text-2xl font-bold">500 Bonus Points</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What to Expect
            </h2>
            <p className="text-lg text-gray-600">
              The digital version brings new features and exciting gameplay
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-2">Play Online</h3>
              <p className="text-gray-600">
                Connect with players worldwide. Match with friends or find new opponents in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">Tournaments</h3>
              <p className="text-gray-600">
                Compete in daily and weekly tournaments. Climb the leaderboards and win prizes!
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-2">Rewards System</h3>
              <p className="text-gray-600">
                Earn points for every game. Unlock exclusive cards, avatars, and special items.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2">Cross-Platform</h3>
              <p className="text-gray-600">
                Play on mobile, tablet, or desktop. Your progress syncs across all devices.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Social Features</h3>
              <p className="text-gray-600">
                Add friends, create private rooms, and chat during gameplay. Build your community!
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Quick Matches</h3>
              <p className="text-gray-600">
                Fast-paced 5-minute games perfect for breaks. Or play longer strategic matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Registration Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Pre-Register Now
              </h2>
              <p className="text-gray-600">
                Be among the first to play and receive 500 bonus points when the game launches!
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="9876543210"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary w-full ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Pre-Register Now'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By pre-registering, you'll receive updates about the game launch and exclusive offers.
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-10 h-10 text-green-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  You're Registered!
                </h3>
                <p className="text-gray-600 mb-6">
                  Thanks for pre-registering! We'll notify you when the game launches.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-semibold">
                    Your 500 bonus points are waiting!
                  </p>
                </div>
                <Link href="/" className="btn-primary inline-block">
                  Back to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-secondary to-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Love the Physical Game?
          </h2>
          <p className="text-xl mb-8">
            Get your copy of the Bale card game today and start playing tonight!
          </p>
          <Link
            href="/product"
            className="bg-white text-primary hover:bg-gray-100 font-bold px-8 py-4 rounded-lg transition-colors inline-block text-lg"
          >
            Buy Physical Game - ₹499
          </Link>
        </div>
      </section>
    </div>
  );
}
