'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { product } from '@/lib/product';
import { formatCurrency, calculateShipping, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import { useCartStore } from '@/lib/store';

export default function ProductPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0],
    });
    router.push('/cart');
  };

  const handleBuyNow = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0],
    });
    router.push('/checkout');
  };

  const subtotal = product.price * quantity;
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-gray-500 hover:text-primary">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {product.stock <= 10 && product.stock > 0 && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded">
                Only {product.stock} left!
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <p className="text-xl text-gray-600 mb-6">
            {product.shortDescription}
          </p>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
              <span className="text-gray-500">per unit</span>
            </div>
            {shipping > 0 && (
              <p className="text-sm text-gray-600">
                + {formatCurrency(shipping)} shipping (Free shipping over {formatCurrency(FREE_SHIPPING_THRESHOLD)})
              </p>
            )}
            {shipping === 0 && subtotal >= FREE_SHIPPING_THRESHOLD && (
              <p className="text-sm text-secondary font-semibold">
                Free shipping on this order!
              </p>
            )}
          </div>

          {/* Product Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Game Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Players:</span>
                <span className="ml-2 font-medium">{product.details.players}</span>
              </div>
              <div>
                <span className="text-gray-600">Playtime:</span>
                <span className="ml-2 font-medium">{product.details.playtime}</span>
              </div>
              <div>
                <span className="text-gray-600">Age:</span>
                <span className="ml-2 font-medium">{product.details.age}</span>
              </div>
              <div>
                <span className="text-gray-600">In Stock:</span>
                <span className="ml-2 font-medium text-secondary">{product.stock} units</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-primary transition-colors font-semibold"
                disabled={quantity <= 1}
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                className="w-20 h-10 border-2 border-gray-300 rounded-lg text-center font-semibold"
                min="1"
                max={product.stock}
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:border-primary transition-colors font-semibold"
                disabled={quantity >= product.stock}
              >
                +
              </button>
              <span className="text-sm text-gray-600 ml-2">
                Subtotal: {formatCurrency(subtotal)}
              </span>
            </div>
          </div>

          {/* Order Summary */}
          {quantity > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal ({quantity} units):</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Shipping:</span>
                <span className="font-semibold">
                  {shipping > 0 ? formatCurrency(shipping) : 'FREE'}
                </span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={handleBuyNow}
              className="btn-primary w-full"
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
            <button
              onClick={handleAddToCart}
              className="btn-secondary w-full"
              disabled={product.stock === 0}
            >
              Add to Cart
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-around py-4 border-t border-b border-gray-200">
            <div className="text-center">
              <div className="text-2xl mb-1">🔒</div>
              <p className="text-xs text-gray-600">Secure Payment</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🚚</div>
              <p className="text-xs text-gray-600">Fast Shipping</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💯</div>
              <p className="text-xs text-gray-600">Quality Assured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Game</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
        </div>
      </div>

      {/* Components List */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What's in the Box?</h2>
        <ul className="grid md:grid-cols-2 gap-3">
          {product.details.components.map((component, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700">{component}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
