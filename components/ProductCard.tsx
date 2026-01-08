import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/product';
import { formatCurrency } from '@/lib/shipping';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product`} className="group">
      <div className="card hover:shadow-xl transition-shadow duration-300">
        {/* Product Image */}
        <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.stock <= 10 && product.stock > 0 && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              Only {product.stock} left!
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {product.shortDescription}
          </p>

          {/* Product Details */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <span>{product.details.players}</span>
            <span>•</span>
            <span>{product.details.playtime}</span>
            <span>•</span>
            <span>Ages {product.details.age}</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            <span className="text-sm text-gray-500">
              {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
