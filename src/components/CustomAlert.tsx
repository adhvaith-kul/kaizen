import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttons?: AlertButton[];
}

export default function CustomAlert({ visible, title, message, onClose, buttons }: CustomAlertProps) {
  const [scaleAnim] = React.useState(new Animated.Value(0.92));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 220,
          friction: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleButtonPress = (onPress?: () => void) => {
    onClose();
    if (onPress) {
      setTimeout(() => onPress(), 100);
    }
  };

  const renderButtons = () => {
    if (!buttons || buttons.length === 0) {
      return (
        <TouchableOpacity style={styles.button} onPress={() => handleButtonPress()}>
          <Text style={styles.buttonText}>Acknowledge</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.buttonRow}>
        {buttons.map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.button,
              btn.style === 'cancel' && styles.cancelBtn,
              btn.style === 'destructive' && styles.destructiveBtn,
              buttons.length > 1 && styles.flexBtn,
            ]}
            onPress={() => handleButtonPress(btn.onPress)}>
            <Text
              style={[
                styles.buttonText,
                btn.style === 'cancel' && styles.cancelBtnText,
                btn.style === 'destructive' && styles.destructiveBtnText,
              ]}>
              {btn.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {renderButtons()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  alertBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.silver,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
    fontWeight: '400',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  flexBtn: {
    flex: 1,
  },
  button: {
    backgroundColor: colors.mocha,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mochaLight,
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  destructiveBtn: {
    backgroundColor: colors.danger,
    borderColor: 'transparent',
  },
  buttonText: {
    color: colors.silver,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cancelBtnText: {
    color: colors.textMuted,
  },
  destructiveBtnText: {
    color: colors.silverLight,
  },
});
