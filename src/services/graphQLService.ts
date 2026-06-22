import { extractDomain } from './apiUtils';
import { RequestManager } from './requestManager';

const GRAPHQL_PATHS = [
  '/graphql', '/graphql/console', '/graphiql', '/graphql-explorer',
  '/api/graphql', '/api/v1/graphql', '/api/v2/graphql',
  '/api/graphiql', '/gql', '/api/gql', '/query',
  '/v1/graphql', '/v2/graphql', '/v3/graphql',
  '/graphql/schema', '/graphql/v1', '/graphql/v2',
  '/_graphql', '/__graphql',
];

const INTROSPECTION_QUERY = JSON.stringify({
  query: `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        types {
          name
          kind
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    }
  `,
});

export interface GraphQLEndpoint {
  path: string;
  accessible: boolean;
  introspectionOpen: boolean;
  queryType?: string;
  mutationType?: string;
  typeCount?: number;
}

export interface GraphQLResult {
  endpoints: GraphQLEndpoint[];
  totalEndpoints: number;
  openEndpoints: number;
  introspectionEnabled: boolean;
}

export const performGraphQLScan = async (target: string, requestManager: RequestManager): Promise<GraphQLResult> => {
  const domain = extractDomain(target);
  console.log(`[GraphQL] Starting for ${domain}`);

  const baseUrl = target.startsWith('http') ? target : `https://${target}`;
  const endpoints: GraphQLEndpoint[] = [];
  let introspectionEnabled = false;

  for (const path of GRAPHQL_PATHS.slice(0, 10)) {
    const url = `${baseUrl}${path}`;
    try {
      const response = await requestManager.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: INTROSPECTION_QUERY,
        timeout: 10000,
      });

      if (response.status === 200) {
        const data = await response.json();

        const ep: GraphQLEndpoint = {
          path,
          accessible: true,
          introspectionOpen: false,
        };

        if (data?.data?.__schema) {
          ep.introspectionOpen = true;
          introspectionEnabled = true;
          ep.queryType = data.data.__schema.queryType?.name;
          ep.mutationType = data.data.__schema.mutationType?.name;
          ep.typeCount = data.data.__schema.types?.length;
        }

        endpoints.push(ep);
      }
    } catch {
      // Also try GET request for graphiql
      if (path.includes('graphiql') || path.includes('explorer')) {
        try {
          const getResponse = await requestManager.fetch(url, { method: 'GET', timeout: 5000 });
          if (getResponse.status === 200) {
            const text = await getResponse.text();
            if (text.includes('graphiql') || text.includes('GraphQL') || text.includes('Playground')) {
              endpoints.push({
                path,
                accessible: true,
                introspectionOpen: false,
              });
            }
          }
        } catch { /* ignore */ }
      }
    }
  }

  return {
    endpoints,
    totalEndpoints: endpoints.length,
    openEndpoints: endpoints.filter(e => e.introspectionOpen || e.accessible).length,
    introspectionEnabled,
  };
};
