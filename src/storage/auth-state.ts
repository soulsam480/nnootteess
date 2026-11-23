export type UserState = "authenticated" | "inactive" | "copying";

export interface SecuritySnapshot {
  isActive: boolean;
  activeAddress: string | null;
}

export type SecurityAction =
  | { kind: "none" }
  | { kind: "activate"; address: string }
  | { kind: "deactivate" };

export function securityAction(
  state: UserState,
  security: SecuritySnapshot,
  activating: boolean,
): SecurityAction {
  if (activating || state === "copying") {
    return { kind: "none" };
  }

  if (security.isActive && security.activeAddress) {
    return { kind: "activate", address: security.activeAddress };
  }

  return { kind: "deactivate" };
}
