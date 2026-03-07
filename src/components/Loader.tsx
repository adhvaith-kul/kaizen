import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

interface LoaderProps {
  size?: number;
  color?: string;
  style?: any;
  fullScreen?: boolean;
}

export default function Loader({ size = 48, color = '#C2FF05', style, fullScreen = false }: LoaderProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15],
  });

  const opacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const loaderContent = (
    <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: color,
          borderTopColor: 'transparent',
          transform: [{ rotate: spin }, { scale }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: size * 0.2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
        }}
      />
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenOverlay}>{loaderContent}</View>;
  }

  return loaderContent;
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 14, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});
