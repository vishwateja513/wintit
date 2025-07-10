import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../contexts/AuthContext'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import AuditsScreen from '../screens/AuditsScreen'
import AuditExecutionScreen from '../screens/AuditExecutionScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const AuditsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AuditsList" 
        component={AuditsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AuditExecution" 
        component={AuditExecutionScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Audits') {
            iconName = focused ? 'clipboard' : 'clipboard-outline'
          } else if (route.name === 'Templates') {
            iconName = focused ? 'document-text' : 'document-text-outline'
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Audits" 
        component={AuditsStack}
        options={{ tabBarLabel: 'Audits' }}
      />
      <Tab.Screen 
        name="Templates" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Templates' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Reports' }}
      />
    </Tab.Navigator>
  )
}

const AppNavigator: React.FC = () => {
  const { session, loading } = useAuth()

  if (loading) {
    return null // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      {session ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  )
}

export default AppNavigator