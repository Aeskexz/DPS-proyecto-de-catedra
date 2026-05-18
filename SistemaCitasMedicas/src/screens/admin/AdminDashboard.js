import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
    ActivityIndicator, Alert, RefreshControl, Platform, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { obtenerMedicos, obtenerUsuario, escucharMedicos } from '../../services/firestore-crud';
import { ref, get, onValue } from 'firebase/database';
import { database } from '../../services/firebase';

const AdminDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();
    const [medicos, setMedicos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isLargeScreen = width > 800 || Platform.OS === 'web' && width > 600;

    const cargarDatos = useCallback(async () => {
        try {
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const datos = snapshot.val();
                const allUsers = Object.entries(datos).map(([uid, data]) => ({
                    uid,
                    ...data,
                }));

                setClientes(allUsers.filter(u => u.rol === 'cliente'));
                setMedicos(allUsers.filter(u => u.rol === 'medico'));
            } else {
                setClientes([]);
                setMedicos([]);
            }
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7C3AED" />;

    const renderItemUsuario = ({ item, tipo }) => {
        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <Text style={styles.nombre}>{item.nombre || item.displayName} {item.apellido || ''}</Text>
                </View>
                <Text style={styles.detalles}>@{item.username || 'sin-usuario'} - {item.email}</Text>
                {tipo === 'medico' && <Text style={styles.detalles}>{item.especialidad || 'Sin especialidad'}</Text>}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={[styles.headerInfo, width < 760 && styles.headerInfoMobile]}>
                    <Text style={styles.titulo}>Panel de Control</Text>
                    <Text style={styles.subtitulo}>{user?.nombre || user?.displayName} - {medicos.length} Medicos - {clientes.length} Pacientes</Text>
                </View>
                <View style={[styles.headerActions, width < 760 && styles.headerActionsMobile]}>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('RegistrarMedico', { onVolver: cargarDatos })}>
                        <Text style={styles.addBtnTexto}>+ Registrar Medico</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('AjustesCuenta')}>
                        <Text style={styles.settings}>Ajustes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout}>
                        <Text style={styles.logout}>Salir</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.contentRow, isLargeScreen ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
                <View style={[styles.columna, isLargeScreen && { marginRight: 8 }]}>
                    <View style={styles.columnaHeader}>
                        <Text style={styles.columnaTitulo}>Pacientes</Text>
                    </View>
                    <FlatList
                        data={clientes}
                        keyExtractor={(item) => item.uid}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarDatos(); }} />}
                        renderItem={({ item }) => renderItemUsuario({ item, tipo: 'cliente' })}
                        ListEmptyComponent={<Text style={styles.vacio}>No hay pacientes registrados.</Text>}
                        contentContainerStyle={styles.listaPadding}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                <View style={[styles.columna, isLargeScreen && { marginLeft: 8 }, !isLargeScreen && { marginTop: 20 }]}>
                    <View style={[styles.columnaHeader, { backgroundColor: '#E0E7FF' }]}>
                        <Text style={[styles.columnaTitulo, { color: '#3730A3' }]}>Medicos</Text>
                    </View>
                    <FlatList
                        data={medicos}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => renderItemUsuario({ item, tipo: 'medico' })}
                        ListEmptyComponent={<Text style={styles.vacio}>No hay medicos registrados.</Text>}
                        contentContainerStyle={styles.listaPadding}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 16,
        flexWrap: 'wrap',
        rowGap: 10,
        elevation: 4, zIndex: 10
    },
    headerInfo: { flexShrink: 1 },
    headerInfoMobile: { width: '100%' },
    titulo: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
    subtitulo: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    headerActionsMobile: { width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' },
    settings: { color: '#BFDBFE', fontWeight: 'bold', fontSize: 15 },
    logout: { color: '#FCA5A5', fontWeight: 'bold', fontSize: 15 },
    addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    addBtnTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },

    contentRow: { flex: 1, padding: 16 },
    columna: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, overflow: 'hidden' },
    columnaHeader: { backgroundColor: '#DCFCE7', padding: 14, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' },
    columnaTitulo: { fontSize: 16, fontWeight: 'bold', color: '#166534', textAlign: 'center' },
    listaPadding: { padding: 12, paddingBottom: 40 },

    card: {
        backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
        borderLeftWidth: 4, borderLeftColor: '#3B82F6'
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    nombre: { fontWeight: 'bold', fontSize: 16, color: '#1E293B', flex: 1 },
    detalles: { color: '#64748B', fontSize: 13, marginBottom: 2 },

    vacio: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 15 },
});

export default AdminDashboard;
