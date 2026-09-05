/**
 * Bjet Mobile - Statement Candidate In-Memory Store (Phase 7)
 *
 * Keeps active statement candidates in memory during review.
 * Avoids URL parameter length limits when passing large multi-page candidate sets
 * (e.g. 90 transactions from 11-page GPay statement).
 *
 * Safeguard constraint:
 * Statement candidates are strictly local and are NEVER sent to POST /transactions.
 */

import {
  TransactionCandidate,
  StatementMetadata,
} from '../../types/receiptInterpretation';

class StatementCandidateStore {
  private candidates: TransactionCandidate[] = [];
  private metadata: StatementMetadata | undefined = undefined;
  private warnings: string[] = [];
  private listeners: Set<() => void> = new Set();

  public setSession(
    candidates: TransactionCandidate[],
    metadata?: StatementMetadata,
    warnings?: string[]
  ) {
    this.candidates = [...candidates];
    this.metadata = metadata;
    this.warnings = warnings ? [...warnings] : [];
    this.notify();
  }

  public getCandidates(): TransactionCandidate[] {
    return this.candidates;
  }

  public getMetadata(): StatementMetadata | undefined {
    return this.metadata;
  }

  public getWarnings(): string[] {
    return this.warnings;
  }

  public updateCandidate(localId: string, updated: TransactionCandidate) {
    const idx = this.candidates.findIndex(c => c.localId === localId);
    if (idx !== -1) {
      this.candidates[idx] = { ...updated };
      this.notify();
    }
  }

  public toggleInclusion(localId: string) {
    const idx = this.candidates.findIndex(c => c.localId === localId);
    if (idx !== -1) {
      const current = this.candidates[idx];
      const isExcl = current.reviewStatus === 'EXCLUDED' || current.isExcluded;
      const nextStatus = isExcl ? 'READY_FOR_REVIEW' : 'EXCLUDED';
      this.candidates[idx] = {
        ...current,
        reviewStatus: nextStatus,
        isExcluded: !isExcl,
      };
      this.notify();
    }
  }

  public setAllInclusion(include: boolean) {
    this.candidates = this.candidates.map(c => ({
      ...c,
      reviewStatus: include ? 'READY_FOR_REVIEW' : 'EXCLUDED',
      isExcluded: !include,
    }));
    this.notify();
  }

  public clear() {
    this.candidates = [];
    this.metadata = undefined;
    this.warnings = [];
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const statementCandidateStore = new StatementCandidateStore();
