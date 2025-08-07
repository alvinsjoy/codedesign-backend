import { Activity } from "../data/mockData.js";

export function filterActivitiesByDateRange(
  activities: Activity[],
  startDate?: string,
  endDate?: string
): Activity[] {
  if (!startDate && !endDate) {
    return activities;
  }

  return activities.filter((activity) => {
    const activityDate = activity.date;

    if (startDate && activityDate < startDate) {
      return false;
    }

    if (endDate && activityDate > endDate) {
      return false;
    }

    return true;
  });
}

export function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
