import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { formatPrice } from '@pythfolio/core';
import { api } from '../src/lib/api';

const ASSET_CLASSES = [
  { label: 'All', value: null },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Equities', value: 'equity' },
  { label: 'Forex', value: 'forex' },
  { label: 'Commodities', value: 'commodity' },
];

export default function BrowseScreen() {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [activeClass, setActiveClass] = useState<string | null>(null);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      const feedList = await api.getFeeds();
      setFeeds(feedList);

      const feedIds = feedList.map((f: any) => f.feedId);
      if (feedIds.length > 0) {
        const priceData = await api.getPrices(feedIds);
        setPrices(priceData);
      }
    } catch (err) {
      console.error('Failed to load feeds:', err);
    }
  };

  const filtered = feeds.filter((f) => {
    if (activeClass && f.assetClass !== activeClass) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.symbol.toLowerCase().includes(q) ||
        f.baseAsset.toLowerCase().includes(q) ||
        (f.displayName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const renderFeed = ({ item }: { item: any }) => {
    const p = prices[item.feedId];
    return (
      <TouchableOpacity style={styles.feedRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.name}>{item.displayName || item.baseAsset}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>
            ${p?.price ? formatPrice(p.price) : '...'}
          </Text>
          {p?.confidence > 0 && (
            <Text style={styles.confidence}>
              ±${formatPrice(p.confidence)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search assets..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {ASSET_CLASSES.map((cls) => (
          <TouchableOpacity
            key={cls.label}
            onPress={() => setActiveClass(cls.value)}
            style={[
              styles.tab,
              activeClass === cls.value && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeClass === cls.value && styles.tabTextActive,
              ]}
            >
              {cls.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.feedId}
        renderItem={renderFeed}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No assets found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { alignItems: 'center', padding: 32 },
  searchInput: {
    margin: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    color: '#FFF',
    fontSize: 15,
  },
  tabs: { paddingHorizontal: 12, marginBottom: 8, maxHeight: 44 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginHorizontal: 4,
  },
  tabActive: { borderColor: '#8B5CF6', backgroundColor: '#8B5CF620' },
  tabText: { color: '#888', fontSize: 13 },
  tabTextActive: { color: '#8B5CF6' },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  symbol: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  name: { color: '#666', fontSize: 12, marginTop: 2 },
  price: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  confidence: { color: '#888', fontSize: 11, marginTop: 2 },
  empty: { color: '#666', fontSize: 15 },
});
