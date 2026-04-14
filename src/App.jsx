/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, User, Users, Volume2, VolumeX, Settings, Plus, Trash2, Save, X, Info } from 'lucide-react';

// --- DANH SÁCH CÂU HỎI (CÓ THỂ DỄ DÀNG CHỈNH SỬA) ---
const QUESTIONS_LIST = [
  { q: "5 + 7 = ?", a: 12 },
  { q: "12 - 4 = ?", a: 8 },
  { q: "3 x 4 = ?", a: 12 },
  { q: "15 : 3 = ?", a: 5 },
  { q: "20 + 15 = ?", a: 35 },
  { q: "40 - 18 = ?", a: 22 },
  { q: "6 x 7 = ?", a: 42 },
  { q: "32 : 4 = ?", a: 8 },
  { q: "9 + 14 = ?", a: 23 },
  { q: "25 - 9 = ?", a: 16 },
  { q: "8 x 3 = ?", a: 24 },
  { q: "45 : 5 = ?", a: 9 },
  { q: "13 + 27 = ?", a: 40 },
  { q: "50 - 25 = ?", a: 25 },
  { q: "7 x 4 = ?", a: 28 },
  { q: "18 : 2 = ?", a: 9 },
  { q: "11 + 19 = ?", a: 30 },
  { q: "36 - 12 = ?", a: 24 },
  { q: "5 x 9 = ?", a: 45 },
  { q: "24 : 6 = ?", a: 4 },
  { q: "17 + 8 = ?", a: 25 },
  { q: "29 - 14 = ?", a: 15 },
  { q: "10 x 2 = ?", a: 20 },
  { q: "60 : 10 = ?", a: 6 },
  { q: "22 + 33 = ?", a: 55 },
  { q: "48 - 20 = ?", a: 28 },
  { q: "4 x 8 = ?", a: 32 },
  { q: "21 : 3 = ?", a: 7 },
  { q: "14 + 16 = ?", a: 30 },
  { q: "30 - 15 = ?", a: 15 }
];

export default function App() {
  const [questions, setQuestions] = useState(QUESTIONS_LIST);
  const [gameState, setGameState] = useState('start');
  const [isAIMode, setIsAIMode] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
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
    nextQuestion();
    
    // Bắt đầu phát nhạc khi người chơi tương tác
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Autoplay blocked:", err));
    }
  };

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
  }, [turn, isAIMode, gameState, currentQuestion, feedback]);

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

    const newPos = turn === 'A' ? position + 2 : position - 2;
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
                <Settings size={16} /> Chế độ Giáo viên
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
            className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full border-4 border-stone-400 flex flex-col h-[80vh]"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <Settings size={20} /> Quản lý câu hỏi
              </h2>
              <button onClick={() => setGameState('start')} className="text-stone-400 hover:text-stone-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase">Câu hỏi</label>
                <input
                  type="text"
                  placeholder="VD: 2 + 2 = ?"
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  className="p-2 border-2 border-stone-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex flex-col gap-1 w-20">
                <label className="text-[10px] font-bold text-stone-500 uppercase">Đáp án</label>
                <input
                  type="text"
                  placeholder="Đáp án"
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                  className="p-2 border-2 border-stone-200 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={() => {
                  if (newQ && newA) {
                    setQuestions([...questions, { q: newQ, a: newA }]);
                    setNewQ('');
                    setNewA('');
                  }
                }}
                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 self-end mb-[2px]"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4 custom-scrollbar">
              {questions.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="text-sm">
                    <span className="font-bold text-stone-700">{item.q}</span>
                    <span className="ml-2 text-green-600">= {item.a}</span>
                  </div>
                  <button
                    onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setGameState('start')}
              className="bg-stone-800 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> Lưu và Quay lại
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

                  <div className="flex items-center gap-2 text-amber-600 font-bold">
                    <Trophy size={20} />
                    <span className="text-sm uppercase tracking-tighter">Đang thi đấu</span>
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

      {/* Footer Info */}
      <div className="absolute bottom-2 text-stone-500 font-medium text-[10px]">
        Trò chơi dân gian Việt Nam - Phiên bản Học tập
      </div>
    </div>
  );
}
