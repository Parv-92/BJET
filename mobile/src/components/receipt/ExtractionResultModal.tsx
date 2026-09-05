/**
 * Bjet Mobile - Extraction Result Modal (Phase 6)
 *
 * Displays the outcome of document text extraction:
 * - Document Classification Badge (Transaction Statement, Individual Receipt, Unknown)
 * - Extraction Method Badge (PDF_TEXT, OCR, PDF_OCR)
 * - Page Count & Quality Metrics (Characters, Non-whitespace, Non-empty lines, Extraction duration)
 * - Warning Banners for any partial or page failures
 * - Full Scrollable Raw Text with Page Boundary highlighting
 *
 * STRICT PHASE 6 CONSTRAINT:
 * - Does NOT display parsed transaction cards or auto-confirmation controls.
 * - Does NOT create transactions.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  FileText,
  Receipt,
  Layers,
  AlertTriangle,
  Clock,
  Hash,
  X,
  Check,
  Copy,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ReceiptExtractionResult } from '../../services/receipt/types';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

interface ExtractionResultModalProps {
  visible: boolean;
  result: ReceiptExtractionResult | null;
  onClose: () => void;
  onReviewCandidates?: () => void;
}

export const ExtractionResultModal: React.FC<ExtractionResultModalProps> = ({
  visible,
  result,
  onClose,
  onReviewCandidates,
}) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const isStatement = result.documentType === 'TRANSACTION_STATEMENT';
  const isReceipt = result.documentType === 'INDIVIDUAL_RECEIPT';

  const getDocTypeColor = () => {
    if (isStatement) return colors.info;
    if (isReceipt) return colors.brandLight;
    return colors.warning;
  };

  const getDocTypeLabel = () => {
    switch (result.documentType) {
      case 'TRANSACTION_STATEMENT':
        return 'Transaction Statement';
      case 'INDIVIDUAL_RECEIPT':
        return 'Individual Receipt';
      default:
        return 'Unknown Document';
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'PDF_TEXT':
        return { label: 'Direct PDF Text', color: colors.brandLight };
      case 'OCR':
        return { label: 'Image OCR', color: colors.info };
      case 'PDF_OCR':
        return { label: 'Scanned PDF (OCR)', color: colors.warning };
      default:
        return { label: method, color: colors.textMuted };
    }
  };

  const methodInfo = getMethodBadge(result.extractionMethod);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Extraction Result</Text>
              <Text style={styles.subtitle}>Raw document text & classification metadata</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
              <X color={colors.textSecondary} size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Classification Card */}
            <Card style={styles.card}>
              <View style={styles.typeRow}>
                <View
                  style={[
                    styles.typeIconCircle,
                    { backgroundColor: `${getDocTypeColor()}20` },
                  ]}
                >
                  {isStatement ? (
                    <Layers color={getDocTypeColor()} size={28} />
                  ) : (
                    <Receipt color={getDocTypeColor()} size={28} />
                  )}
                </View>
                <View style={styles.typeDetails}>
                  <Text style={[styles.typeLabel, { color: getDocTypeColor() }]}>
                    {getDocTypeLabel()}
                  </Text>
                  <View style={styles.badgesContainer}>
                    <View style={[styles.badge, { borderColor: methodInfo.color }]}>
                      <Text style={[styles.badgeText, { color: methodInfo.color }]}>
                        {methodInfo.label}
                      </Text>
                    </View>
                    {result.pageCount !== undefined && (
                      <View style={styles.pageBadge}>
                        <Text style={styles.pageBadgeText}>
                          {result.pageCount} {result.pageCount === 1 ? 'Page' : 'Pages'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Hash color={colors.textMuted} size={14} />
                  <Text style={styles.metricValue}>
                    {result.characterCount || result.rawText.length}
                  </Text>
                  <Text style={styles.metricLabel}>Characters</Text>
                </View>
                <View style={styles.metricItem}>
                  <FileText color={colors.textMuted} size={14} />
                  <Text style={styles.metricValue}>
                    {result.nonEmptyLineCount || 0}
                  </Text>
                  <Text style={styles.metricLabel}>Lines</Text>
                </View>
                {result.extractionDurationMs !== undefined && (
                  <View style={styles.metricItem}>
                    <Clock color={colors.textMuted} size={14} />
                    <Text style={styles.metricValue}>
                      {result.extractionDurationMs}ms
                    </Text>
                    <Text style={styles.metricLabel}>Duration</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Warnings Section */}
            {result.warnings && result.warnings.length > 0 && (
              <Card style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <AlertTriangle color={colors.warning} size={18} />
                  <Text style={styles.warningTitle}>Extraction Warnings</Text>
                </View>
                {result.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>
                    • {warning}
                  </Text>
                ))}
              </Card>
            )}

            {/* Raw Text Viewer */}
            <Card style={styles.textCard}>
              <View style={styles.textCardHeader}>
                <Text style={styles.textCardTitle}>Normalized Raw Text</Text>
                <View style={styles.charBadge}>
                  <Text style={styles.charBadgeText}>
                    {result.rawText.length} chars
                  </Text>
                </View>
              </View>

              <ScrollView
                style={styles.textScrollView}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <Text style={styles.rawTextContent} selectable>
                  {result.rawText || '(No readable text extracted)'}
                </Text>
              </ScrollView>
            </Card>

            {/* Phase 7 Interpretation & Review Notice */}
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                Extracted text can now be interpreted into reviewable transaction candidates.
                Statement candidates remain local and unconfirmed.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            {onReviewCandidates && (
              <Button
                title="Interpret & Review Candidates"
                variant="primary"
                onPress={onReviewCandidates}
                style={styles.actionButton}
              />
            )}
            <Button
              title="Close"
              variant={onReviewCandidates ? 'secondary' : 'primary'}
              onPress={onClose}
              style={styles.actionButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    marginLeft: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  typeDetails: {
    flex: 1,
  },
  typeLabel: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  pageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
  },
  pageBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  warningCard: {
    backgroundColor: `${colors.warning}15`,
    borderColor: `${colors.warning}40`,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  warningTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.warning,
  },
  warningText: {
    fontSize: fontSizes.xs,
    color: colors.text,
    marginTop: 2,
    lineHeight: 18,
  },
  textCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  textCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  textCardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  charBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  charBadgeText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  textScrollView: {
    maxHeight: 350,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  rawTextContent: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  disclaimerContainer: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  doneButton: {
    width: '100%',
  },
});
