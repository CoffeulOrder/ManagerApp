import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { MenuItem } from '@/types';

export default function MenuScreen() {
  const { currentStore, categories, menuItems, addMenuItem, removeMenuItem, updateMenuItem, toggleSoldOut } =
    useApp();

  const storeCategories = useMemo(
    () => categories.filter((c) => c.storeId === currentStore?.id).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories, currentStore]
  );
  const [activeCategoryId, setActiveCategoryId] = useState(storeCategories[0]?.id ?? '');
  const activeCategory = storeCategories.find((c) => c.id === activeCategoryId) ?? storeCategories[0];

  const items = useMemo(
    () => menuItems.filter((m) => m.storeId === currentStore?.id && m.categoryId === activeCategory?.id),
    [menuItems, currentStore, activeCategory]
  );

  // "메뉴 관리" modal: add new items to this category, or remove existing ones.
  const [manageVisible, setManageVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  function openManage() {
    setName('');
    setDescription('');
    setPrice('');
    setManageVisible(true);
  }

  function handleAdd() {
    const parsedPrice = Number(price.replace(/[^0-9]/g, ''));
    if (!name.trim() || !parsedPrice || !currentStore || !activeCategory) return;
    addMenuItem({
      storeId: currentStore.id,
      categoryId: activeCategory.id,
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
    });
    setName('');
    setDescription('');
    setPrice('');
  }

  // Action sheet shown when tapping a menu item: 수정 or 품절 처리.
  const [actionItem, setActionItem] = useState<MenuItem | null>(null);

  // "메뉴 수정" modal.
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setEditName(item.name);
    setEditDescription(item.description);
    setEditPrice(String(item.price));
    setActionItem(null);
  }

  function handleSaveEdit() {
    const parsedPrice = Number(editPrice.replace(/[^0-9]/g, ''));
    if (!editItem || !editName.trim() || !parsedPrice) return;
    updateMenuItem(editItem.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      price: parsedPrice,
    });
    setEditItem(null);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {storeCategories.map((cat) => {
            const active = cat.id === activeCategory?.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                onPress={() => setActiveCategoryId(cat.id)}>
                <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'}>
                  {cat.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
        <Button label="메뉴 관리" size="small" onPress={openManage} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {items.length === 0 && (
          <ThemedText type="small" color="textMuted" style={styles.emptyText}>
            이 카테고리에 등록된 메뉴가 없습니다
          </ThemedText>
        )}
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, item.soldOut && styles.cardSoldOut]}
            onPress={() => setActionItem(item)}>
            <ThemedText type="subtitle">{item.name}</ThemedText>
            <ThemedText type="small" color="textSecondary" numberOfLines={2}>
              {item.description}
            </ThemedText>
            <View style={styles.cardBottomRow}>
              <ThemedText type="price" color="accent">
                {item.price.toLocaleString()}원
              </ThemedText>
              <View style={[styles.soldOutBadge, item.soldOut && styles.soldOutBadgeActive]}>
                <ThemedText type="label" color={item.soldOut ? 'text' : 'textSecondary'}>
                  {item.soldOut ? '품절' : '판매중'}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* 메뉴 아이템 액션 시트: 수정 / 품절 처리 */}
      <Modal visible={!!actionItem} transparent animationType="fade" onRequestClose={() => setActionItem(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActionItem(null)}>
          <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
            <ThemedText type="subtitle" style={styles.actionSheetTitle}>
              {actionItem?.name}
            </ThemedText>
            <Pressable style={styles.actionRow} onPress={() => actionItem && openEdit(actionItem)}>
              <SymbolView
                name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                tintColor={Colors.text}
                size={18}
              />
              <ThemedText type="default">수정</ThemedText>
            </Pressable>
            <Pressable
              style={styles.actionRow}
              onPress={() => {
                if (actionItem) toggleSoldOut(actionItem.id);
                setActionItem(null);
              }}>
              <SymbolView
                name={{ ios: 'exclamationmark.circle', android: 'block', web: 'block' }}
                tintColor={Colors.danger}
                size={18}
              />
              <ThemedText type="default" color="danger">
                {actionItem?.soldOut ? '판매 재개' : '품절 처리'}
              </ThemedText>
            </Pressable>
            <Pressable style={[styles.actionRow, styles.actionRowLast]} onPress={() => setActionItem(null)}>
              <ThemedText type="default" color="textSecondary" style={styles.cancelLabel}>
                취소
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 메뉴 관리: 이 카테고리에 메뉴 추가 / 삭제 */}
      <Modal visible={manageVisible} transparent animationType="fade" onRequestClose={() => setManageVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle">메뉴 관리</ThemedText>
            <ThemedText type="small" color="textSecondary" style={styles.modalCategory}>
              {activeCategory?.name} 카테고리
            </ThemedText>

            <View style={styles.modalForm}>
              <TextField label="메뉴명" placeholder="카페 라떼" value={name} onChangeText={setName} />
              <TextField
                label="설명"
                placeholder="부드러운 스팀밀크와 에스프레소"
                value={description}
                onChangeText={setDescription}
              />
              <TextField
                label="가격"
                placeholder="5000"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Button label="+ 메뉴 추가" onPress={handleAdd} />
            </View>

            <ThemedText type="smallBold" color="textSecondary" style={styles.manageListTitle}>
              등록된 메뉴
            </ThemedText>
            <ScrollView style={styles.manageList}>
              {items.length === 0 && (
                <ThemedText type="small" color="textMuted">
                  등록된 메뉴가 없습니다
                </ThemedText>
              )}
              {items.map((item) => (
                <View key={item.id} style={styles.manageRow}>
                  <ThemedText type="small" style={styles.manageRowName} numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" color="textSecondary">
                    {item.price.toLocaleString()}원
                  </ThemedText>
                  <Pressable onPress={() => removeMenuItem(item.id)} hitSlop={8} style={styles.manageDeleteButton}>
                    <SymbolView
                      name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                      tintColor={Colors.danger}
                      size={16}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <Button label="닫기" variant="secondary" style={styles.closeButton} onPress={() => setManageVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* 메뉴 수정 */}
      <Modal visible={!!editItem} transparent animationType="fade" onRequestClose={() => setEditItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle">메뉴 수정</ThemedText>

            <View style={styles.modalForm}>
              <TextField label="메뉴명" value={editName} onChangeText={setEditName} />
              <TextField label="설명" value={editDescription} onChangeText={setEditDescription} />
              <TextField label="가격" keyboardType="numeric" value={editPrice} onChangeText={setEditPrice} />
            </View>

            <View style={styles.modalActions}>
              <Button label="취소" variant="secondary" style={styles.modalButton} onPress={() => setEditItem(null)} />
              <Button label="저장" style={styles.modalButton} onPress={handleSaveEdit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  categoryRow: {
    flexGrow: 0,
  },
  categoryPill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.two,
  },
  categoryPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  emptyText: {
    marginTop: Spacing.five,
  },
  card: {
    width: 240,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardSoldOut: {
    opacity: 0.55,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  soldOutBadge: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Colors.successBg,
  },
  soldOutBadgeActive: {
    backgroundColor: Colors.dangerBg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheet: {
    width: 300,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  actionSheetTitle: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionRowLast: {
    justifyContent: 'center',
  },
  cancelLabel: {
    textAlign: 'center',
    flex: 1,
  },
  modalCard: {
    width: 420,
    maxHeight: '85%',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
    gap: Spacing.one,
  },
  modalCategory: {
    marginBottom: Spacing.two,
  },
  modalForm: {
    gap: Spacing.three,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  modalButton: {
    flex: 1,
  },
  manageListTitle: {
    marginTop: Spacing.five,
    marginBottom: Spacing.one,
  },
  manageList: {
    maxHeight: 180,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  manageRowName: {
    flex: 1,
  },
  manageDeleteButton: {
    padding: Spacing.one,
  },
  closeButton: {
    marginTop: Spacing.four,
  },
});
