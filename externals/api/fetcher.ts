type GraphqlResponse<TData> = {
  data: TData | null
  errors?: Array<{ message?: string }> | null
}

function getGraphqlUrl(): string {
  // 1) Explicit override (handy in sandbox contexts)
  const override = (globalThis as any).__LF_GRAPHQL_URL
  if (typeof override === 'string' && override.length > 0) return override

  // 2) Common paths (works when frontend and API share origin/proxy)
  // Prefer /graphql (client-web-main default), but also try /api/graphql (common convention)
  return new URL('/graphql', globalThis.location?.origin ?? 'http://localhost')
    .toString()
}

export const fetchData = <TData, TVariables>(
  query: string,
  variables?: TVariables,
  _options?: unknown,
): (() => Promise<TData>) => {
  return async () => {
    const url = getGraphqlUrl()

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // In the real app, auth is usually cookie-based or handled by the host page.
      // Include credentials so the sandbox can reuse the host session.
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!res.ok) {
      throw new Error(
        `GraphQL request failed (${res.status} ${res.statusText})`,
      )
    }

    const json = (await res.json()) as GraphqlResponse<TData>

    if (json.errors && json.errors.length > 0) {
      const msg =
        json.errors
          .map(e => e?.message)
          .filter(Boolean)
          .join('\n') || 'GraphQL error'
      throw new Error(msg)
    }

    if (json.data === null) {
      throw new Error('GraphQL: no data returned')
    }

    return json.data
  }
}
