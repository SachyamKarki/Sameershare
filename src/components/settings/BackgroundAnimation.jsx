import React from 'react';
import { View, StyleSheet } from 'react-native';

const BackgroundAnimation = ({ darkMode = true }) => {
  const opacity = darkMode ? 0.05 : 0.08; // Much lower opacity for more blackish look
  
  return (
    <View style={styles.backgroundGradient}>
      <View style={[
        styles.gradientCircle, 
        styles.circle1,
        { backgroundColor: `rgba(138, 43, 226, ${opacity})` }
      ]} />
      <View style={[
        styles.gradientCircle, 
        styles.circle2,
        { backgroundColor: `rgba(30, 144, 255, ${opacity})` }
      ]} />
      <View style={[
        styles.gradientCircle, 
        styles.circle3,
        { backgroundColor: `rgba(255, 20, 147, ${opacity})` }
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientCircle: {
    position: "absolute",
    borderRadius: 200,
    width: 400,
    height: 400,
  },
  circle1: { 
    top: -200, 
    left: -100 
  },
  circle2: {
    top: 100,
    right: -150,
  },
  circle3: {
    bottom: -100,
    left: -50,
  },
});

export default BackgroundAnimation;
