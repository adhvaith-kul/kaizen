import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { colors, radii } from '../theme';

export interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: BlurTint;
  /**
   * Style preset:
   * - 'dock': edge-to-edge frosted glass bar (bottom navbar, top header)
   * - 'capsule': floating rounded glass pill (buttons, active tabs, floating docks)
   * - 'card': glass surface card with border and soft shadow
   * - 'modal': deep blur sheet / dialog container
   * - 'raw': plain glass container without preset borders
   */
  variant?: 'dock' | 'capsule' | 'card' | 'modal' | 'raw';
  borderRadius?: number;
  tintColor?: string;
  specularBorder?: boolean;
  specularColor?: string;
  overflow?: 'hidden' | 'visible';
}

export default function GlassView({
  children,
  style,
  intensity = 75,
  tint = 'dark',
  variant = 'card',
  borderRadius,
  tintColor,
  specularBorder = true,
  specularColor,
  overflow = 'hidden',
}: GlassViewProps) {
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  // Apple-style specular reflection colors
  const defaultSpecular = specularColor || (variant === 'capsule' ? 'rgba(230, 224, 240, 0.22)' : 'rgba(255, 255, 255, 0.14)');
  const defaultTopRim = variant === 'dock' ? 'rgba(255, 255, 255, 0.16)' : defaultSpecular;

  // Translucent backdrop tint for depth
  const defaultBackdrop = tintColor || (
    variant === 'capsule'
      ? 'rgba(230, 224, 240, 0.10)'
      : variant === 'modal'
      ? 'rgba(28, 19, 15, 0.82)'
      : 'rgba(37, 25, 20, 0.62)'
  );

  const resolvedRadius =
    borderRadius !== undefined
      ? borderRadius
      : variant === 'capsule'
      ? 28
      : variant === 'card'
      ? radii.lg
      : variant === 'modal'
      ? radii.xl
      : 0;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'dock' && styles.dock,
    variant === 'capsule' && styles.capsule,
    variant === 'card' && styles.card,
    variant === 'modal' && styles.modal,
    { borderRadius: resolvedRadius, overflow },
    specularBorder && {
      borderColor: defaultSpecular,
      borderTopColor: defaultTopRim,
    },
    isWeb && ({
      backdropFilter: `blur(${Math.round(intensity * 0.35)}px) saturate(180%)`,
      WebkitBackdropFilter: `blur(${Math.round(intensity * 0.35)}px) saturate(180%)`,
    } as any),
    style,
  ];

  return (
    <View style={containerStyle}>
      {/* Native frosted blur layer */}
      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={intensity}
        tint={tint}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
      />

      {/* Apple ambient translucent tint layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: defaultBackdrop,
            borderRadius: resolvedRadius,
          },
        ]}
      />

      {/* Top hairline specular refraction highlight */}
      {specularBorder && (variant === 'card' || variant === 'dock' || variant === 'modal') && (
        <View
          pointerEvents="none"
          style={[
            styles.specularHairline,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderTopLeftRadius: resolvedRadius,
              borderTopRightRadius: resolvedRadius,
            },
          ]}
        />
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'relative',
  },
  dock: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  capsule: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modal: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 24,
  },
  specularHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
});
