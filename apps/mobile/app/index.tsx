import { View, Text, StyleSheet } from 'react-native';
import { FEED_IDS } from '@pythfolio/core';

export default function HomeScreen() {
  const feedCount = Object.keys(FEED_IDS).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PythFolio</Text>
      <Text style={styles.subtitle}>
        Portfolio tracker powered by Pyth Network price feeds.
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {feedCount} feeds loaded from @pythfolio/core
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0F0F0F',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    maxWidth: 300,
  },
  badge: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  badgeText: {
    color: '#4ADE80',
    fontSize: 14,
  },
});
