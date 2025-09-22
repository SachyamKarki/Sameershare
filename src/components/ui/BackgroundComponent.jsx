// BackgroundComponent.js
// This handles the animated background with gradients and floating elements

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BackgroundComponent = ({ children }) => {
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate background elements on mount
    Animated.timing(backgroundAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Main gradient background - Black theme */}
      <LinearGradient
        colors={['#000000', '#0A0A0A', '#1A1A1A', '#2A2A2A']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Floating animated circles for depth */}
      <Animated.View style={[
        styles.backgroundCircle, 
        { opacity: backgroundAnim }
      ]} />
      
      <Animated.View style={[
        styles.backgroundCircle2, 
        { opacity: backgroundAnim }
      ]} />
      
      {/* Content goes here */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(40,40,40,0.15)', // Dark gray for depth
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(60,60,60,0.08)', // Dark gray for depth
  },
});

export default BackgroundComponent;
