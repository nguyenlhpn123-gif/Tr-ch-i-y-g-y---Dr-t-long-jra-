/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, User, Users, Volume2, VolumeX, Settings, Plus, Trash2, Save, X, Info } from 'lucide-react';

// --- NGÂN HÀNG CÂU HỎI THEO KHỐI LỚP ---
const QUESTION_BANK = {
  grade1: [
    { q: "7 + 2", a: "9" },
    { q: "5 + 3", a: "8" },
    { q: "9 - 4", a: "5" },
    { q: "10 - 6", a: "4" },
    { q: "23 + 15", a: "38" },
    { q: "45 - 20", a: "25" },
    { q: "34 + 12", a: "46" },
    { q: "56 - 30", a: "26" },
    { q: "12 + 7", a: "19" },
    { q: "28 - 14", a: "14" }
  ],
  grade2: [
    { q: "345 > 354 (đúng hay sai)", a: "sai" },
    { q: "678 < 700 (đúng hay sai)", a: "đúng" },
    { q: "245 + 123", a: "368" },
    { q: "500 - 245", a: "255" },
    { q: "346 + 122", a: "468" },
    { q: "700 - 356", a: "344" },
    { q: "2 x 5", a: "10" },
    { q: "5 x 6", a: "30" },
    { q: "10 : 2", a: "5" },
    { q: "25 : 5", a: "5" }
  ],
  grade3: [
    { q: "3456 > 3465 (đúng hay sai)", a: "sai" },
    { q: "7890 < 8000 (đúng hay sai)", a: "đúng" },
    { q: "4567 + 1234", a: "5801" },
    { q: "7000 - 3567", a: "3433" },
    { q: "2345 + 4321", a: "6666" },
    { q: "8000 - 2456", a: "5544" },
    { q: "123 x 3", a: "369" },
    { q: "245 x 2", a: "490" },
    { q: "864 : 4", a: "216" },
    { q: "945 : 5", a: "189" }
  ],
  grade4: [
    { q: "456789 > 456780 (đúng hay sai)", a: "đúng" },
    { q: "123456 < 123450 (đúng hay sai)", a: "sai" },
    { q: "Làm tròn 456789 đến hàng nghìn", a: "457000" },
    { q: "Làm tròn 123456 đến hàng chục nghìn", a: "120000" },
    { q: "34567 + 23456", a: "58023" },
    { q: "80000 - 45678", a: "34322" },
    { q: "123 x 45", a: "5535" },
    { q: "246 x 12", a: "2952" },
    { q: "1440 : 12", a: "120" },
    { q: "Trung bình của 10, 20, 30", a: "20" }
  ],
  grade5: [
    { q: "4.5 > 4.05 (đúng hay sai)", a: "đúng" },
    { q: "3.25 < 3.3 (đúng hay sai)", a: "đúng" },
    { q: "Làm tròn 12.345 đến hàng phần mười", a: "12.3" },
    { q: "Làm tròn 45.678 đến hàng đơn vị", a: "46" },
    { q: "12.5 + 3.75", a: "16.25" },
    { q: "20.5 - 4.25", a: "16.25" },
    { q: "12 x 2.5", a: "30" },
    { q: "45 x 1.2", a: "54" },
    { q: "36 : 1.5", a: "24" },
    { q: "Trung bình của 2.5, 3.5, 4", a: "3.33" }
  ]
};

