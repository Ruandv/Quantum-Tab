import { AzureBoardPayload, AzureBoardColumn, AzureWorkItem } from '@/types/common';

interface AzureDevOpsBoardColumnResponse {
  id: string;
  name: string;
  columnType: string;
  isSplit: boolean;
  order?: number;
  stateMappings?: Record<string, string>;
}

interface AzureDevOpsBoardResponse {
  id: string;
  name: string;
  columns: AzureDevOpsBoardColumnResponse[];
}

interface WiqlWorkItemReference {
  id: number;
}

interface WiqlResponse {
  workItems: WiqlWorkItemReference[];
}

interface WorkItemBatchValue {
  id: number;
  url: string;
  fields: Record<string, unknown>;
  _links?: {
    html?: {
      href: string;
    };
  };
}

interface WorkItemBatchResponse {
  value: WorkItemBatchValue[];
}

export class AzureDevOpsService {
  private static readonly BOARD_API_VERSION = '7.1';
  private static readonly WIQL_API_VERSION = '7.1';
  private static readonly WORKITEM_BATCH_API_VERSION = '7.1';
  private static readonly DEFAULT_MAX_ITEMS = 200;

  public static parseBoardIdentifier(boardUrl: string): string {
    if (!boardUrl) {
      throw new Error('Board URL is required');
    }

    const sanitized = boardUrl.split('?')[0].replace(/\/$/, '');
    const segments = sanitized.split('/');
    const identifier = decodeURIComponent(segments[segments.length - 1] || '').trim();

    if (!identifier) {
      throw new Error('Unable to parse board identifier from URL');
    }

    return identifier;
  }

  public static async fetchBoardData({
    patToken,
    organization,
    project,
    team,
    boardUrl,
    areaPath,
    iterationPath,
  }: {
    patToken: string;
    organization?: string;
    project?: string;
    team?: string;
    boardUrl: string;
    areaPath?: string;
    iterationPath?: string;
  }): Promise<AzureBoardPayload> {
    console.warn('RDV - Fetching Azure DevOps board data...');
    if (!patToken) {
      throw new Error('Azure DevOps PAT token is required');
    }

    const derivedContext = this.parseBoardContext(boardUrl);
    const resolvedOrganization = derivedContext.organization || this.normalizeSegment(organization);
    const resolvedProject = derivedContext.project || this.normalizeSegment(project);
    const resolvedTeam = derivedContext.team || this.normalizeSegment(team);

    if (!resolvedOrganization || !resolvedProject) {
      throw new Error(
        'Unable to determine Azure DevOps organization or project from the board URL. Please update the widget settings.'
      );
    }

    if (!resolvedTeam) {
      throw new Error(
        'Unable to determine the Azure DevOps team from the board URL. Please include it in the URL or widget settings.'
      );
    }

    const boardId = this.parseBoardIdentifier(boardUrl);
    const boardDefinition = await this.getBoardDefinition({
      patToken,
      organization: resolvedOrganization,
      project: resolvedProject,
      team: resolvedTeam,
      boardId,
    });

    const columns = this.mapColumns(boardDefinition.columns);
    const stateSet = this.collectStates(boardDefinition.columns);
    const workItemIds = await this.runWiqlQuery({
      patToken,
      organization: resolvedOrganization,
      project: resolvedProject,
      team: resolvedTeam,
      states: stateSet,
      areaPath,
      iterationPath,
    });

    if (workItemIds.length === 0) {
      return {
        boardId: boardDefinition.id,
        boardName: boardDefinition.name,
        columns,
        workItems: [],
        retrievedAt: new Date().toISOString(),
      };
    }

    const batchItems = await this.fetchWorkItemBatch({
      patToken,
      organization: resolvedOrganization,
      project: resolvedProject,
      ids: workItemIds,
    });

    const { workItems, columns: enrichedColumns } = this.mapWorkItemsToColumns(
      batchItems,
      boardDefinition.columns,
      columns
    );

    return {
      boardId: boardDefinition.id,
      boardName: boardDefinition.name,
      columns: enrichedColumns,
      workItems,
      retrievedAt: new Date().toISOString(),
    };
  }

