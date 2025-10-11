// CSV utility for RFC 4180 compliant exports

export type TransactionCsvInput = {
  id?: string;
  user_id?: string;
  amount?: number | string | null;
  type?: string;
  category_id?: string | null;
  description?: string | null;
  payment_method?: string | null;
  transaction_date?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  categories?: { name?: string | null; color?: string | null } | null;
};

export const CSV_HEADER = 'id,user_id,amount,type,category_id,description,payment_method,transaction_date,created_at,updated_at,category_name,category_color\r\n';

export function toIso8601Z(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function toTwoDecimals(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n as number)) return '';
  return Number(n).toFixed(2);
}

export function escapeCsv(field: string | null | undefined): string {
  const s = field == null ? '' : String(field);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function transactionToCsvRow(t: TransactionCsvInput): string {
  const cols = [
    t.id ?? '',
    t.user_id ?? '',
    toTwoDecimals(t.amount ?? null),
    t.type ?? '',
    t.category_id ?? '',
    t.description ?? '',
    t.payment_method ?? '',
    toIso8601Z(t.transaction_date ?? null),
    toIso8601Z(t.created_at ?? null),
    toIso8601Z(t.updated_at ?? null),
    t.categories?.name ?? '',
    t.categories?.color ?? '',
  ];
  return cols.map((c) => escapeCsv(c)).join(',') + '\r\n';
}

export function buildCsv(transactions: TransactionCsvInput[]): string {
  let out = CSV_HEADER;
  for (const t of transactions) out += transactionToCsvRow(t);
  return out;
}


