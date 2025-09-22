// animationHooks.js
// Custom hooks and utilities for animations

import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

// Hook for entrance animations (fade in + slide up)
export const useEntranceAnimation = (duration = 1000) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: duration * 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration]);

  return {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };
};

// Hook for continuous pulse animation
export const usePulseAnimation = (scale = 1.05, duration = 1500) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: scale,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [scale, duration]);

  return pulseAnim;
};

// Hook for glow/breathing animation
export const useGlowAnimation = (duration = 2000) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration,
          useNativeDriver: false,
        }),
      ])
    );

    glowLoop.start();

    return () => {
      glowAnim.stopAnimation();
    };
  }, [duration]);

  return glowAnim;
};

// Hook for button press animation
export const useButtonPressAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = (callback) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Execute callback after animation
    setTimeout(callback, 50);
  };

  return {
    transform: [{ scale: scaleAnim }],
    animatePress,
  };
};

// Hook for rotation animation
export const useRotationAnimation = (rotateValue = '180deg', duration = 300) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const rotate = (expanded) => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const interpolatedRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', rotateValue],
  });

  return {
    transform: [{ rotate: interpolatedRotation }],
    rotate,
  };
};

// Animation presets
export const ANIMATION_PRESETS = {
  ENTRANCE: {
    fade: { duration: 1000 },
    slide: { duration: 800, distance: 50 },
  },
  PULSE: {
    gentle: { scale: 1.02, duration: 2000 },
    moderate: { scale: 1.05, duration: 1500 },
    strong: { scale: 1.08, duration: 1000 },
  },
  GLOW: {
    soft: { duration: 3000 },
    medium: { duration: 2000 },
    fast: { duration: 1000 },
  },
  BUTTON: {
    quick: { scale: 0.95, duration: 100 },
    smooth: { scale: 0.92, duration: 150 },
  },
};

// Utility function to create smooth color interpolation
export const createColorInterpolation = (animValue, colors) => {
  return animValue.interpolate({
    inputRange: colors.map((_, index) => index / (colors.length - 1)),
    outputRange: colors,
  });
};

// Utility function for spring animations
export const createSpringAnimation = (value, toValue, config = {}) => {
  const defaultConfig = {
    toValue,
    useNativeDriver: true,
    tension: 100,
    friction: 8,
    ...config,
  };

  return Animated.spring(value, defaultConfig);
};

// Utility function for timing animations
export const createTimingAnimation = (value, toValue, config = {}) => {
  const defaultConfig = {
    toValue,
    duration: 300,
    useNativeDriver: true,
    ...config,
  };

  return Animated.timing(value, defaultConfig);
};

// Stagger animation utility
export const createStaggeredAnimation = (animations, staggerDelay = 100) => {
  return Animated.stagger(staggerDelay, animations);
};

// Sequence animation utility
export const createSequenceAnimation = (animations) => {
  return Animated.sequence(animations);
};

// Parallel animation utility
export const createParallelAnimation = (animations) => {
  return Animated.parallel(animations);
};

// Loop animation utility
export const createLoopAnimation = (animation, iterations = -1) => {
  return Animated.loop(animation, { iterations });
};

// Custom easing functions
export const EASING_FUNCTIONS = {
  // Smooth ease in-out
  smooth: (t) => t * t * (3 - 2 * t),
  
  // Bounce effect
  bounce: (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
  
  // Elastic effect
  elastic: (t) => {
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
};

export default {
  useEntranceAnimation,
  usePulseAnimation,
  useGlowAnimation,
  useButtonPressAnimation,
  useRotationAnimation,
  ANIMATION_PRESETS,
  createColorInterpolation,
  createSpringAnimation,
  createTimingAnimation,
  createStaggeredAnimation,
  createSequenceAnimation,
  createParallelAnimation,
  createLoopAnimation,
  EASING_FUNCTIONS,
};
