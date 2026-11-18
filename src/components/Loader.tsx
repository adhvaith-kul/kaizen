import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Text, Image } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface LoaderProps {
  size?: number;
  color?: string;
  style?: any;
  fullScreen?: boolean;
  message?: string;
}

export default function Loader({ size = 72, style, fullScreen = false, message }: LoaderProps) {
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseValue]);

  const opacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const scale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const loaderContent = (
    <View style={[styles.centerContainer, style]}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: size, height: size, borderRadius: size * 0.22 }}
          resizeMode="cover"
        />
        <Text style={styles.brandTitle}>KAIZEN</Text>
        {message ? (
          <Text style={styles.messageText}>{message}</Text>
        ) : (
          <View style={styles.subBadge}>
            <Text style={styles.subText}>CONTINUOUS IMPROVEMENT</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenOverlay}>{loaderContent}</View>;
  }

  return loaderContent;
}

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(33, 22, 19, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  brandTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: spacing.md,
  },
  messageText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  subBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  subText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
