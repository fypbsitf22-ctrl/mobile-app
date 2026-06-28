import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressProps {
  chartData: number[]; // [Study, Play, Routine]
}

export const ProgressChart = ({ chartData }: ProgressProps) => {
  const [study, play, routine] = chartData || [0, 0, 0];
  const overall = Math.round((study + play + routine) / 3);

  return (
    <View style={styles.container}>
      {/* Central Interactive Ring */}
      <View style={styles.chartWrapper}>
        <View style={[styles.ring, { borderColor: '#26CE71', width: 140, height: 140 }]}>
          <View style={[styles.ring, { borderColor: '#42A5F5', width: 105, height: 105 }]}>
            <View style={[styles.ring, { borderColor: '#7C4DFF', width: 70, height: 70 }]}>
              <View style={styles.centerText}>
                <Text style={styles.percentage}>{overall}%</Text>
                <Text style={styles.subText}>Overall</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Fascinating Detail Legend */}
      <View style={styles.legendWrapper}>
        <LegendItem color="#26CE71" label="Routine" value={routine} status="Excellent" />
        <LegendItem color="#42A5F5" label="Academic" value={study} status="On Track" />
        <LegendItem color="#7C4DFF" label="Playtime" value={play} status="Steady" />
      </View>
    </View>
  );
};

const LegendItem = ({ color, label, value, status }: any) => (
  <View style={styles.legendItem}>
    <View style={[styles.statusDot, { backgroundColor: color }]} />
    <View style={{ flex: 1 }}>
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={[styles.statusTag, { color: color }]}>{status}</Text>
    </View>
    <Text style={styles.legendValue}>{value}%</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  chartWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 150,
  },
  ring: {
    borderRadius: 100,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  centerText: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  subText: {
    fontSize: 9,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legendWrapper: {
    flex: 1,
    marginLeft: 25,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 20,
    borderRadius: 3,
    marginRight: 10,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  statusTag: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -2,
  },
  legendValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});