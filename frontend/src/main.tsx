/* ══════════════════════════════════════════════════
   UniTrustID — Entry Point
   ══════════════════════════════════════════════════ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider } from '@txnlab/use-wallet-react';
import { walletManager } from './lib/walletProvider';

/* Import all CSS modules */
import './styles/globals.css';
import './styles/header.css';
import './styles/wallet.css';
import './styles/credentials.css';
import './styles/profile.css';
import './styles/services.css';
import './styles/modal.css';
import './styles/auth.css';

// Error boundary for debugging
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#ff4757', padding: 40, fontFamily: 'monospace' }}>
          <h2>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, opacity: 0.7 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-load App to catch import errors
const App = React.lazy(() => import('./App'));

console.log('[UniTrustID] main.tsx loaded, mounting React...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WalletProvider manager={walletManager}>
        <React.Suspense
          fallback={
            <div style={{ color: '#00c8ff', padding: 40, fontFamily: 'monospace' }}>
              Loading UniTrustID...
            </div>
          }
        >
          <App />
        </React.Suspense>
      </WalletProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
