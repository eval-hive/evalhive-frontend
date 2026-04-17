import { Edit, Trash2, ImageIcon } from 'lucide-react';

interface QuestionCardProps {
  index: number;
  question: {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    optionE?: string | null;
    correctOption: 'a' | 'b' | 'c' | 'd' | 'e';
    imageUrl?: string | null;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  readonly?: boolean;
}

const optionLabels = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };

export default function QuestionCard({ index, question, onEdit, onDelete, readonly = false }: QuestionCardProps) {
  const options: { key: 'a'|'b'|'c'|'d'|'e', label: string, value: string }[] = [
    { key: 'a', label: 'A', value: question.optionA },
    { key: 'b', label: 'B', value: question.optionB },
    { key: 'c', label: 'C', value: question.optionC },
    { key: 'd', label: 'D', value: question.optionD },
  ];
  if (question.optionE !== undefined && question.optionE !== null) {
    options.push({ key: 'e' as const, label: 'E', value: question.optionE });
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Question {index + 1}
          </span>
          <p className="mt-1 text-sm text-text-primary font-medium leading-relaxed">
            {question.questionText}
          </p>
        </div>

        {!readonly && (
          <div className="flex items-center gap-2 ml-4">
            {onEdit && (
              <button
                onClick={() => onEdit(question.id)}
                className="p-1.5 rounded-md text-text-secondary hover:text-brand-indigo hover:bg-brand-indigo/10 transition-colors"
                title="Edit question"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(question.id)}
                className="p-1.5 rounded-md text-text-secondary hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                title="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {question.imageUrl && (
        <div className="mb-3">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${question.imageUrl}`}
            alt="Question image"
            className="max-w-xs rounded-md border border-border"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <div
            key={opt.key}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border ${
              question.correctOption === opt.key
                ? 'border-brand-emerald bg-brand-emerald/5 text-brand-emerald font-medium'
                : 'border-border text-text-primary'
            }`}
          >
            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold ${
              question.correctOption === opt.key
                ? 'bg-brand-emerald text-white'
                : 'bg-gray-100 text-text-secondary'
            }`}>
              {opt.label}
            </span>
            <span className="truncate">{opt.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
