'use client';

interface StepperProps {
    currentStep: number;
    totalSteps: number;
}

const stepLabels = ['Datum', 'Uhrzeit', 'Daten'];

export default function Stepper({ currentStep, totalSteps }: StepperProps) {
    return (
        <div className="stepper">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                    {/* Step circle */}
                    <div
                        className={`stepper-step ${stepNumber === currentStep
                                ? 'active'
                                : stepNumber < currentStep
                                    ? 'completed'
                                    : 'pending'
                            }`}
                    >
                        {stepNumber < currentStep ? (
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            stepNumber
                        )}
                    </div>

                    {/* Step label (visible on larger screens) */}
                    <span
                        className={`hidden sm:inline ml-2 text-sm font-medium ${stepNumber === currentStep
                                ? 'text-[var(--secondary)]'
                                : stepNumber < currentStep
                                    ? 'text-[var(--success)]'
                                    : 'text-gray-400'
                            }`}
                    >
                        {stepLabels[stepNumber - 1]}
                    </span>

                    {/* Connector line */}
                    {stepNumber < totalSteps && (
                        <div
                            className={`stepper-line mx-2 ${stepNumber < currentStep ? 'completed' : ''
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
