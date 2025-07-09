/**
 * Tiny in-memory stub that mimics the chained Drizzle/Prisma API used
 * by the Notes page:  db.select().from(notes).where(...)
 *
 * It simply resolves to an empty array so the page renders.
 */
type WhereFn<T> = (condition: unknown) => Promise<T[]>

interface QueryBuilder<T = any> {
  select(): QueryBuilder<T>
  from(table: unknown): QueryBuilder<T>
  where: WhereFn<T>
}

// Mock database for development
export const db = {
  select: () => ({
    from: () => ({
      where: () => Promise.resolve([]),
    }),
  }),
}
