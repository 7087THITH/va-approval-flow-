import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://192.168.213.207:3001/api';
const CHECK_INTERVAL = 30000; // 30 seconds

export type ApiStatus = 'connected' | 'disconnected' | 'checking';

export function useApiHealth() {
  const [status, setStatus] = useState<ApiStatus>('checking');

  const check = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setStatus(res.ok ? 'connected' : 'disconnected');
    } catch {
      setStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [check]);

  return { status, recheck: check };
}
