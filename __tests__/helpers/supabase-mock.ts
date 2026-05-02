import { vi, type Mock } from 'vitest'

/**
 * Mock Supabase client builder.
 * Tests can configure return values via the returned `mock` object.
 *
 * Usage:
 *   const { client, mock } = createSupabaseMock()
 *   mock.rpc.mockResolvedValueOnce({ data: null, error: null })
 *   vi.doMock('@/lib/supabase/server', () => ({ createClient: async () => client }))
 */

export type ChainableQuery = {
  select: Mock
  insert: Mock
  update: Mock
  delete: Mock
  upsert: Mock
  eq: Mock
  neq: Mock
  in: Mock
  is: Mock
  order: Mock
  limit: Mock
  gte: Mock
  lte: Mock
  gt: Mock
  lt: Mock
  like: Mock
  ilike: Mock
  match: Mock
  contains: Mock
  overlaps: Mock
  range: Mock
  returns: Mock
  or: Mock
  filter: Mock
  single: Mock
  maybeSingle: Mock
  then: Mock
}

function makeChain(result: { data: unknown; error: unknown } = { data: null, error: null }): ChainableQuery {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'gte', 'lte', 'gt', 'lt', 'like', 'ilike', 'match', 'contains', 'overlaps', 'range', 'returns', 'or', 'filter'] as const
  for (const m of methods) {
    chain[m] = vi.fn(() => chain as ChainableQuery)
  }
  chain.single = vi.fn(() => Promise.resolve(result) as never)
  chain.maybeSingle = vi.fn(() => Promise.resolve(result) as never)
  chain.then = vi.fn((onFulfilled: (v: typeof result) => unknown) => Promise.resolve(result).then(onFulfilled))
  return chain as ChainableQuery
}

export function createSupabaseMock() {
  const fromChain = makeChain()
  const storageBucket = {
    remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
    upload: vi.fn(() => Promise.resolve({ data: { path: 'test.png' }, error: null })),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test/img.png' } })),
  }

  const mock = {
    from: vi.fn(() => fromChain),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => storageBucket),
    },
    fromChain,
    storageBucket,
  }

  return {
    client: mock,
    mock,
    fromChain,
    storageBucket,
    /** Chain'in next call'ında belirli sonuç döndür (single, maybeSingle, then) */
    setNextQueryResult: (result: { data: unknown; error: unknown }) => {
      fromChain.single.mockResolvedValueOnce(result as never)
      fromChain.maybeSingle.mockResolvedValueOnce(result as never)
      fromChain.then.mockImplementationOnce((onFulfilled: (v: typeof result) => unknown) =>
        Promise.resolve(result).then(onFulfilled),
      )
    },
    setNextRpcResult: (result: { data: unknown; error: unknown }) => {
      mock.rpc.mockResolvedValueOnce(result as never)
    },
    /**
     * Multi-call query desteği — her terminal method için ayrı queue.
     *
     * Supabase chain'inin nasıl sonlandığına göre doğru queue'ya yerleştir:
     * - `.single()` veya `.maybeSingle()` → `single` queue
     * - `.eq()`, `.in()`, `.update().eq()` (terminal `await`) → `then` queue
     *
     * Örnek (addPayment'in 4 chain'i):
     *   queueResults({
     *     single: [insertResult, selectOrderResult],  // .insert().select().single() + .select().eq().single()
     *     then:   [selectPaymentsResult, updateResult],  // .select().eq() + .update().eq()
     *   })
     */
    queueResults: (queues: {
      single?: Array<{ data: unknown; error: unknown }>
      maybeSingle?: Array<{ data: unknown; error: unknown }>
      then?: Array<{ data: unknown; error: unknown }>
    }) => {
      for (const r of queues.single ?? []) {
        fromChain.single.mockResolvedValueOnce(r as never)
      }
      for (const r of queues.maybeSingle ?? []) {
        fromChain.maybeSingle.mockResolvedValueOnce(r as never)
      }
      for (const r of queues.then ?? []) {
        fromChain.then.mockImplementationOnce((onFulfilled: (v: typeof r) => unknown) =>
          Promise.resolve(r).then(onFulfilled),
        )
      }
    },
    /** Tüm mock state'i sıfırla — beforeEach içinde çağrılır */
    reset: () => {
      const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'gte', 'lte', 'gt', 'lt', 'like', 'ilike', 'match', 'contains', 'overlaps', 'range', 'returns', 'or', 'filter'] as const
      for (const m of methods) {
        const fn = (fromChain as Record<string, ReturnType<typeof vi.fn>>)[m]
        if (fn) {
          fn.mockReset()
          fn.mockImplementation(() => fromChain)
        }
      }
      fromChain.single.mockReset()
      fromChain.single.mockImplementation(() => Promise.resolve({ data: null, error: null }))
      fromChain.maybeSingle.mockReset()
      fromChain.maybeSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }))
      fromChain.then.mockReset()
      fromChain.then.mockImplementation((cb: (v: { data: null; error: null }) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(cb),
      )
      mock.rpc.mockReset()
      mock.rpc.mockImplementation(() => Promise.resolve({ data: null, error: null }))
      mock.from.mockReset()
      mock.from.mockImplementation(() => fromChain)
      mock.auth.getUser.mockReset()
      mock.auth.getUser.mockImplementation(() =>
        Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null }),
      )
    },
  }
}
