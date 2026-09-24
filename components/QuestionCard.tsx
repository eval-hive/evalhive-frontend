import { Edit, Trash2, ImageIcon } from 'lucide-react';
import MathText from './MathText';

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
  onImageUpload?: (id: string, file: File) => void;
  readonly?: boolean;
}

const MAX_QUESTION_IMAGE_SIZE = 2 * 1024 * 1024;

function resolveImageUrl(imageUrl: string) {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imageUrl}`;
}

export default function QuestionCard({ index, question, onEdit, onDelete, onImageUpload, readonly = false }: QuestionCardProps) {
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
    <div className="bg-card border border-border rounded-lg p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs font-bold text-brand-indigo uppercase tracking-[0.12em]">
            Question {index + 1}
          </span>
          <p className="mt-1 text-sm text-text-primary font-medium leading-relaxed">
            <MathText>{question.questionText}</MathText>
          </p>
        </div>

        {!readonly && (
          <div className="flex items-center gap-2 ml-4">
            {onImageUpload && (
              <label
                className="p-1.5 rounded-md text-text-secondary hover:text-brand-indigo hover:bg-brand-indigo/10 transition-colors cursor-pointer"
                title="Upload question image"
              >
                <ImageIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;

                    if (file.size > MAX_QUESTION_IMAGE_SIZE) {
                      alert('Question images must be 2MB or smaller.');
                      return;
                    }

                    onImageUpload(question.id, file);
                  }}
                />
              </label>
            )}
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
            src={resolveImageUrl(question.imageUrl)}
            alt="Question image"
            className="max-w-xs rounded-md border border-border"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <div
            key={opt.key}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border ${
              question.correctOption === opt.key
                ? 'border-brand-emerald bg-brand-emerald/5 text-brand-emerald font-medium'
                : 'border-border bg-background text-text-primary'
            }`}
          >
            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold ${
              question.correctOption === opt.key
                ? 'bg-brand-emerald text-white'
                : 'bg-gray-100 text-text-secondary'
            }`}>
              {opt.label}
            </span>
            <span className="min-w-0 break-words"><MathText>{opt.value}</MathText></span>
          </div>
        ))}
      </div>
    </div>
  );
}
