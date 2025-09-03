import { ConsoleCrisisSystem } from '../components/crisis/ConsoleCrisisSystem';
import { CrisisErrorBoundary } from '../components/ErrorBoundary';

export function CrisisPage() {
  return (
    <CrisisErrorBoundary>
      <ConsoleCrisisSystem />
    </CrisisErrorBoundary>
  );
}
// Default export for lazy loading
export default CrisisPage;
