"use client";

import { createContext, Fragment, type ReactNode } from "react";

/** Optional presentation slots; the ordinary dashboard does not depend on Flute. */
export const DashboardPresentation = createContext({
  activePath: "",
  spatial: false,
  splitWorkspace: false,
  wrap: (id: string, children: ReactNode): ReactNode => <Fragment key={id}>{children}</Fragment>,
});
