import { useState, useEffect, useCallback } from 'react';
import { logger, LogCategory } from '../services/logging/logger';
import { secureStorage } from '../services/security/SecureLocalStorage';

interface AssessmentData {
  moodScore?: number;
  thoughtScore?: number;
  behaviorScore?: number;
  physicalScore?: number;
  socialScore?: number;
  overallRisk?: number;
  timestamp?: Date;
}

interface CrisisAssessmentHook {
  assessmentData: AssessmentData | null;
  updateAssessment: (data: Partial<AssessmentData>) => void;
  clearAssessment: () => void;
  isAssessing: boolean;
  lastAssessment: Date | null;
}

export function useCrisisAssessment(): CrisisAssessmentHook {
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(() => {
    // Load from secure storage (crisis assessments are sensitive mental health data)
    const stored = secureStorage.getItem('crisis_assessment');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          timestamp: parsed.timestamp ? new Date(parsed.timestamp) : null
        };
      } catch (e) {
        logger.error('Failed to parse stored assessment', e as Error, {
          category: LogCategory.CRISIS
        });
      }
    }
    return null;
  });

  const [isAssessing, setIsAssessing] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<Date | null>(() => {
    const stored = secureStorage.getItem('last_crisis_assessment');
    return stored ? new Date(stored) : null;
  });

  // Save assessment data to secure storage (encrypted for sensitive data)
  useEffect(() => {
    if (assessmentData) {
      secureStorage.setItem('crisis_assessment', JSON.stringify(assessmentData));
    }
  }, [assessmentData]);

  // Update assessment with new data
  const updateAssessment = useCallback((data: Partial<AssessmentData>) => {
    setIsAssessing(true);
    
    setAssessmentData(prev => {
      const updated = {
        ...prev,
        ...data,
        timestamp: new Date()
      };

      // Calculate overall risk if we have enough data
      if (updated.moodScore !== undefined && 
          updated.thoughtScore !== undefined && 
          updated.behaviorScore !== undefined) {
        const scores = [
          updated.moodScore || 0,
          updated.thoughtScore || 0,
          updated.behaviorScore || 0,
          updated.physicalScore || 0,
          updated.socialScore || 0
        ].filter(score => score > 0);

        if (scores.length > 0) {
          updated.overallRisk = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
      }

      return updated;
    });

    setLastAssessment(new Date());
    secureStorage.setItem('last_crisis_assessment', new Date().toISOString());
    
    setTimeout(() => setIsAssessing(false), 500);

    // Log assessment update
    logger.info('Crisis assessment updated', {
      category: LogCategory.CRISIS,
      ...data
    });
  }, []);

  // Clear assessment data
  const clearAssessment = useCallback(() => {
    setAssessmentData(null);
    secureStorage.removeItem('crisis_assessment');
    logger.info('Crisis assessment cleared', {
      category: LogCategory.CRISIS
    });
  }, []);

  // Check if assessment is stale (older than 24 hours)
  useEffect(() => {
    if (lastAssessment) {
      const hoursSinceAssessment = (Date.now() - lastAssessment.getTime()) / (1000 * 60 * 60);
      if (hoursSinceAssessment > 24) {
        logger.info('Crisis assessment is stale', {
          category: LogCategory.CRISIS,
          hoursSinceAssessment
        });
      }
    }
  }, [lastAssessment]);

  return {
    assessmentData,
    updateAssessment,
    clearAssessment,
    isAssessing,
    lastAssessment
  };
}