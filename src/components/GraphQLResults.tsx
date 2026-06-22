import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, CheckCircle2, XCircle, AlertTriangle, Unlock } from 'lucide-react';
import { GraphQLResult } from '@/services/graphQLService';
import ModuleCardWrapper from './ModuleCardWrapper';

interface Props { graphQL?: GraphQLResult; isTested: boolean; moduleError?: string }

const GraphQLResults = ({ graphQL, isTested, moduleError }: Props) => {
  if (!isTested) return null;
  const hasData = !!graphQL;

  const content = !graphQL ? (
    <CardContent className="space-y-4"><div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No GraphQL scan data available.</p></div></CardContent>
  ) : (
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Endpoints Found</p><p className="text-lg font-bold text-foreground">{graphQL.totalEndpoints}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Open</p><p className={`text-lg font-bold ${graphQL.openEndpoints > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{graphQL.openEndpoints}</p></div>
        <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Introspection</p><p>{graphQL.introspectionEnabled ? <Unlock className="h-5 w-5 text-red-500 inline" /> : <CheckCircle2 className="h-5 w-5 text-green-500 inline" />}</p></div>
      </div>
      {graphQL.introspectionEnabled && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> GraphQL introspection is enabled — full schema exposed!</p></div>}
      {graphQL.totalEndpoints === 0 && <div className="bg-muted rounded-lg p-4 text-center"><p className="text-sm text-muted-foreground">No GraphQL endpoints found on common paths.</p></div>}
      {graphQL.endpoints.map((ep, i) => (
        <div key={i} className={`bg-muted rounded-lg p-3 space-y-1 border-l-4 ${ep.introspectionOpen ? 'border-red-500' : ep.accessible ? 'border-yellow-500' : 'border-green-500'}`}>
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-foreground" />
            <p className="text-sm font-mono text-foreground flex-1">{ep.path}</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {ep.accessible && <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">Accessible</Badge>}
            {ep.introspectionOpen && <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">Introspection Open</Badge>}
          </div>
          {ep.queryType && <p className="text-xs text-muted-foreground">Query: {ep.queryType}{ep.mutationType ? ` | Mutation: ${ep.mutationType}` : ''}{ep.typeCount ? ` | ${ep.typeCount} types` : ''}</p>}
        </div>
      ))}
    </CardContent>
  );

  return (
    <ModuleCardWrapper title="GraphQL Introspection" icon={Network} iconColorClass={hasData && graphQL!.introspectionEnabled ? 'text-red-500' : 'text-muted-foreground'} moduleError={moduleError} hasData={hasData} noDataMessage="GraphQL scan was not performed or encountered an error.">
      {content}
    </ModuleCardWrapper>
  );
};

export default GraphQLResults;
