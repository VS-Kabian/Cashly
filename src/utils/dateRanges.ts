export interface LocalMonthRange {
  start: Date;
  endExclusive: Date;
}

const pad = (value: number) => value.toString().padStart(2, '0');

export const toLocalDateKey = (value: Date): string => {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

export const getLocalMonthRange = (year: number, monthIndex: number): LocalMonthRange => {
  return {
    start: new Date(year, monthIndex, 1),
    endExclusive: new Date(year, monthIndex + 1, 1),
  };
};
