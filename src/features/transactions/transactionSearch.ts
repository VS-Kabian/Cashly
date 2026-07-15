const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const sanitizeTransactionSearchTerm = (value: string) => value
  .normalize('NFKC')
  .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim();

export const buildSafeTransactionSearchExpression = (searchTerm: string, categoryIds: string[]) => {
  const safeSearchTerm = sanitizeTransactionSearchTerm(searchTerm);
  if (!safeSearchTerm) return null;

  const conditions = [`description.ilike.%${safeSearchTerm}%`];
  const safeCategoryIds = categoryIds.filter((id) => UUID_PATTERN.test(id));

  if (safeCategoryIds.length > 0) {
    conditions.push(`category_id.in.(${safeCategoryIds.join(',')})`);
  }

  return conditions.join(',');
};
