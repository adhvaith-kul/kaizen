import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface LoaderProps {
  size?: number;
  color?: string;
  style?: any;
  fullScreen?: boolean;
}

export default function Loader({ style, fullScreen = false }: LoaderProps) {
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseValue]);

  const opacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  const scale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.01],
  });

  const loaderContent = (
    <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <Text style={styles.brandTitle}>KAIZEN</Text>
        <View style={styles.subBadge}>
          <Text style={styles.subText}>DISCIPLINE & CONTINUOUS IMPROVEMENT</Text>
        </View>
      </Animated.View>
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
    backgroundColor: 'rgba(19, 14, 11, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  brandTitle: {
    color: colors.silver,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
  },
  subBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  subText: {
    color: colors.lavenderMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
