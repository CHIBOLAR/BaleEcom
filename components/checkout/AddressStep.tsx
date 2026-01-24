'use client';

import { useFormContext } from 'react-hook-form';
import AddressAutocomplete from './AddressAutocomplete';
import { AddressSuggestion } from '@/lib/geoapify';

interface AddressStepProps {
  onNext: () => void;
}

export default function AddressStep({ onNext }: AddressStepProps) {
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext();

  const addressValue = watch('address') || '';

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    // Auto-fill address fields from the selected suggestion
    setValue('address', suggestion.address_line1 || suggestion.formatted, { shouldValidate: true });

    if (suggestion.city) {
      setValue('city', suggestion.city, { shouldValidate: true });
    }
    if (suggestion.state) {
      setValue('state', suggestion.state, { shouldValidate: true });
    }
    if (suggestion.postcode) {
      setValue('pincode', suggestion.postcode, { shouldValidate: true });
    }
  };

  const handleContinue = async () => {
    // Validate all fields in Step 1
    const isValid = await trigger(['name', 'phone', 'email', 'address', 'apartment', 'city', 'state', 'pincode']);
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Information</h2>

      <div className="space-y-4">
        {/* Name & Phone (row) */}
        <div className="grid md:grid-cols-2 gap-4">
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
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Phone Number *
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
              <p className="text-red-500 text-sm mt-1">{errors.phone.message as string}</p>
            )}
          </div>
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
            <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>
          )}
        </div>

        {/* Address Autocomplete */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Street Address *
            <span className="font-normal text-gray-500 ml-1">(Start typing to search)</span>
          </label>
          <AddressAutocomplete
            value={addressValue}
            onChange={(value) => setValue('address', value, { shouldValidate: true })}
            onSelect={handleAddressSelect}
            error={errors.address?.message as string}
            placeholder="Start typing your address..."
          />
        </div>

        {/* Apartment/Floor/Landmark (optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Apartment, Floor, Landmark
            <span className="font-normal text-gray-500 ml-1">(Optional)</span>
          </label>
          <input
            type="text"
            {...register('apartment')}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            placeholder="Apt 4B, 2nd Floor, Near Metro Station"
          />
        </div>

        {/* City, State, Pincode (auto-filled, editable) */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              City *
            </label>
            <input
              type="text"
              {...register('city')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="City"
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              State *
            </label>
            <input
              type="text"
              {...register('state')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="State"
            />
            {errors.state && (
              <p className="text-red-500 text-sm mt-1">{errors.state.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Pincode *
            </label>
            <input
              type="text"
              {...register('pincode')}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary ${
                errors.pincode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Pincode"
              maxLength={6}
            />
            {errors.pincode && (
              <p className="text-red-500 text-sm mt-1">{errors.pincode.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleContinue}
          className="btn-primary w-full md:w-auto px-8"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
