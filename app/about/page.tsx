import Link from 'next/link';

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Bale</h1>
          <p className="text-xl text-gray-100">
            A trading card game inspired by the vibrant world of textiles
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-lg text-gray-700 mb-4">
              Bale was born from a simple idea: to create a fun, engaging card game that celebrates
              the rich heritage of the textile industry while providing strategic gameplay that
              brings people together.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Drawing inspiration from the bustling fabric markets and the art of trading, we've
              crafted a game that combines negotiation, strategy, and a bit of luck. Whether you're
              a casual player or a strategic thinker, Bale offers an exciting experience every time
              you play.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Perfect for family game nights, gatherings with friends, or breaking the ice at
              parties, Bale brings people together through the universal language of fun and
              friendly competition.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Quality First</h3>
              <p className="text-gray-600">
                We're committed to delivering premium quality games with beautiful artwork and
                durable components that last for years.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-2">Bring People Together</h3>
              <p className="text-gray-600">
                Our games are designed to create memorable moments and strengthen bonds between
                friends and family.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Continuous Innovation</h3>
              <p className="text-gray-600">
                We're constantly evolving, with new expansions, digital versions, and gameplay
                modes on the horizon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Game Details */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What Makes Bale Special?
          </h2>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Easy to Learn, Hard to Master
              </h3>
              <p className="text-gray-700">
                Bale's simple rules mean you can start playing in minutes, but the strategic depth
                keeps you coming back for more. Every game presents new challenges and opportunities.
              </p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Perfect Player Count
              </h3>
              <p className="text-gray-700">
                Designed for 3-8 players, Bale scales beautifully whether you're playing with a few
                friends or hosting a larger gathering. The game adapts to create the perfect
                experience for any group size.
              </p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Beautiful Artwork
              </h3>
              <p className="text-gray-700">
                Each card features stunning illustrations of various fabrics and textiles, making
                the game a visual treat. The art tells a story and immerses you in the world of
                textile trading.
              </p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Replayability
              </h3>
              <p className="text-gray-700">
                With special action cards, seasonal modifiers, and the unpredictable nature of
                trading with other players, no two games are ever the same. Endless variety keeps
                every session fresh and exciting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience Bale?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of players who are already enjoying the excitement of Bale!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/product"
              className="bg-white text-primary hover:bg-gray-100 font-bold px-8 py-4 rounded-lg transition-colors inline-block text-lg"
            >
              Buy Now - ₹499
            </Link>
            <Link
              href="/digital-game"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold px-8 py-4 rounded-lg transition-colors inline-block text-lg border-2 border-white"
            >
              Pre-Register for Digital
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
