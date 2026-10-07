'use client';
import { Flag, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Loader2, Clock } from 'lucide-react';
import MathText from '@/components/MathText';
import { ExamPart } from '@/components/ExamPresentation';

function resolveQuestionImageUrl(imageUrl: string) {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imageUrl}`;
}

export type ExamSessionViewProps = {
 questions: any[]; currentIdx: number; timeRemaining: number | null;
 answers: Record<string, {option: string | null; flagged: boolean}>;
 savingStatus: 'idle' | 'saving' | 'saved' | 'error'; showConfirmModal: boolean;
 setCurrentIdx: (index: number) => void; setShowConfirmModal: (show: boolean) => void;
 handleSelectOption: (option: string) => void; handleToggleFlag: () => void; handleManualSubmit: () => void;
};

export default function ExamSessionView({questions, currentIdx, timeRemaining, answers, savingStatus, showConfirmModal, setCurrentIdx, setShowConfirmModal, handleSelectOption, handleToggleFlag, handleManualSubmit}: ExamSessionViewProps) {
  const currentQ = questions[currentIdx];
  const qId = currentQ?.id;
  const currentAns = answers[qId];

  const answeredCount = Object.values(answers).filter(a => a.option !== null).length;
  const flaggedCount = Object.values(answers).filter(a => a.flagged).length;
  
  const m = timeRemaining ? Math.floor(timeRemaining / 60) : 0;
  const s = timeRemaining ? timeRemaining % 60 : 0;
  const isWarning = timeRemaining !== null && timeRemaining <= 300;

  return (
    <div className="exam-session-view flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <ExamPart id="exam-header"><header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)] sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <h1 className="text-lg font-semibold text-text-primary hidden sm:block">Exam Session</h1>
          <span className="text-sm px-3 py-1 bg-background-alt text-text-secondary rounded-full">
            {answeredCount} / {questions.length} answered
          </span>
          <div className="text-sm">
            {savingStatus === 'saving' && <span className="text-brand-indigo flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Saving...</span>}
            {savingStatus === 'saved' && <span className="text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Saved</span>}
            {savingStatus === 'error' && <span className="text-red-500">Save failed</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-6">
          <div className={`flex items-center font-mono text-xl font-medium px-4 py-1.5 rounded-lg border ${
            isWarning ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse' : 'bg-background-alt text-brand-indigo border-transparent'
          }`}>
            <Clock className="w-5 h-5 mr-2" />
            {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="cursor-pointer rounded-lg bg-brand-indigo px-4 py-2 font-medium text-white shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition-colors hover:bg-brand-indigo/90 sm:px-6"
          >
            Submit
          </button>
        </div>
      </header></ExamPart>

      {/* Warning Banner */}
      {isWarning && (
        <ExamPart id="exam-warning"><div className="flex shrink-0 items-center justify-center border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-red-600 sm:px-6">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">5 minutes remaining. Your exam will auto-submit when time runs out.</span>
        </div></ExamPart>
      )}

      {/* Main Layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        
        {/* Left Side: Question Navigator */}
        <aside className="hidden min-h-0 w-80 shrink-0 flex-col border-r border-border bg-background-alt lg:flex">
          <ExamPart id="map-title"><div className="p-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Questions Map</h3>
          </div></ExamPart>
          <div className="p-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = ans && ans.option !== null;
                const isFlagged = ans && ans.flagged;
                const isActive = currentIdx === idx;

                let btnClass = "h-10 text-sm cursor-pointer font-medium rounded border transition-colors relative flex items-center justify-center ";
                
                if (isActive) btnClass += "ring-2 bg-foreground ring-brand-indigo ring-offset-2 text-white ring-offset-background ";
                
                if (isAnswered) {
                  btnClass += "bg-brand-indigo text-white border-brand-indigo ";
                } else {
                  btnClass += "bg-card text-text-primary border-border hover:bg-background ";
                }

                if (isFlagged) {
                   btnClass += "border-y-4 border-brand-gold ";
                }

                return (
                  <ExamPart id={`number-${idx}`} key={q.id}><button 
                    onClick={() => setCurrentIdx(idx)}
                    className={btnClass}
                  >
                    {idx + 1}
                  </button></ExamPart>
                );
              })}
            </div>
          </div>
          <ExamPart id="map-legend"><div className="p-4 border-t border-border flex flex-wrap gap-4 text-xs text-text-secondary">
             <div className="flex items-center"><div className="w-3 h-3 bg-card border border-border rounded mr-2"></div> Unanswered</div>
             <div className="flex items-center"><div className="w-3 h-3 bg-brand-indigo rounded mr-2"></div> Answered</div>
             <div className="flex items-center"><div className="w-3 h-3 border-y-2 border-brand-gold bg-card rounded mr-2"></div> Flagged</div>
          </div></ExamPart>
        </aside>

        {/* Right Side: Question Area */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-4xl p-5 sm:p-6 md:px-10 md:py-8">
            {currentQ && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <ExamPart id="question-heading"><div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
                  <h2 className="min-w-0 flex-1 text-xl font-medium leading-snug text-text-primary md:text-2xl">
                    <span className="text-brand-indigo font-bold mr-3">{currentIdx + 1}.</span>
                    <MathText>{currentQ.questionText}</MathText>
                  </h2>
                  <button 
                    onClick={handleToggleFlag}
                    className={`flex shrink-0 items-center rounded-md border px-3 py-1.5 text-sm transition-colors sm:ml-4 ${
                      currentAns?.flagged 
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-gold font-medium' 
                        : 'border-border bg-background hover:bg-background-alt text-text-secondary'
                    }`}
                  >
                    <Flag className={`w-4 h-4 mr-2 ${currentAns?.flagged ? 'fill-current' : ''}`} />
                    {currentAns?.flagged ? 'Flagged' : 'Flag for review'}
                  </button>
                </div></ExamPart>

                {currentQ.imageUrl && (
                  <ExamPart id="question-image"><div className="mb-6 max-w-lg overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveQuestionImageUrl(currentQ.imageUrl)} alt="Question figure" className="w-full h-auto object-cover" />
                  </div></ExamPart>
                )}

                <div className="space-y-3">
                  {['a', 'b', 'c', 'd', 'e'].map(optKey => {
                    const optText = currentQ[`option${optKey.toUpperCase()}`];
                    if (!optText) return null;
                    
                    const isSelected = currentAns?.option === optKey;

                    return (
                      <ExamPart id={`option-${optKey}`} key={optKey}><button
                        onClick={() => handleSelectOption(optKey)}
                        className={`group flex min-h-16 w-full items-center rounded-lg border-2 p-4 text-left transition-all ${
                          isSelected 
                            ? 'border-brand-indigo bg-brand-indigo/5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]' 
                            : 'border-border bg-background hover:border-brand-indigo/40 hover:bg-background-alt'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 transition-colors ${
                          isSelected ? 'bg-brand-indigo text-white' : 'bg-background-alt text-text-secondary group-hover:text-brand-indigo'
                        }`}>
                          {optKey.toUpperCase()}
                        </div>
                        <span className={`min-w-0 break-words text-base leading-6 md:text-lg ${isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                          <MathText>{optText}</MathText>
                        </span>
                      </button></ExamPart>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <ExamPart id="exam-navigation"><div className="z-10 flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:px-6">
            <button 
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors text-text-primary bg-background-alt hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>
            <div className="hidden font-medium text-text-secondary sm:block">
              Question {currentIdx + 1} of {questions.length}
            </div>
            {currentIdx === questions.length - 1 ? (
              <button 
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 bg-brand-indigo text-white font-medium rounded-lg hover:bg-brand-indigo/90 transition-colors shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
              >
                Submit Exam
              </button>
            ) : (
               <button 
                onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                className="px-5 py-2.5 bg-brand-indigo text-white font-medium rounded-lg hover:bg-brand-indigo/90 transition-colors flex items-center shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
              >
                Next Question
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div></ExamPart>
        </main>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <ExamPart id="exam-confirmation"><div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-card rounded-lg w-full max-w-md p-8 shadow-xl animate-in zoom-in-95 duration-200">
             <div className="w-12 h-12 bg-brand-indigo/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-brand-indigo" />
             </div>
             <h3 className="text-xl font-bold text-text-primary mb-2">Submit Exam</h3>
             <p className="text-text-secondary mb-6 leading-relaxed">
               You have answered <strong className="text-text-primary">{answeredCount} of {questions.length}</strong> questions.
               {flaggedCount > 0 && <span> <strong className="text-brand-gold">{flaggedCount}</strong> are flagged for review. </span>}
               Are you sure you want to completely submit your exam?
             </p>
             <div className="flex gap-4 w-full">
               <button className="flex-1 py-3 bg-background-alt hover:bg-border text-text-primary rounded-lg font-medium transition-colors" onClick={() => setShowConfirmModal(false)}>
                 Go Back
               </button>
               <button className="flex-1 py-3 bg-brand-indigo hover:bg-brand-indigo/90 text-white rounded-lg font-medium transition-colors shadow-[0_1px_2px_rgba(17,24,39,0.04)]" onClick={handleManualSubmit}>
                 Submit Now
               </button>
             </div>
           </div>
        </div></ExamPart>
      )}

    </div>
  );
}
