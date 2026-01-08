export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
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

export const product: Product = {
  id: 'bale-001',
  name: 'Bale - Trading Card Game',
  slug: 'bale-card-game',
  price: 499, // ₹499 - Update this to your actual price
  images: [
    '/products/box-front.jpg',
    '/products/box-back.jpg',
    '/products/cards-spread.jpg',
    '/products/gameplay.jpg',
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
