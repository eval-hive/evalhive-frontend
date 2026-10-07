"use client";

import { Surface } from "@webprodigies/flute";
import type { ReactNode } from "react";
import OrganizationAdminDashboard from "../../../app/admin/organization/page";
import { DashboardPresentation } from "../../../components/DashboardPresentation";
import "../sidebar-descent.css";

const presentation = {
  spatial: true,
  splitWorkspace: false,
  activePath: "/admin/organization",
  wrap(id: string, children: ReactNode) {
    const paint = id.endsWith("-paint");
    return <Surface key={id} id={id} style={paint
      ? { position: "absolute", inset: 0, pointerEvents: "none" }
      : id === "workspace" ? { flex: 1, minWidth: 0 } : undefined}>
      {children}
    </Surface>;
  },
};

export default function SidebarDescent() {
  return <DashboardPresentation.Provider value={presentation}>
    <Surface id="dashboard" className="school-sidebar-scene" style={{ position: "absolute", left: 240, top: 90, width: 1440, height: 900 }}>
      <OrganizationAdminDashboard />
    </Surface>
  </DashboardPresentation.Provider>;
}
