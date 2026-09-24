"use client";

import { Surface } from '@webprodigies/flute';
import type { ReactNode } from 'react';
import SchoolAdminDashboard from '../../../app/admin/school/page';
import { DashboardPresentation } from '../../../components/DashboardPresentation';
import { AnalyticsPresentation } from '../../../components/AnalyticsPresentation';
import { SceneMetric, SceneChartProgress, wrapAnalytics } from '../AnalyticsMotion';
import '../analytics-reveal.css';

const dashboardPresentation = {
  spatial: true,
  splitWorkspace: true,
  activePath: '/admin/school',
  wrap(id: string, children: ReactNode) {
    return <Surface key={id} id={id} style={id.endsWith('-paint')
      ? { position: 'absolute', inset: 0, pointerEvents: 'none' }
      : id === 'workspace' ? { flex: 1, minWidth: 0 } : undefined}>{children}</Surface>;
  },
};
const analyticsPresentation = {wrap: wrapAnalytics, Metric: SceneMetric, Progress: SceneChartProgress};

export default function AnalyticsReveal() {
  return <DashboardPresentation.Provider value={dashboardPresentation}>
    <AnalyticsPresentation.Provider value={analyticsPresentation}>
      <Surface id="dashboard" className="school-analytics-scene" style={{position:'absolute',left:0,top:-450,width:1600,height:1900}}>
        <SchoolAdminDashboard />
      </Surface>
    </AnalyticsPresentation.Provider>
  </DashboardPresentation.Provider>;
}
