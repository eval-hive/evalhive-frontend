"use client";
import React from "react";
import { ProjectPreview } from "@webprodigies/flute/preview";
import { sceneModules } from "./catalog";
// Host-owned development flag: no process, Vite or Electron globals in this adapter.
export function FluteProjectPreview({ children, enabled, active, ...props }) {
  if (!enabled) return children;
  return <ProjectPreview {...props} projectId="08e4d326-6d18-44d5-a287-1101f0a2f939" enabled={enabled} active={active} sceneModules={sceneModules}>{children}</ProjectPreview>;
}
