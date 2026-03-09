// ============================================================
// src/screens/admin/AdminDashboard.js
// ============================================================
// RESPONSABLE: Equipo Frontend / Backend
// ESTADO: Completo. Vista Dual (Pacientes y Médicos) para web y móvil.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, RefreshControl, Platform, useWindowDimensions
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { medicosService, clientesService } from '../../services/api';

const AdminDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();
    const [medicos, setMedicos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Si la pantalla es ancha (Web/Tablet), mostramos 2 columnas
    const isLargeScreen = width > 800 || Platform.OS === 'web' && width > 600;

    const cargarDatos = useCallback(async () => {
        try {
            const [dataMedicos, dataClientes] = await Promise.all([
                medicosService.getLista(),
                clientesService.getLista()
            ]);
            setMedicos(dataMedicos);
            setClientes(dataClientes);
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const confirmarEliminacion = (tipo, id, nombre) => {
        // En Web, Alert.alert de React Native no detiene la ejecución igual,
        // pero usaremos el comportamiento estándar.
        if (Platform.OS === 'web') {
            if (window.confirm(`¿Seguro que deseas eliminar a ${nombre}?`)) {
                ejecutarEliminacion(tipo, id);
            }
        } else {
            Alert.alert(
                'Confirmar eliminación',
                `¿Seguro que deseas eliminar a ${nombre}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => ejecutarEliminacion(tipo, id) },
                ]
            );
        }
    };

    const ejecutarEliminacion = async (tipo, id) => {
        try {
            if (tipo === 'medico') {
                await medicosService.eliminar(id);
            } else {
                await clientesService.eliminar(id);
            }
            // Agregamos feedback visual tras eliminar
            if (Platform.OS === 'web') {
                window.alert('✅ Usuario eliminado/desactivado correctamente.');
            } else {
                Alert.alert('Éxito', 'Usuario eliminado/desactivado correctamente.');
            }
            cargarDatos();
        } catch (e) {
            if (Platform.OS === 'web') {
                window.alert('❌ Error: ' + e.message);
            } else {
                Alert.alert('Error', e.message);
            }
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7C3AED" />;

    const renderItemUsuario = ({ item, tipo }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.nombre}>{item.nombre} {item.apellido}</Text>
                <View style={[styles.badge, { backgroundColor: item.activo ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: item.activo ? '#166534' : '#991B1B' }]}>
                        {item.activo ? 'ACTIVO' : 'INACTIVO'}
                    </Text>
                </View>
            </View>
            <Text style={styles.detalles}>@{item.username} · {item.email}</Text>
            {tipo === 'medico' && <Text style={styles.detalles}>🩺 {item.especialidad}</Text>}

            <TouchableOpacity
                style={styles.eliminarBtn}
                onPress={() => confirmarEliminacion(tipo, item.id_usuario, item.nombre)}
            >
                <Text style={styles.eliminarText}>Eliminar 🗑</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* ── Header ───────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.titulo}>Panel de Control Supremo</Text>
                    <Text style={styles.subtitulo}>{user.nombre} · {medicos.length} Médicos · {clientes.length} Pacientes</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('RegistrarMedico', { onVolver: cargarDatos })}>
                        <Text style={styles.addBtnTexto}>+ Registrar Médico</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout}>
                        <Text style={styles.logout}>Salir</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Contenido Dual ───────────────────────────── */}
            <View style={[styles.contentRow, isLargeScreen ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>

                {/* ── Columna Pacientes (Izquierda) ──────────── */}
                <View style={[styles.columna, isLargeScreen && { marginRight: 8 }]}>
                    <View style={styles.columnaHeader}>
                        <Text style={styles.columnaTitulo}>🤒 Pacientes</Text>
                    </View>
                    <FlatList
                        data={clientes}
                        keyExtractor={(item) => String(item.id_usuario)}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarDatos(); }} />}
                        renderItem={({ item }) => renderItemUsuario({ item, tipo: 'cliente' })}
                        ListEmptyComponent={<Text style={styles.vacio}>No hay pacientes registrados.</Text>}
                        contentContainerStyle={styles.listaPadding}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* ── Columna Médicos (Derecha) ──────────────── */}
                <View style={[styles.columna, isLargeScreen && { marginLeft: 8 }, !isLargeScreen && { marginTop: 20 }]}>
                    <View style={[styles.columnaHeader, { backgroundColor: '#E0E7FF' }]}>
                        <Text style={[styles.columnaTitulo, { color: '#3730A3' }]}>👨‍⚕️ Médicos</Text>
                    </View>
                    <FlatList
                        data={medicos}
                        keyExtractor={(item) => String(item.id_usuario)}
                        renderItem={({ item }) => renderItemUsuario({ item, tipo: 'medico' })}
                        ListEmptyComponent={<Text style={styles.vacio}>No hay médicos registrados.</Text>}
                        contentContainerStyle={styles.listaPadding}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#0F172A', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20,
        elevation: 4, zIndex: 10
    },
    titulo: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
    subtitulo: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
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
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    detalles: { color: '#64748B', fontSize: 13, marginBottom: 2 },

    eliminarBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    eliminarText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },
    vacio: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 15 },
});

export default AdminDashboard;
