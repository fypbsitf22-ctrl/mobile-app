import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

// Data for our categories to keep code clean
const CATEGORIES = [
  {
    id: '1',
    title: 'Academic learning',
    color: '#E8E0FF', // Soft Purple
    btnColor: '#C4A6FB',
      image: require('../../assets/images/academic.png'),
    route: '/parent/academic',
  },
  {
    id: '2',
    title: 'Daily routine',
    color: '#E0F9E9', // Soft Green
    btnColor: '#A5E9B9',
   image: require('../../assets/images/routine.png'),
    route: '/parent/dailyroutine',
  },
  {
    id: '3',
    title: 'General knowledge',
    color: '#FDE4E4', // Soft Red/Pink
    btnColor: '#FFADAD',
       image: require('../../assets/images/gk.png'),
    route: '/parent/gk',
  },
  {
    id: '4',
    title: 'Islamic teachings',
    color: '#D4E9FF', // Soft Blue
    btnColor: '#A2D2FF',
    image: require('../../assets/images/islamic.png'), 
    route: '/parent/islamic',
  },
  {
    id: '5',
    title: 'Fun games',
    color: '#F9E0F2', // Soft Pink
    btnColor: '#F9A6DB',
    image: require('../../assets/images/games.png'),
    route: '/parent/games',
  },
  {
    id: '6',
    title: 'Activities',
    color: '#E0F1F9', // Soft Sky Blue
    btnColor: '#A6DFF9',
     image: require('../../assets/images/activity.png'),
    route: '/parent/activity',
  },
  {
    id: '7',
    title: 'Parent panel',
    color: '#E9F9E0', // Light Mint
    btnColor: '#A5E9B9',
     image: require('../../assets/images/animals.png'),  // Using a dummy image
    route: '/parent/parentpanel',
    isParent: true, // Special flag for the check button
  },
];

const MainMenu = () => {
  const router = useRouter();

  const renderCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => router.push(item.route as any)}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: item.btnColor }]}>
          {item.title}
        </Text>
        
        <View style={[styles.btn, { backgroundColor: item.btnColor }]}>
          <Text style={styles.btnText}>{item.isParent ? 'Check' : 'Start now'}</Text>
        </View>
      </View>

      <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Header Section */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={() => router.push('./userprofile')}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={30} color="#7E57C2" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.welcomeTextWrap}>
            <Text style={styles.helloText}>Hello little 👋</Text>
            <Text style={styles.nameText}>name</Text>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push('./notification')} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('./settings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((item) => renderCard(item))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF9E9', // Cream background
  },
  header: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    // Header Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#E1D5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  welcomeTextWrap: {
    marginLeft: 12,
  },
  helloText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4A056',
  },
  nameText: {
    fontSize: 16,
    color: '#B48454',
    marginTop: -2,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 15,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40, // Space at the bottom
  },
  card: {
    width: '100%',
    height: 160,
    borderRadius: 30,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'visible',
    // Card Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 25,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 15,
    width: '60%', // Wrap text before it hits the image
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignSelf: 'flex-start',
    // Button Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardImage: {
    position: 'absolute',
    right: 10,
    bottom: 5,
    width: width * 0.4,
    height: '90%',
  }
});

export default MainMenu;