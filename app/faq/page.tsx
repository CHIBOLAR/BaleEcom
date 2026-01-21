export default function FAQPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-100">
            Everything you need to know about playing Bale
          </p>
        </div>
      </section>

      {/* General Gameplay */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">General Gameplay</h2>
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How many cards do I need to win?</h3>
              <p className="text-gray-700">You need 7 cards of the same product. With an active Season card for that product, you only need 6 cards.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I win with a mix of products?</h3>
              <p className="text-gray-700">No. All 7 (or 6 with season) cards must be the same product. However, the Bale App wild card can substitute for any product.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What happens if the draw pile runs out?</h3>
              <p className="text-gray-700">Shuffle the entire discard pile to form a new draw pile.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I pick cards from the discard pile?</h3>
              <p className="text-gray-700">No. You can only draw from the draw pile. The discard pile only becomes available when it is shuffled to become the new draw pile.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I skip my turn?</h3>
              <p className="text-gray-700">No, you must draw at least one card. However, trading, playing special cards, and discarding are all optional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trading */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Trading</h2>
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I refuse a trade?</h3>
              <p className="text-gray-700">Yes, both players must agree to a normal trade. However, you cannot refuse a Forced Deal.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I trade special cards?</h3>
              <p className="text-gray-700">Yes, all special cards are worth 30 points and can be included in trades.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I see what cards I'm getting in a trade?</h3>
              <p className="text-gray-700">No. All trades are blind - you only know the total point value, not the specific cards.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I trade on another player's turn?</h3>
              <p className="text-gray-700">No, trades can only be initiated during your own turn.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I offer a higher value trade without getting equal points back?</h3>
              <p className="text-gray-700">Yes. You can offer a higher value card and receive less in return. For example, you can trade a 30-point special card for a 20-point product card, receiving nothing for the extra 10 points.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Bale Call */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">The Bale Call</h2>
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">When exactly do I call "BALE!"?</h3>
              <p className="text-gray-700">When you are one card away from winning - typically at 6 cards, or 5 cards if you have an active Season card.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What if I forget to call Bale?</h3>
              <p className="text-gray-700">Your victory is invalid. You must wait until your next turn to try again (and remember to call Bale first!).</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Do I call Bale before or after drawing?</h3>
              <p className="text-gray-700">Call Bale whenever you reach one card away from winning - this could be after drawing, after a trade, or after playing a card.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Special Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Special Cards</h2>
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I play multiple special cards in one turn?</h3>
              <p className="text-gray-700">Yes, you can play any number of special cards during your turn.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">When do I play Insurance?</h3>
              <p className="text-gray-700">You must play Insurance before you are targeted by a blocker card. It provides preventive protection.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can Insurance block Forced Deal or Market Disruption?</h3>
              <p className="text-gray-700">No. Insurance only protects against Inventory Theft, Bad Debtor, and Warehouse Fire.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What if Tariff is played on a product I'm collecting with a Season card?</h3>
              <p className="text-gray-700">Both effects stack. You'll need 8 cards to win (7 base - 1 season + 2 tariff = 8).</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can Bale App be stolen with Inventory Theft?</h3>
              <p className="text-gray-700">No. Bale App cannot be stolen or affected by product-specific effects.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Does Warehouse Fire affect the player who played it?</h3>
              <p className="text-gray-700">No. Only other players must discard 2 cards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Season Cards */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Season Cards</h2>
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I have multiple Season cards active?</h3>
              <p className="text-gray-700">Yes, you can have multiple Season cards in play, allowing flexibility in which product you pursue.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Do Season cards affect all players or just me?</h3>
              <p className="text-gray-700">Only you benefit from your active Season cards.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can a Season card be removed from play?</h3>
              <p className="text-gray-700">No. Season cards remain active once played. However, Tariff can make a product harder to collect by adding +2 cards needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Edge Cases */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Edge Cases</h2>
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What if two players declare victory at the same time?</h3>
              <p className="text-gray-700">The player with the higher point product wins (20-point products beat 10-point products). If equal, whoever declared first wins.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What if I draw a card that puts me over 13 cards?</h3>
              <p className="text-gray-700">You must discard down to 13 cards. If caught with more than 13, you must discard 2 cards as a penalty.</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Can I use Forced Deal to make a 0-point trade?</h3>
              <p className="text-gray-700">No, trades must have a point value. The minimum trade is 10 points (one Cotton/Polyester/Denim card).</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">What happens if I play Collateral but there are fewer than 3 cards in the deck?</h3>
              <p className="text-gray-700">Draw whatever cards remain, then deposit 1 card to the discard pile.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