  private static async getBoardDefinition({
    patToken,
    organization,
    project,
    team,
    boardId,
  }: {
    patToken: string;
    organization: string;
    project: string;
    team: string;
    boardId: string;
  }): Promise<AzureDevOpsBoardResponse> {
    const url = `${this.buildBaseUrl(organization, project, team)}/_apis/work/boards/${boardId}?api-version=${this.BOARD_API_VERSION}`;

    const response = await fetch(url, {
      headers: this.buildHeaders(patToken),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load board definition: ${errorText || response.statusText}`);
    }
    return (await response.json()) as AzureDevOpsBoardResponse;
  }

  private static mapColumns(columns: AzureDevOpsBoardColumnResponse[]): AzureBoardColumn[] {
    return columns
      .map((column, index) => ({
        id: column.id || column.name,
        name: column.name,
        columnType: column.columnType,
        isSplit: column.isSplit,
        order: typeof column.order === 'number' ? column.order : index,
      }))
      .sort((a, b) => a.order - b.order);
  }

  private static collectStates(columns: AzureDevOpsBoardColumnResponse[]): Set<string> {
    const states = new Set<string>();
    columns.forEach((column) => {
      Object.values(column.stateMappings || {}).forEach((state) => {
        if (state) {
          states.add(state);
        }
      });
    });
    return states;
  }

  private static async runWiqlQuery({
    patToken,
    organization,
    project,
    team,
    states,
    areaPath,
    iterationPath,
  }: {
    patToken: string;
    organization: string;
    project: string;
    team: string;
    states: Set<string>;
    areaPath?: string;
    iterationPath?: string;
  }): Promise<number[]> {
    const filters: string[] = [`[System.TeamProject] = '${this.escape(project)}'`];

    if (areaPath) {
      filters.push(`[System.AreaPath] = '${this.escape(areaPath)}'`);
    }

    if (iterationPath) {
      filters.push(`[System.IterationPath] UNDER '${this.escape(iterationPath)}'`);
    }

    if (states.size > 0) {
      const stateFilter = Array.from(states)
        .map((state) => `'${this.escape(state)}'`)
        .join(', ');
      filters.push(`[System.State] IN (${stateFilter})`);
    }

    filters.push(`NOT [System.WorkItemType] CONTAINS 'Feature'`);
    filters.push(`NOT [System.WorkItemType] CONTAINS 'Epic'`);
    filters.push(`[System.State] <> 'Removed'`);

    const whereClause = filters.join(' AND ');
    const selectFields = [
      '[System.Id]',
      '[System.WorkItemType]',
      '[System.Title]',
      '[System.AssignedTo]',
      '[System.State]',
      '[System.Tags]',
    ];
    const wiql = `SELECT
    ${selectFields.join(',\n    ')}
FROM WorkItems
WHERE ${whereClause}
ORDER BY [System.ChangedDate] DESC`;
    const workItemIds = await this.executeWiqlRequests({
      endpoints: this.buildWiqlEndpointUrls({ organization, project, team }),
      requestOptions: {
        method: 'POST',
        headers: this.buildHeaders(patToken),
        body: JSON.stringify({ query: wiql }),
      },
    });

    return workItemIds.slice(0, this.DEFAULT_MAX_ITEMS);
  }

  private static async fetchWorkItemBatch({
    patToken,
    organization,
    project,
    ids,
  }: {
    patToken: string;
    organization: string;
    project: string;
    ids: number[];
  }): Promise<WorkItemBatchValue[]> {
    const response = await fetch(
      `${this.buildProjectBaseUrl(organization, project)}/_apis/wit/workitemsbatch?api-version=${this.WORKITEM_BATCH_API_VERSION}`,
      {
        method: 'POST',
        headers: this.buildHeaders(patToken),
        body: JSON.stringify({
          ids,
          fields: [
            'System.Id',
            'System.Title',
            'System.State',
            'System.WorkItemType',
            'System.AssignedTo',
            'System.Tags',
            'System.AreaPath',
            'System.IterationPath',
            'System.BoardColumn',
            'System.ChangedDate',
            'Microsoft.VSTS.Common.Priority',
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load work items: ${errorText || response.statusText}`);
    }
    const data = (await response.json()) as WorkItemBatchResponse;
    return data.value || [];
  }

