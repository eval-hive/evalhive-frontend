'use client';

import { createContext, useContext, type ReactNode } from 'react';

// Normal routes render the original markup; the cinematic binding adds spatial leaves.
export const ExamPresentation = createContext<{
  wrap: (id: string, children: ReactNode) => ReactNode;
}>({ wrap: (_id, children) => children });

export function ExamPart({ id, children }: { id: string; children: ReactNode }) {
  return <>{useContext(ExamPresentation).wrap(id, children)}</>;
}
