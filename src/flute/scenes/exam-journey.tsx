'use client';

import { Surface, useSceneTime, evaluateMotion } from '@webprodigies/flute';
import { useState, type ReactNode } from 'react';
import ExamSessionView from '@/components/ExamSessionView';
import ExamResultContent from '@/components/ExamResultContent';
import { ExamPresentation } from '@/components/ExamPresentation';
import '../exam-journey.css';

// A replay of the two visible questions and the verified STD009 submission.
// No credentials, student profile, or API writes are needed to replay/export.
const questions = [
  { id: 'q1', questionText: 'What is the value of 7×8?', optionA: '54', optionB: '56', optionC: '64', optionD: '72' },
  { id: 'q2', questionText: 'Simplify: (x²)(x³)', optionA: 'x⁵', optionB: 'x⁶', optionC: 'x⁸', optionD: 'x⁹' },
  ...Array.from({length: 8}, (_, index) => ({id: `unanswered-${index}`})),
];

const presentation = {
  wrap(id: string, children: ReactNode) {
    return <Surface key={id} id={id} className={`exam-layer exam-layer-${id}`}>{children}</Surface>;
  },
};
const scoreMotion = { durationMs: 14500, speed: 1, tracks: [{
  target: {kind: 'surface', id: 'score'}, property: 'opacity',
  keyframes: [{timeMs: 11500, value: 0, easing: 'cinematic'}, {timeMs: 13200, value: 1, easing: 'cinematic'}],
}] };

function ExamPlayback() {
  const time = useSceneTime();
  const phase = time < 6700 ? 0 : time < 10800 ? 1 : 2;
  const [manual, setManual] = useState<{phase: number; option?: string; index?: number} | null>(null);
  const currentIdx = manual?.phase === phase && manual.index !== undefined ? manual.index : phase === 0 ? 0 : 1;
  const firstSelected = time >= 5100;
  const secondSelected = time >= 8200;
  const answers = Object.fromEntries(questions.map(q => [q.id, { option: q.id === 'q1' && firstSelected ? 'b' : q.id === 'q2' && secondSelected ? 'a' : null, flagged: false }]));
  if (manual?.phase === phase && manual.option) answers[questions[currentIdx].id].option = manual.option;
  const progress = evaluateMotion(scoreMotion, time).surfaces.score?.opacity ?? 0;
  const result = {
    exam: {title: 'Mathematics CA Test', resultVisibility: 'score_only', examType: 'internal'},
    score: Math.round(2 * progress), totalQuestions: 10, timeTakenSeconds: Math.round(41 * progress),
  };

  return <ExamPresentation.Provider value={presentation}>
    <Surface id="exam-shell" className="exam-cinema" content={<div className="exam-backing"><div className="exam-sidebar-backing" /></div>}>
      <ExamSessionView questions={questions} currentIdx={currentIdx} answers={answers}
        timeRemaining={300 - Math.min(41, Math.floor(time / 260))}
        savingStatus={time >= 5100 && time < 6200 || time >= 8200 && time < 9200 ? 'saved' : 'idle'}
        showConfirmModal={true}
        setCurrentIdx={index => setManual({phase, index: Math.min(index, 1)})}
        handleSelectOption={option => setManual({phase, index: currentIdx, option})}
        setShowConfirmModal={() => {}} handleToggleFlag={() => {}} handleManualSubmit={() => {}} />
      <Surface id="exam-completion" className="exam-result-layer">
        <ExamResultContent result={result} onBack={() => setManual(null)} />
      </Surface>
      <Surface id="exam-pointer" className="exam-pointer" content={<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M3 2 L28 24 L16 25 L11 37 Z" fill="#171c36" stroke="white" strokeWidth="2" /></svg>} />
      <Surface id="exam-click" className="exam-click" content={<div />} />
    </Surface>
  </ExamPresentation.Provider>;
}

export default function ExamJourney() { return <ExamPlayback />; }
