// Centralized type definitions for the entire application

// Utility type to make all properties required except className, callback functions, and widgetId
type RequiredProps<T> = Required<Omit<T, 'className' | 'isLocked' | 'widgetId' | 'onBackgroundChange' | 'onButtonsChange' | 'onLocaleChange'>>;

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface DashboardWidget {
  id: string;
  allowMultiples:boolean;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  dimensions: Dimensions;
  position: Position;
}

export interface WidgetType<T = any> {
  id: string;
  name: string;
  allowMultiples:boolean;
  description: string;
  component: React.ComponentType<T>;
  defaultDimensions: Dimensions;
  defaultProps: RequiredProps<T>;
}
interface DefaultWidgetProps{
    isLocked: boolean;
    widgetId?: string; // Optional widget ID for event handling
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
  className?: string;
  timeZone: string;
  dateFormat?: string; // Optional date format prop
  timeFormat?: string; // Optional time format prop
  showTime?: boolean;
  showDate?: boolean;
  showTimeZone?: boolean;
}

export interface QuickActionButtonsProps extends DefaultWidgetProps {
  className?: string;
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

export interface GitHubWidgetProps extends DefaultWidgetProps {
  className?: string;
  patToken?: string;
  repositoryUrl?: string;
}

export interface BackgroundManagerProps extends DefaultWidgetProps {
  className?: string;
  onBackgroundChange?: (imageUrl: string) => void;
}

export interface WebsiteCounterData {
  url: string;
  hostname: string;
  count: number;
  lastVisited: number; // timestamp
  favicon?: string;
}

export interface WebsiteCounterProps extends DefaultWidgetProps {
  className?: string;
  websites?: WebsiteCounterData[];
  showFavicons?: boolean;
  maxWebsites?: number;
  sortBy?: 'count' | 'name' | 'recent';
}

export interface LocaleWidgetProps extends DefaultWidgetProps {
  className?: string;
  selectedLocale?: string;
  onLocaleChange?: (locale: string) => void;
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
  className?: string;
}

export interface DashboardProps {
  widgets: DashboardWidget[];
  className?: string;
  isLocked?: boolean;
  onRemoveWidget?: (widgetId: string) => void;
  onWidgetResize?: (widgetId: string, dimensions: Dimensions) => void;
  onWidgetMove?: (widgetId: string, position: Position) => void;
  onBackgroundChange?: (imageUrl: string) => void;
  onUpdateWidgetProps?: (widgetId: string, newProps: any) => void;
}

export interface WidgetManagerProps extends DefaultWidgetProps {
  onAddWidget: (widget: DashboardWidget) => void;
  onRemoveWidget: (widgetId: string) => void;
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
  BACKGROUND: 'quantum-tab-background',
  LOCK_STATE: 'quantum-tab-lock-state'
} as const;

export const DEFAULT_WIDGET_CONSTRAINTS = {
  MIN_WIDTH: 150,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 200
} as const;

export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
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
}

export interface GitHubApiRequest {
  action: 'fetchPullRequests';
  data: {
    patToken: string;
    repositoryUrl: string;
  };
}

export interface GitHubApiResponse {
  action: 'fetchPullRequests';
  success: boolean;
  data?: GitHubPullRequest[];
  error?: string;
}

// Background message types
export type BackgroundMessage = GitHubApiRequest;
export type BackgroundResponse = GitHubApiResponse;