import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';

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
  const [scaleAnim] = React.useState(new Animated.Value(0.88));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 18,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
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
          <Text style={styles.buttonText}>GOT IT</Text>
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
            onPress={() => handleButtonPress(btn.onPress)}
          >
            <Text
              style={[
                styles.buttonText,
                btn.style === 'cancel' && styles.cancelBtnText,
                btn.style === 'destructive' && styles.destructiveBtnText,
              ]}
            >
              {btn.text.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    backgroundColor: '#1A1A24',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#2A2A35',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    color: '#A0A0B0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  flexBtn: {
    flex: 1,
  },
  button: {
    backgroundColor: '#C2FF05',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#2A2A35',
  },
  destructiveBtn: {
    backgroundColor: '#FF3366',
  },
  buttonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cancelBtnText: {
    color: '#FFF',
  },
  destructiveBtnText: {
    color: '#FFF',
  },
});
