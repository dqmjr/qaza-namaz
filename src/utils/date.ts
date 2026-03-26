import dayjs from 'dayjs';

export function todayYmd(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function isValidTimeHHmm(input: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(input.trim());
}

