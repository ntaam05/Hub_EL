// src/app/(main)/wiki/[id]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWikiCardDetail } from "@/actions/wiki";
import { generateQuizFromWikiCard, addExpToUser, keepCardStar, saveWikiQuizHistory } from "@/actions/quiz";
import { useSession } from "next-auth/react";
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, BookOpen, Trophy, Target, X, Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import Confetti from "react-confetti";
import { WikiCard3D } from "@/components/ui/wiki-card-3d";
import { StudyConfig } from "./_components/StudyConfig"; 

// --- CÁC HÀM HELPER ---
const getSpeechLangCode = (lang: string) => ({"Tiếng Anh":"en-US", "Tiếng Nhật":"ja-JP", "Tiếng Hàn":"ko-KR", "Tiếng Trung":"zh-CN", "Tiếng Pháp":"fr-FR", "Tiếng Đức":"de-DE"}[lang] || "en-US");

const safeText = (text: string) => {
    if (!text) return "";
    return text.replace(/\?/g, (match, offset, string) => (offset > 0 && offset < string.length - 1 && string[offset-1].match(/[a-z]/i) && string[offset+1].match(/[a-z]/i)) ? " " : match);
};

function renderTextWithTooltips(text: string, vocabularies: any[], guessWords: string[]) {
  if (!vocabularies?.length && !guessWords?.length) return text;
  const allTargets = Array.from(new Set([...vocabularies.map(v => v.word), ...guessWords])).filter(Boolean).sort((a, b) => b.length - a.length);
  if (allTargets.length === 0) return text;
  
  const regexParts = allTargets.map(w => /[\u3400-\u9FBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7A3]/.test(w) ? w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : `\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  const regex = new RegExp(`(${regexParts.join('|')})`, 'gi');
  
  return text.split(regex).map((part, i) => {
    const lowerPart = part.toLowerCase();
    if (guessWords.some(gw => gw.toLowerCase() === lowerPart)) {
      return <span key={i} className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 font-bold px-1 rounded shadow-[0_0_5px_rgba(234,179,8,0.2)] border border-yellow-500/50">{part}</span>;
    }
    const vocab = vocabularies.find(v => v.word.toLowerCase() === lowerPart);
    if (vocab) {
      return (
        <span key={i} className="relative group text-blue-600 dark:text-blue-400 font-bold cursor-help hover:underline decoration-blue-500/50 underline-offset-2 transition-all">
          {part}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[250px] bg-slate-800 text-slate-100 text-xs font-normal px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <span className="text-blue-300 font-bold italic mr-1">[{vocab.pos}]</span> {vocab.meaning}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-slate-800" />
          </span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// --- SUB-COMPONENTS UI ---
function SceneBackground({ isDarkMode, bgData, step }: any) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000", step === 'result' ? 'opacity-100 z-0' : 'opacity-30 z-0')}>
      {isDarkMode ? bgData.stars.map((star: any) => (
        <div key={star.id} className="absolute bg-white rounded-full" style={{ left:`${star.x}%`, top:`${star.y}%`, width:star.size, height:star.size, animation:`twinkleStar 4s ease-in-out infinite ${star.delay}s`, boxShadow: '0 0 4px white' }} />
      )) : bgData.clouds.map((cloud: any) => (
        <div key={cloud.id} className="cloud-shape" style={{ top: `${cloud.y}%`, left: `${cloud.x}%`, width: `${cloud.width}px`, height: `${cloud.height}px`, opacity: cloud.opacity, animation: `driftClouds ${cloud.duration}s linear infinite`, animationDelay: `${cloud.delay}s` }} />
      ))}
      <div className="absolute bottom-0 left-0 w-full shrink-0 pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 1440 320" className="w-full h-auto block overflow-visible transition-colors duration-1000 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fde047" stopOpacity="0.9" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" /></linearGradient>
            <linearGradient id="moonGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" /><stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" /></linearGradient>
            <linearGradient id="mountBack" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={isDarkMode ? "#1e293b" : "#bae6fd"} stopOpacity="0.8"/><stop offset="100%" stopColor={isDarkMode ? "#0f172a" : "#f0f9ff"} stopOpacity="0.1"/></linearGradient>
            <linearGradient id="mountMid" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={isDarkMode ? "#334155" : "#7dd3fc"} stopOpacity="0.8"/><stop offset="100%" stopColor={isDarkMode ? "#0f172a" : "#e0f2fe"} stopOpacity="0.3"/></linearGradient>
            <linearGradient id="mountFront" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={isDarkMode ? "#475569" : "#38bdf8"} stopOpacity="0.9"/><stop offset="100%" stopColor={isDarkMode ? "#0f172a" : "#bae6fd"} stopOpacity="0.6"/></linearGradient>
          </defs>
          <circle cx="1300" cy="70" r="45" fill={isDarkMode ? "url(#moonGrad)" : "url(#sunGrad)"} />
          <g><animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="50s" repeatCount="indefinite" /><path fill="url(#mountBack)" d="M0,210 L80,90 L200,180 L350,70 L500,200 L680,100 L850,240 L1000,110 L1200,250 L1350,140 L1440,210 L1440,320 L0,320 Z" /><path fill="url(#mountBack)" d="M0,210 L80,90 L200,180 L350,70 L500,200 L680,100 L850,240 L1000,110 L1200,250 L1350,140 L1440,210 L1440,320 L0,320 Z" transform="translate(1440, 0)" /></g>
          <g><animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="30s" repeatCount="indefinite" /><path fill="url(#mountMid)" d="M0,260 L100,170 L250,280 L400,160 L550,270 L750,150 L900,280 L1100,180 L1250,290 L1350,200 L1440,260 L1440,320 L0,320 Z" /><path fill="url(#mountMid)" d="M0,260 L100,170 L250,280 L400,160 L550,270 L750,150 L900,280 L1100,180 L1250,290 L1350,200 L1440,260 L1440,320 L0,320 Z" transform="translate(1440, 0)" /></g>
          <g><animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="15s" repeatCount="indefinite" /><path fill="url(#mountFront)" d="M0,300 L120,230 L280,310 L450,210 L600,310 L780,220 L950,310 L1150,240 L1300,320 L1380,260 L1440,300 L1440,320 L0,320 Z" /><path fill="url(#mountFront)" d="M0,300 L120,230 L280,310 L450,210 L600,310 L780,220 L950,310 L1150,240 L1300,320 L1380,260 L1440,300 L1440,320 L0,320 Z" transform="translate(1440, 0)" /></g>
        </svg>
      </div>
    </div>
  );
}

function VocabSidebar({ studyData, setShowVocabPanel, handleSpeakWord }: any) {
  return (
    <>
      <div className="lg:hidden fixed inset-0 bg-black/50 z-[90] animate-in fade-in duration-300" onClick={() => setShowVocabPanel(false)} />
      <div className="fixed lg:static inset-y-0 right-0 w-[85%] max-w-[320px] lg:w-[350px] lg:max-w-none bg-white/95 dark:bg-[#111827]/95 border-l border-slate-200 dark:border-slate-800/60 shadow-[-20px_0_40px_rgba(0,0,0,0.3)] lg:shadow-none z-[100] lg:z-10 flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#0b1120] shrink-0 sticky top-0 h-[64px] z-10">
          <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><BookOpen className="text-blue-600 dark:text-blue-400" size={20}/> Từ Vựng Khó</h3>
          <button onClick={() => setShowVocabPanel(false)} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 pb-32 lg:pb-12 space-y-4 bg-slate-50/50 dark:bg-[#0b1120]/50 relative z-0">
          {studyData?.vocabularies?.map((v: any, i: number) => {
            let phonetic = "", pronunciation = "", explanation = safeText(v.englishDesc || "");
            if (v.englishDesc && v.englishDesc.includes('\n')) {
                const parts = v.englishDesc.split('\n');
                let line1 = safeText(parts[0].trim());
                const bracketMatch = line1.match(/\[.*?\]/);
                if (bracketMatch) {
                    phonetic = bracketMatch[0];
                    pronunciation = line1.replace(phonetic, '').replace(/^-/, '').trim();
                } else {
                    const splitDash = line1.split('-');
                    phonetic = splitDash[0]?.trim() || "";
                    pronunciation = splitDash[1]?.trim() || "";
                }
                explanation = safeText(parts.slice(1).join(' ').trim());
            }
            return (
                <div key={i} className="bg-white dark:bg-[#151e2e] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-3">
                        <h4 className="text-blue-700 dark:text-blue-400 font-black text-base sm:text-lg">{safeText(v.word)}</h4>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">{v.pos}</span>
                     </div>
                     <button onClick={() => handleSpeakWord(v.word)} className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><Volume2 size={16} /></button>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold mb-2">{safeText(v.meaning)}</p>
                  {phonetic && (
                     <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                       <span className="text-[12px] font-black text-blue-600/80 dark:text-blue-400/80 font-mono bg-blue-50 dark:bg-blue-900/10 px-1.5 py-0.5 rounded">{phonetic}</span>
                       {pronunciation && <span className="text-[11px] font-semibold text-slate-500">{pronunciation}</span>}
                     </div>
                  )}
                  {explanation && <p className="text-slate-500 dark:text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">{explanation}</p>}
                </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function WikiReaderStudyView() {
  const params = useParams();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;
  
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [card, setCard] = useState<any>(null);
  const [studyData, setStudyData] = useState<any>(null);
  const [step, setStep] = useState<'config' | 'loading' | 'study' | 'result'>('config');

  const [selectedLanguage, setSelectedLanguage] = useState<string>("Tiếng Anh");
  const [selectedLevel, setSelectedLevel] = useState<string>("A2");
  const [numQs, setNumQs] = useState(3);
  const [quizTypes, setQuizTypes] = useState<string[]>(['multiple_choice', 'true_false', 'main_idea', 'inference', 'guess_meaning']); 
  const [quizStates, setQuizStates] = useState<any[]>([]);
  const [showVocabPanel, setShowVocabPanel] = useState(false); 
  
  const [finalScore, setFinalScore] = useState(0);
  const [gainedExp, setGainedExp] = useState(0);
  const [gainedCoins, setGainedCoins] = useState(0);
  const [currentAwakenedStars, setCurrentAwakenedStars] = useState(0);

  const [lostStar, setLostStar] = useState(false);
  const [cardDropped, setCardDropped] = useState(false);
  const [isKeepingStar, setIsKeepingStar] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [bgData, setBgData] = useState({ stars: [] as any[], clouds: [] as any[] });

  const [timeLimit, setTimeLimit] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [wordMin, setWordMin] = useState(150);
  const [wordMax, setWordMax] = useState(200);

  const [playingSentenceIndex, setPlayingSentenceIndex] = useState(-1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const savedLang = localStorage.getItem('wiki_lastLanguage');
      const savedLevel = localStorage.getItem('wiki_lastLevel');
      if (savedLang) setSelectedLanguage(savedLang);
      else if (user.targetLanguage) setSelectedLanguage(user.targetLanguage);
      if (savedLevel) setSelectedLevel(savedLevel);
      else if (user.languageLevel) setSelectedLevel(user.languageLevel);
    }
  }, [user?.targetLanguage, user?.languageLevel]);

  useEffect(() => {
    const checkTheme = () => document.documentElement.classList.contains('dark');
    setIsDarkMode(checkTheme());
    const observer = new MutationObserver(() => setIsDarkMode(checkTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    setBgData({
      stars: Array.from({ length: 80 }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 40, size: Math.random() * 1.5 + 0.5, delay: Math.random() * 5 })),
      clouds: Array.from({ length: 8 }).map((_, i) => ({ id: i, x: -30, y: 5 + Math.random() * 35, width: 140 + Math.random() * 80, height: 40 + Math.random() * 20, duration: 35 + Math.random() * 20, delay: -(Math.random() * 60), opacity: 0.65 }))
    });

    async function init() {
      if (!params.id) return;
      const resCard = await getWikiCardDetail(Number(params.id)) as any; 
      if (resCard.success && resCard.data) {
        setCard(resCard.data);
        setCurrentAwakenedStars(resCard.data.awakenedStars || 0); 
        setNumQs(Math.min(3, (resCard.data?.totalStars || 1) * 5)); 
      } else router.push("/gacha");
    }
    init();

    return () => { observer.disconnect(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, [params.id, router]);

  useEffect(() => {
    if (step !== 'study' || timeLimit === 0) return;
    if (timeLeft <= 0) { handleFinish(); return; }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft, timeLimit]);

  const sentences = useMemo(() => {
    if (!studyData?.simplifiedText) return [];
    return studyData.simplifiedText.match(/[^.!?\n]+[.!?\n]*/g) || [studyData.simplifiedText];
  }, [studyData?.simplifiedText]);

  const stopPlaying = () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setPlayingSentenceIndex(-1); };

  const playFromSentence = (startIndex: number) => {
    if (!('speechSynthesis' in window)) return alert("Trình duyệt không hỗ trợ đọc.");
    window.speechSynthesis.cancel();
    setPlayingSentenceIndex(startIndex);
    
    const langCode = getSpeechLangCode(selectedLanguage);
    const voices = window.speechSynthesis.getVoices();
    const availableVoices = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(langCode.split('-')[0].toLowerCase()));
    const bestVoice = availableVoices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')) || availableVoices[0];

    for(let i = startIndex; i < sentences.length; i++) {
       const utterance = new SpeechSynthesisUtterance(sentences[i]);
       utterance.lang = langCode;
       if (bestVoice) utterance.voice = bestVoice;
       utterance.rate = 0.85;
       utterance.onstart = () => setPlayingSentenceIndex(i);
       utterance.onend = () => { if (i === sentences.length - 1) setPlayingSentenceIndex(-1); };
       utterance.onerror = () => setPlayingSentenceIndex(-1);
       window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeakWord = (word: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    const langCode = getSpeechLangCode(selectedLanguage);
    utterance.lang = langCode;
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(langCode.split('-')[0].toLowerCase()) && (v.name.includes('Google') || v.name.includes('Premium'))) || voices[0];
    if (bestVoice) utterance.voice = bestVoice;
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  };

  const toggleQuizType = (typeId: string) => setQuizTypes(prev => prev.includes(typeId) && prev.length > 1 ? prev.filter(t => t !== typeId) : [...prev, typeId]);

  const handleGenerateLesson = async () => {
    if (!card || !user?.id) return;
    setStep('loading');
    const resAi = await generateQuizFromWikiCard(user.id, card.id, { numQs, types: quizTypes, wordMin, wordMax, targetLanguage: selectedLanguage, languageLevel: selectedLevel }) as any;
    if (resAi.success && resAi.data) {
      setStudyData(resAi.data);
      setQuizStates(resAi.data.quizzes.map(() => ({ answer: null, checked: false })));
      setTimeLeft(timeLimit * 60); 
      await updateSession(); router.refresh();
      setStep('study');
    } else { alert(resAi.message); setStep('config'); }
  };

  const checkIsCorrect = (qIndex: number) => {
    const state = quizStates[qIndex], quiz = studyData.quizzes[qIndex];
    if (!state.checked) return false;
    const isMultiple = ["multiple_choice", "guess_meaning", "true_false", "main_idea", "inference"].includes(quiz.type);
    const userAns = isMultiple ? String(quiz.options[state.answer as number]) : String(state.answer);
    return quiz.correctAnswers.some((a: string) => String(a).trim().toLowerCase() === userAns.trim().toLowerCase());
  };

  const handleFinish = async () => {
    stopPlaying();
    let score = 0;
    quizStates.forEach((_, i) => { if (checkIsCorrect(i)) score++; });
    const isPass = score >= Math.ceil(studyData?.quizzes?.length / 2);
    
    setFinalScore(score); setGainedExp(score * 10); setStep('result');
    if (!isPass) setTimeout(() => setCardDropped(true), currentAwakenedStars > 0 ? 2500 : 1500);
    if (!isPass && currentAwakenedStars > 0) setLostStar(true);

    if (user?.id) {
      const expRes = await addExpToUser(user.id, card.id, score, isPass) as any;
      if (expRes.success) {
        setGainedExp(expRes.expGained);
        if ('newAwakenedStars' in expRes) setCurrentAwakenedStars(expRes.newAwakenedStars);
        if ('gainedCoins' in expRes) setGainedCoins(expRes.gainedCoins);
      }
      try { await saveWikiQuizHistory(user.id, card.id, score, score, studyData.quizzes.length, quizStates.map(s => String(s.answer)), studyData); } catch (err) {}
      await updateSession(); router.refresh();
    }
  };

  if (!card) return <div className="flex h-screen w-full items-center justify-center text-sm text-slate-500">Đang tải...</div>;
  const isAllChecked = quizStates.length > 0 && quizStates.every(s => s.checked);
  const isPass = finalScore >= Math.ceil(studyData?.quizzes?.length / 2);
  const activeGuessWords = studyData?.quizzes?.filter((q: any) => q.type === 'guess_word' || q.type === 'guess_meaning').map((q: any) => q.targetWord).filter(Boolean) || [];

  return (
    <div className={cn("absolute inset-0 z-0 flex w-full overflow-hidden font-sans transition-colors duration-700 ease-in-out", isDarkMode ? 'bg-[#0b1120] text-slate-100' : 'bg-sky-50 text-slate-800')} >
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none;}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}.dual-range::-webkit-slider-thumb{pointer-events:auto;position:relative;z-index:50;}.dual-range{pointer-events:none;}input[type="range"]::-webkit-slider-thumb{appearance:none;width:16px;height:16px;background:#2563eb;border-radius:50%;cursor:pointer;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.2);}@keyframes driftClouds{from{transform:translateX(-100%);}to{transform:translateX(120vw);}}@keyframes twinkleStar{0%,100%{opacity:0.2;transform:scale(0.7);}50%{opacity:1;transform:scale(1.1);}}.cloud-shape{position:absolute;background:linear-gradient(135deg,rgba(255,255,255,0.95) 0%,rgba(255,225,240,0.85) 100%);filter:blur(10px);border-radius:80px;pointer-events:none;box-shadow:inset 0 -10px 15px rgba(150,140,150,0.25),0 10px 30px rgba(255,255,255,0.4);}@keyframes cardRevealScale{0%{transform:scale(0.3) rotateY(0deg) translateY(50px);opacity:0;}60%{transform:scale(1.1) rotateY(720deg) translateY(0);opacity:1;}100%{transform:scale(1) rotateY(1080deg);opacity:1;}}@keyframes dropFail{0%{transform:scale(0.3) rotateY(0deg) translateY(50px);opacity:0;}30%{transform:scale(1.1) rotateY(360deg) translateY(-20px);opacity:1;}50%{transform:scale(1) rotateY(720deg) translateY(0);opacity:1;}65%{transform:scale(1) rotateY(720deg) translateY(0);opacity:1;}100%{transform:scale(0.6) rotateY(720deg) translateY(150vh) rotateZ(30deg);opacity:0;}}@keyframes outlineDrop{0%{transform:scale(6) translateY(-20px);opacity:0;stroke-width:1.5px;fill:transparent;}50%{transform:scale(1) translateY(0);opacity:1;stroke-width:1.5px;fill:transparent;}90%{transform:scale(1) translateY(0);opacity:1;stroke-width:1.5px;fill:transparent;}100%{transform:scale(1) translateY(0);opacity:0;fill:transparent;}}@keyframes solidFlash{0%,80%{fill:transparent;filter:drop-shadow(0 0 0px transparent);opacity:0;transform:scale(1);}90%{fill:currentColor;filter:drop-shadow(0 0 20px currentColor) brightness(1.5);transform:scale(1.3);opacity:1;}100%{fill:currentColor;filter:drop-shadow(0 0 10px currentColor) brightness(1);transform:scale(1);opacity:1;}}@keyframes fadeInLate{0%{opacity:0;transform:translateY(20px);}100%{opacity:1;transform:translateY(0);}}@keyframes starShatter{0%{transform:scale(1);opacity:1;filter:drop-shadow(0 0 10px red);}20%{transform:scale(1.5) rotate(15deg);filter:drop-shadow(0 0 30px red) brightness(2);}100%{transform:scale(4) rotate(-20deg);opacity:0;filter:blur(10px);}}@keyframes cardDropOut{0%{transform:scale(1) translateY(0) rotateZ(0);opacity:1;}100%{transform:scale(0.6) translateY(100vh) rotateZ(30deg);opacity:0;}}@keyframes slideUpCenter{0%{transform:translateY(100px);opacity:0;}100%{transform:translateY(0);opacity:1;}}`}</style>
      <SceneBackground isDarkMode={isDarkMode} bgData={bgData} step={step} />

      <div className="flex flex-1 w-full h-full relative z-10 lg:flex-row flex-col">
        <div className="flex-1 flex flex-col items-center w-full h-full overflow-y-auto no-scrollbar">
          {(step === 'config' || step === 'study') && (
            <div className="w-full flex justify-between items-center p-4 lg:px-8 sticky top-0 z-50 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={() => { stopPlaying(); router.back() }} className="flex items-center gap-1 px-3 py-1.5 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 backdrop-blur-md rounded-lg font-bold text-xs sm:text-sm transition-colors border border-slate-300 dark:border-slate-700 shadow-sm"><ArrowLeft size={16} /> Kho thẻ</button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{selectedLanguage}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-60"></span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">{selectedLevel}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {timeLimit > 0 && step === 'study' && (<div className={cn("flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-xl font-black text-sm border shadow-sm transition-colors", timeLeft <= 60 ? "bg-red-100 text-red-600 border-red-300 animate-pulse" : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 backdrop-blur-md")}>⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>)}
                {!showVocabPanel && step === 'study' && (<button onClick={() => setShowVocabPanel(true)} className="flex items-center gap-1.5 px-4 py-2 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 shrink-0 border border-blue-400/30"><BookOpen size={16} /> <span className="hidden sm:inline">Từ Vựng</span><span className="sm:hidden">Từ Vựng</span></button>)}
              </div>
            </div>
          )}
          
          <div className={cn("w-full mx-auto flex-1 flex flex-col", (step === 'config' || step === 'study') ? 'px-4 pb-12 sm:px-6 lg:px-8' : 'items-center justify-center p-4 min-h-[70vh] lg:min-h-full')}>
            {step === 'config' && (
               <StudyConfig isPro={user?.isPro || false} selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel} numQs={numQs} setNumQs={setNumQs} timeLimit={timeLimit} setTimeLimit={setTimeLimit} wordMin={wordMin} setWordMin={setWordMin} wordMax={wordMax} setWordMax={setWordMax} quizTypes={quizTypes} toggleQuizType={toggleQuizType} handleGenerateLesson={handleGenerateLesson} />
            )}

            {step === 'loading' && (
               <div className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-3xl p-8 sm:p-10 flex flex-col items-center shadow-2xl animate-in zoom-in-95 max-w-lg mx-auto">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 border-[4px] sm:border-[5px] border-blue-500 border-t-transparent rounded-full animate-spin mb-4 sm:mb-6" />
                 <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-200 animate-pulse text-center">AI đang thiết kế {numQs} câu hỏi...</h3>
               </div>
            )}

            {/* ĐÃ FIX: Phần bài đọc giãn rộng ra tối đa với max-w-[1600px] thay vì 1200px như cũ */}
            {step === 'study' && studyData && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500 w-full lg:w-[95%] max-w-[1600px] mx-auto pb-32 lg:pb-12">
                <div className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl rounded-2xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden w-full">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                     <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight drop-shadow-sm">{card.title}</h1>
                     <div className="flex items-center gap-2">
                        {playingSentenceIndex >= 0 ? (<button onClick={stopPlaying} className="p-2.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors shadow-sm"><Square size={20}/></button>) : (<button onClick={() => playFromSentence(0)} className="p-2.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors shadow-sm"><Volume2 size={20}/></button>)}
                     </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4">💡 Gợi ý: Bấm vào một câu bất kỳ để máy đọc bắt đầu từ đoạn đó.</p>
                  <div className="text-[14px] sm:text-[15px] lg:text-base text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose whitespace-pre-line text-justify font-medium">
                    {sentences.map((sentence: string, i: number) => (
                       <span key={i} onClick={() => playFromSentence(i)} className={cn("cursor-pointer transition-colors duration-200", playingSentenceIndex === i ? "bg-blue-200/50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 rounded shadow-sm" : "hover:bg-slate-200 dark:hover:bg-slate-800")}>
                          {renderTextWithTooltips(sentence, studyData.vocabularies, activeGuessWords)}
                       </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4 w-full">
                  <div className="flex items-center gap-2 sm:gap-3 border-b-2 border-slate-200 dark:border-slate-800 pb-2 sm:pb-3 px-1 sm:px-2">
                    <Target className="text-blue-600 dark:text-blue-400 w-6 h-6 sm:w-8 sm:h-8" />
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest drop-shadow-sm">Kiểm tra tri thức</h2>
                  </div>

                  {studyData.quizzes.map((quiz: any, qIdx: number) => {
                    const state = quizStates[qIdx], isChecked = state?.checked, isCorrect = checkIsCorrect(qIdx);
                    const isMultiple = ["multiple_choice", "guess_meaning", "true_false", "main_idea", "inference"].includes(quiz.type);
                    return (
                      <div key={qIdx} className="bg-white/95 dark:bg-[#151e2e]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                           <span className="text-blue-600 dark:text-blue-400 font-black text-lg sm:text-xl md:text-2xl drop-shadow-sm">Q{qIdx + 1}.</span>
                           <div className="flex-1">
                             <span className={cn("inline-block px-2 sm:px-3 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 sm:mb-3 border", quiz.type === 'inference' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700' : quiz.type === 'true_false' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700' : quiz.type === 'guess_meaning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700')}>
                                {quiz.type === 'multiple_choice' ? 'Trắc nghiệm' : quiz.type === 'true_false' ? 'Đúng / Sai' : quiz.type === 'main_idea' ? 'Ý chính' : quiz.type === 'inference' ? 'Suy luận' : 'Đoán nghĩa'}
                              </span>
                             <p className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white leading-snug">{quiz.question}</p>
                           </div>
                        </div>
                        {isMultiple ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
                            {quiz.options.map((opt: string, oIdx: number) => {
                              const isOptCorrect = quiz.correctAnswers.some((a:string) => String(a).trim().toLowerCase() === String(opt).trim().toLowerCase()), isSelected = state?.answer === oIdx;
                              let btnClass = "bg-slate-50 dark:bg-[#0b1120] hover:bg-slate-100 dark:hover:bg-[#1e293b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                              if (isChecked) btnClass = isOptCorrect ? "bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 shadow-md" : isSelected ? "bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300" : "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 opacity-50";
                              else if (isSelected) btnClass = "bg-blue-50 dark:bg-blue-900/40 border-blue-500 text-blue-800 dark:text-blue-100 border-[2px] shadow-sm";
                              return (
                                <button key={oIdx} disabled={isChecked} onClick={() => setQuizStates(p => { const n = [...p]; n[qIdx].answer = oIdx; return n; })} className={cn("px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between text-[13px] sm:text-[14px] font-semibold", btnClass)}>
                                  <span>{opt}</span>{isChecked && isOptCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}{isChecked && isSelected && !isOptCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mb-4">
                            {quiz.options?.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">Gợi ý: {quiz.options.join(" | ")}</p>}
                            <input type="text" disabled={isChecked} placeholder="Gõ câu trả lời..." value={state?.answer || ""} onChange={(e) => setQuizStates(p => { const n = [...p]; n[qIdx].answer = e.target.value; return n; })} className={cn("w-full px-4 py-2.5 sm:py-3 rounded-xl border-2 bg-transparent outline-none transition-all text-[14px] sm:text-[15px] font-bold", isChecked ? isCorrect ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10" : "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10" : "border-slate-300 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white")} />
                          </div>
                        )}
                        {!isChecked && state?.answer !== null && state?.answer !== "" && (<button onClick={() => setQuizStates(p => { const n = [...p]; n[qIdx].checked = true; return n; })} className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-xs sm:text-sm uppercase tracking-wider">Xác nhận</button>)}
                        {isChecked && (
                          <div className={cn("mt-4 p-3 sm:p-4 border-2 rounded-xl animate-in slide-in-from-top-4", isCorrect ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30")}>
                            {!isCorrect && (quiz.type === "fill_in_blank" || quiz.type === "guess_word") && <p className="font-bold text-red-600 dark:text-red-400 mb-1 text-[13px] sm:text-[14px]">Đáp án đúng: {quiz.correctAnswers.join(" hoặc ")}</p>}
                            <p className={cn("text-[12px] sm:text-[13px] leading-relaxed", isCorrect ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200")}><span className="font-black uppercase tracking-widest text-[9px] sm:text-[10px] mr-1 block mb-1 opacity-70">Giải thích</span> {quiz.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button disabled={!isAllChecked} onClick={handleFinish} className={cn("w-full py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base lg:text-lg uppercase tracking-widest transition-all backdrop-blur-md", isAllChecked ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-xl hover:-translate-y-1" : "bg-slate-200/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-600 cursor-not-allowed")}>{isAllChecked ? "Hoàn tất bài học" : "Trả lời hết để nộp bài"}</button>
              </div>
            )}

            {step === 'result' && (
            <div className="flex flex-col items-center justify-center w-full relative -mt-16 z-30 max-w-md mx-auto">
              {isPass && <Confetti width={windowSize.width} height={windowSize.height} style={{ pointerEvents: 'none', position: 'fixed', top: 0, left: 0, zIndex: 100 }} recycle={false} numberOfPieces={300} gravity={0.2} />}
              <div className="flex justify-center my-6"><WikiCard3D card={card} currentAwakenedStars={currentAwakenedStars} isPass={isPass} isRestored={isRestored} lostStar={lostStar} cardDropped={cardDropped} scale={1} /></div>
              {(isPass || isRestored) ? (
                <div className="flex flex-col items-center animate-[fadeInLate_0.5s_ease-out_1.5s_both] z-50 mt-12">
                  <div className={cn("px-5 py-2.5 sm:px-6 sm:py-3 rounded-full flex items-center gap-2 sm:gap-3 shadow-xl mb-4 sm:mb-5 transition-colors border", isDarkMode ? "bg-[#0b1120] border-slate-700" : "bg-white border-slate-300")}>
                    <span className={cn("font-black text-lg sm:text-xl drop-shadow-sm", isDarkMode ? "text-green-400" : "text-green-600")}>+{gainedExp} XP</span>
                    {isRestored ? (<span className="font-black text-lg sm:text-xl text-yellow-500 drop-shadow-sm flex items-center gap-2"><Sparkles size={20} /> Đã khôi phục +1 Sao</span>) : gainedCoins > 0 && (<><span className="w-1.5 h-1.5 bg-slate-400/50 rounded-full mx-1"></span><span className={cn("font-black text-lg sm:text-xl drop-shadow-sm", isDarkMode ? "text-yellow-400" : "text-yellow-600")}>+{gainedCoins} Xu</span><span className="w-1.5 h-1.5 bg-slate-400/50 rounded-full mx-1"></span><span className={cn("font-black text-lg sm:text-xl drop-shadow-sm", isDarkMode ? "text-purple-400" : "text-purple-600")}>+1 Sao</span></>)}
                  </div>
                  <button onClick={() => router.push('/wiki-manager')} className={cn("px-12 py-3.5 font-black text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 border-2 shadow-lg", isDarkMode ? "bg-[#0b1120] text-white border-white hover:bg-white/10" : "bg-white text-black border-black hover:bg-black/5")}>Xác nhận</button>
                </div>
              ) : cardDropped && (
                <div className="flex flex-col items-center w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12 z-50 px-4">
                    {lostStar && (
                        <div className={cn("px-5 py-3 rounded-full flex items-center gap-3 shadow-xl mb-4 border animate-[slideUpCenter_0.4s_ease-out_forwards] relative z-[99] pointer-events-auto", isDarkMode ? "bg-[#111827] border-red-900/50" : "bg-white border-red-200")}>
                            <span className="font-black text-lg text-red-500 drop-shadow-sm">-1 Sao</span><span className="w-1.5 h-1.5 bg-slate-400/50 rounded-full mx-1"></span>
                            <button disabled={isKeepingStar} onClick={async (e) => { e.preventDefault(); e.stopPropagation(); try { setIsKeepingStar(true); const res = await keepCardStar(user?.id, card?.id); if (res?.success) { setLostStar(false); setCardDropped(false); setCurrentAwakenedStars(p => p + 1); setIsRestored(true); await updateSession(); } else alert(res?.message || "Lỗi!"); } catch (err) { alert("Lỗi!"); } finally { setIsKeepingStar(false); } }} className={cn("text-[13px] font-black text-white px-3 py-1.5 rounded-lg shadow-md flex items-center transition-all", isKeepingStar ? "bg-slate-400 cursor-wait" : "bg-yellow-500 hover:bg-yellow-400 active:scale-95")}>{isKeepingStar ? "Đang xử lý..." : "Giữ sao (-50 Xu)"}</button>
                        </div>
                    )}
                  <div className={cn("text-center w-full max-w-sm p-6 sm:p-8 rounded-3xl border shadow-2xl animate-[slideUpCenter_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]", isDarkMode ? "bg-[#111827] border-slate-700" : "bg-white border-slate-300")} style={{ animationDelay: lostStar ? '0.2s' : '0s' }}>
                      <Trophy className="w-16 h-16 text-slate-600 dark:text-slate-500 mx-auto mb-3 opacity-50" /><h2 className="text-3xl font-black text-slate-500 uppercase tracking-widest">Thất bại</h2><p className="text-slate-500 text-lg font-medium mt-2 mb-6">Đúng {finalScore}/{studyData.quizzes.length} câu. Cần 50% để qua!</p>
                      <button onClick={() => router.back()} className={cn("w-full py-3.5 font-black text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 border-2 shadow-sm", isDarkMode ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200")}>Thử lại sau</button>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {step === 'study' && showVocabPanel && <VocabSidebar studyData={studyData} setShowVocabPanel={setShowVocabPanel} handleSpeakWord={handleSpeakWord} />}
      </div>
    </div>
  );
}