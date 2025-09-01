import React from 'react';
import { Users, Calendar, Target, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface TherapySession {
  id: string;
  date: Date;
  therapistName: string;
  type: string;
  topics: string[];
  homework: any[];
  progress: number;
  notes?: string;
}

interface TherapyProgressWidgetProps {
  progress?: TherapySession[];
  error?: string;
}

export function TherapyProgressWidget({ progress, error }: TherapyProgressWidgetProps) {
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!progress || progress.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <Users className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-center">No therapy sessions yet</p>
        <button
          onClick={() => navigate('/professional/therapy')}
          className="mt-3 text-sm text-primary-600 hover:text-primary-700"
        >
          Schedule a session
        </button>
      </div>
    );
  }

  const latestSession = progress[0];
  const totalSessions = progress.length;
  const completedHomework = progress.reduce((acc, session) => 
    acc + session.homework.filter((hw: any) => hw.completed).length, 0
  );
  const totalHomework = progress.reduce((acc, session) => 
    acc + session.homework.length, 0
  );

  return (
    <div className="space-y-3">
      {/* Session Summary */}
      <div className="bg-primary-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary-900">Therapy Progress</span>
          <span className="text-xs text-primary-700">{totalSessions} sessions</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-primary-700">Next Session</p>
            <p className="text-sm font-medium text-primary-900">
              {latestSession ? new Date(latestSession.date).toLocaleDateString() : 'Not scheduled'}
            </p>
          </div>
          <div>
            <p className="text-xs text-primary-700">Homework</p>
            <p className="text-sm font-medium text-primary-900">
              {completedHomework}/{totalHomework} completed
            </p>
          </div>
        </div>
      </div>

      {/* Latest Session Details */}
      {latestSession && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                Last Session
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(latestSession.date).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-sm text-gray-700 mb-2">
            with {latestSession.therapistName}
          </p>

          {/* Topics Covered */}
          {latestSession.topics.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-600 mb-1">Topics discussed:</p>
              <div className="flex flex-wrap gap-1">
                {latestSession.topics.slice(0, 3).map((topic, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Session Progress</span>
              <span className="text-xs font-medium text-primary-600">
                {latestSession.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className="bg-primary-600 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${latestSession.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Homework Items */}
      {progress.some(s => s.homework.length > 0) && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Active Homework</p>
          {progress.slice(0, 2).map(session => 
            session.homework.filter((hw: any) => !hw.completed).slice(0, 2).map((hw: any) => (
              <div
                key={hw.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => navigate('/wellness/activities')}
              >
                <div className="flex items-center space-x-2">
                  {hw.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700">{hw.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))
          )}
        </div>
      )}

      {/* View Details Link */}
      <button
        onClick={() => navigate('/professional/therapy')}
        className="w-full bg-primary-100 text-primary-700 rounded-lg p-3 flex items-center justify-between hover:bg-primary-200 transition-colors"
      >
        <span className="text-sm font-medium">View Therapy Details</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}