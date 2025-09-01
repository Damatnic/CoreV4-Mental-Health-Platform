/**
 * Module resolution declarations for lazy loading compatibility
 * Maps component imports to their actual file locations
 */

// Crisis Components
declare module '../../components/crisis/CrisisIntervention' {
  export { default } from '../../components/crisis/CrisisInterventionSystem';
}

// Wellness Components
declare module '../../components/wellness/BreathingExercise' {
  export { default } from '../../components/wellness/BreathingExercises';
}

declare module '../../components/wellness/Meditation' {
  export { default } from '../../components/wellness/MeditationTimer';
}

declare module '../../components/wellness/Journal' {
  // Create a placeholder type if Journal component doesn't exist
  import { ComponentType } from 'react';
  const Journal: ComponentType<any>;
  export default Journal;
}

// Community Components
declare module '../../components/community/CommunityFeed' {
  export { default } from '../../components/dashboard/widgets/CommunityFeedWidget';
}

declare module '../../components/community/Forums' {
  // Create a placeholder type if Forums component doesn't exist
  import { ComponentType } from 'react';
  const Forums: ComponentType<any>;
  export default Forums;
}

// Professional Components
declare module '../../components/professional/TherapistFinder' {
  // Create a placeholder type if TherapistFinder component doesn't exist
  import { ComponentType } from 'react';
  const TherapistFinder: ComponentType<any>;
  export default TherapistFinder;
}

declare module '../../components/professional/AppointmentScheduling' {
  // Create a placeholder type if AppointmentScheduling component doesn't exist
  import { ComponentType } from 'react';
  const AppointmentScheduling: ComponentType<any>;
  export default AppointmentScheduling;
}

// Settings and Profile Components
declare module '../../components/settings/Settings' {
  // Create a placeholder type if Settings component doesn't exist
  import { ComponentType } from 'react';
  const Settings: ComponentType<any>;
  export default Settings;
}

declare module '../../components/profile/Profile' {
  // Create a placeholder type if Profile component doesn't exist
  import { ComponentType } from 'react';
  const Profile: ComponentType<any>;
  export default Profile;
}

// Page Components
declare module '../../pages/Dashboard' {
  export { default } from '../../pages/DashboardPage';
}

declare module '../../pages/Crisis' {
  export { default } from '../../pages/CrisisPage';
}

declare module '../../pages/Wellness' {
  export { default } from '../../pages/WellnessPage';
}

declare module '../../pages/Community' {
  export { default } from '../../pages/CommunityPage';
}

declare module '../../pages/Professional' {
  export { default } from '../../pages/ProfessionalPage';
}

declare module '../../pages/Settings' {
  // Create a placeholder type if Settings page doesn't exist
  import { ComponentType } from 'react';
  const SettingsPage: ComponentType<any>;
  export default SettingsPage;
}