export default function App() {
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const saved = localStorage.getItem('tug-math-selected-grade');
    return saved || 'grade1';
  });
  const [questions, setQuestions] = useState(QUESTION_BANK[selectedGrade]);
  const [gameState, setGameState] = useState('start');
  const [isAIMode, setIsAIMode] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeLimit, setTimeLimit] = useState(() => {
    const saved = localStorage.getItem('tug-math-time-limit');
    return saved ? parseInt(saved) : 10;
  });
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [turn, setTurn] = useState('A');
  const [position, setPosition] = useState(0); // 0 là ở giữa, dương là Đội A thắng thế, âm là Đội B thắng thế
  const [currentQuestion, setCurrentQuestion] = useState(questions[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [winner, setWinner] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Teacher Mode States
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  const inputRef = useRef(null);
  const audioRef = useRef(null);

  const WIN_THRESHOLD = 5; // Đẩy 5 bước là thắng

  // Chuyển câu hỏi ngẫu nhiên
  const nextQuestion = useCallback(() => {
    if (questions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIndex]);
    setUserAnswer('');
    setFeedback(null);
    setTimeLeft(timeLimit);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  }, [questions]);

  // Khởi động trò chơi
  const startGame = (aiMode = false) => {
    setIsAIMode(aiMode);
    setGameState('playing');
    setPosition(0);
    setTurn('A');
    setWinner(null);
    setTimeLeft(timeLimit);
    nextQuestion();
    
    // Bắt đầu phát nhạc khi người chơi tương tác
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Autoplay blocked:", err));
    }
  };

  // Cập nhật âm lượng
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Xử lý khi trả lời sai
  const handleWrongAnswer = useCallback((msg = "Sai rồi!") => {
    setFeedback({ type: 'wrong', text: msg });
    setTimeout(() => {
      setTurn(prev => prev === 'A' ? 'B' : 'A');
      nextQuestion();
    }, 1500);
  }, [nextQuestion]);

  const handleCorrectAnswer = () => {
    playSound('/dapan.mp3');
    setFeedback({ type: 'correct', text: 'Chính xác! Đẩy nào!' });
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    const newPos = turn === 'A' ? position + 1 : position - 1;
    setPosition(newPos);

    if (Math.abs(newPos) >= WIN_THRESHOLD) {
      const finalPos = newPos > 0 ? 15 : -15; // Đẩy mạnh ra ngoài
      setPosition(finalPos);
      setWinner(newPos > 0 ? 'A' : 'B');
      playSound('/dich.mp3');
      setTimeout(() => {
        setGameState('won');
      }, 1000);
    } else {
      setTimeout(() => {
        setTurn(turn === 'A' ? 'B' : 'A');
        nextQuestion();
      }, 1500);
    }
  };

  // Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && feedback === null && !winner) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleWrongAnswer("Hết thời gian!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, feedback, winner, handleWrongAnswer]);

  // AI Turn Logic
  useEffect(() => {
    if (gameState === 'playing' && turn === 'B' && isAIMode && !feedback) {
      const aiThinkingTime = 1500 + Math.random() * 1000;
      const timer = setTimeout(() => {
        // AI success rate (e.g., 75%)
        const isCorrect = Math.random() < 0.75;
        if (isCorrect) {
          setUserAnswer(currentQuestion.a.toString());
          setTimeout(() => {
            handleCorrectAnswer();
          }, 500);
        } else {
          // AI "types" a wrong answer or just fails
          setUserAnswer("?"); 
          setTimeout(() => {
            handleWrongAnswer("AI đã trả lời sai!");
          }, 500);
        }
      }, aiThinkingTime);
      return () => clearTimeout(timer);
    }
  }, [turn, isAIMode, gameState, currentQuestion, feedback, handleCorrectAnswer, handleWrongAnswer]);

  const playSound = (src) => {
    if (isMuted) return;
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(err => console.log("Sound play blocked or failed:", err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userAnswer === '' || feedback) return;

    const normalizedUserAnswer = userAnswer.toString().trim().toLowerCase();
    const normalizedCorrectAnswer = currentQuestion.a.toString().trim().toLowerCase();

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-game flex flex-col items-center justify-center p-2 font-sans text-stone-900">
      <audio ref={audioRef} src="/nhacchinh.mp3" loop />
      
      {/* Volume Control */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Nút Info (i) */}
        <button
          onClick={() => setShowInfo(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
          title="Giới thiệu trò chơi"
        >
          <Info size={20} />
        </button>

        {/* Nút Settings (i) */}
        <button
          onClick={() => setShowSettings(true)}
          className="bg-stone-600 hover:bg-stone-700 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
          title="Cài đặt thời gian"
        >
          <Settings size={20} />
        </button>

        <div className="bg-white/80 backdrop-blur p-2 rounded-2xl shadow-lg border-2 border-amber-200 flex items-center gap-2">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-amber-600 hover:text-amber-700 transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-24 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-amber-500"
          >
            <h1 className="text-3xl font-bold text-amber-600 mb-4 uppercase tracking-wider">Đẩy Gậy Toán Học</h1>
            <div className="flex justify-center mb-6 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-500 overflow-hidden">
                  <User size={40} className="text-blue-600" />
                </div>
                <span className="mt-1 font-bold text-blue-600 text-sm">Đội A</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-lg border-4 border-red-500 overflow-hidden">
                  <User size={40} className="text-red-600" />
                </div>
                <span className="mt-1 font-bold text-red-600 text-sm">Đội B</span>
              </div>
            </div>
            <p className="text-stone-600 mb-6 leading-relaxed text-sm">
              Trả lời đúng để đẩy gậy về phía đối thủ. Đẩy đối thủ ra khỏi vòng tròn để giành chiến thắng!
            </p>
            <div className="flex flex-col gap-3">
              <div className="bg-stone-50 px-4 py-2 rounded-xl text-stone-500 font-bold text-xs uppercase tracking-wider mb-1">
                Bộ câu hỏi: Lớp {selectedGrade.replace('grade', '')}
              </div>
              <button
                onClick={() => setShowRules(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full text-sm shadow transition-all flex items-center justify-center gap-2 mx-auto w-full"
              >
                Luật chơi
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => startGame(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-full text-sm shadow-lg transition-all flex items-center justify-center gap-2 flex-1"
                >
                  <Users size={18} /> 2 Người chơi
                </button>
                <button
                  onClick={() => startGame(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-full text-sm shadow-lg transition-all flex items-center justify-center gap-2 flex-1"
                >
                  <Play fill="currentColor" size={18} /> Chơi với AI
                </button>
              </div>
              <button
                onClick={() => setGameState('teacher')}
                className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-2 px-8 rounded-full text-sm shadow transition-all flex items-center justify-center gap-2 mx-auto w-full"
              >
                ⚙️ Giáo viên
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'teacher' && (
          <motion.div
            key="teacher"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full border-4 border-stone-400 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <Settings size={20} /> Cài đặt Giáo viên
              </h2>
              <button onClick={() => setGameState('start')} className="text-stone-400 hover:text-stone-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 mb-8">
              {/* Chọn Lớp */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest px-1">Chọn khối lớp</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    const grade = e.target.value;
                    setSelectedGrade(grade);
                    setQuestions(QUESTION_BANK[grade]);
                  }}
                  className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-2xl font-bold text-stone-700 focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="grade1">Lớp 1 (Số 1-100, Cộng trừ đơn giản)</option>
                  <option value="grade2">Lớp 2 (Số 1-1000, Nhân chia 2 & 5)</option>
                  <option value="grade3">Lớp 3 (Số 10000, Nhân chia 1 chữ số)</option>
                  <option value="grade4">Lớp 4 (Số triệu, Làm tròn, Nhân chia 2 chữ số)</option>
                  <option value="grade5">Lớp 5 (Số thập phân, Nhân chia nâng cao)</option>
                </select>
              </div>

              {/* Chỉnh Thời gian */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest px-1">Thời gian trả lời (5-90 giây)</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    className="flex-1 h-3 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="w-16 h-12 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center font-black text-amber-600">
                    {timeLimit}s
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('tug-math-selected-grade', selectedGrade);
                localStorage.setItem('tug-math-time-limit', timeLimit.toString());
                setGameState('start');
              }}
              className="bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> Lưu cài đặt
            </button>
          </motion.div>
        )}

        {gameState === 'playing' || gameState === 'won' ? (
          <motion.div
            key="game-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl flex flex-col items-center gap-2"
          >
            {gameState === 'playing' && (
              <>
                {/* Header: Turn & Timer */}
                <div className="w-full flex justify-between items-center bg-white/80 backdrop-blur p-2 rounded-2xl shadow-md border-b-4 border-amber-200">
                  <div className={`flex items-center gap-2 px-4 py-1 rounded-full transition-colors ${turn === 'A' ? 'bg-blue-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    <Users size={18} />
                    <span className="font-bold text-lg">Đội A</span>
                  </div>

                  <div className="flex flex-col items-center gap-0">
                    <div className="flex items-center gap-1 mb-[-2px]">
                      <span className="text-[8px] font-black uppercase text-amber-500">Lớp {selectedGrade.replace('grade', '')}</span>
                    </div>
                    <div className={`text-2xl font-black tabular-nums transition-colors ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>
                      {timeLeft}s
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-4 py-1 rounded-full transition-colors ${turn === 'B' ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    <span className="font-bold text-lg">{isAIMode ? 'Máy (AI)' : 'Đội B'}</span>
                    <Users size={18} />
                  </div>
                </div>

                {/* Question Area */}
                <div className="bg-white p-3 rounded-2xl shadow-xl w-full max-w-md border-4 border-amber-400 text-center">
                  <h2 className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Câu hỏi cho Đội {turn}</h2>
                  <div className="text-3xl font-black text-stone-800 mb-3">{currentQuestion.q}</div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={feedback !== null}
                      placeholder="Nhập đáp án..."
                      className="w-full text-center text-2xl p-2 rounded-xl border-4 border-stone-200 focus:border-amber-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={feedback !== null}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 text-white font-bold py-2 rounded-xl text-lg shadow-lg transition-all"
                    >
                      Trả lời
                    </button>
                  </form>

                  {/* Feedback Overlay */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`mt-2 p-2 rounded-lg font-bold text-lg ${feedback.type === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {feedback.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {gameState === 'won' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
              >
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-sm w-full border-8 border-yellow-400"
                >
                  <div className="flex justify-center mb-2">
                    <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                      <Trophy size={48} />
                    </div>
                  </div>
                <h1 className="text-3xl font-black text-stone-800 mb-1 uppercase">Chiến Thắng!</h1>
                <p className="text-xl font-bold text-amber-600 mb-4 uppercase tracking-widest">
                  {isAIMode && winner === 'B' ? 'Máy (AI) đã thắng' : `Đội ${winner} đã thắng`}
                </p>
                  <div className="bg-stone-50 p-3 rounded-xl mb-4">
                    <p className="text-stone-600 italic text-sm">"Một màn trình diễn tuyệt vời!"</p>
                  </div>
                  <button
                    onClick={startGame}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg transition-all flex items-center gap-2 mx-auto"
                  >
                    <RotateCcw size={20} /> Chơi lại
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Game Arena */}
            <div className="relative w-full h-[250px] bg-stone-200/50 rounded-full border-4 border-stone-300 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Center Line */}
              <div className="absolute h-full w-1 bg-stone-400/50 left-1/2 -translate-x-1/2"></div>

              {/* Stick & Characters Container */}
              <motion.div
                animate={{ x: position * 40 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className={`relative ${isShaking ? 'animate-shake' : ''}`}
              >
                <img 
                  src="/nhanvat.png" 
                  alt="Đẩy gậy" 
                  className="w-[800px] h-auto max-h-[200px] object-contain" 
                  referrerPolicy="no-referrer" 
                />
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRules(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-4 border-blue-500 relative"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                <Trophy size={24} /> Luật chơi Đẩy Gậy
              </h2>
              <div className="space-y-4 text-stone-700 leading-relaxed">
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                  <p>Trò chơi dành cho 2 đội (Đội A và Đội B).</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                  <p>Mỗi lượt, một đội sẽ nhận được một câu hỏi toán học.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                  <p>Nếu trả lời <b>đúng</b>, đội của bạn sẽ đẩy gậy về phía đối thủ.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                  <p>Nếu trả lời <b>sai</b>, lượt chơi sẽ chuyển sang đội đối phương.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0">5</div>
                  <p>Đội nào đẩy được đối thủ ra khỏi vòng tròn trước sẽ giành <b>chiến thắng</b>!</p>
                </div>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
              >
                Đã hiểu!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal (Giới thiệu trò chơi) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border-4 border-orange-500 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={28} />
              </button>
              
              <h2 className="text-3xl font-bold text-orange-600 mb-6 text-center uppercase tracking-tight">
                Giới thiệu trò chơi
              </h2>
              
              <div className="space-y-4 text-stone-700 leading-relaxed text-justify">
                <p>
                  Trò chơi dân gian đẩy gậy (Drút ‘long ira) là một hoạt động thể thao truyền thống của người Bahnar, 
                  được nhiều thanh thiếu niên và nhi đồng yêu thích. Trò chơi thường diễn ra trên sân nhà rông hoặc 
                  bãi đất bằng phẳng, với mỗi lượt có hai người tham gia và sử dụng một cây gậy tre làm dụng cụ thi đấu.
                </p>
                <p>
                  Hai người chơi đứng đối diện nhau qua một vạch ranh giới, mỗi người nắm một đầu gậy và dùng sức đẩy 
                  đối phương ra khỏi vạch. Người thắng là người đẩy được đối thủ ra khỏi ranh giới. 
                </p>
                <p>
                  Trò chơi không chỉ mang lại niềm vui mà còn giúp rèn luyện sức khỏe, sự khéo léo và tinh thần thi đấu, 
                  đồng thời góp phần giữ gìn bản sắc văn hóa dân tộc.
                </p>
              </div>
              
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowInfo(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-10 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border-4 border-stone-600 relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                <Settings size={24} /> Cài đặt thời gian
              </h2>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-stone-500 uppercase">Thời gian trả lời (giây)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="5"
                      max="90"
                      value={timeLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 5;
                        setTimeLimit(val);
                      }}
                      className="flex-1 p-3 border-2 border-stone-200 rounded-xl text-xl font-bold focus:border-amber-500 outline-none"
                    />
                    <span className="text-xl font-bold text-stone-400">giây</span>
                  </div>
                  <p className="text-xs text-stone-400 italic">Giới hạn từ 5 đến 90 giây</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  let finalLimit = timeLimit;
                  if (finalLimit < 5) finalLimit = 5;
                  if (finalLimit > 90) finalLimit = 90;
                  setTimeLimit(finalLimit);
                  localStorage.setItem('tug-math-time-limit', finalLimit.toString());
                  setShowSettings(false);
                  if (gameState === 'playing') {
                    setTimeLeft(finalLimit); // Reset timer immediately if playing
                  }
                }}
                className="mt-8 w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} /> Lưu cài đặt
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="absolute bottom-2 text-stone-500 font-medium text-[10px]">
        Trò chơi dân gian Việt Nam - Phiên bản Học tập
      </div>
    </div>
  );
}
