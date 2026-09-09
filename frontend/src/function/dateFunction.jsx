


  export const strDate = (convertedDate) => {
    const year = convertedDate.getFullYear();
    const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
    const day = String(convertedDate.getDate()).padStart(2, '0');

    return {
      year,
      month,
      day,
      str: `${year}-${month}-${day}`,
    };
  };

  export const isValidDateString = (value) => {
    if (typeof value !== 'string') {
      return false;
    }

    const match = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

    if (!match) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };