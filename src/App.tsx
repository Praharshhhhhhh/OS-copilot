import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Dashboard from './Dashboard';
import SaaSTemplate from './components/ui/saa-s-template';

interface User {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      if (document.location.origin === event.origin || event.origin.endsWith('.run.app') || event.origin.includes('localhost')) {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          checkAuth();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) {
        const authWindow = window.open(data.url, 'oauth_popup', 'width=600,height=700');
        if (!authWindow) {
          alert('Please allow popups to connect your GitHub account.');
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error initializing OAuth login");
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <SaaSTemplate onLogin={handleLogin} />
      )}
    </>
  );
}

