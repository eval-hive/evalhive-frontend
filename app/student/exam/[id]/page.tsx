'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Flag, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Loader2, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function ExamTakingInterface() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, { option: string | null, flagged: boolean }>>({});
  
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Poll timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || submitting) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, submitting]);

  // Load Exam
  useEffect(() => {
    const initExam = async () => {
      try {
        let attemptRes;
        
        // Mock routes create an attempt before sending the student here, while
        // internal exams still arrive with an exam id. Resume first, then start.
        try {
          attemptRes = await api.get(`/student/attempts/${examId}/resume`);
        } catch {
          try {
            attemptRes = await api.post(`/student/exams/${examId}/start`);
          } catch (err: any) {
            if (err.response?.data?.error === 'Attempt already exists for this exam') {
              const examsRes = await api.get('/student/exams');
              const targetExam = examsRes.data.exams.find((e: any) => e.id === examId);
              if (targetExam?.inProgressAttemptId) {
                attemptRes = await api.get(`/student/attempts/${targetExam.inProgressAttemptId}/resume`);
              } else {
                throw err;
              }
            } else {
              throw err;
            }
          }
        }
        
        const data = attemptRes.data;
        if (data.attempt) {
          // resumed
          setAttempt(data.attempt);
          setQuestions(data.questions);
          setTimeRemaining(data.timeRemaining);
          
          const restoredAnswers: Record<string, { option: string | null, flagged: boolean }> = {};
          if (data.attempt.studentAnswers) {
            data.attempt.studentAnswers.forEach((ans: any) => {
              restoredAnswers[ans.questionId] = {
                option: ans.selectedOption,
                flagged: ans.isFlagged
              };
            });
          }
          setAnswers(restoredAnswers);
        } else {
          // fresh start
          setAttempt({ id: data.attemptId });
          setQuestions(data.questions);
          setTimeRemaining(data.durationMinutes * 60);
          
          const initialAnswers: Record<string, { option: string | null, flagged: boolean }> = {};
          data.questions.forEach((q: any) => {
            initialAnswers[q.id] = { option: null, flagged: false };
          });
          setAnswers(initialAnswers);
        }
      } catch (error) {
        console.error('Failed to init exam', error);
        router.push('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };
    initExam();
  }, [examId, router]);

  const handleSelectOption = async (option: string) => {
    if (!attempt || !questions[currentIdx]) return;
    const qId = questions[currentIdx].id;
    
    setSavingStatus('saving');
    
    // Toggle if same option clicked
    const currentAns = answers[qId];
    const isSelected = currentAns?.option === option;
    const newOption = isSelected ? null : option;
    
    const newAnswerState = { ...currentAns, option: newOption };
    setAnswers(prev => ({ ...prev, [qId]: newAnswerState }));
    
    try {
      await api.post(`/student/attempts/${attempt.id}/answer`, {
        questionId: qId,
        selectedOption: newOption,
        isFlagged: newAnswerState.flagged
      });
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setSavingStatus('error');
    }
  };

  const handleToggleFlag = async () => {
    if (!attempt || !questions[currentIdx]) return;
    const qId = questions[currentIdx].id;
    
    setSavingStatus('saving');
    const currentAns = answers[qId] || { option: null, flagged: false };
    const newAnswerState = { ...currentAns, flagged: !currentAns.flagged };
    
    setAnswers(prev => ({ ...prev, [qId]: newAnswerState }));
    
    try {
      await api.post(`/student/attempts/${attempt.id}/answer`, {
        questionId: qId,
        selectedOption: newAnswerState.option,
        isFlagged: newAnswerState.flagged
      });
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (err) {
      setSavingStatus('error');
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting || !attempt) return;
    setSubmitting(true);
    try {
      await api.post(`/student/attempts/${attempt.id}/submit`);
    } catch (err) {} 
    router.push(`/student/result/${attempt.id}`);
  };

  const handleManualSubmit = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      await api.post(`/student/attempts/${attempt.id}/submit`);
      router.push(`/student/result/${attempt.id}`);
    } catch (err) {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-brand-indigo" />
    </div>;
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-indigo mb-4" />
        <h2 className="text-xl font-semibold text-text-primary">Submitting Exam...</h2>
        <p className="text-text-secondary mt-2">Please wait, compiling your results.</p>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const qId = currentQ?.id;
  const currentAns = answers[qId];

  const answeredCount = Object.values(answers).filter(a => a.option !== null).length;
  const flaggedCount = Object.values(answers).filter(a => a.flagged).length;
  
  const m = timeRemaining ? Math.floor(timeRemaining / 60) : 0;
  const s = timeRemaining ? timeRemaining % 60 : 0;
  const isWarning = timeRemaining !== null && timeRemaining <= 300;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 shadow-sm">
        <div className="flex items-center space-x-4">
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

        <div className="flex items-center space-x-6">
          <div className={`flex items-center font-mono text-xl font-medium px-4 py-1.5 rounded-lg border ${
            isWarning ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse' : 'bg-background-alt text-brand-indigo border-transparent'
          }`}>
            <Clock className="w-5 h-5 mr-2" />
            {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
          </div>
          <button 
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-2 bg-brand-indigo text-white font-medium rounded-lg hover:bg-brand-indigo/90 cursor-pointer transition-colors shadow-sm"
          >
            Submit
          </button>
        </div>
      </header>

      {/* Warning Banner */}
      {isWarning && (
        <div className="bg-red-500/10 border-b border-red-500/20 py-2 px-6 flex items-center justify-center text-red-600">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">5 minutes remaining. Your exam will auto-submit when time runs out.</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        
        {/* Left Side: Question Navigator */}
        <aside className="w-80 bg-background-alt border-r border-border flex flex-col hidden lg:flex shrink-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Questions Map</h3>
          </div>
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
                  <button 
                    key={q.id} 
                    onClick={() => setCurrentIdx(idx)}
                    className={btnClass}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-border flex flex-wrap gap-4 text-xs text-text-secondary">
             <div className="flex items-center"><div className="w-3 h-3 bg-card border border-border rounded mr-2"></div> Unanswered</div>
             <div className="flex items-center"><div className="w-3 h-3 bg-brand-indigo rounded mr-2"></div> Answered</div>
             <div className="flex items-center"><div className="w-3 h-3 border-y-2 border-brand-gold bg-card rounded mr-2"></div> Flagged</div>
          </div>
        </aside>

        {/* Right Side: Question Area */}
        <main className="flex-1 overflow-y-auto bg-card relative">
          <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32">
            {currentQ && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-2xl font-medium text-text-primary leading-tight flex-1">
                    <span className="text-brand-indigo font-bold mr-3">{currentIdx + 1}.</span>
                    {currentQ.questionText}
                  </h2>
                  <button 
                    onClick={handleToggleFlag}
                    className={`ml-4 flex items-center px-3 py-1.5 rounded-md border text-sm transition-colors shrink-0 ${
                      currentAns?.flagged 
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-gold font-medium' 
                        : 'border-border bg-background hover:bg-background-alt text-text-secondary'
                    }`}
                  >
                    <Flag className={`w-4 h-4 mr-2 ${currentAns?.flagged ? 'fill-current' : ''}`} />
                    {currentAns?.flagged ? 'Flagged' : 'Flag for review'}
                  </button>
                </div>

                {currentQ.imageUrl && (
                  <div className="mb-8 rounded-xl overflow-hidden border border-border max-w-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentQ.imageUrl} alt="Question figure" className="w-full h-auto object-cover" />
                  </div>
                )}

                <div className="space-y-4">
                  {['a', 'b', 'c', 'd', 'e'].map(optKey => {
                    const optText = currentQ[`option${optKey.toUpperCase()}`];
                    if (!optText) return null;
                    
                    const isSelected = currentAns?.option === optKey;

                    return (
                      <button
                        key={optKey}
                        onClick={() => handleSelectOption(optKey)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center group ${
                          isSelected 
                            ? 'border-brand-indigo bg-brand-indigo/5 shadow-sm' 
                            : 'border-border bg-background hover:border-brand-indigo/40 hover:bg-background-alt'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 transition-colors ${
                          isSelected ? 'bg-brand-indigo text-white' : 'bg-background-alt text-text-secondary group-hover:text-brand-indigo'
                        }`}>
                          {optKey.toUpperCase()}
                        </div>
                        <span className={`text-lg ${isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                          {optText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fixed Navigation Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-card border-t border-border flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors text-text-primary bg-background-alt hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>
            <div className="text-text-secondary font-medium">
              Question {currentIdx + 1} of {questions.length}
            </div>
            {currentIdx === questions.length - 1 ? (
              <button 
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 bg-brand-indigo text-white font-medium rounded-lg hover:bg-brand-indigo/90 transition-colors shadow-sm"
              >
                Submit Exam
              </button>
            ) : (
               <button 
                onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                className="px-5 py-2.5 bg-brand-indigo text-white font-medium rounded-lg hover:bg-brand-indigo/90 transition-colors flex items-center shadow-sm"
              >
                Next Option
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-card rounded-2xl w-full max-w-md p-8 shadow-xl animate-in zoom-in-95 duration-200">
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
               <button className="flex-1 py-3 bg-background-alt hover:bg-border text-text-primary rounded-xl font-medium transition-colors" onClick={() => setShowConfirmModal(false)}>
                 Go Back
               </button>
               <button className="flex-1 py-3 bg-brand-indigo hover:bg-brand-indigo/90 text-white rounded-xl font-medium transition-colors shadow-sm" onClick={handleManualSubmit}>
                 Submit Now
               </button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
