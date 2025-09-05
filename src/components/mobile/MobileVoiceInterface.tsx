import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, Volume2, VolumeX } from 'lucide-react';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface MobileVoiceInterfaceProps {
  onVoiceInput?: (transcript: string) => void;
  onClose?: () => void;
}

export function MobileVoiceInterface({ onVoiceInput, onClose }: MobileVoiceInterfaceProps) {
  const { canVibrate } = useMobileFeatures();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
              setConfidence(result[0].confidence);
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startListening = async () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
        
        if (canVibrate) navigator.vibrate(50);
        
        // Start audio level monitoring
        await initializeAudioLevel();
      }
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    
    if (canVibrate) navigator.vibrate(100);
    
    // Stop audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const initializeAudioLevel = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255);
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to initialize audio level:', error);
    }
  };

  const speakText = (text: string) => {
    if (synthRef.current && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      synthRef.current.speak(utterance);
      
      if (canVibrate) navigator.vibrate([50, 50, 50]);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onVoiceInput?.(transcript);
      setTranscript('');
      if (canVibrate) navigator.vibrate(100);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md bg-gray-800/95 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Voice Chat</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {/* Voice Visualizer */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              className="relative"
              animate={{
                scale: isListening ? 1 + audioLevel * 0.3 : 1
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Outer rings */}
              {isListening && (
                <>
                  <motion.div
                    className="absolute inset-0 w-32 h-32 rounded-full border-2 border-blue-400/30"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  <motion.div
                    className="absolute inset-2 w-28 h-28 rounded-full border-2 border-blue-400/50"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.5, 0.2, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </>
              )}
              
              {/* Main button */}
              <motion.button
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                }`}
                onClick={isListening ? stopListening : startListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: isListening 
                    ? [
                        '0 8px 32px rgba(239, 68, 68, 0.3)',
                        '0 8px 40px rgba(239, 68, 68, 0.5)',
                        '0 8px 32px rgba(239, 68, 68, 0.3)'
                      ]
                    : '0 8px 32px rgba(59, 130, 246, 0.3)'
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </motion.button>
            </motion.div>
          </div>

          {/* Status */}
          <div className="text-center mb-6">
            <p className="text-gray-300 text-sm">
              {isListening ? 'Listening...' : 'Tap to start speaking'}
            </p>
            {confidence > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Confidence: {Math.round(confidence * 100)}%
              </p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <motion.div
              className="mb-6 p-4 bg-gray-700/50 rounded-2xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-white text-sm leading-relaxed">
                {transcript}
              </p>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex space-x-3">
            <motion.button
              className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              onClick={isPlaying ? stopSpeaking : () => speakText(transcript)}
              disabled={!transcript}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span>{isPlaying ? 'Stop' : 'Play'}</span>
            </motion.button>
            
            <motion.button
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              onClick={handleSend}
              disabled={!transcript}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="w-5 h-5" />
              <span>Send</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default MobileVoiceInterface;