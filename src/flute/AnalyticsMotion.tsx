"use client";

import { Surface, useSceneTime, evaluateMotion } from '@webprodigies/flute';
import type { ReactNode } from 'react';
import { formatMetric, type MetricProps, type ProgressProps } from '../../components/AnalyticsPresentation';
import { analyticsTimings, analyticsDrawDuration } from './analytics-timing';

// The installed evaluator owns easing. No RAF, timers, duplicate clock or mutated data.
const progressTracks = Object.fromEntries(Object.entries(analyticsTimings).map(([id, start]) => [id, {
  durationMs: 10000, speed: 1,
  tracks: [{target: {kind: 'surface' as const, id}, property: 'opacity' as const, keyframes: [
    {timeMs: start + 250, value: 0, easing: 'cinematic' as const},
    {timeMs: start + 250 + analyticsDrawDuration, value: 1, easing: 'cinematic' as const},
  ]}],
}]));

function useProgress(id: string) {
  const authoredTime = useSceneTime();
  const track = progressTracks[id];
  return track ? evaluateMotion(track, authoredTime).surfaces[id]?.opacity ?? 1 : 1;
}

export function SceneMetric({id, value, suffix = ''}: MetricProps) {
  return <>{formatMetric(value, useProgress(id))}{suffix}</>;
}

export function SceneChartProgress({id, children}: ProgressProps) {
  return <>{children(useProgress(id))}</>;
}

export function wrapAnalytics(id: string, children: ReactNode) {
  return <Surface key={id} id={id}>{children}</Surface>;
}
