export function formatDate(
  dateString: string | null | undefined | Date
): string {
  if (!dateString) {
    return "N/A";
  }

  // Handle Date objects
  if (dateString instanceof Date) {
    if (isNaN(dateString.getTime())) {
      return "Invalid Date";
    }
    return dateString.toLocaleString();
  }

  // Handle string dates
  if (typeof dateString === "string") {
    // Trim whitespace
    const trimmed = dateString.trim();

    if (!trimmed) {
      return "N/A";
    }

    // Try parsing as ISO string first
    let date = new Date(trimmed);

    // If that fails, try other common formats
    if (isNaN(date.getTime())) {
      // Try parsing as timestamp
      const timestamp = Number(trimmed);
      if (!isNaN(timestamp) && timestamp > 0) {
        date = new Date(timestamp);
      }
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString();
  }

  return "N/A";
}

export function formatDateShort(
  dateString: string | null | undefined | Date
): string {
  if (!dateString) {
    return "N/A";
  }

  // Handle Date objects
  if (dateString instanceof Date) {
    if (isNaN(dateString.getTime())) {
      return "Invalid Date";
    }
    return dateString.toLocaleDateString();
  }

  // Handle string dates
  if (typeof dateString === "string") {
    const trimmed = dateString.trim();

    if (!trimmed) {
      return "N/A";
    }

    let date = new Date(trimmed);

    if (isNaN(date.getTime())) {
      const timestamp = Number(trimmed);
      if (!isNaN(timestamp) && timestamp > 0) {
        date = new Date(timestamp);
      }
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString();
  }

  return "N/A";
}

export function formatTime(
  dateString: string | null | undefined | Date
): string {
  if (!dateString) {
    return "N/A";
  }

  let date: Date;

  // Handle Date objects
  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === "string") {
    const trimmed = dateString.trim();
    if (!trimmed) {
      return "N/A";
    }
    date = new Date(trimmed);
  } else {
    return "N/A";
  }

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return date.toLocaleTimeString();
}