  private static mapWorkItemsToColumns(
    batchValues: WorkItemBatchValue[],
    sourceColumns: AzureDevOpsBoardColumnResponse[],
    mappedColumns: AzureBoardColumn[]
  ): { workItems: AzureWorkItem[]; columns: AzureBoardColumn[] } {
    const columnMap = new Map<string, AzureBoardColumn>(
      mappedColumns.map((col) => [col.id, { ...col }])
    );

    const workItems: AzureWorkItem[] = batchValues.map((item) => {
      const fields = item.fields || {};
      const workItemType = String(fields['System.WorkItemType'] || '');
      const state = String(fields['System.State'] || '');
      const resolvedColumn = this.resolveColumnForItem({
        sourceColumns,
        boardColumns: columnMap,
        workItemType,
        state,
        fallbackColumnName: String(fields['System.BoardColumn'] || ''),
      });

      return {
        id: item.id,
        title: String(fields['System.Title'] || 'Untitled Work Item'),
        state,
        workItemType,
        assignedTo: fields['System.AssignedTo']
          ? {
              displayName:
                (fields['System.AssignedTo'] as { displayName?: string }).displayName || '',
              uniqueName: (fields['System.AssignedTo'] as { uniqueName?: string }).uniqueName,
            }
          : undefined,
        tags: this.parseTags(String(fields['System.Tags'] || '')),
        boardColumn: resolvedColumn.name,
        boardColumnId: resolvedColumn.id,
        url: item._links?.html?.href || item.url,
        changedDate: fields['System.ChangedDate'] as string,
        priority: fields['Microsoft.VSTS.Common.Priority'] as number,
        areaPath: fields['System.AreaPath'] as string,
        iterationPath: fields['System.IterationPath'] as string,
        typeCategory: this.resolveTypeCategory(workItemType),
      };
    });

    return {
      workItems,
      columns: Array.from(columnMap.values()).sort((a, b) => a.order - b.order),
    };
  }

  private static resolveColumnForItem({
    sourceColumns,
    boardColumns,
    workItemType,
    state,
    fallbackColumnName,
  }: {
    sourceColumns: AzureDevOpsBoardColumnResponse[];
    boardColumns: Map<string, AzureBoardColumn>;
    workItemType: string;
    state: string;
    fallbackColumnName?: string;
  }): { id: string; name: string } {
    for (const column of sourceColumns) {
      const mapping = column.stateMappings || {};
      if (mapping[workItemType] === state) {
        const mappedId = column.id || column.name;
        if (!boardColumns.has(mappedId)) {
          boardColumns.set(mappedId, this.createBoardColumn(column, boardColumns.size));
        }
        return { id: mappedId, name: column.name };
      }
    }

    if (fallbackColumnName) {
      const existing = Array.from(boardColumns.values()).find(
        (col) => col.name.toLowerCase() === fallbackColumnName.toLowerCase()
      );
      if (existing) {
        return { id: existing.id, name: existing.name };
      }
    }

    if (!boardColumns.has('unmapped')) {
      boardColumns.set('unmapped', {
        id: 'unmapped',
        name: 'Unmapped',
        columnType: 'custom',
        isSplit: false,
        order: boardColumns.size + 100,
      });
    }

    return { id: 'unmapped', name: 'Unmapped' };
  }

  private static createBoardColumn(
    column: AzureDevOpsBoardColumnResponse,
    fallbackOrder: number
  ): AzureBoardColumn {
    return {
      id: column.id || column.name,
      name: column.name,
      columnType: column.columnType,
      isSplit: column.isSplit,
      order: typeof column.order === 'number' ? column.order : fallbackOrder,
    };
  }

