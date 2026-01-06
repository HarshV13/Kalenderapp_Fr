'use client';

interface Service {
    id: string;
    name: string;
    description: string;
}

interface ServiceSelectorProps {
    services: Service[];
    selectedServices: string[];
    onToggle: (serviceId: string) => void;
    disabled?: boolean;
}

export default function ServiceSelector({
    services,
    selectedServices,
    onToggle,
    disabled,
}: ServiceSelectorProps) {
    return (
        <div className="space-y-2">
            {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);

                return (
                    <button
                        key={service.id}
                        type="button"
                        onClick={() => !disabled && onToggle(service.id)}
                        disabled={disabled}
                        className={`service-item w-full text-left ${isSelected ? 'selected' : ''}`}
                    >
                        <div className="service-checkbox flex-shrink-0">
                            {isSelected && (
                                <svg
                                    className="w-4 h-4"
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
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800">{service.name}</p>
                            <p className="text-sm text-gray-500 truncate">{service.description}</p>
                        </div>
                    </button>
                );
            })}

            {services.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                    Leistungen werden geladen...
                </div>
            )}
        </div>
    );
}
