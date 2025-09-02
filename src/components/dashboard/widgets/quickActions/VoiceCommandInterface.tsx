import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, AlertCircle, CheckCircle } from 'lucide-react';

interface VoiceCommandInterfaceProps {
  isActive: boolean;
  onCommand: (command: string) => void;
  onClose: () => void;
  supportedCommands?: string[];
}

export function VoiceCommandInterface({
  isActive,
  onCommand,
  onClose,
  supportedCommands = []
}: VoiceCommandInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Default voice commands
  const defaultCommands = [
    'log mood', 'start meditation', 'open journal', 'call crisis line',
    'breathing exercise', 'check in', 'view schedule', 'track medication',
    'safety plan', 'grounding exercise', 'contact therapist', 'emergency help'
  ];

  const commands = supportedCommands.length > 0 ? supportedCommands : defaultCommands;

  // Initialize speech recognition
  useEffect(() => {
    if (!isActive) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setErrorMessage('Voice commands not supported in this browser');
      setStatus('error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('listening');
      setIsListening(true);
      setErrorMessage('');
      initializeAudioAnalyzer();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += `${transcript  } `;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
        processCommand(final.trim());
      }
      
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setStatus('error');
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          setErrorMessage('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setErrorMessage('Microphone not found. Please check your settings.');
          break;
        case 'not-allowed':
          setErrorMessage('Microphone access denied. Please enable permissions.');
          break;
        default:
          setErrorMessage('An error occurred. Please try again.');
      }
      
      stopAudioAnalyzer();
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioAnalyzer();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioAnalyzer();
    };
  }, [isActive]);

  // Initialize audio analyzer for volume visualization
  const initializeAudioAnalyzer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      updateVolume();
    } catch (error) {
      console.error('Error initializing audio analyzer:', error);
    }
  };

  // Update volume meter
  const updateVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setVolume(average / 255);
    
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  };

  // Stop audio analyzer
  const stopAudioAnalyzer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    setVolume(0);
  };

  // Process recognized command
  const processCommand = useCallback((command: string) => {
    setStatus('processing');
    const lowerCommand = command.toLowerCase();
    
    // Find matching command
    const matchedCommand = commands.find(cmd => 
      lowerCommand.includes(cmd.toLowerCase())
    );
    
    if (matchedCommand) {
      setStatus('success');
      onCommand(lowerCommand);
      
      // Provide audio feedback
      const utterance = new SpeechSynthesisUtterance(`Executing ${matchedCommand}`);
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
      
      setTimeout(() => {
        setStatus('idle');
        setTranscript('');
      }, 2000);
    } else {
      setStatus('error');
      setErrorMessage('Command not recognized. Please try again.');
      
      setTimeout(() => {
        setStatus('listening');
        setErrorMessage('');
      }, 2000);
    }
  }, [commands, onCommand]);

  // Toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('idle');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Speak command list
  const speakCommands = () => {
    const commandList = commands.join(', ');
    const utterance = new SpeechSynthesisUtterance(`Available commands are: ${commandList}`);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  {isListening ? (
                    <Mic className="h-5 w-5 animate-pulse" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                  {/* Volume indicator */}
                  {isListening && (
                    <motion.div
                      className="absolute -inset-2 rounded-full border-2 border-white"
                      animate={{ scale: 1 + volume * 0.5 }}
                      transition={{ duration: 0.1 }}
                    />
                  )}
                </div>
                <span className="font-semibold">Voice Commands</span>
              </div>
              
              <button
                onClick={onClose}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Close voice commands"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Status indicator */}
            <div className="mt-2 flex items-center space-x-2">
              {status === 'listening' && (
                <>
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-1 h-4 bg-white rounded-full"
                      animate={{ scaleY: [1, 1.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="w-1 h-4 bg-white rounded-full"
                      animate={{ scaleY: [1, 1.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div
                      className="w-1 h-4 bg-white rounded-full"
                      animate={{ scaleY: [1, 1.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-sm">Listening...</span>
                </>
              )}
              
              {status === 'processing' && (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-sm">Processing...</span>
                </>
              )}
              
              {status === 'success' && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Command executed!</span>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Error occurred</span>
                </>
              )}
              
              {status === 'idle' && (
                <span className="text-sm text-white text-opacity-80">
                  Click the microphone to start
                </span>
              )}
            </div>
          </div>

          {/* Transcript display */}
          <div className="p-4 min-h-[100px] max-h-[200px] overflow-y-auto bg-gray-50">
            {(transcript || interimTranscript) ? (
              <div>
                {transcript && (
                  <p className="text-gray-900 mb-1">{transcript}</p>
                )}
                {interimTranscript && (
                  <p className="text-gray-500 italic">{interimTranscript}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center">
                Your voice commands will appear here
              </p>
            )}
            
            {errorMessage && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={speakCommands}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              aria-label="Hear available commands"
            >
              <Volume2 className="h-4 w-4" />
              <span>Hear commands</span>
            </button>
            
            <button
              onClick={toggleListening}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? 'Stop' : 'Start'} Listening
            </button>
          </div>

          {/* Command suggestions */}
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-500 mb-2">Try saying:</p>
            <div className="flex flex-wrap gap-1">
              {commands.slice(0, 6).map((cmd, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  "{cmd}"
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}