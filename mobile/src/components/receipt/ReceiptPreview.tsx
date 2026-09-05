/**
 * Bjet Mobile - ReceiptPreview Component
 * Displays pre-upload preview for image or PDF receipts with safe metadata display.
 * Does NOT expose internal filesystem paths or perform client-side text extraction.
 */
import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, TouchableOpacity } from 'react-native';
import { FileText, Image as ImageIcon, ArrowLeftRight, X, Upload, ReceiptText } from 'lucide-react-native';
import { ReceiptFile, inferReceiptMimeType } from '../../types/receipt';
import { ExtractionProgress } from '../../services/receipt/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

interface ReceiptPreviewProps {
  file: ReceiptFile;
  isUploading: boolean;
  uploadProgress: number | null;
  onUpload: () => void;
  onReplace: () => void;
  onCancel: () => void;
  onExtractText?: () => void;
  isExtracting?: boolean;
  extractionProgress?: ExtractionProgress | null;
  onCancelExtraction?: () => void;
  style?: ViewStyle;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  file,
  isUploading,
  uploadProgress,
  onUpload,
  onReplace,
  onCancel,
  onExtractText,
  isExtracting = false,
  extractionProgress,
  onCancelExtraction,
  style,
}) => {
  const mimeType = inferReceiptMimeType(file);
  const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Size unknown';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'camera':
        return 'Camera Capture';
      case 'gallery':
        return 'Photo Library';
      case 'document':
        return 'Document Picker';
      default:
        return 'File';
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Visual File Preview */}
      {isPdf ? (
        <Card style={styles.pdfCard}>
          <View style={styles.pdfIconCircle}>
            <FileText color={colors.warning} size={44} />
          </View>
          <Text style={styles.pdfFileName} numberOfLines={2}>
            {file.name}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.pdfBadge}>
              <Text style={styles.pdfBadgeText}>PDF Document</Text>
            </View>
            <Text style={styles.fileSizeText}>{formatFileSize(file.size)}</Text>
          </View>
          <Text style={styles.pdfNote}>
            Receipt will be sent directly to the upload pipeline.
          </Text>
        </Card>
      ) : (
        <Card style={styles.imageCard}>
          <Image
            source={{ uri: file.uri }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <View style={styles.imageMetadataOverlay}>
            <View style={styles.imageBadge}>
              <ImageIcon color="#fff" size={14} style={styles.badgeIcon} />
              <Text style={styles.imageBadgeText}>
                {file.name.endsWith('.png') ? 'PNG' : file.name.endsWith('.webp') ? 'WebP' : 'JPEG'}
              </Text>
            </View>
            <Text style={styles.imageSizeText}>{formatFileSize(file.size)}</Text>
          </View>
        </Card>
      )}

      {/* Safe File Metadata Card */}
      <Card style={styles.metadataCard}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Source</Text>
          <Text style={styles.metaValue}>{getSourceLabel(file.source)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>File Name</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {file.name}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Format</Text>
          <Text style={styles.metaValue}>{mimeType}</Text>
        </View>
        {file.size !== undefined && (
          <>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>File Size</Text>
              <Text style={styles.metaValue}>{formatFileSize(file.size)}</Text>
            </View>
          </>
        )}
      </Card>

      {/* Upload Progress Indicator */}
      {isUploading && (
        <Card style={styles.progressCard}>
          {uploadProgress !== null ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Uploading Receipt...</Text>
                <Text style={styles.progressPercent}>{uploadProgress}%</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${uploadProgress}%` },
                  ]}
                />
              </View>
            </View>
          ) : (
            <LoadingSpinner size="small" label="Uploading receipt to Bjet..." />
          )}
        </Card>
      )}

      {/* Text Extraction Progress Indicator */}
      {isExtracting && (
        <Card style={styles.extractionProgressCard}>
          <View style={styles.extractionProgressContent}>
            <LoadingSpinner size="small" />
            <View style={styles.extractionProgressTextContainer}>
              <Text style={styles.extractionProgressTitle}>
                {extractionProgress?.message || 'Processing document text...'}
              </Text>
              {extractionProgress?.currentPage && extractionProgress?.totalPages && (
                <Text style={styles.extractionProgressSubtitle}>
                  Page {extractionProgress.currentPage} of {extractionProgress.totalPages}
                </Text>
              )}
            </View>
          </View>
          {onCancelExtraction && (
            <TouchableOpacity
              onPress={onCancelExtraction}
              style={styles.cancelExtractionBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelExtractionText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Card>
      )}

      {/* Actions Bar */}
      <View style={styles.actionsContainer}>
        {onExtractText && (
          <Button
            title={
              isExtracting
                ? 'Extracting Text...'
                : isPdf
                ? 'Extract Receipt / Statement Text'
                : 'Extract Receipt Text'
            }
            icon={<ReceiptText color={colors.background} size={18} />}
            onPress={onExtractText}
            variant="primary"
            loading={isExtracting}
            disabled={isUploading || isExtracting}
            style={styles.extractButton}
          />
        )}

        <Button
          title={isUploading ? 'Uploading...' : 'Upload to Backend'}
          icon={<Upload color={colors.text} size={18} />}
          onPress={onUpload}
          variant="secondary"
          loading={isUploading}
          disabled={isUploading || isExtracting}
          style={styles.uploadButton}
        />

        <View style={styles.secondaryActions}>
          <Button
            title="Replace"
            icon={<ArrowLeftRight color={colors.textSecondary} size={16} />}
            onPress={onReplace}
            variant="secondary"
            disabled={isUploading || isExtracting}
            style={styles.halfButton}
          />
          <Button
            title="Cancel"
            icon={<X color={colors.textSecondary} size={16} />}
            onPress={onCancel}
            variant="ghost"
            disabled={isUploading || isExtracting}
            style={styles.halfButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pdfCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pdfIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pdfFileName: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pdfBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pdfBadgeText: {
    color: colors.warning,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  fileSizeText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  pdfNote: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  imageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 320,
    borderRadius: radii.md,
    backgroundColor: '#000',
  },
  imageMetadataOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginRight: 4,
  },
  imageBadgeText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  imageSizeText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  metadataCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  metaValue: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    maxWidth: '65%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
  },
  progressCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressTitle: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  progressPercent: {
    color: colors.brandLight,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: 4,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  extractButton: {
    width: '100%',
  },
  uploadButton: {
    width: '100%',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  extractionProgressCard: {
    backgroundColor: colors.surface,
    borderColor: colors.brand,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extractionProgressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  extractionProgressTextContainer: {
    flex: 1,
  },
  extractionProgressTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.text,
  },
  extractionProgressSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelExtractionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.sm,
  },
  cancelExtractionText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
});

export default ReceiptPreview;
