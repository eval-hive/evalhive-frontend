'use client';

import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  children: string | null | undefined;
  className?: string;
}

type Segment = { type: 'text' | 'math'; value: string };

const EXPLICIT_MATH = /(\\\([^\n]*?\\\)|\$\$[^\n]*?\$\$|\$[^\n$]+\$|\\\[[\s\S]*?\\\])/g;

function splitExplicitMath(value: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  value.replace(EXPLICIT_MATH, (match, _group, offset: number) => {
    if (offset > lastIndex) segments.push({ type: 'text', value: value.slice(lastIndex, offset) });
    const content = match.startsWith('$$') || match.startsWith('$')
      ? match.replace(/^\$\$?/, '').replace(/\$\$?$/, '')
      : match.replace(/^\\\(|\\\)$/g, '').replace(/^\\\[|\\\]$/g, '');
    segments.push({ type: 'math', value: content });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < value.length) segments.push({ type: 'text', value: value.slice(lastIndex) });
  return segments.length ? segments : [{ type: 'text', value }];
}

function renderShorthand(value: string) {
  const parts = value.split(/(\^\{[^}]+\}|\^[A-Za-z0-9+\-]+|_\{[^}]+\}|_[A-Za-z0-9+\-]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('^')) {
      return <sup key={index} className="text-[0.72em] leading-none">{part.slice(1).replace(/^\{|\}$/g, '')}</sup>;
    }
    if (part.startsWith('_')) {
      return <sub key={index} className="text-[0.72em] leading-none">{part.slice(1).replace(/^\{|\}$/g, '')}</sub>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function MathText({ children, className = '' }: MathTextProps) {
  const value = children || '';
  return (
    <span className={`math-text whitespace-pre-wrap ${className}`}>
      {splitExplicitMath(value).map((segment, index) => (
        segment.type === 'math'
          ? <InlineMath key={index} math={segment.value} />
          : <span key={index}>{renderShorthand(segment.value)}</span>
      ))}
    </span>
  );
}

