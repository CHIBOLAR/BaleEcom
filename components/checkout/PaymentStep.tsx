'use client';

interface PaymentStepProps {
  paymentMethod: 'prepaid' | 'cod';
  onPaymentMethodChange: (method: 'prepaid' | 'cod') => void;
  onBack: () => void;
  onNext: () => void;
}

export default function PaymentStep({
  paymentMethod,
  onPaymentMethodChange,
  onBack,
  onNext,
}: PaymentStepProps) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

      <div className="space-y-3">
        {/* Prepaid Option */}
        <label
          className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            paymentMethod === 'prepaid'
              ? 'border-primary bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="prepaid"
            checked={paymentMethod === 'prepaid'}
            onChange={() => onPaymentMethodChange('prepaid')}
            className="mt-1 w-5 h-5 text-primary focus:ring-primary"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Pay Online</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Recommended
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              UPI, Credit/Debit Card, Net Banking, or Wallets via PhonePe
            </p>
          </div>
        </label>

        {/* COD Option */}
        <label
          className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            paymentMethod === 'cod'
              ? 'border-primary bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={() => onPaymentMethodChange('cod')}
            className="mt-1 w-5 h-5 text-primary focus:ring-primary"
          />
          <div className="flex-1">
            <span className="font-semibold text-gray-900">Cash on Delivery</span>
            <p className="text-sm text-gray-600 mt-1">
              Pay when your order is delivered
            </p>
          </div>
        </label>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary px-8 order-2 sm:order-1"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary px-8 order-1 sm:order-2"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}
