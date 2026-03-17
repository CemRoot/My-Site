/**
 * Shared date formatting utility for displaying dates
 * in a consistent en-GB short format across the app.
 *
 * Handles both "d/m/yyyy" (Supabase scraper output) and ISO strings.
 */
export function formatDate(dateString: string): string {
  try {
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return new Date(
        `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      ).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
