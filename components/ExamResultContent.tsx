'use client';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import MathText from '@/components/MathText';
export default function ExamResultContent({result, onBack}: {result: any; onBack: () => void}) {
  const visibility = result.exam.resultVisibility; // hidden, score_only, full_breakdown
  const showScore = visibility !== 'hidden';
  const showBreakdown = visibility === 'full_breakdown' && result.exam.answersPublished;
  
  const percentage = result.totalQuestions > 0 ? ((result.score / result.totalQuestions) * 100).toFixed(1) : '0';


return (      <div className="max-w-4xl mx-auto py-8">
        <button 
          onClick={() => onBack()}
          className="flex items-center text-text-secondary hover:text-brand-indigo font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-card rounded-lg border border-border p-8 md:p-12 text-center shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Exam Submitted Successfully!</h2>
          <p className="text-text-secondary mb-8 text-lg">You have completed the <strong className="text-text-primary">{result.exam.title}</strong> exam.</p>

          {!showScore && (
             <div className="bg-background-alt p-6 rounded-lg inline-block text-left border">
               <p className="text-text-primary font-medium">Your results will be published soon by your teacher.</p>
             </div>
          )}

          {showScore && (
            <div className="flex flex-wrap justify-center gap-6 mt-6">
              <div className="bg-background-alt p-6 rounded-lg min-w-[200px] border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                 <p className="text-sm font-medium text-text-secondary mb-1">Your Score</p>
                 <p className="text-4xl font-bold text-brand-indigo">{result.score} <span className="text-xl text-text-secondary font-medium">/ {result.totalQuestions}</span></p>
              </div>
              <div className="bg-background-alt p-6 rounded-lg min-w-[200px] border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                 <p className="text-sm font-medium text-text-secondary mb-1">Percentage</p>
                 <p className="text-4xl font-bold text-brand-indigo">{percentage}%</p>
              </div>
              <div className="bg-background-alt p-6 rounded-lg min-w-[200px] border border-border shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                 <p className="text-sm font-medium text-text-secondary mb-1">Time Taken</p>
                 <p className="text-4xl font-bold text-text-primary">{Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s</p>
              </div>
            </div>
          )}
        </div>

        {showBreakdown && result.studentAnswers && (
          <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
            <h3 className="text-xl font-bold text-text-primary">Breakdown</h3>
            {result.studentAnswers.map((ans: any, idx: number) => {
               const q = ans.question;
               const isCorrect = ans.isCorrect;
               return (
                 <div key={ans.id} className="bg-card border border-border rounded-lg p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <div className="flex items-start">
                       <div className="mt-1 mr-4 shrink-0">
                          {isCorrect ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                       </div>
                       <div className="flex-1">
                          <p className="text-lg font-medium text-text-primary mb-4"><span className="text-brand-indigo font-bold mr-2">{idx + 1}.</span> <MathText>{q.questionText}</MathText></p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="p-4 rounded-lg bg-background-alt border border-border">
                               <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Your Answer</p>
                               <p className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                 {ans.selectedOption ? <><span>{ans.selectedOption.toUpperCase()}:</span> <MathText>{q[`option${ans.selectedOption.toUpperCase()}`]}</MathText></> : 'Unanswered'}
                               </p>
                             </div>
                             <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                               <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Correct Answer</p>
                               <p className="font-medium text-green-600">
                                 <span>{q.correctOption.toUpperCase()}:</span> <MathText>{q[`option${q.correctOption.toUpperCase()}`]}</MathText>
                               </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               );
            })}
          </div>
        )}

      </div>
);
}
