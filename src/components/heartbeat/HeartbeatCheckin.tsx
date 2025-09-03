import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, _Users, Wifi, WifiOff, Volume2, VolumeX, 
  Phone, MessageCircle, Shield, Clock, Activity
} from 'lucide-react';
import { useVibration } from '../../hooks/useVibration';

interface Partner {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastCheckin: Date | null;
  isHolding: boolean;
  distance?: number;
}

interface HeartbeatState {
  isConnected: boolean;
  isHolding: boolean;
  holdDuration: number;
  partnerHeartbeat: number;
  lastSync: Date | null;
  missedCheckins: number;
}

const HeartbeatCheckin: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: 'partner-1',
      name: 'Sarah',
      avatar: '👩‍🦰',
      status: 'online',
      lastCheckin: new Date(),
      isHolding: false
    },
    {
      id: 'partner-2', 
      name: 'Alex',
      avatar: '🧑‍🦱',
      status: 'away',
      lastCheckin: new Date(Date.now() - 300000), // 5 minutes ago
      isHolding: false
    }
  ]);
  
  const [heartbeatState, setHeartbeatState] = useState<HeartbeatState>({
    isConnected: true,
    isHolding: false,
    holdDuration: 0,
    partnerHeartbeat: 72,
    lastSync: new Date(),
    missedCheckins: 0
  });

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const { vibrate } = useVibration();
  const holdTimerRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const missedCheckinTimerRef = useRef<NodeJS.Timeout>();

  // Simulate heartbeat patterns
  useEffect(() => {
    if (heartbeatState.isConnected) {
      heartbeatIntervalRef.current = setInterval(() => {
        setHeartbeatState(prev => ({
          ...prev,
          partnerHeartbeat: 65 + Math.random() * 20 // 65-85 BPM range
        }));
      }, 1000);
    }
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [heartbeatState.isConnected]);

  // Monitor for missed check-ins (crisis detection)
  useEffect(() => {
    missedCheckinTimerRef.current = setTimeout(() => {
      const lastCheckin = partners.find(p => p.status === 'online')?.lastCheckin;
      if (lastCheckin && Date.now() - lastCheckin.getTime() > 300000) { // 5 minutes
        setHeartbeatState(prev => ({ ...prev, missedCheckins: prev.missedCheckins + 1 }));
        if (heartbeatState.missedCheckins >= 1) {
          setShowCrisisAlert(true);
        }
      }
    }, 300000); // Check every 5 minutes

    return () => {
      if (missedCheckinTimerRef.current) {
        clearTimeout(missedCheckinTimerRef.current);
      }
    };
  }, [partners, heartbeatState.missedCheckins]);

  const startHeartbeatCheckin = (partner: Partner) => {
    setSelectedPartner(partner);
    setHeartbeatState(prev => ({ ...prev, isHolding: true, holdDuration: 0 }));
    
    // Start hold timer
    holdTimerRef.current = setInterval(() => {
      setHeartbeatState(prev => {
        const newDuration = prev.holdDuration + 0.1;
        
        // Trigger heartbeat vibration every second during hold
        if (Math.floor(newDuration * 10) % 10 === 0) {
          vibrate([50, 50]); // Gentle heartbeat pattern
        }
        
        // Complete check-in after 3 seconds
        if (newDuration >= 3.0) {
          completeCheckin(partner);
          return { ...prev, holdDuration: 3.0 };
        }
        
        return { ...prev, holdDuration: newDuration };
      });
    }, 100);
  };

  const completeCheckin = (partner: Partner) => {
    // Clear hold timer
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
    
    // Success vibration
    vibrate([100, 100, 200]);
    
    // Update partner status
    setPartners(prev => prev.map(p => 
      p.id === partner.id 
        ? { ...p, lastCheckin: new Date(), status: 'online' as const }
        : p
    ));
    
    setHeartbeatState(prev => ({
      ...prev,
      isHolding: false,
      holdDuration: 0,
      lastSync: new Date(),
      missedCheckins: 0
    }));
    
    setSelectedPartner(null);
    setShowCrisisAlert(false);
  };

  const cancelCheckin = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
    
    setHeartbeatState(prev => ({ ...prev, isHolding: false, holdDuration: 0 }));
    setSelectedPartner(null);
  };

  const getPartnerStatusColor = (status: Partner['status']) => {
    const colors = {
      online: 'text-green-400',
      away: 'text-yellow-400', 
      busy: 'text-orange-400',
      offline: 'text-gray-400'
    };
    return colors[status];
  };

  const getPartnerStatusDot = (status: Partner['status']) => {
    const colors = {
      online: 'bg-green-400',
      away: 'bg-yellow-400',
      busy: 'bg-orange-400', 
      offline: 'bg-gray-400'
    };
    return colors[status];
  };

  const formatLastCheckin = (date: Date | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="heartbeat-checkin bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="bg-gradient-to-r from-pink-500 to-red-500 p-4 rounded-2xl mr-4"
          >
            <Heart className="h-8 w-8 text-white fill-current" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Heartbeat Check-in</h1>
            <p className="text-gray-300 text-lg">Stay connected with your support network</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            {heartbeatState.isConnected ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-400" />
            )}
            <span className="text-sm text-gray-300">
              {heartbeatState.isConnected ? 'Connected' : 'Offline Mode'}
            </span>
          </div>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Crisis Alert */}
      <AnimatePresence>
        {showCrisisAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-red-500/20 border border-red-400/50 rounded-2xl p-6 mb-6 backdrop-blur-md"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Check-in Alert</h3>
            </div>
            <p className="text-gray-300 mb-4">
              We haven&apos;t heard from your partner in a while. This could be normal, but let&apos;s make sure they&apos;re okay.
            </p>
            <div className="flex space-x-3">
              <button className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-600 transition-colors">
                <Phone className="h-4 w-4" />
                <span>Call Partner</span>
              </button>
              <button className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-600 transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>Send Message</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="text-3xl">{partner.avatar}</div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getPartnerStatusDot(partner.status)} border-2 border-gray-800`}></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{partner.name}</h3>
                  <p className={`text-sm capitalize ${getPartnerStatusColor(partner.status)}`}>
                    {partner.status}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-400">Last check-in</div>
                <div className="text-sm font-medium text-white">
                  {formatLastCheckin(partner.lastCheckin)}
                </div>
              </div>
            </div>

            {/* Heartbeat Visualization */}
            <div className="mb-4">
              <div className="flex items-center justify-center h-16 bg-gray-900/50 rounded-lg">
                <motion.div
                  animate={{ 
                    scale: partner.isHolding ? [1, 1.2, 1] : [1, 1.05, 1],
                    opacity: partner.status === 'online' ? [0.7, 1, 0.7] : [0.3, 0.5, 0.3]
                  }}
                  transition={{ 
                    duration: 60 / (heartbeatState.partnerHeartbeat || 72),
                    repeat: Infinity 
                  }}
                  className="flex items-center space-x-2"
                >
                  <Activity className="h-6 w-6 text-pink-400" />
                  <span className="text-white font-mono">
                    {partner.status === 'online' ? Math.floor(heartbeatState.partnerHeartbeat) : '--'} BPM
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Check-in Button */}
            <button
              onClick={() => startHeartbeatCheckin(partner)}
              disabled={heartbeatState.isHolding || partner.status === 'offline'}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Heart className="h-5 w-5" />
              <span>
                {heartbeatState.isHolding && selectedPartner?.id === partner.id 
                  ? `Hold for ${(3 - heartbeatState.holdDuration).toFixed(1)}s`
                  : 'Start Heartbeat Check-in'
                }
              </span>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Hold to Check-in Overlay */}
      <AnimatePresence>
        {heartbeatState.isHolding && selectedPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
            onClick={cancelCheckin}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center p-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center"
              >
                <Heart className="h-16 w-16 text-white fill-current" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Connecting with {selectedPartner.name}
              </h2>
              <p className="text-gray-300 mb-6">Hold to sync heartbeats...</p>

              {/* Progress Circle */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgb(236, 72, 153)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: heartbeatState.holdDuration / 3 }}
                    transition={{ duration: 0.1 }}
                    style={{
                      pathLength: heartbeatState.holdDuration / 3
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {Math.ceil(3 - heartbeatState.holdDuration)}
                  </span>
                </div>
              </div>

              <p className="text-gray-400 text-sm">Tap anywhere to cancel</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/30 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-white mb-4">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="text-center">
              <Clock className="h-6 w-6 text-console-accent mx-auto mb-2" />
              <p>Hold for 3 seconds to initiate check-in</p>
            </div>
            <div className="text-center">
              <Activity className="h-6 w-6 text-pink-400 mx-auto mb-2" />
              <p>Feel synchronized heartbeat through vibration</p>
            </div>
            <div className="text-center">
              <Shield className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p>Automatic crisis detection if check-ins are missed</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeartbeatCheckin;