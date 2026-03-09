// ============================================================
// src/screens/medico/MedicoDashboard.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. El médico ve sus citas y puede navegar al detalle.
//
// TODO PARA TUS COMPAÑEROS:
//   - Agregar filtro por fecha (hoy / esta semana / este mes)
//   - Mostrar conteo de citas por estado en el header
//   - Agregar badge de notificación para citas nuevas/pendientes
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { citasService } from '../../services/api';

const colorEstado = {
    pendiente: { bg: '#FEF9C3', text: '#854D0E' },
    confirmada: { bg: '#DCFCE7', text: '#166534' },
    completada: { bg: '#DBEAFE', text: '#1E3A5F' },
    cancelada: { bg: '#FEE2E2', text: '#991B1B' },
};

const MedicoDashboard = ({ navigation }) => {
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

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;

    const renderCita = ({ item }) => {
        const color = colorEstado[item.estado] || colorEstado.pendiente;
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('DetalleCitaMedico', { cita: item, onVolver: cargarCitas })}
            >
                <View style={styles.cardRow}>
                    <Text style={styles.paciente}>{item.nombre_paciente}</Text>
                    <View style={[styles.badge, { backgroundColor: color.bg }]}>
                        <Text style={[styles.badgeText, { color: color.text }]}>{item.estado.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.email}>{item.email_paciente}</Text>
                <Text style={styles.fecha}>📅 {item.fecha_cita}  🕐 {item.hora_cita?.slice(0, 5)}</Text>
                {item.motivo_consulta ? <Text style={styles.motivo}>📋 {item.motivo_consulta}</Text> : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.titulo}>Dr. {user.nombre} {user.apellido}</Text>
                    <Text style={styles.subtitulo}>{citas.length} cita(s) activas</Text>
                </View>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logout}>Salir</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={citas}
                keyExtractor={(item) => String(item.id_cita)}
                renderItem={renderCita}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.vacio}>No tienes citas asignadas actualmente.</Text>}
                contentContainerStyle={{ paddingBottom: 32 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0FDF4' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#166534', padding: 20, paddingTop: 50,
    },
    titulo: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    subtitulo: { color: '#86EFAC', fontSize: 13, marginTop: 2 },
    logout: { color: '#FCA5A5', fontWeight: '600' },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16,
        marginTop: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    paciente: { fontWeight: '700', fontSize: 16, color: '#166534', flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    email: { color: '#64748B', fontSize: 12, marginBottom: 6 },
    fecha: { color: '#374151', fontSize: 14, marginBottom: 4 },
    motivo: { color: '#6B7280', fontSize: 13, fontStyle: 'italic' },
    vacio: { textAlign: 'center', color: '#94A3B8', marginTop: 60, fontSize: 16 },
});

export default MedicoDashboard;
