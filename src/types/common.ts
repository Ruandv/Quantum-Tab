// Centralized type definitions for the entire application

// Define the keys that should be optional in defaultProps
type OptionalKeys = 'buttons' | 'isLocked' | 'widgetId' | 'onBackgroundChange' | 'onButtonsChange' | 'onLocaleChange' | 'metaData';

// Utility type to make all properties required except for specific optional ones
// but still allow the optional properties to be provided in defaultProps
type RequiredProps<T> = Required<Omit<T, OptionalKeys & keyof T>> & Partial<Pick<T, OptionalKeys & keyof T>>;

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}
export interface CssStyle {
  border: number;
  radius: number;
  blur: number;
  backgroundColorRed: number;
  backgroundColorGreen: number;
  backgroundColorBlue: number;
  transparency: number;
  textColorRed: number;
  textColorGreen: number;
  textColorBlue: number;
  alignment: 'flex-start' | 'center' | 'flex-end';
  justify: 'flex-start' | 'center' | 'flex-end' | 'space-around' | 'space-between';
}
export interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  wikiPage: string;
  allowMultiples: boolean;
  isDepricated?: boolean; // Made optional for backward compatibility
  isRuntimeVisible?: boolean; // Made optional for backward compatibility
  component: React.ComponentType<Record<string, unknown>>;
  props?: Record<string, unknown>;
  dimensions: Dimensions;
  position: Position;
  style: CssStyle;
  metaData?: Record<string, unknown>;
}

export interface WidgetType<T = Record<string, unknown>> {
  id: string;
  name: string;
  wikiPage: string;
  allowMultiples: boolean;
  isRuntimeVisible: boolean;
  isDepricated?: boolean; // Made optional for backward compatibility
  description: string;
  component: React.ComponentType<T>;
  defaultDimensions: Dimensions;
  defaultProps: RequiredProps<T>;
  metaData?: { lastRefresh: Date, backgroundImage: string },
  group: string;
}

interface DefaultWidgetProps {
  isLocked: boolean;
  widgetId?: string; // Optional widget ID for event handling
  widgetHeading?: string; // Optional widget heading
}

export interface SavedData {
  widgets: DashboardWidget[];
  backgroundImage: string;
  isLocked: boolean;
  timestamp: number;
}

export interface StorageInfo {
  widgetsSize: number;
  backgroundSize: number;
  lockStateSize: number;
  totalSize: number;
}

// Component-specific interfaces
export interface LiveClockProps extends DefaultWidgetProps {
  timeZone: string;
  dateFormat?: string; // Optional date format prop
  timeFormat?: string; // Optional time format prop
  showTime?: boolean;
  showDate?: boolean;
  showTimeZone?: boolean;
}

export interface QuickActionButtonsProps extends DefaultWidgetProps {
  buttons?: ActionButton[];
  onButtonsChange?: (buttons: ActionButton[]) => void;
}

export interface ActionButton {
  icon: string;
  label: string;
  url: string;
}

export interface QuickActionButtonItemProps {
  button: ActionButton;
  index: number;
  isLocked: boolean;
  onButtonClick: (url: string) => void;
  onRemoveButton: (index: number) => void;
}

export interface GitHubIssuesProps extends DefaultWidgetProps {
}


