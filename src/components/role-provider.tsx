"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "@/lib/auth";

const UserContext = createContext<CurrentUser>(null);

export function RoleProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** Vai trò + thông tin user hiện tại (đã có sẵn từ server, không cần fetch lại). */
export function useCurrentUser() {
  return useContext(UserContext);
}
