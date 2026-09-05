/**
 * Bjet Mobile - Statement Candidate Review Screen (Phase 7)
 *
 * Route: /receipt-review/statement
 *
 * Renders parsed statement candidates (e.g. 90 transactions from 11-page GPay statement).
 *
 * SAFEGUARDS ENFORCED:
 * 1. Statement review MUST NOT present the action as "Confirm Transactions" because
 *    statement candidates are not persisted or confirmed in Phase 7.
 *    Action is strictly "Review Selection" / "Continue" with clear explanation that
 *    statement import is not yet persisted.
 * 2. Category suggestions are advisory only. Candidates remain editable and the user can
 *    change the category before any future persistence workflow.
 * 3. Statement candidates remain strictly local and MUST NOT be submitted through POST /transactions.
 * 4. Zero backend or frontend modifications.
 */

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { CandidateCard } from '../../src/components/receipt/CandidateCard';
import { CandidateEditModal } from '../../src/components/receipt/CandidateEditModal';
import {
  StatementSummaryHeader,
  FilterCategory,
} from '../../src/components/receipt/StatementSummaryHeader';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { statementCandidateStore } from '../../src/services/receipt/statementCandidateStore';
import { TransactionCandidate } from '../../src/types/receiptInterpretation';
import { colors } from '../../src/theme/colors';
import { spacing, radii } from '../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../src/theme/typography';

