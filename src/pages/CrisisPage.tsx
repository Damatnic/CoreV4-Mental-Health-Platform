import { CrisisInterventionSystem } from '../components/crisis/CrisisInterventionSystem';
import { CrisisErrorBoundary } from '../components/crisis/CrisisErrorBoundary';

export function CrisisPage() {
  return (
    <CrisisErrorBoundary>
      <CrisisInterventionSystem />
    </CrisisErrorBoundary>
  );
}
// Default export for lazy loading
export default CrisisPage;
