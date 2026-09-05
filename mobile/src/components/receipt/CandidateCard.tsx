/**
 * Bjet Mobile - Candidate Card Component (Phase 7)
 *
 * Displays a single parsed transaction candidate from a statement or receipt.
 *
 * Features:
 * - Direction indicator (SENT, RECEIVED, TOP_UP, UNKNOWN)
 * - Counterparty/merchant name & formatted INR amount
 * - Timestamp formatting
 * - Exact string UPI transaction ID / VPA
 * - Advisory category badge (clearly indicates suggestion; tappable)
 * - Duplicate detection warning & in-batch warnings
 * - Inclusion/exclusion toggle
 * - Collapsible source evidence audit snippet (sourcePage + sourceText)
 * - Edit trigger for full candidate modification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Edit3,
  CheckSquare,
  Square,
  Tag,
  ShieldCheck,
} from 'lucide-react-native';
import { TransactionCandidate } from '../../types/receiptInterpretation';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

interface CandidateCardProps {
  candidate: TransactionCandidate;
  onToggleInclusion: (candidateId: string) => void;
  onEdit: (candidate: TransactionCandidate) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onToggleInclusion,
  onEdit,
}) => {
  const [showEvidence, setShowEvidence] = useState(false);

  const isExcluded = candidate.reviewStatus === 'EXCLUDED';

  // Format currency
  const formattedAmount =
    candidate.amount !== undefined
      ? `₹${candidate.amount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '₹—';

  // Format timestamp e.g. "01 Aug 2026, 11:22 AM"
  const formattedDate = candidate.timestamp
    ? (() => {
        try {
          const d = new Date(candidate.timestamp);
          return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return candidate.timestamp;
        }
      })()
    : 'Unknown Date';

  // Direction configuration
  const getDirectionMeta = () => {
    switch (candidate.direction) {
      case 'RECEIVED':
        return {
          label: 'Received',
          icon: <ArrowDownLeft color={colors.success} size={16} />,
          color: colors.success,
          bgColor: 'rgba(16, 185, 129, 0.12)',
        };
      case 'TOP_UP':
        return {
          label: 'UPI Lite Top-up',
          icon: <RefreshCw color={colors.info} size={16} />,
          color: colors.info,
          bgColor: 'rgba(59, 130, 246, 0.12)',
        };
      case 'SENT':
        return {
          label: 'Sent',
          icon: <ArrowUpRight color={colors.textSecondary} size={16} />,
          color: colors.textSecondary,
          bgColor: 'rgba(148, 163, 184, 0.12)',
        };
      default:
        return {
          label: 'Unknown',
          icon: <HelpCircle color={colors.textMuted} size={16} />,
          color: colors.textMuted,
          bgColor: 'rgba(100, 116, 139, 0.12)',
        };
    }
  };

  const dirMeta = getDirectionMeta();

  return (
    <View
      style={[
        styles.card,
        isExcluded && styles.cardExcluded,
        candidate.isDuplicate && styles.cardDuplicate,
      ]}
    >
      {/* Top Header: Selection checkbox, Direction, and Edit action */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => onToggleInclusion(candidate.localId)}
          style={styles.checkboxContainer}
          accessibilityLabel={isExcluded ? 'Include candidate' : 'Exclude candidate'}
        >
          {isExcluded ? (
            <Square color={colors.textMuted} size={20} />
          ) : (
            <CheckSquare color={colors.brandLight} size={20} />
          )}
          <Text
            style={[
              styles.inclusionText,
              isExcluded ? styles.textMuted : styles.textLight,
            ]}
          >
            {isExcluded ? 'Excluded' : 'Included'}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={[styles.directionBadge, { backgroundColor: dirMeta.bgColor }]}>
            {dirMeta.icon}
            <Text style={[styles.directionText, { color: dirMeta.color }]}>
              {dirMeta.label}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => onEdit(candidate)}
            style={styles.editButton}
            accessibilityLabel="Edit candidate"
          >
            <Edit3 color={colors.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Details: Merchant & Amount */}
      <View style={styles.detailsRow}>
        <View style={styles.merchantContainer}>
          <Text
            style={[styles.merchantName, isExcluded && styles.textStrikethrough]}
            numberOfLines={2}
          >
            {candidate.counterpartyName || candidate.merchantRawName || 'Unknown Merchant'}
          </Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amountText,
              candidate.direction === 'RECEIVED' && styles.amountReceived,
              isExcluded && styles.textStrikethrough,
            ]}
          >
            {formattedAmount}
          </Text>
          {candidate.upiTransactionId ? (
            <Text style={styles.upiIdText} numberOfLines={1}>
              UPI: {candidate.upiTransactionId}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Advisory Category Pill */}
      <View style={styles.categoryRow}>
        <TouchableOpacity
          style={styles.categoryPill}
          onPress={() => onEdit(candidate)}
          activeOpacity={0.7}
        >
          <Tag color={colors.brandLight} size={12} />
          <Text style={styles.categoryPillLabel}>
            Advisory: {candidate.suggestedCategoryName || 'Uncategorized'}
          </Text>
        </TouchableOpacity>

        {candidate.confidence && (
          <View style={styles.confidenceBadge}>
            <ShieldCheck color={colors.textMuted} size={12} />
            <Text style={styles.confidenceText}>
              {candidate.confidence} Confidence
            </Text>
          </View>
        )}
      </View>

      {/* Duplicate Warning Alert */}
      {candidate.isDuplicate && (
        <View style={styles.warningBox}>
          <Copy color={colors.warning} size={14} />
          <Text style={styles.warningBoxText}>
            Duplicate detected{candidate.duplicateTransactionId ? ` (matches #${candidate.duplicateTransactionId})` : ''}
          </Text>
        </View>
      )}

      {/* General Warnings */}
      {candidate.warnings && candidate.warnings.length > 0 && (
        <View style={styles.warningsList}>
          {candidate.warnings.map((w, idx) => (
            <View key={idx} style={styles.warningItem}>
              <AlertTriangle color={colors.warning} size={12} />
              <Text style={styles.warningText}>{w}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Source Evidence Expandable Section */}
      {(candidate.sourceText || candidate.sourcePage !== undefined) && (
        <View style={styles.evidenceContainer}>
          <TouchableOpacity
            style={styles.evidenceToggle}
            onPress={() => setShowEvidence(prev => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.evidenceToggleText}>
              {showEvidence ? 'Hide Source Evidence' : 'View Source Evidence'}
              {candidate.sourcePage !== undefined ? ` (Page ${candidate.sourcePage})` : ''}
            </Text>
            {showEvidence ? (
              <ChevronUp color={colors.textMuted} size={14} />
            ) : (
              <ChevronDown color={colors.textMuted} size={14} />
            )}
          </TouchableOpacity>

          {showEvidence && candidate.sourceText && (
            <View style={styles.evidenceContent}>
              <Text style={styles.evidenceCode} selectable>
                {candidate.sourceText}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardExcluded: {
    opacity: 0.55,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderMuted,
  },
  cardDuplicate: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inclusionText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  textLight: {
    color: colors.textSecondary,
  },
  textMuted: {
    color: colors.textMuted,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  directionText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  editButton: {
    padding: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  merchantContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  merchantName: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  amountReceived: {
    color: colors.success,
  },
  upiIdText: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  categoryPillLabel: {
    color: colors.brandLight,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
  warningBoxText: {
    color: colors.warning,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  warningsList: {
    marginTop: spacing.xs,
    gap: 2,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    color: colors.warning,
    fontSize: 11,
  },
  evidenceContainer: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    paddingTop: spacing.xs,
  },
  evidenceToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  evidenceToggleText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  evidenceContent: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  evidenceCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
