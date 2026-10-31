import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, Video, ShieldCheck, BarChart3, Users, Clock, 
  ArrowRight, Award, Zap, HelpCircle, Send, Check, Play, Square,
  Lock, ChevronDown, ChevronUp, DollarSign, Copy, MessageCircle, AlertCircle,
  RefreshCw, KeyRound, UserCheck, PlayCircle, Eye, FileText, Share2, Volume2, Plus, Trash2
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function App() {
  // Global Mode: 'candidate' | 'interviewer' | 'sales'
  const [appMode, setAppMode] = useState('candidate');
  
  // PIN protection for Interviewer Dashboard
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const DEFAULT_PIN = '1234';

  // Active Session State
  const [sessionId] = useState('INNO-8921');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Questions Database (Managed by Interviewer)
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      competency: 'Liderazgo y Gestión de Conflictos',
      question: 'Cuéntanos de alguna ocasión en la que tuviste un desacuerdo técnico severo con un miembro clave de tu equipo. ¿Cómo manejaste la situación y cuál fue el resultado final?',
      timeLimit: 120,
      starGuide: 'Evaluar empatía, escucha activa y enfoque en la solución de problemas sin perder el objetivo del proyecto.'
    },
    {
      id: 'q2',
      competency: 'Pensamiento Crítico y Resolución de Problemas',
      question: 'Caso Real: Un proyecto crítico sufre un retraso imprevisto del 30% a una semana de la entrega debido a una falla de un proveedor externo. ¿Qué pasos inmediatos ejecutas?',
      timeLimit: 180,
      starGuide: 'Observar capacidad de priorización bajo presión, comunicación transparente con clientes y planes de contingencia.'
    },
    {
      id: 'q3',
      competency: 'Innovación y Adaptabilidad',
      question: 'Describe un proceso en tu trabajo previo que consideraste ineficiente y cómo propusiste una mejora innovadora para optimizarlo.',
      timeLimit: 120,
      starGuide: 'Buscar proactividad, pensamiento fuera de la caja y capacidad para medir el impacto de la mejora.'
    }
  ]);

  // Candidate Interview Flow State
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordedVideos, setRecordedVideos] = useState({}); // { qId: videoBlobUrl }
  const [candidateCompleted, setCandidateCompleted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Evaluation & STAR Scoring State (Interviewer Side)
  const [scores, setScores] = useState({
    Situation: 4,
    Task: 3,
    Action: 4,
    Result: 5
  });

  // Sales ROI Calculator State
  const [interviewsPerMonth, setInterviewsPerMonth] = useState(25);
  const [hourlyRecruiterCost, setHourlyRecruiterCost] = useState(20);
  const hoursSavedPerInterview = 1.25;
  const totalHoursSaved = Math.round(interviewsPerMonth * hoursSavedPerInterview);
  const monthlyMoneySaved = Math.round(totalHoursSaved * hourlyRecruiterCost);
  const annualSavings = monthlyMoneySaved * 12;

  // New Question Form State (Interviewer)
  const [newQCompetency, setNewQCompetency] = useState('');
  const [newQText, setNewQText] = useState('');
  const [newQTime, setNewQTime] = useState(120);

  // START CAMERA
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Acceso a cámara no disponible, usando modo simulación.");
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (appMode === 'candidate' && interviewStarted && !cameraActive) {
      startCamera();
    }
  }, [appMode, interviewStarted]);

  // START RECORDING
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTimer(questions[currentQuestionIndex].timeLimit);
    recordedChunksRef.current = [];

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedVideos(prev => ({ ...prev, [questions[currentQuestionIndex].id]: url }));
        };

        mediaRecorder.start();
      } catch (e) {
        console.warn("Simulación de grabación activada");
      }
    }

    timerIntervalRef.current = setInterval(() => {
      setRecordingTimer((prev) => {
        if (prev <= 1) {
          handleStopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // STOP RECORDING
  const handleStopRecording = () => {
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      const simulatedBlob = new Blob(["simulated_video"], { type: "video/webm" });
      setRecordedVideos(prev => ({
        ...prev,
        [questions[currentQuestionIndex].id]: URL.createObjectURL(simulatedBlob)
      }));
    }
  };

  // NEXT QUESTION
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsRecording(false);
    } else {
      setCandidateCompleted(true);
    }
  };

  // SHARE LINK GENERATOR
  const getCandidateUrl = () => {
    return `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
  };

  const handleCopyLink = () => {
    const url = getCandidateUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      setShareModalOpen(true);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `¡Hola! Te invitamos a realizar tu entrevista en video por competencias con Innovatalent.\n\nAccede a tu sesión aquí:\n${getCandidateUrl()}\n\nCódigo de Sesión: ${sessionId}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // PIN AUTHENTICATION
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === DEFAULT_PIN) {
      setIsPinAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // ADD NEW QUESTION
  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQText.trim()) return;
    const newQ = {
      id: `q_${Date.now()}`,
      competency: newQCompetency || 'General',
      question: newQText,
      timeLimit: parseInt(newQTime) || 120,
      starGuide: 'Criterio personalizado del reclutador.'
    };
    setQuestions([...questions, newQ]);
    setNewQText('');
    setNewQCompetency('');
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // RADAR DATA FOR STAR
  const radarData = [
    { subject: 'Situación', score: scores.Situation, fullMark: 5 },
    { subject: 'Tarea', score: scores.Task, fullMark: 5 },
    { subject: 'Acción', score: scores.Action, fullMark: 5 },
    { subject: 'Resultado', score: scores.Result, fullMark: 5 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      
      {/* HEADER / NAV SWITCHER */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setAppMode('sales')}>
            <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                INNOVATALENT
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                Video-Entrevistas
              </span>
            </div>
          </div>

          {/* MODE SELECTOR BUTTONS */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setAppMode('candidate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                appMode === 'candidate' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal Candidato</span>
            </button>

            <button
              onClick={() => setAppMode('interviewer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                appMode === 'interviewer' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Panel Entrevistador</span>
            </button>

            <button
              onClick={() => setAppMode('sales')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                appMode === 'sales' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Planes & ROI</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: CANDIDATE PORTAL */}
        {/* ------------------------------------------------------------- */}
        {appMode === 'candidate' && (
          <div className="max-w-3xl mx-auto space-y-6">
            
            {!interviewStarted ? (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 text-center shadow-2xl">
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30">
                  <Video className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-white">Bienvenido a tu Video-Entrevista</h1>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    A continuación responderás {questions.length} preguntas por competencias evaluadas bajo el modelo **STAR**. Graba tus respuestas en video desde tu dispositivo.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Instrucciones previas:</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-2 pl-6 list-disc">
                    <li>Asegúrate de estar en un lugar con buena luz y silencioso.</li>
                    <li>Cada pregunta tiene un tiempo límite para responder.</li>
                    <li>Podrás revisar o volver a grabar tu respuesta antes de avanzar.</li>
                  </ul>
                </div>

                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Ej. Sofía Martínez"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="sofia.martinez@email.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  disabled={!candidateName || !candidateEmail}
                  onClick={() => setInterviewStarted(true)}
                  className="w-full max-w-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 mx-auto cursor-pointer"
                >
                  <span>Iniciar Entrevista</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : !candidateCompleted ? (
              <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
                
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-4">
                  <span className="font-bold text-indigo-400">
                    Pregunta {currentQuestionIndex + 1} de {questions.length}
                  </span>
                  <span>Competencia: <strong className="text-white">{questions[currentQuestionIndex].competency}</strong></span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    "{questions[currentQuestionIndex].question}"
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tiempo asignado: {questions[currentQuestionIndex].timeLimit} segundos
                  </p>
                </div>

                <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span>{recordingTimer}s</span>
                    </div>
                  )}

                  {!isRecording && !recordedVideos[questions[currentQuestionIndex].id] && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-4 text-center space-y-3">
                      <Video className="w-10 h-10 text-slate-600" />
                      <p className="text-xs text-slate-400 max-w-xs">
                        Haz clic en "Iniciar Grabación" para activar la cámara y grabar tu respuesta.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>{recordedVideos[questions[currentQuestionIndex].id] ? 'Volver a Grabar' : 'Iniciar Grabación'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Square className="w-4 h-4 text-red-400" />
                      <span>Detener Grabación</span>
                    </button>
                  )}

                  <button
                    disabled={!recordedVideos[questions[currentQuestionIndex].id]}
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{currentQuestionIndex < questions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar y Enviar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">¡Entrevista Completada!</h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Gracias <strong className="text-white">{candidateName}</strong>. Tus videos han sido recibidos. El equipo evaluador revisará tus respuestas.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: INTERVIEWER DASHBOARD */}
        {/* ------------------------------------------------------------- */}
        {appMode === 'interviewer' && (
          <div>
            {!isPinAuthenticated ? (
              <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 text-center shadow-2xl">
                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Panel del Entrevistador</h2>
                  <p className="text-xs text-slate-400 mt-1">Ingresa el PIN para modificar las preguntas y calificar las respuestas.</p>
                </div>

                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="PIN (Por defecto: 1234)"
                      className="w-full text-center tracking-widest text-lg bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                    {pinError && <p className="text-[11px] text-red-400 mt-1">PIN incorrecto. Intenta con 1234.</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
                  >
                    Acceder al Panel
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                  <div>
                    <h1 className="text-xl font-black text-white">Gestión y Evaluación de Candidatos</h1>
                    <p className="text-xs text-slate-400">Configura preguntas y evalúa respuestas bajo el modelo STAR.</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleCopyLink}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                    </button>

                    <button
                      onClick={handleWhatsAppShare}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Question Manager */}
                  <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-white flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <span>Banco de Preguntas & Casos ({questions.length})</span>
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 relative group">
                          <div className="flex justify-between items-start text-xs pr-6">
                            <span className="font-bold text-indigo-400">Pregunta {idx + 1}</span>
                            <span className="bg-slate-900 px-2.5 py-0.5 rounded-full text-[10px] text-slate-400 border border-slate-800">
                              {q.competency}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200">{q.question}</p>
                          <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-900">
                            <span>Límite: {q.timeLimit} segundos</span>
                            <span>Criterio STAR: {q.starGuide}</span>
                          </div>

                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddQuestion} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 pt-4">
                      <span className="text-xs font-bold text-white block">Agregar Pregunta o Caso Práctico</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={newQCompetency}
                          onChange={(e) => setNewQCompetency(e.target.value)}
                          placeholder="Competencia (Ej. Trabajo en Equipo)"
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="number"
                          value={newQTime}
                          onChange={(e) => setNewQTime(e.target.value)}
                          placeholder="Tiempo Límite (segundos)"
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <textarea
                        required
                        rows={2}
                        value={newQText}
                        onChange={(e) => setNewQText(e.target.value)}
                        placeholder="Escribe la pregunta o situación a evaluar..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                      />

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Añadir Pregunta</span>
                      </button>
                    </form>
                  </div>

                  {/* STAR Matrix & Radar Chart */}
                  <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
                    <h2 className="text-base font-bold text-white flex items-center space-x-2">
                      <Award className="w-5 h-5 text-purple-400" />
                      <span>Evaluación STAR</span>
                    </h2>

                    <div className="space-y-4">
                      {[
                        { key: 'Situation', label: 'Situación' },
                        { key: 'Task', label: 'Tarea' },
                        { key: 'Action', label: 'Acción' },
                        { key: 'Result', label: 'Resultado' }
                      ].map((dim) => (
                        <div key={dim.key} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{dim.label}</span>
                            <span className="text-purple-400 font-bold">{scores[dim.key]} / 5</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={scores[dim.key]}
                            onChange={(e) => setScores({ ...scores, [dim.key]: parseInt(e.target.value) })}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="h-64 w-full bg-slate-950 p-2 rounded-2xl border border-slate-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#475569" />
                          <Radar name="Perfil STAR" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 3: SALES & LANDING PAGE */}
        {/* ------------------------------------------------------------- */}
        {appMode === 'sales' && (
          <div className="space-y-16 animate-fadeIn">
            <section className="text-center space-y-6 py-8">
              <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Optimiza tus procesos de selección</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight max-w-4xl mx-auto">
                Video-Entrevistas por Competencias <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  Asíncronas y Evaluadas con Método STAR
                </span>
              </h1>

              <p className="text-base text-slate-400 max-w-2xl mx-auto">
                Reduce el tiempo de contratación compartiendo preguntas y situaciones reales por WhatsApp a tus candidatos.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setAppMode('candidate')}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all text-xs cursor-pointer"
                >
                  Probar Modo Candidato
                </button>
                <button
                  onClick={() => setAppMode('interviewer')}
                  className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-2xl transition-all text-xs cursor-pointer"
                >
                  Acceder al Panel Entrevistador
                </button>
              </div>
            </section>

            <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span>Calculadora de Ahorro Estimado</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Entrevistas al mes: {interviewsPerMonth}</label>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={interviewsPerMonth}
                    onChange={(e) => setInterviewsPerMonth(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Costo por hora del reclutador: ${hourlyRecruiterCost} USD</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={hourlyRecruiterCost}
                    onChange={(e) => setHourlyRecruiterCost(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Horas Ahorradas al Mes</span>
                  <span className="text-2xl font-black text-indigo-400">{totalHoursSaved} Horas</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Ahorro Estimado Anual</span>
                  <span className="text-2xl font-black text-emerald-400">${annualSavings.toLocaleString()} USD / año</span>
                </div>
              </div>
            </section>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">INNOVATALENT</span>
          </div>
          <p>© Innovatalent. Plataforma de Evaluación de Talento.</p>
        </div>
      </footer>

    </div>
  );
}