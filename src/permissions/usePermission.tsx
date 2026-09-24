import * as React from "react";
import { usePermissionContext } from "./PermissionProvider";
import type { Permission } from "./types";

export function usePermission(permission: Permission): boolean {
  const { can } = usePermissionContext();
  return can(permission);
}

export interface CanProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/** Declarative permission gate: <Can permission="export:pdf">...</Can> */
export function Can({ permission, fallback = null, children }: CanProps) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}
