import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const RoleSelection = () => {
  const router = useRouter();

  const handleRoleSelect = (role: string) => {
    // Navigate to signup and pass the role if needed
    router.push({
      pathname: '/signup',
      params: { selectedRole: role }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9E9" />
      
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Join Us!</Text>
        <Text style={styles.subtitle}>Who will be using the app today?</Text>
      </View>

      {/* Roles Container */}
      <View style={styles.rolesContainer}>
        
        {/* Parent Role Card */}
        <TouchableOpacity 
          style={[styles.roleCard, styles.parentCardShadow]}
          onPress={() => handleRoleSelect('parent')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FFEDEB' }]}>
            <MaterialCommunityIcons name="home-heart" size={60} color="#E87D88" />
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.roleTitle}>Parent</Text>
            <Text style={styles.roleDescription}>I want to help my child learn and grow.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={30} color="#E87D88" />
        </TouchableOpacity>

        {/* Teacher Role Card */}
        <TouchableOpacity 
          style={[styles.roleCard, styles.teacherCardShadow]}
          onPress={() => handleRoleSelect('teacher')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FFF4E5' }]}>
            <FontAwesome5 name="chalkboard-teacher" size={45} color="#F2A663" />
          </View>
          <View style={styles.textColumn}>
            <Text style={[styles.roleTitle, { color: '#B48454' }]}>Teacher</Text>
            <Text style={styles.roleDescription}>I want to support my students' progress.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={30} color="#F2A663" />
        </TouchableOpacity>

      </View>

      {/* Bottom Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Already have an account? <Text style={styles.loginLink}>Login</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E9', // Matching Splash/Login background
    paddingHorizontal: 25,
  },
  headerContainer: {
    marginTop: height * 0.1,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#E87D88',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#B48454',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 25,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 140,
  },
  parentCardShadow: {
    shadowColor: '#E87D88',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFEDEB',
  },
  teacherCardShadow: {
    shadowColor: '#F2A663',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFF4E5',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    marginLeft: 20,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E87D88',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 18,
  },
  backButton: {
    marginBottom: 40,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    color: '#D19E67',
    fontWeight: 'bold',
  },
});

export default RoleSelection;