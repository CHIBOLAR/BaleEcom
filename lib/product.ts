export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  images: string[];
  videos: string[];
  description: string;
  shortDescription: string;
  details: {
    players: string;
    playtime: string;
    age: string;
    components: string[];
  };
  stock: number;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
}

export const product: Product = {
  id: 'bale-001',
  name: 'Bale - Trading Card Game',
  slug: 'bale-card-game',
  price: 399,
  originalPrice: 449, // 10% discount
  images: [
    '/products/box-front.png',
    '/products/cards-spread.png',
  ],
  videos: [
    // Add video URLs when available
    // '/videos/gameplay.mp4',
  ],
  description: `Bale is an exciting trading card game where players compete to collect and trade fabric cards representing various textiles. Navigate the ups and downs of the textile market, make strategic trades with opponents, and be the first to complete your collection!

Perfect for game nights with friends and family, Bale combines strategy, negotiation, and a bit of luck. Every game is different, keeping you engaged and entertained for hours.

The game features beautifully illustrated cards showcasing various fabrics including Cotton, Silk, Wool, and more. Special action cards and seasonal modifiers add exciting twists to gameplay, ensuring no two games are the same.`,
  shortDescription: 'A fast-paced trading card game for 3-8 players. Trade fabric cards, outsmart your opponents, and win!',
  details: {
    players: '3-8 players',
    playtime: '15-25 minutes',
    age: '10+',
    components: [
      '69 Product Cards (Cotton, Silk, Wool, and more)',
      'Special Action Cards (Market Disruption, Inventory Theft, etc.)',
      'Seasonal Modifier Cards',
      'Comprehensive Rulebook',
      'Quick Reference Guide',
    ],
  },
  stock: 250,
};

export const reviews: Review[] = [
  {
    id: '1',
    name: 'Priya M.',
    rating: 5,
    date: '2024-01-15',
    title: 'Perfect for family game night!',
    content: 'We played this with our extended family during Diwali and everyone loved it! The trading mechanics are so engaging and the games are quick enough to play multiple rounds. Highly recommend!',
    verified: true,
    helpful: 24,
  },
  {
    id: '2',
    name: 'Rahul S.',
    rating: 5,
    date: '2024-01-10',
    title: 'Best party game I have bought',
    content: 'Introduced this at a house party and it was an instant hit. Easy to learn, hard to master. The negotiation aspect makes every game different and hilarious.',
    verified: true,
    helpful: 18,
  },
  {
    id: '3',
    name: 'Ananya K.',
    rating: 4,
    date: '2024-01-08',
    title: 'Great quality cards',
    content: 'The card quality is excellent - feels premium. Game is super fun with 5-6 players. Only wish there were more expansion packs!',
    verified: true,
    helpful: 12,
  },
  {
    id: '4',
    name: 'Vikram P.',
    rating: 5,
    date: '2024-01-05',
    title: 'Kids and adults love it equally',
    content: 'My 12-year-old nephew and my 60-year-old dad both enjoyed this game. That says a lot about how well-designed it is. The rules are simple but strategy is deep.',
    verified: true,
    helpful: 31,
  },
  {
    id: '5',
    name: 'Sneha R.',
    rating: 5,
    date: '2024-01-02',
    title: 'Fast shipping and great game',
    content: 'Ordered on Monday, received by Wednesday. The game itself is fantastic - we have played it every weekend since. The fabric theme is unique and fun.',
    verified: true,
    helpful: 9,
  },
];

export const faqs = [
  {
    question: 'How many players can play Bale?',
    answer: 'Bale is designed for 3-8 players. The game works best with 4-6 players, but is still very enjoyable at any player count within the range.',
  },
  {
    question: 'How long does a typical game take?',
    answer: 'A typical game of Bale takes 15-25 minutes, making it perfect for multiple rounds in one sitting or a quick game when time is limited.',
  },
  {
    question: 'Is Bale suitable for children?',
    answer: 'Yes! Bale is recommended for ages 10 and up. The rules are simple enough for kids to understand, while the strategy keeps adults engaged.',
  },
  {
    question: 'What is included in the box?',
    answer: 'Each Bale box includes 69 product cards, special action cards, seasonal modifier cards, a comprehensive rulebook, and a quick reference guide.',
  },
  {
    question: 'Do you ship all over India?',
    answer: 'Yes, we ship to all pincodes across India. Shipping is FREE on all orders with delivery typically within 5-7 business days.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 7-day return policy. If you are not satisfied with your purchase, you can initiate a return within 7 days of delivery.',
  },
];
