// Test entry only; never a production build entrypoint or backend adapter.
import React from 'react';
import { createRoot } from 'react-dom/client';
import EmailLogin from '../../app/email-login';
import { createFirebaseEmailAuth } from '../../lib/firebase-email-auth';
import '../../app/globals.css';
if (location.hostname !== '127.0.0.1' || !import.meta.env.DEV) throw new Error('Local test fixture only');
const auth = createFirebaseEmailAuth({ projectId: 'demo-julies-kokebok', apiKey: 'fake-api-key', authDomain: 'demo-julies-kokebok.firebaseapp.com' }, {
  returnUrl: 'http://127.0.0.1:4175/tests/e2e/auth.html',
  emulator: { authUrl: 'http://127.0.0.1:9099', functionsHost: '127.0.0.1', functionsPort: 5001 },
});
createRoot(document.getElementById('root')!).render(<EmailLogin auth={auth}/>);
