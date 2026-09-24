/**
 * Permissions are plain strings so they map cleanly onto whatever
 * authorization system your app already has (Pundit/CanCanCan-style
 * policies, a roles table, Auth0/Clerk roles, etc). bi-report-kit ships a
 * few conventional permission names its own components check:
 *
 *   "dashboard:view"          \u2014 can see dashboards at all
 *   "dashboard:edit"          \u2014 can add/resize/remove widgets, save layout
 *   "dashboard:create"        \u2014 can create new dashboards
 *   "export:csv" / "export:png" / "export:pdf"
 *   "schedule:manage"         \u2014 can create/edit scheduled report deliveries
 *
 * You're free to check any other permission string in your own code via
 * usePermission() \u2014 these are just the ones the built-in components use.
 */
export type Permission = string;

export interface PermissionContextValue {
  /** true if the current user holds this permission */
  can(permission: Permission): boolean;
  /** the current user's role labels, for display purposes only */
  roles?: string[];
}
