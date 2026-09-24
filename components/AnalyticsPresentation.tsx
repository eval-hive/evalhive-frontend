'use client';

import { createContext, Fragment, useContext, type ComponentType, type ReactNode } from 'react';

export type MetricProps = { id: string; value: number; suffix?: string };
export type ProgressProps = { id: string; children: (progress: number) => ReactNode };

export function formatMetric(value: number, progress = 1) {
  return (value * Math.max(0, Math.min(1, progress))).toLocaleString('en-US', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

const StaticMetric = ({ value, suffix = '' }: MetricProps) => <>{formatMetric(value)}{suffix}</>;
const StaticProgress = ({ children }: ProgressProps) => <>{children(1)}</>;

/** Scene adapters animate presentation, never the underlying analytics records. */
export const AnalyticsPresentation = createContext<{
  wrap: (id: string, children: ReactNode) => ReactNode;
  Metric: ComponentType<MetricProps>;
  Progress: ComponentType<ProgressProps>;
}>({
  wrap: (id, children) => <Fragment key={id}>{children}</Fragment>,
  Metric: StaticMetric,
  Progress: StaticProgress,
});

export function AnimatedMetric(props: MetricProps) {
  const { Metric } = useContext(AnalyticsPresentation);
  return <Metric {...props} />;
}

export function AnalyticsProgress(props: ProgressProps) {
  const { Progress } = useContext(AnalyticsPresentation);
  return <Progress {...props} />;
}
