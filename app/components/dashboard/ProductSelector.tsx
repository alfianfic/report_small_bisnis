// app/components/dashboard/ProductSelector.tsx

'use client';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface ProductSelectorProps {
  products: Product[];
  activeProductId: string;
  onProductChange: (productId: string) => void;
}

export default function ProductSelector({
  products,
  activeProductId,
  onProductChange,
}: ProductSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onProductChange(product.id)}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${activeProductId === product.id
              ? 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }
          `}
        >
          {product.name}
        </button>
      ))}
    </div>
  );
}