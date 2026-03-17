
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';


import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';


import ClienteDashboard from '../screens/cliente/ClienteDashboard';
import NuevaCitaScreen from '../screens/cliente/NuevaCitaScreen';


import MedicoDashboard from '../screens/medico/MedicoDashboard';
import DetalleCitaMedico from '../screens/medico/DetalleCitaMedico';


import AdminDashboard from '../screens/admin/AdminDashboard';
import GestionMedicos from '../screens/admin/GestionMedicos';
import RegistrarMedico from '../screens/admin/RegistrarMedico';
import AjustesCuentaScreen from '../screens/common/AjustesCuentaScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, loading } = useAuth();


    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                ) : user.rol === 'cliente' ? (
                   
                    <>
                        <Stack.Screen name="ClienteDashboard" component={ClienteDashboard} />
                        <Stack.Screen name="NuevaCita" component={NuevaCitaScreen} />
                        <Stack.Screen name="AjustesCuenta" component={AjustesCuentaScreen} />
                    </>
                ) : user.rol === 'medico' ? (
                   
                    <>
                        <Stack.Screen name="MedicoDashboard" component={MedicoDashboard} />
                        <Stack.Screen name="DetalleCitaMedico" component={DetalleCitaMedico} />
                        <Stack.Screen name="AjustesCuenta" component={AjustesCuentaScreen} />
                    </>
                ) : user.rol === 'administrador' ? (
                    
                    <>
                        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                        <Stack.Screen name="GestionMedicos" component={GestionMedicos} />
                        <Stack.Screen name="RegistrarMedico" component={RegistrarMedico} />
                        <Stack.Screen name="AjustesCuenta" component={AjustesCuentaScreen} />
                    </>
                ) : (
                   
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
