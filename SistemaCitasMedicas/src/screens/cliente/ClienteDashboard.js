// ============================================================
// src/screens/cliente/ClienteDashboard.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. Muestra las citas del paciente y botón para crear una nueva.
//
// TODO PARA TUS COMPAÑEROS:
//   - Agregar pull-to-refresh para recargar las citas
//   - Agregar filtro de citas por estado (pendiente, confirmada, etc.)
//   - Mostrar imagen/icono de médico en cada tarjeta de cita
//   - Implementar cancelar cita (requiere endpoint PUT /api/citas/:id/estado)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { citasService } from '../../services/api';

// Colores por estado de cita
const colorEstado = {
    pendiente: { bg: '#FEF9C3', text: '#854D0E' },
    confirmada: { bg: '#DCFCE7', text: '#166534' },
    completada: { bg: '#DBEAFE', text: '#1E3A5F' },
    cancelada: { bg: '#FEE2E2', text: '#991B1B' },
};

const CitaCard = ({ cita }) => {
    const color = colorEstado[cita.estado] || colorEstado.pendiente;
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardMedico}>{cita.nombre_medico}</Text>
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                    <Text style={[styles.badgeText, { color: color.text }]}>{cita.estado.toUpperCase()}</Text>
                </View>
            </View>
            <Text style={styles.cardEspecialidad}>{cita.especialidad}</Text>
            <Text style={styles.cardFecha}>📅 {cita.fecha_cita}  🕐 {cita.hora_cita?.slice(0, 5)}</Text>
            {cita.motivo_consulta ? <Text style={styles.cardMotivo}>Motivo: {cita.motivo_consulta}</Text> : null}
        </View>
    );
};

const ClienteDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const cargarCitas = useCallback(async () => {
        try {
            const data = await citasService.getMisCitas();
            setCitas(data);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { cargarCitas(); }, [cargarCitas]);

    const onRefresh = () => { setRefreshing(true); cargarCitas(); };

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;
    }

    return (
        <View style={styles.container}>
            {/* ── Header ─────────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.bienvenida}>Hola, {user.nombre} 👋</Text>
                    <Text style={styles.subtitulo}>Tus próximas citas</Text>
                </View>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logout}>Salir</Text>
                </TouchableOpacity>
            </View>

            {/* ── Lista de citas ─────────────────────────────── */}
            <FlatList
                data={citas}
                keyExtractor={(item) => String(item.id_cita)}
                renderItem={({ item }) => <CitaCard cita={item} />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <Text style={styles.vacio}>No tienes citas registradas.</Text>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {/* ── FAB: Nueva cita ────────────────────────────── */}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NuevaCita', { onVolver: cargarCitas })}>
                <Text style={styles.fabTexto}>+ Nueva Cita</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#1E3A5F', padding: 20, paddingTop: 50,
    },
    bienvenida: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    subtitulo: { color: '#93C5FD', fontSize: 13, marginTop: 2 },
    logout: { color: '#FCA5A5', fontWeight: '600' },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16,
        marginTop: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardMedico: { fontWeight: '700', fontSize: 16, color: '#1E3A5F', flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    cardEspecialidad: { color: '#64748B', fontSize: 13, marginBottom: 6 },
    cardFecha: { color: '#374151', fontSize: 14, marginBottom: 4 },
    cardMotivo: { color: '#6B7280', fontSize: 13, fontStyle: 'italic' },
    vacio: { textAlign: 'center', color: '#94A3B8', marginTop: 60, fontSize: 16 },
    fab: {
        position: 'absolute', bottom: 28, right: 24, left: 24,
        backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
        elevation: 6,
    },
    fabTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ClienteDashboard;
