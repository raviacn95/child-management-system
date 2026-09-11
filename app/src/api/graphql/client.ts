/** GraphQL is optional. Wire Apollo/URQL here when an endpoint exists. */
export async function graphqlRequest<T>(_query: string, _variables?: Record<string, unknown>): Promise<T> {
  throw new Error('GraphQL endpoint is not configured. Set VITE_GRAPHQL_URL to enable Apollo/URQL.')
}
