'use client';

interface CheckoutStepsProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
}

const steps = [
  { number: 1, label: 'Address' },
  { number: 2, label: 'Payment' },
  { number: 3, label: 'Review' },
] as const;

export default function CheckoutSteps({ currentStep, onStepClick }: CheckoutStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = isCompleted;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                  transition-all duration-200
                  ${isCompleted
                    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                    : isCurrent
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'hover:scale-105' : 'cursor-default'}
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </button>

              {/* Step label */}
              <span
                className={`
                  ml-2 font-medium text-sm hidden sm:inline
                  ${isCompleted
                    ? 'text-green-600'
                    : isCurrent
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }
                `}
              >
                {step.label}
              </span>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-12 sm:w-20 h-1 mx-3 rounded
                    ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
