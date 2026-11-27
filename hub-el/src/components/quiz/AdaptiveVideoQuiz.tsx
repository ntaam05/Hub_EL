"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Loader2, Sparkles, XCircle, Zap } from "lucide-react";
import { generateNextAdaptiveQuestionAction } from "@/actions/quiz/ai";

interface AdaptiveVideoQuizProps {
  videoId: string;
  userId: string;
  totalCount: number;
  questions: any[];
  onQuestionsChange: (questions: any[]) => void;
  userAnswers: Record<number, string>;
  onUserAnswersChange: (answers: Record<number, string>) => void;
  hasSubmitted: boolean;
  isSubmitting: boolean;
  onSubmitQuiz: () => void;
  onError?: (msg: string) => void;
}

const DIFFICULTY_META: Record<number, { label: string; className: string }> = {
  1: {
    label: "Mức 1 · Rất dễ",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  2: {
    label: "Mức 2 · Tương đối dễ",
    className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  },
  3: {
    label: "Mức 3 · Trung bình",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  4: {
    label: "Mức 4 · Khá khó",
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  5: {
    label: "Mức 5 · Khó",
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  },
};

export function AdaptiveVideoQuiz({
  videoId,
  userId,
  totalCount,
  questions,
  onQuestionsChange,
  userAnswers,
  onUserAnswersChange,
  hasSubmitted,
  isSubmitting,
  onSubmitQuiz,
  onError,
}: AdaptiveVideoQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(2);
  const [questionDifficulties, setQuestionDifficulties] = useState<Record<number, number>>({ 0: 2 });
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  // Reset trạng thái khi tạo bộ câu hỏi mới
  useEffect(() => {
    if (questions.length <= 1 && Object.keys(userAnswers).length === 0) {
      setCurrentIndex(0);
      setDifficultyLevel(2);
      setQuestionDifficulties({ 0: 2 });
      setIsLoadingNext(false);
    }
  }, [questions.length, userAnswers]);

  if (!questions || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const selectedOpt = userAnswers[currentIndex];
  const isAnswered = selectedOpt !== undefined;
  const isCurrentCorrect = selectedOpt === currentQuestion?.correctAnswer;
  const currentDiff = questionDifficulties[currentIndex] ?? difficultyLevel;
  const diffMeta = DIFFICULTY_META[currentDiff] || DIFFICULTY_META[2];
  const isLastQuestion = currentIndex + 1 >= totalCount;

  const handleSelectOption = (opt: string) => {
    if (hasSubmitted || isAnswered || isLoadingNext) return;
    onUserAnswersChange({ ...userAnswers, [currentIndex]: opt });
  };

  const handleNextQuestion = async () => {
    if (!isAnswered || isLoadingNext) return;

    // Nếu câu tiếp theo đã được tạo sẵn (trong trường hợp hiếm), chuyển luôn
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    const nextLevel = isCurrentCorrect
      ? Math.min(5, currentDiff + 1)
      : Math.max(1, currentDiff - 1);

    setIsLoadingNext(true);
    try {
      const previousTexts = questions.map((q) => q.questionText).filter(Boolean);
      const res = await generateNextAdaptiveQuestionAction(
        userId,
        videoId,
        nextLevel,
        previousTexts
      );

      if (res.success && res.data) {
        const nextIdx = questions.length;
        onQuestionsChange([...questions, res.data]);
        setDifficultyLevel(res.difficultyLevel ?? nextLevel);
        setQuestionDifficulties((prev) => ({
          ...prev,
          [nextIdx]: res.difficultyLevel ?? nextLevel,
        }));
        setCurrentIndex(nextIdx);
      } else {
        onError?.(res.error || "Không thể tạo câu hỏi tiếp theo. Vui lòng thử lại!");
      }
    } catch {
      onError?.("Lỗi kết nối khi tạo câu hỏi tiếp theo!");
    } finally {
      setIsLoadingNext(false);
    }
  };

  // Chế độ xem lại toàn bộ sau khi nộp bài
  if (hasSubmitted) {
    return (
      <div className="bg-white/50 dark:bg-[#121212] rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <Zap className="w-6 h-6 text-yellow-500" /> Kết Quả Bài Tập AI ({questions.length} câu)
        </h3>

        <div className="space-y-6">
          {questions.map((q: any, index: number) => {
            const isUserCorrect = userAnswers[index] === q.correctAnswer;
            const qDiff = DIFFICULTY_META[questionDifficulties[index] ?? 2] || DIFFICULTY_META[2];
            return (
              <div
                key={index}
                className="p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a21]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Câu {index + 1} / {questions.length}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${qDiff.className}`}>
                    {qDiff.label}
                  </span>
                </div>
                <p className="font-bold text-base md:text-lg mb-4 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {["A", "B", "C", "D"].map((opt) => {
                    if (!q[`option${opt}`]) return null;
                    const isSelected = userAnswers[index] === opt;
                    const isCorrectOpt = q.correctAnswer === opt;
                    let btnStyle =
                      "opacity-50 bg-slate-50 dark:bg-[#23232b] border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-500";
                    if (isCorrectOpt) {
                      btnStyle =
                        "bg-green-100 dark:bg-green-500/20 border-green-500 text-green-800 dark:text-green-400 font-bold";
                    } else if (isSelected && !isCorrectOpt) {
                      btnStyle =
                        "bg-red-100 dark:bg-red-500/20 border-red-500 text-red-800 dark:text-red-400 font-bold";
                    }
                    return (
                      <div
                        key={opt}
                        className={`p-4 rounded-xl border text-left flex justify-between items-center ${btnStyle}`}
                      >
                        <span>
                          <span className="font-bold mr-1 opacity-80">{opt}.</span> {q[`option${opt}`]}
                        </span>
                        {isCorrectOpt && <CheckCircle className="w-5 h-5 shrink-0" />}
                        {isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`mt-5 p-4 rounded-xl text-sm border ${
                    isUserCorrect
                      ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  <p className="font-bold mb-2 flex items-center gap-2">
                    {isUserCorrect ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> Chính xác!
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Sai rồi!
                      </>
                    )}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold opacity-80">Giải thích:</span> {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Chế độ làm từng câu một với độ khó thích ứng
  return (
    <div className="bg-white/50 dark:bg-[#121212] rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Câu {currentIndex + 1} / {totalCount}
        </h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${diffMeta.className}`}>
          {diffMeta.label}
        </span>
      </div>

      {/* Thanh tiến độ */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / totalCount) * 100}%` }}
        />
      </div>

      {currentQuestion && (
        <div className="p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a21]">
          <p className="font-bold text-base md:text-lg mb-5 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {currentQuestion.questionText}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {["A", "B", "C", "D"].map((opt) => {
              if (!currentQuestion[`option${opt}`]) return null;
              const isSelected = selectedOpt === opt;
              const isCorrectOpt = currentQuestion.correctAnswer === opt;

              let btnStyle =
                "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:bg-[#23232b] dark:border-slate-700/50 dark:hover:bg-[#2a2a35]";

              if (isAnswered) {
                if (isCorrectOpt) {
                  btnStyle =
                    "bg-green-100 dark:bg-green-500/20 border-green-500 text-green-800 dark:text-green-400 font-bold";
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle =
                    "bg-red-100 dark:bg-red-500/20 border-red-500 text-red-800 dark:text-red-400 font-bold";
                } else {
                  btnStyle =
                    "opacity-50 bg-slate-50 dark:bg-[#23232b] border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-500";
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswered || isLoadingNext}
                  className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${btnStyle}`}
                >
                  <span>
                    <span className="font-bold mr-1 opacity-80">{opt}.</span>{" "}
                    {currentQuestion[`option${opt}`]}
                  </span>
                  {isAnswered && isCorrectOpt && <CheckCircle className="w-5 h-5 shrink-0" />}
                  {isAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div
              className={`mt-5 p-4 rounded-xl text-sm border ${
                isCurrentCorrect
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"
              }`}
            >
              <p className="font-bold mb-1.5 flex items-center gap-2">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Chính xác!
                    {!isLastQuestion && (
                      <span className="text-xs font-medium opacity-85">
                        (Câu tiếp theo sẽ khó hơn một chút)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Sai rồi!
                    {!isLastQuestion && (
                      <span className="text-xs font-medium opacity-85">
                        (Câu tiếp theo sẽ dễ hơn để bạn củng cố)
                      </span>
                    )}
                  </>
                )}
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-bold opacity-80">Giải thích:</span> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {isAnswered && (
        <div className="mt-6 flex justify-end">
          {!isLastQuestion ? (
            <button
              onClick={handleNextQuestion}
              disabled={isLoadingNext}
              className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {isLoadingNext ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tạo câu hỏi tiếp theo...</span>
                </>
              ) : (
                <>
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onSubmitQuiz}
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              <span>{isSubmitting ? "Đang chấm..." : "Nộp bài & Chấm điểm"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
