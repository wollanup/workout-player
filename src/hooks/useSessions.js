import { useCallback, useState } from 'react';
import { SessionStore, gcFiles } from '../services/storage.js';
import { uid } from '../core/model.js';

/** React wrapper around the localStorage session store. */
export function useSessions() {
  const [sessions, setSessions] = useState(() => SessionStore.all());
  const refresh = useCallback(() => setSessions(SessionStore.all()), []);

  const save = useCallback(async session => {
    SessionStore.upsert(session);
    await gcFiles();
    refresh();
  }, [refresh]);

  const remove = useCallback(async id => {
    SessionStore.remove(id);
    await gcFiles();
    refresh();
  }, [refresh]);

  const duplicate = useCallback(id => {
    const s = structuredClone(SessionStore.get(id));
    s.id = uid();
    s.name += ' (copie)';
    s.steps.forEach(x => { x.id = uid(); });
    SessionStore.upsert(s);
    refresh();
  }, [refresh]);

  return { sessions, save, remove, duplicate };
}
