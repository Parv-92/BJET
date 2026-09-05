/**
 * Bjet Mobile - CategoryPickerModal
 * Modal bottom sheet for selecting or clearing transaction category.
 */
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { Search, X, Check } from 'lucide-react-native';
import { useCategories } from '../../hooks/useCategories';
import { Category } from '../../types/api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CategoryPickerModalProps {
  visible: boolean;
  selectedCategoryId: number | null | undefined;
  onSelect: (category: Category | null) => void;
  onClose: () => void;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible,
  selectedCategoryId,
  onSelect,
  onClose,
}) => {
  const { data: categories, isLoading } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const handleSelect = (category: Category | null) => {
    onSelect(category);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Category</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Search color={colors.textMuted} size={18} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search categories..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner size="small" label="Loading categories..." />
                </View>
              ) : (
                <FlatList
                  data={filteredCategories}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  ListHeaderComponent={
                    <TouchableOpacity
                      style={[
                        styles.categoryItem,
                        selectedCategoryId === null && styles.categoryItemSelected,
                      ]}
                      onPress={() => handleSelect(null)}
                    >
                      <View style={styles.itemLeft}>
                        <View style={[styles.colorDot, { backgroundColor: colors.textMuted }]} />
                        <Text style={styles.itemTitle}>Uncategorized / None</Text>
                      </View>
                      {selectedCategoryId === null && (
                        <Check color={colors.brandLight} size={18} />
                      )}
                    </TouchableOpacity>
                  }
                  renderItem={({ item }) => {
                    const isSelected = selectedCategoryId === item.id;
                    const itemColor = item.color || colors.brand;

                    return (
                      <TouchableOpacity
                        style={[
                          styles.categoryItem,
                          isSelected && styles.categoryItemSelected,
                        ]}
                        onPress={() => handleSelect(item)}
                      >
                        <View style={styles.itemLeft}>
                          <View style={[styles.colorDot, { backgroundColor: itemColor }]} />
                          <Text style={styles.itemTitle}>{item.name}</Text>
                        </View>
                        {isSelected && <Check color={colors.brandLight} size={18} />}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No categories found</Text>
                    </View>
                  }
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    borderRadius: 6,
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: spacing.md,
  },
  itemTitle: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
});

export default CategoryPickerModal;
