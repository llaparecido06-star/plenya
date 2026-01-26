/**
 * Date utilities to handle timezone-safe date conversions
 * Prevents the "off-by-one" bug when saving dates to the database
 */

/**
 * Converts a Date object to a local date string in YYYY-MM-DD format
 * This prevents timezone conversion issues where selecting "Day 20" 
 * could be saved as "Day 19" due to UTC conversion
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a date string (YYYY-MM-DD) into a Date object in local timezone
 * Avoids the common issue where new Date('2024-01-20') creates a UTC date
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};
