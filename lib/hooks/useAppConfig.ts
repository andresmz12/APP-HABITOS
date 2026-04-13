'use client';

import { useEffect } from 'react';
import { subscribeToAppConfig } from '../firebase/appConfig';
import { useAppStore } from '../stores/appStore';

export function useAppConfig() {
  const { setAppConfig, appConfig } = useAppStore();

  useEffect(() => {
    const unsubscribe = subscribeToAppConfig((config) => {
      setAppConfig(config);
    });
    return unsubscribe;
  }, [setAppConfig]);

  return appConfig;
}
