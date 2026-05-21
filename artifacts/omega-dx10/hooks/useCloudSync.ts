import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

const SYNC_DEBOUNCE = 10_000;
const SAVE_KEY = 'omega_dx10_save_v3';

export function useCloudSync() {
  const { token, getApiUrl } = useAuth();
  const { collection, tamerLevel, tamerExp, playerName, team } = useGame();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(token);
  const getApiUrlRef = useRef(getApiUrl);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { getApiUrlRef.current = getApiUrl; }, [getApiUrl]);

  useEffect(() => {
    const tok = tokenRef.current;
    if (!tok) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const currentTok = tokenRef.current;
      if (!currentTok) return;
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const saveData = JSON.parse(raw);
        await fetch(`${getApiUrlRef.current()}/saves`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentTok}` },
          body: JSON.stringify({ saveData }),
        });
      } catch {}
    }, SYNC_DEBOUNCE);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.length, tamerLevel, tamerExp, playerName, team.length, token]);
}
