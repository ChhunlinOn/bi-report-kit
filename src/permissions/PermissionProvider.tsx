import * as React from "react";
import type { Permission, PermissionContextValue } from "./types";

const PermissionContext = React.createContext<PermissionContextValue>({
  // Fail open by default: if the host app doesn't wrap the tree in a
  // <PermissionProvider>, every permission check passes. This keeps the
  // package usable for read-only/internal-tool cases with no auth model.
  // Wrap in <PermissionProvider> to restrict anything.
  can: () => true,
});

export interface PermissionProviderProps {
  /** static list of granted permission strings \u2014 simplest option */
  permissions?: Permission[];
  /** or supply your own check, e.g. delegating to Pundit/CanCanCan via your API */
  can?: (permission: Permission) => boolean;
  roles?: string[];
  children: React.ReactNode;
}

export function PermissionProvider({ permissions, can, roles, children }: PermissionProviderProps) {
  const value = React.useMemo<PermissionContextValue>(() => {
    const checker = can ?? ((p: Permission) => permissions?.includes(p) ?? false);
    return { can: checker, roles };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions, can, roles]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissionContext(): PermissionContextValue {
  return React.useContext(PermissionContext);
}
