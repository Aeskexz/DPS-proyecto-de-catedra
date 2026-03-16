import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, RefreshControl, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { citasService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

// Mantenemos tus colores originales para evitar conflictos
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
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardMedico}>{cita.nombre_medico}</Text>
                    <Text style={styles.cardEspecialidad}>{cita.especialidad}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                    <Text style={[styles.badgeText, { color: color.text }]}>{cita.estado.toUpperCase()}</Text>
                </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.cardBody}>
                <Text style={styles.cardFechaLabel}>Fecha y Hora:</Text>
                <Text style={styles.cardFechaValue}>{cita.fecha_cita}  •  {cita.hora_cita?.slice(0, 5)}</Text>
                
                {cita.motivo_consulta ? (
                    <View style={styles.motivoContainer}>
                        <Text style={styles.cardMotivoLabel}>Motivo:</Text>
                        <Text style={styles.cardMotivoText}>{cita.motivo_consulta}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

const ClienteDashboard = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const { isMobile } = getResponsive(width);
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
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 10, color: '#64748B' }}>Cargando tus citas...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header mejorado visualmente */}
            <View style={styles.header}>
                <View style={[styles.headerTop, isMobile && styles.headerTopMobile]}>
                    <View>
                        <Text style={styles.bienvenida}>Hola, {user.nombre}</Text>
                        <Text style={styles.subtitulo}>Gestiona tus citas médicas</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('AjustesCuenta')} style={styles.actionBtn}>
                            <Text style={styles.settingsText}>Ajustes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={logout} style={[styles.actionBtn, styles.logoutBtn]}>
                            <Text style={styles.logoutText}>Salir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                data={citas}
                keyExtractor={(item) => String(item.id_cita)}
                renderItem={({ item }) => <CitaCard cita={item} />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
                ListEmptyComponent={
                    <View style={styles.vacioContainer}>
                        <Text style={styles.vacio}>No tienes citas registradas.</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
            />

            {/* Botón Flotante (FAB) más moderno */}
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => navigation.navigate('NuevaCita', { onVolver: cargarCitas })}
                activeOpacity={0.8}
            >
                <Text style={styles.fabTexto}>+ Nueva Cita</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    
    // Header
    header: {
        backgroundColor: '#1E3A5F', // Tu color original
        paddingHorizontal: 20,
        paddingBottom: 25,
        paddingTop: 10,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTopMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 15 },
    headerActions: { flexDirection: 'row', gap: 10 },
    bienvenida: { fontSize: 24, fontWeight: '800', color: '#fff' },
    subtitulo: { color: '#93C5FD', fontSize: 14 },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
    logoutBtn: { backgroundColor: 'rgba(252,165,165,0.2)' },
    settingsText: { color: '#BFDBFE', fontWeight: '700', fontSize: 13 },
    logoutText: { color: '#FCA5A5', fontWeight: '700', fontSize: 13 },

    // Tarjetas
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardMedico: { fontWeight: '800', fontSize: 17, color: '#1E3A5F' },
    cardEspecialidad: { color: '#64748B', fontSize: 14, marginTop: 2, fontWeight: '500' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '800' },
    
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    
    cardBody: { gap: 8 },
    cardFechaLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    cardFechaValue: { fontSize: 15, color: '#334155', fontWeight: '600' },
    
    motivoContainer: { marginTop: 4 },
    cardMotivoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    cardMotivoText: { color: '#475569', fontSize: 13, fontStyle: 'italic', marginTop: 2 },

    vacioContainer: { alignItems: 'center', marginTop: 80 },
    vacio: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },

    // Botón Flotante
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        left: 20, // Lo mantenemos ancho como el original pero con mejor estilo
        backgroundColor: '#2563EB', // Tu color original
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    fabTexto: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});

export default ClienteDashboard;
