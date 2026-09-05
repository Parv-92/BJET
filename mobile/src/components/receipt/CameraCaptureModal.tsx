/**
 * Bjet Mobile - CameraCaptureModal
 * Full-screen receipt camera capture utilizing expo-camera CameraView.
 * Handles runtime camera permission requests on demand with clear recovery states.
 */
import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, ZapOff, Camera, AlertCircle } from 'lucide-react-native';
import { ReceiptFile } from '../../types/receipt';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { Button } from '../ui/Button';

interface CameraCaptureModalProps {
  visible: boolean;
  onCapture: (file: ReceiptFile) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  visible,
  onCapture,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleTakePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (photo?.uri) {
        const file: ReceiptFile = {
          uri: photo.uri,
          name: `receipt_camera_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          source: 'camera',
          width: photo.width,
          height: photo.height,
        };
        onCapture(file);
        onClose();
      }
    } catch (err) {
      console.error('Failed to capture photo:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFlash = () => {
    setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Permission Request View */}
        {!permission?.granted ? (
          <SafeAreaView style={styles.permissionContainer}>
            <View style={styles.permissionCard}>
              <View style={styles.permissionIconCircle}>
                <Camera color={colors.brandLight} size={40} />
              </View>
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionDescription}>
                Bjet requires camera permission to capture receipt photos and UPI payment screenshots.
              </Text>
              <Button
                title="Grant Camera Access"
                onPress={requestPermission}
                variant="primary"
                style={styles.permissionButton}
              />
              <Button
                title="Cancel"
                onPress={onClose}
                variant="ghost"
                style={styles.cancelButton}
              />
            </View>
          </SafeAreaView>
        ) : (
          /* Live Camera View */
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flashMode === 'on'}
          >
            <SafeAreaView style={styles.cameraOverlay}>
              {/* Top Controls Bar */}
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X color="#fff" size={24} />
                </TouchableOpacity>

                <Text style={styles.topBarTitle}>Align Receipt in Frame</Text>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFlash}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {flashMode === 'on' ? (
                    <Zap color={colors.warning} size={24} />
                  ) : (
                    <ZapOff color="#fff" size={24} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Viewfinder Reticle */}
              <View style={styles.reticleContainer}>
                <View style={styles.reticle}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>

              {/* Bottom Controls Bar */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={[
                    styles.shutterButton,
                    isCapturing && styles.shutterButtonDisabled,
                  ]}
                  onPress={handleTakePicture}
                  disabled={isCapturing}
                  activeOpacity={0.8}
                >
                  <View style={styles.shutterInner}>
                    {isCapturing ? (
                      <ActivityIndicator color={colors.brand} size="small" />
                    ) : (
                      <View style={styles.shutterCenter} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </CameraView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  permissionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  permissionDescription: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  permissionButton: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  cancelButton: {
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  reticle: {
    width: '90%',
    height: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.brandLight,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  bottomBar: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingBottom: spacing.md,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  shutterButtonDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
  },
});

export default CameraCaptureModal;
