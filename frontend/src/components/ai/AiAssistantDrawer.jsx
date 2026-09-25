import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Zap,
  Mic,
  MicOff,
  Radio
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AudioRecorder } from '../../utils/audioRecorder';

export const AiAssistantDrawer = ({ isOpen, onClose, setActiveTab, initialPrompt = '' }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your AI Copilot for ${gym?.name || 'your gym'}. I have real-time access to your membership, attendance, and revenue data. Ask me anything or click a prompt below!`,
      actions: [
        { label: 'Expiring this week?', prompt: 'How many memberships expire this week?' },
        { label: 'Inactive members (14d)?', prompt: 'Which members have not attended in the last 14 days?' },
        { label: 'Revenue this month?', prompt: 'What was our revenue this month?' },
        { label: 'Most popular plan?', prompt: 'Which membership plan is most popular?' },
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const messagesEndRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  // Clean up recording on drawer close
  useEffect(() => {
    if (!isOpen && isListening) {
      stopRecording(false);
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const rec = new AudioRecorder();
      await rec.start();
      recorderRef.current = rec;
      setIsListening(true);
      setRecordDuration(0);

      // Duration counter
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 12) {
            // Auto-stop after 12 seconds
            stopRecording(true);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser or Windows Settings.'
          : 'Could not access microphone on this device.'
      );
      setIsListening(false);
    }
  };

  const stopRecording = async (shouldTranscribe = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!recorderRef.current) {
      setIsListening(false);
      return;
    }

    const rec = recorderRef.current;
    recorderRef.current = null;
    setIsListening(false);

    let audioBlob = null;
    try {
      audioBlob = rec.stop();
    } catch (e) {
      console.error('Failed to encode audio:', e);
      return;
    }

    if (!shouldTranscribe || !audioBlob || audioBlob.size < 500) {
      return;
    }

    // Send audio to local backend for zero-error speech recognition
    try {
      setIsTranscribing(true);
      const res = await api.transcribeAudio(audioBlob);
      if (res.success && res.text) {
        setInput(res.text);
        toast.success(`Heard: "${res.text}"`);
      } else if (res.message) {
        toast.info(res.message);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      toast.error('Could not process voice input. Please type your query.');
    } finally {
      setIsTranscribing(false);
      setRecordDuration(0);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording(true);
    } else {
      startRecording();
    }
  };

  const handleSend = async (queryText = null) => {
    const q = (queryText || input).trim();
    if (!q || isLoading) return;

    if (isListening) {
      stopRecording(false);
    }

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.queryAi(q);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          suggestedActions: res.suggested_actions,
          data: res.data
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Sorry, I encountered an issue querying the database: ${err.message}`,
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.prompt) {
      handleSend(action.prompt);
    } else if (action.action) {
      if (action.action === 'NAVIGATE_MEMBERS' || action.action === 'NAVIGATE_EXPIRING') {
        setActiveTab('members');
        onClose();
      } else if (action.action === 'NAVIGATE_REPORTS') {
        setActiveTab('reports');
        onClose();
      } else if (action.action === 'NAVIGATE_ATTENDANCE') {
        setActiveTab('attendance');
        onClose();
      } else if (action.action === 'NAVIGATE_PLANS') {
        setActiveTab('memberships');
        onClose();
      } else if (action.action === 'NAVIGATE_PAYMENTS') {
        setActiveTab('payments');
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-900 to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  AI Facility Copilot
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-brand-500/20 text-brand-300 border border-brand-400/30">PRO</span>
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">Real-time analytical assistance & voice input</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white font-semibold shadow-md'
                      : m.isError
                      ? 'bg-rose-50 text-rose-950 font-semibold border border-rose-200'
                      : 'bg-white text-slate-900 font-semibold border border-slate-200 shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Render Data Table if returned */}
                  {m.data && Array.isArray(m.data) && m.data.length > 0 && (
                    <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/75">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100 font-bold text-slate-800">
                            {Object.keys(m.data[0]).map((key) => (
                              <th key={key} className="p-2 capitalize">{key.replace('_', ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {m.data.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx}>
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="p-2 truncate max-w-[120px] font-semibold text-slate-900">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Actions / Suggested Buttons */}
                  {m.actions && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1"
                        >
                          {act.label}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {m.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-brand-600 transition-colors flex items-center gap-1.5"
                        >
                          {act.label}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold italic p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
                Analyzing {gym?.name} data...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions bar */}
          <div className="p-2 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <span className="text-[11px] font-extrabold text-slate-600 pl-2">Try:</span>
            <button
              onClick={() => handleSend("What was our revenue this month?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200"
            >
              Revenue?
            </button>
            <button
              onClick={() => handleSend("How many memberships expire this week?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200"
            >
              Expiring week?
            </button>
            <button
              onClick={() => handleSend("Which members have not attended in 14 days?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200"
            >
              Inactive 14d?
            </button>
          </div>

          {/* Voice Recording / Transcribing Indicator Banner */}
          {isListening && (
            <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 text-rose-900 text-xs flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
                <span className="font-extrabold">
                  Listening... speak clearly ({recordDuration}s)
                </span>
              </div>
              <button
                type="button"
                onClick={() => stopRecording(true)}
                className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {isTranscribing && (
            <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
              <span className="font-bold">Converting speech to text...</span>
            </div>
          )}

          {/* Input Form with Microphone Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? "Recording your voice... click Done when finished"
                  : isTranscribing
                  ? "Transcribing voice audio..."
                  : "Ask a question about your gym..."
              }
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 bg-white ${
                isListening
                  ? 'border-rose-400 ring-2 ring-rose-300/50 bg-rose-50/30 text-rose-950 font-bold placeholder-rose-500'
                  : 'border-slate-300 text-slate-950 placeholder:text-slate-400 placeholder:font-normal focus:ring-brand-500 focus:border-brand-500'
              }`}
            />

            {/* Voice Input Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isTranscribing}
              title={isListening ? "Stop recording (Click when finished speaking)" : "Speak to AI (Click to record voice)"}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/40 animate-pulse scale-105'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 hover:text-brand-600'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Query Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isTranscribing}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white transition-colors shrink-0"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
