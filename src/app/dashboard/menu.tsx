import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function MenuScreen() {
  const { currentStore, categories, menuItems, addMenuItem, removeMenuItem, toggleSoldOut } = useApp();

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

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  function openModal() {
    setName('');
    setDescription('');
    setPrice('');
    setModalVisible(true);
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
    setModalVisible(false);
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
        <Button label="+ 메뉴 추가" size="small" onPress={openModal} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {items.length === 0 && (
          <ThemedText type="small" color="textMuted" style={styles.emptyText}>
            이 카테고리에 등록된 메뉴가 없습니다
          </ThemedText>
        )}
        {items.map((item) => (
          <View key={item.id} style={[styles.card, item.soldOut && styles.cardSoldOut]}>
            <View style={styles.cardTopRow}>
              <ThemedText type="subtitle" style={styles.cardName}>
                {item.name}
              </ThemedText>
              <Pressable onPress={() => removeMenuItem(item.id)} hitSlop={8}>
                <SymbolView
                  name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                  tintColor={Colors.danger}
                  size={18}
                />
              </Pressable>
            </View>
            <ThemedText type="small" color="textSecondary" numberOfLines={2}>
              {item.description}
            </ThemedText>
            <View style={styles.cardBottomRow}>
              <ThemedText type="price" color="accent">
                {item.price.toLocaleString()}원
              </ThemedText>
              <Pressable
                style={[styles.soldOutToggle, item.soldOut && styles.soldOutToggleActive]}
                onPress={() => toggleSoldOut(item.id)}>
                <ThemedText type="label" color={item.soldOut ? 'text' : 'textSecondary'}>
                  {item.soldOut ? '품절' : '판매중'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle">메뉴 추가</ThemedText>
            <ThemedText type="small" color="textSecondary" style={styles.modalCategory}>
              {activeCategory?.name} 카테고리에 추가됩니다
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
            </View>

            <View style={styles.modalActions}>
              <Button label="취소" variant="secondary" style={styles.modalButton} onPress={() => setModalVisible(false)} />
              <Button label="추가" style={styles.modalButton} onPress={handleAdd} />
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardName: {
    flex: 1,
    marginRight: Spacing.two,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  soldOutToggle: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Colors.successBg,
  },
  soldOutToggleActive: {
    backgroundColor: Colors.dangerBg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 420,
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
});
