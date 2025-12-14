export const formatOpenStatus = (hours: any): string => {
  if (!hours || hours.unavailable || !hours.weekdayText?.length) {
    return 'Hours not listed';
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentTime = now.getHours() * 100 + now.getMinutes();

  // Get today's periods
  const todayPeriods = (hours.periods || []).filter((p: any) => p.open?.day === currentDay);

  // Check if currently open
  for (const period of todayPeriods) {
    const openTime = parseInt(period.open?.time || '0000');
    const closeTime = period.close ? parseInt(period.close.time || '2359') : null;

    if (closeTime && currentTime >= openTime && currentTime < closeTime) {
      return `Open · Closes ${formatTime(period.close?.time)}`;
    }
    // Handle 24-hour places (no close time)
    if (!closeTime && currentTime >= openTime) {
      return 'Open 24 hours';
    }
  }

  // Find next opening
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    const dayPeriods = (hours.periods || []).filter((p: any) => p.open?.day === checkDay);

    if (dayPeriods.length > 0) {
      const nextPeriod = dayPeriods[0];
      const openTime = parseInt(nextPeriod.open?.time || '0000');

      if (i === 0 && openTime > currentTime) {
        return `Closed · Opens ${formatTime(nextPeriod.open?.time)}`;
      } else if (i > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `Closed · Opens ${days[checkDay]} ${formatTime(nextPeriod.open?.time)}`;
      }
    }
  }

  return 'Closed';
};

const formatTime = (time: string): string => {
  if (!time) return '';
  const hours = parseInt(time.slice(0, 2));
  const minutes = time.slice(2);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return minutes === '00' ? `${hour12} ${ampm}` : `${hour12}:${minutes} ${ampm}`;
};

// Simple Open/Closed status for the header stat box
export const getSimpleOpenStatus = (hours: any): { isOpen: boolean; text: string } => {
  if (!hours || hours.unavailable || !hours.periods?.length) {
    return { isOpen: false, text: 'Hours Not Listed' };
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentTime = now.getHours() * 100 + now.getMinutes();

  // Check if currently open
  const todayPeriods = hours.periods.filter((p: any) => p.open?.day === currentDay);

  for (const period of todayPeriods) {
    const openTime = parseInt(period.open?.time || '0000');
    const closeTime = period.close ? parseInt(period.close.time || '2359') : null;

    // Handle 24-hour places (no close time)
    if (!closeTime && currentTime >= openTime) {
      return { isOpen: true, text: 'Open' };
    }

    // Handle overnight hours (close time is next day)
    if (closeTime && closeTime < openTime) {
      if (currentTime >= openTime || currentTime < closeTime) {
        return { isOpen: true, text: 'Open' };
      }
    } else if (closeTime) {
      if (currentTime >= openTime && currentTime < closeTime) {
        return { isOpen: true, text: 'Open' };
      }
    }
  }

  return { isOpen: false, text: 'Closed' };
};