export default function StatementReviewScreen() {
  const router = useRouter();

  // Subscribe to reactive updates from statementCandidateStore
  const candidates = useSyncExternalStore(
    statementCandidateStore.subscribe.bind(statementCandidateStore),
    statementCandidateStore.getCandidates.bind(statementCandidateStore)
  );
  const metadata = statementCandidateStore.getMetadata();

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [editingCandidate, setEditingCandidate] = useState<TransactionCandidate | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Totals and metrics
  const {
    totalSent,
    totalReceived,
    totalTopUp,
    duplicateCount,
    includedCount,
    excludedCount,
  } = useMemo(() => {
    let sent = 0;
    let received = 0;
    let topUp = 0;
    let dupes = 0;
    let inc = 0;
    let exc = 0;

    for (const c of candidates) {
      if (c.isDuplicate) dupes++;
      if (c.reviewStatus === 'EXCLUDED') {
        exc++;
      } else {
        inc++;
        if (c.amount !== undefined) {
          if (c.direction === 'SENT') sent += c.amount;
          else if (c.direction === 'RECEIVED') received += c.amount;
          else if (c.direction === 'TOP_UP') topUp += c.amount;
        }
      }
    }

    return {
      totalSent: sent,
      totalReceived: received,
      totalTopUp: topUp,
      duplicateCount: dupes,
      includedCount: inc,
      excludedCount: exc,
    };
  }, [candidates]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      switch (activeFilter) {
        case 'SENT':
          return c.direction === 'SENT';
        case 'RECEIVED':
          return c.direction === 'RECEIVED';
        case 'TOP_UP':
          return c.direction === 'TOP_UP';
        case 'DUPLICATES':
          return c.isDuplicate;
        case 'ALL':
        default:
          return true;
      }
    });
  }, [candidates, activeFilter]);

  const handleBack = () => {
    router.back();
  };

  const handleToggleInclusion = (localId: string) => {
    statementCandidateStore.toggleInclusion(localId);
  };

  const handleEdit = (candidate: TransactionCandidate) => {
    setEditingCandidate(candidate);
  };

  const handleSaveEdit = (updated: TransactionCandidate) => {
    statementCandidateStore.updateCandidate(updated.localId, updated);
  };

  const handleSelectAll = () => {
    statementCandidateStore.setAllInclusion(true);
  };

  const handleDeselectAll = () => {
    statementCandidateStore.setAllInclusion(false);
  };

  // Safeguard 1: Action is "Review Selection" / "Continue", NEVER "Confirm Transactions"
  const handleReviewSelection = () => {
    setShowSummaryModal(true);
  };

  if (candidates.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <FileSpreadsheet color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Statement Candidates</Text>
          <Text style={styles.emptySubtitle}>
            Extract text from a statement PDF in the Scan tab to review transaction candidates.
          </Text>
          <Button
            title="Go to Scan Tab"
            onPress={() => router.replace('/(tabs)/scan' as any)}
            variant="primary"
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.appBar}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View style={styles.appBarTitles}>
            <Text style={styles.appBarTitle}>Statement Review</Text>
            <Text style={styles.appBarSubtitle}>
              {candidates.length} Local Candidates • Unconfirmed
            </Text>
          </View>
        </View>

        {/* Candidate Virtualized FlatList */}
        <FlatList
          data={filteredCandidates}
          keyExtractor={(item) => item.localId}
          renderItem={({ item }) => (
            <CandidateCard
              candidate={item}
              onToggleInclusion={handleToggleInclusion}
              onEdit={handleEdit}
            />
          )}
          ListHeaderComponent={
            <StatementSummaryHeader
              metadata={metadata}
              totalCount={candidates.length}
              includedCount={includedCount}
              excludedCount={excludedCount}
              duplicateCount={duplicateCount}
              totalSent={totalSent}
              totalReceived={totalReceived}
              totalTopUp={totalTopUp}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={7}
          removeClippedSubviews
        />

        {/* Floating Action Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInfo}>
            <Text style={styles.bottomBarCount}>
              {includedCount} candidates selected
            </Text>
            <Text style={styles.bottomBarSub}>
              ₹{(totalSent + totalTopUp).toLocaleString('en-IN')} debits • ₹{totalReceived.toLocaleString('en-IN')} credits
            </Text>
          </View>

          {/* SAFEGUARD 1: Wording is strictly 'Review Selection' / 'Continue' */}
          <Button
            title="Review Selection"
            icon={<ArrowRight color={colors.background} size={16} />}
            onPress={handleReviewSelection}
            variant="primary"
            style={styles.reviewButton}
          />
        </View>

        {/* In-place Candidate Edit Modal */}
        <CandidateEditModal
          visible={editingCandidate !== null}
          candidate={editingCandidate}
          onClose={() => setEditingCandidate(null)}
          onSave={handleSaveEdit}
        />

        {/* Informational Summary Modal (Safeguard 1 & 3) */}
        <Modal
          visible={showSummaryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSummaryModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <Card style={styles.summaryModalCard}>
              <View style={styles.summaryModalIcon}>
                <Layers color={colors.brandLight} size={36} />
              </View>
              <Text style={styles.summaryModalTitle}>Statement Selection Reviewed</Text>
              <Text style={styles.summaryModalSubtitle}>
                You have reviewed {includedCount} transaction candidates.
              </Text>

              <View style={styles.summaryModalStats}>
                <View style={styles.summaryStatRow}>
                  <Text style={styles.summaryStatLabel}>Selected Candidates</Text>
                  <Text style={styles.summaryStatValue}>{includedCount} of {candidates.length}</Text>
                </View>
                <View style={styles.summaryStatRow}>
                  <Text style={styles.summaryStatLabel}>Total Outflow (Sent + Top-up)</Text>
                  <Text style={styles.summaryStatValue}>
                    ₹{(totalSent + totalTopUp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.summaryStatRow}>
                  <Text style={styles.summaryStatLabel}>Total Inflow (Received)</Text>
                  <Text style={[styles.summaryStatValue, { color: colors.success }]}>
                    ₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <View style={styles.persistedNoticeBox}>
                <Info color={colors.info} size={16} />
                <Text style={styles.persistedNoticeText}>
                  Notice: Statement import is not yet persisted to confirmed backend transactions.
                  Candidates remain stored locally. Bulk persistence will be enabled in a future
                  backend contract release.
                </Text>
              </View>

              <Button
                title="Done"
                onPress={() => setShowSummaryModal(false)}
                variant="primary"
                style={styles.modalDoneButton}
              />
            </Card>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    marginRight: spacing.md,
  },
  appBarTitles: {
    flex: 1,
  },
  appBarTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  appBarSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Extra space for floating bottom bar
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarCount: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  bottomBarSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  reviewButton: {
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  summaryModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  summaryModalIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryModalTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  summaryModalSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  summaryModalStats: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  summaryStatValue: {
    color: colors.text,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  persistedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.28)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  persistedNoticeText: {
    flex: 1,
    color: colors.info,
    fontSize: 11,
    lineHeight: 16,
  },
  modalDoneButton: {
    width: '100%',
  },
});
