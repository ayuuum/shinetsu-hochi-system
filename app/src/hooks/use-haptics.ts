"use client";

import { useCallback } from "react";

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'error' | 'success';

export function useHaptics() {
    const triggerHaptic = useCallback((type: HapticType = 'light') => {
        if (typeof window === 'undefined') return;

        // Ignore if vibration is not supported
        if (!navigator.vibrate) return;

        try {
            switch (type) {
                case 'light':
                case 'selection':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(30);
                    break;
                case 'heavy':
                    navigator.vibrate(50);
                    break;
                case 'success':
                    navigator.vibrate([10, 30, 20]);
                    break;
                case 'error':
                    navigator.vibrate([30, 50, 30, 50, 40]);
                    break;
                default:
                    navigator.vibrate(15);
            }
        } catch {
            // Silently fail if vibration throws an error
        }
    }, []);

    return { triggerHaptic };
}