  private static parseTags(rawTags: string): string[] {
    if (!rawTags) {
      return [];
    }
    return rawTags
      .split(';')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  private static resolveTypeCategory(workItemType: string): string {
    const normalized = workItemType.toLowerCase();
    if (normalized.includes('bug')) return 'bug';
    if (normalized.includes('security')) return 'security';
    if (normalized.includes('defect')) return 'defect';
    if (normalized.includes('backlog') || normalized.includes('product backlog')) return 'pbi';
    if (normalized.includes('non') && normalized.includes('functional')) return 'nonFunctional';
    return 'other';
  }

  private static buildHeaders(token: string): HeadersInit {
    // check if the token is already base64 encoded
    // if (/^[A-Za-z0-9+/=]+$/.test(token) && token.length % 4 === 0) {
    //   console.warn('Token appears to be already base64 encoded.', token);
    //   return {
    //     Authorization: `Basic ${token}`,
    //     'Content-Type': 'application/json',
    //   };
    // }
    console.warn('Encoding token to base64.', token);
    const encodedToken = btoa(`:${token}`);
    return {
      Authorization: `Basic ${encodedToken}`,
      'Content-Type': 'application/json',
    };
  }

  private static parseBoardContext(boardUrl: string): {
    organization?: string;
    project?: string;
    team?: string;
  } {
    if (!boardUrl?.trim()) {
      return {};
    }

    const candidateUrl = /^[a-z]+:\/\//i.test(boardUrl) ? boardUrl : `https://${boardUrl}`;

    try {
      const url = new URL(candidateUrl);
      const host = url.hostname.toLowerCase();
      const pathSegments = url.pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));

      let organization: string | undefined;
      let project: string | undefined;

      if (host.endsWith('.visualstudio.com')) {
        organization = host.replace('.visualstudio.com', '');
        project = pathSegments[0];
      } else if (pathSegments.length >= 2) {
        organization = pathSegments[0];
        project = pathSegments[1];
      } else if (pathSegments.length === 1) {
        organization = pathSegments[0];
      }

      if (project?.toLowerCase() === 'defaultcollection' && pathSegments.length >= 2) {
        project = pathSegments[1];
      }

      const params = new URLSearchParams(url.search);
      const queryTeam = params.get('team') || params.get('Team');
      const segmentTeam = this.extractTeamFromSegments(pathSegments);

      const team = segmentTeam || queryTeam || undefined;

      return {
        organization: this.normalizeSegment(organization),
        project: this.normalizeSegment(project),
        team: this.normalizeSegment(team),
      };
    } catch {
      return {};
    }
  }

  private static extractTeamFromSegments(segments: string[]): string | undefined {
    if (!segments.length) {
      return undefined;
    }

    const teamIndicatorIndex = segments.findIndex((segment) => segment.toLowerCase() === 't');
    if (teamIndicatorIndex !== -1 && segments[teamIndicatorIndex + 1]) {
      return segments[teamIndicatorIndex + 1];
    }

    const teamsSegmentIndex = segments.findIndex((segment) => segment.toLowerCase() === 'teams');
    if (teamsSegmentIndex !== -1 && segments[teamsSegmentIndex + 1]) {
      return segments[teamsSegmentIndex + 1];
    }

    return undefined;
  }

  private static normalizeSegment(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private static async executeWiqlRequests({
    endpoints,
    requestOptions,
  }: {
    endpoints: string[];
    requestOptions: RequestInit;
  }): Promise<number[]> {
    let lastError = 'Unknown error';
    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, requestOptions);
      if (response.ok) {
        const data = (await response.json()) as WiqlResponse;
        return (data.workItems || []).map((item) => item.id);
      }

      const errorText = await response.text();
      lastError = this.formatAzureErrorMessage(response.status, response.statusText, errorText);

      if (!this.shouldRetryWiql(response.status)) {
        break;
      }
    }

    throw new Error(`Failed to execute WIQL query: ${lastError}`);
  }

  private static buildBaseUrl(organization: string, project: string, team?: string): string {
    const segments = [organization, project, team]
      .filter((segment) => typeof segment === 'string' && segment.trim().length > 0)
      .map((segment) => encodeURIComponent(segment!.trim()));

    return `https://dev.azure.com/${segments.join('/')}`;
  }

  private static buildProjectBaseUrl(organization: string, project: string): string {
    return this.buildBaseUrl(organization, project);
  }

  private static escape(value: string): string {
    return value.replace(/'/g, "''");
  }

  private static buildWiqlEndpointUrls({
    organization,
    project,
    team,
  }: {
    organization: string;
    project: string;
    team?: string;
  }): string[] {
    const endpoints: string[] = [];
    const trimmedTeam = team?.trim();
    const apiVersionParam = `api-version=${this.WIQL_API_VERSION}`;
    const pathSuffix = '/_apis/wit/wiql';
    const projectBase = this.buildProjectBaseUrl(organization, project);

    if (trimmedTeam) {
      endpoints.push(
        `${this.buildBaseUrl(organization, project, trimmedTeam)}${pathSuffix}?${apiVersionParam}`
      );
    }

    endpoints.push(`${projectBase}${pathSuffix}?${apiVersionParam}`);

    if (trimmedTeam) {
      endpoints.push(
        `${projectBase}${pathSuffix}?team=${encodeURIComponent(trimmedTeam)}&${apiVersionParam}`
      );
    }

    return Array.from(new Set(endpoints));
  }

  private static shouldRetryWiql(status: number): boolean {
    return status === 404 || status === 400 || status === 405;
  }

  private static formatAzureErrorMessage(
    status: number,
    statusText: string,
    rawBody: string
  ): string {
    const base = `HTTP ${status}${statusText ? ` ${statusText}` : ''}`.trim();
    if (!rawBody) {
      return base;
    }

    const plain = rawBody
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plain) {
      return base;
    }

    return `${base} - ${plain.substring(0, 500)}`;
  }
}

export default AzureDevOpsService;
