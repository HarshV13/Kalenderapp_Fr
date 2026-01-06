// Core application configuration
export const CONFIG = {
  // Booking window
  BOOKING_WINDOW_DAYS: 21, // 3 weeks

  // Appointment duration (in minutes)
  // Standard: 4 slots = 60 min (12:30 booked → 13:30 free)
  // Extended: 5 slots = 75 min (12:30 booked → 13:45 free)
  DEFAULT_DURATION_MINUTES: 60,  // 4 slots × 15 min
  EXTENDED_DURATION_MINUTES: 75, // 5 slots × 15 min (when more than 3 services)
  BUFFER_MINUTES: 0, // Buffer now included in duration
  SERVICE_THRESHOLD: 3, // Above this count, use extended duration

  // Slot configuration
  SLOT_INTERVAL_MINUTES: 15,

  // Timezone
  TIMEZONE: 'Europe/Berlin',

  // Opening hours (0 = Sunday, 1 = Monday, etc.)
  OPENING_HOURS: {
    0: null, // Sonntag - geschlossen
    1: { start: '09:00', end: '18:00' }, // Montag
    2: { start: '09:00', end: '18:00' }, // Dienstag
    3: { start: '09:00', end: '18:00' }, // Mittwoch
    4: { start: '09:00', end: '18:00' }, // Donnerstag
    5: { start: '09:00', end: '18:00' }, // Freitag
    6: { start: '09:00', end: '14:00' }, // Samstag
  } as Record<number, { start: string; end: string } | null>,

  // Available services
  SERVICES: [
    { id: 'haircut', name: 'Haarschnitt', description: 'Klassischer Herrenhaarschnitt' },
    { id: 'beard', name: 'Bart trimmen', description: 'Bart in Form bringen' },
    { id: 'beard-shave', name: 'Rasur', description: 'Nassrasur mit heißem Tuch' },
    { id: 'wash', name: 'Haare waschen', description: 'Waschen mit Massage' },
    { id: 'styling', name: 'Styling', description: 'Haare stylen mit Produkt' },
    { id: 'color', name: 'Färben', description: 'Haare oder Bart färben' },
    { id: 'eyebrows', name: 'Augenbrauen', description: 'Augenbrauen in Form' },
    { id: 'kids', name: 'Kinderhaarschnitt', description: 'Für Kinder bis 12 Jahre' },
  ],
} as const;

// Type for opening hours
export type OpeningHours = typeof CONFIG.OPENING_HOURS;

// Type for services
export type Service = typeof CONFIG.SERVICES[number];