interface GitHubWidgetBaseProps extends DefaultWidgetProps {
  patToken: string;
  repositoryUrl: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

export interface GitHubGuruProps extends GitHubWidgetBaseProps {
}

export interface WebsiteCounterProps extends DefaultWidgetProps {
  websites?: WebsiteCounterData[];
  showFavicons?: boolean;
  maxWebsites?: number;
  sortBy?: 'count' | 'name' | 'lastVisited' | 'recent';
}

export interface WebsiteCounterData {
  url: string;
  hostname: string;
  count: number;
  lastVisited: number;
  favicon?: string;
}

export interface LocaleWidgetProps extends DefaultWidgetProps {
  selectedLocale?: string;
  onLocaleChange?: (locale: string) => void;
}

export interface BackgroundManagerProps extends DefaultWidgetProps {
  isAIEnabled: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  backgroundSize: 'cover' | 'contain' | 'auto';
  onBackgroundChange?: (imageUrl: string) => void;
}

export interface QuarterIndicatorProps extends DefaultWidgetProps {
  startDate: string; // Format: YYYY-MM-DD
}
export interface SprintNumberProps extends DefaultWidgetProps {
  startDate: string; // Format: YYYY-MM-DD
  numberOfDays: number;
  currentSprint: number;
}

export interface ResizableWidgetProps {
  id: string;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (dimensions: Dimensions) => void;
  isResizable?: boolean;
}

export interface DashboardProps {
  widgets: DashboardWidget[];
  isLocked?: boolean;
  onRemoveWidget?: (widgetId: string) => void;
  onWidgetResize?: (widgetId: string, dimensions: Dimensions) => void;
  onWidgetMove?: (widgetId: string, position: Position) => void;
  onBackgroundChange?: (imageUrl: string) => void;
  onUpdateWidgetProps?: (widgetId: string, newProps: Record<string, unknown>) => void;
}

export interface WidgetManagerProps extends DefaultWidgetProps {
  onAddWidget: (widget: DashboardWidget) => void;
  existingWidgets: DashboardWidget[];
  onBackgroundChange?: (imageUrl: string) => void;
}

// Drag state interface
export interface DragState {
  isDragging: boolean;
  draggedWidgetId: string | null;
  startPos: Position;
  startWidgetPos: Position;
}

// Resize direction type
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

// Constants
export const STORAGE_KEYS = {
  WIDGETS: 'quantum-tab-widgets',
  LOCK_STATE: 'quantum-tab-lock-state',
  VERSION: 'quantum-tab-version',
  DEFAULT_STYLING: 'quantum-tab-default-styling',
  DEFAULT_POSITION: 'quantum-tab-default-position',
  DEFAULT_DIMENSIONS: 'quantum-tab-default-dimensions',
} as const;

export const DEFAULT_WIDGET_CONSTRAINTS = {
  MIN_WIDTH: 150,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 200,
} as const;

export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
} as const;

// GitHub API Types (based on GitHub REST API v2022-11-28)
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  due_on: string | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  default_branch: string;
}

export interface GitHubPullRequestHead {
  label: string;
  ref: string;
  sha: string;
  user: GitHubUser;
  repo: GitHubRepository;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string | null;
  user: GitHubUser;
  labels: GitHubLabel[];
  milestone: GitHubMilestone | null;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  head: GitHubPullRequestHead;
  base: GitHubPullRequestHead;
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
  merged_by: GitHubUser | null;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  diff_url: string;
  patch_url: string;
}

// GitHub Review interfaces
export interface GitHubReview {
  id: number;
  node_id: string;
  user: GitHubUser;
  body: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  html_url: string;
  pull_request_url: string;
  commit_id: string;
  submitted_at: string | null;
  author_association: string;
}

export interface GitHubPullRequestWithReviews extends GitHubPullRequest {
  reviews?: GitHubReview[];
  approvalCount?: number;
  hasNewActivity?: boolean;
}

export interface GitHubApiError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

export interface GitHubPullRequestsParams {
  state?: 'open' | 'closed' | 'all';
  head?: string;
  base?: string;
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  author?: string;
}

export interface GitHubApiRequest {
  action: 'fetchPullRequests' | 'fetchUserPullRequests';
  data: {
    patToken: string;
    repositoryUrl: string;
  };
}

export interface GitHubApiResponse {
  action: 'fetchPullRequests' | 'fetchUserPullRequests';
  success: boolean;
  data?: GitHubPullRequestWithReviews[];
  error?: string;
}

// Background message types
export type BackgroundMessage = GitHubApiRequest;
export type BackgroundResponse = GitHubApiResponse;

/**
 * Type guard to check if a value is an InternalString
 * Since InternalString is a branded type, we check for the brand property
 * @param value - Value to check
 * @returns True if value is an InternalString
 */
export const isSecureProperty = (key: string): boolean => {
  const secureProps = [
    'token',
    'password',
    'secret',
    'key',
    'credential',
    'auth',
    'api',
    'key',
    'pat', // Personal Access Token
    'aikey',
    'bearer',
    'patToken']; // Add other secure property names here
  return secureProps.map(prop => prop.toLowerCase()).includes(key.toLowerCase());
};

// Settings Widget Types
export interface PATToken {
  name: string;
  key: string;
}

export interface ProviderSettings {
  name: string;
  providerType: string;
  providerSettings: {
    url: string;
    apiKey: string;
  };
}

export interface SettingsWidgetMetaData {
  lastRefresh: Date;
  patTokens?: PATToken[];
  providerSettings?: ProviderSettings[];
}

export interface SettingsWidgetProps extends DefaultWidgetProps {

}
