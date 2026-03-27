import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { formatPrice } from '@pythfolio/core';
import { api } from '../src/lib/api';

export default function PortfolioScreen() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const portfolios = await api.getPortfolios();
      if (portfolios.length > 0) {
        const p = portfolios[0];
        setPortfolio(p);
        const pos = await api.getPositions(p.id);
        setPositions(pos);

        if (pos.length > 0) {
          const feedIds = pos.map((p: any) => p.feedId);
          const priceData = await api.getPrices(feedIds);
          setPrices(priceData);
        }
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh prices every 5s
    const interval = setInterval(async () => {
      if (positions.length > 0) {
        const feedIds = positions.map((p) => p.feedId);
        const priceData = await api.getPrices(feedIds).catch(() => ({}));
        setPrices(priceData);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [positions.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalValue = positions.reduce((sum, pos) => {
    const p = prices[pos.feedId];
    return sum + (p?.price ?? 0) * parseFloat(pos.quantity);
  }, 0);

  const renderPosition = ({ item }: { item: any }) => {
    const p = prices[item.feedId];
    const marketValue = p?.price ? parseFloat(item.quantity) * p.price : 0;

    return (
      <View style={styles.positionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.quantity}>{item.quantity} units</Text>
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
        <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
          <Text style={styles.value}>${formatPrice(marketValue)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Total Value Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Value</Text>
        <Text style={styles.totalValue}>${formatPrice(totalValue)}</Text>
        <Text style={styles.totalSub}>
          {positions.length} position{positions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Positions List */}
      <FlatList
        data={positions}
        keyExtractor={(item) => item.id}
        renderItem={renderPosition}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No positions yet.</Text>
            <Text style={styles.emptySub}>Browse assets to add one.</Text>
          </View>
        }
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loading: { color: '#888' },
  totalCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: { color: '#888', fontSize: 14 },
  totalValue: { color: '#FFF', fontSize: 32, fontWeight: '700', marginTop: 4 },
  totalSub: { color: '#888', fontSize: 13, marginTop: 4 },
  list: { flex: 1 },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  symbol: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  quantity: { color: '#888', fontSize: 12, marginTop: 2 },
  price: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  confidence: { color: '#888', fontSize: 11, marginTop: 2 },
  value: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  empty: { color: '#666', fontSize: 16 },
  emptySub: { color: '#555', fontSize: 13, marginTop: 4 },
});
