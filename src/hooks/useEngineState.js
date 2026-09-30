import { useSyncExternalStore } from 'react';

/** Subscribes a component to the WorkoutEngine state. */
export const useEngineState = engine => useSyncExternalStore(engine.subscribe, engine.getState);
