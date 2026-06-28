import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Info } from 'lucide-react-native';
import React from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from "react-native-gifted-charts";

const screenWidth = Dimensions.get('window').width;

export default function ProgressDetails() {
  const { title, color } = useLocalSearchParams();
  const router = useRouter();

  // Mock data representing percentage completion per day
  const lineData = [
    {value: 40, label: 'Mon'}, {value: 35, label: 'Tue'},
    {value: 85, label: 'Wed'}, {value: 55, label: 'Thu'},
    {value: 90, label: 'Fri'}, {value: 95, label: 'Sat'},
    {value: 70, label: 'Sun'},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft color="#333" size={30} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{title} Performance</Text>
        <View style={{width: 30}} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartHeader}>Weekly Progress Overview</Text>
        <LineChart
          data={lineData}
          height={250}
          width={screenWidth - 100}
          initialSpacing={20}
          color={color as string}
          thickness={5}
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          dataPointsColor={color as string}
          curved
          isAnimated
          yAxisTextStyle={{color: '#999', fontSize: 10}}
          xAxisLabelTextStyle={{color: '#999', fontSize: 10}}
        />
      </View>

      <View style={styles.insightBox}>
        <Info color={color as string} size={24} />
        <View style={{marginLeft: 15, flex: 1}}>
          <Text style={styles.insightTitle}>Weekly Insight</Text>
          <Text style={styles.insightText}>
            Hifza showed the most engagement on <Text style={{fontWeight: 'bold'}}>Saturday</Text>. 
            Consider increasing task difficulty for next week.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  chartCard: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 30, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, alignItems: 'center' },
  chartHeader: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 25, alignSelf: 'flex-start' },
  insightBox: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, padding: 20, borderRadius: 20, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#7C4DFF' },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  insightText: { fontSize: 14, color: '#666', marginTop: 3 }
});