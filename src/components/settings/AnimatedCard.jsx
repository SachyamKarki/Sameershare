import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const AnimatedCard = ({ children, delay = 0, style }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        style,
        { 
          transform: [{ translateY: slideAnim }], 
          opacity: opacityAnim 
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedCard;
