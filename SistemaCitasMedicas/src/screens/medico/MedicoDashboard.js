import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, RefreshControl, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { citasService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

// Definición de colores por estado para coherencia visual
const colorEstado = {
    pendiente: { bg: '#FEF9C3', text: '#854D0E' },
    confirmada: { bg: '#DCFCE7', text: '#166534' },
    completada: { bg: '#DBEAFE', text: '#1E3A5F' },
    cancelada: { bg: '#FEE2E2', text: '#991B1B' },
};

const MedicoDashboard = ({ navigation }) => {
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
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#166534" />
                <Text style={styles.loadingText}>Cargando agenda...</Text>
            </View>
        );
    }

    const renderCita = ({ item }) => {
        const color = colorEstado[item.estado] || colorEstado.pendiente;
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                style={styles.card}
                onPress={() => navigation.navigate('DetalleCitaMedico', { cita: item, onVolver: cargarCitas })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.pacienteContainer}>
                        <Text style={styles.pacienteLabel}>PACIENTE</Text>
                        <Text style={styles.pacienteNombre}>{item.nombre_paciente}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: color.bg }]}>
                        <Text style={[styles.badgeText, { color: color.text }]}>{item.estado.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>📅 {item.fecha_cita}</Text>
                        <Text style={styles.infoText}>🕒 {item.hora_cita?.slice(0, 5)}</Text>
                    </View>
                    {item.motivo_consulta && (
                        <View style={styles.motivoBox}>
                            <Text style={styles.motivoText} numberOfLines={1}>
                                💬 {item.motivo_consulta}
                            </Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.cardFooter}>
                    <Text style={styles.verMas}>Gestionar Cita →</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={[styles.headerTop, isMobile && styles.headerTopMobile]}>
                    <View>
                        <Text style={styles.saludo}>Buen día,</Text>
                        <Text style={styles.titulo}>Dr. {user.nombre} {user.apellido}</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{citas.length} CITAS HOY</Text>
                        </View>
                    </View>
                    
                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.actionBtn} 
                            onPress={() => navigation.navigate('AjustesCuenta')}
                        >
                            <Text style={styles.actionBtnText}>Ajustes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.logoutBtn]} 
                            onPress={logout}
                        >
                            <Text style={[styles.actionBtnText, styles.logoutText]}>Salir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                data={citas}
                keyExtractor={(item) => String(item.id_cita)}
                renderItem={renderCita}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#166534" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.vacio}>No hay citas programadas para hoy.</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#166534', fontWeight: '600' },
    
    // Header
    header: {
        backgroundColor: '#166534',
        paddingHorizontal: 20,
        paddingBottom: 25,
        paddingTop: 15,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTopMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 15 },
    saludo: { color: '#BBF7D0', fontSize: 14, fontWeight: '500' },
    titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
    countBadge: { 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        paddingHorizontal: 10, paddingVertical: 4, 
        borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 
    },
    countText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    headerActions: { flexDirection: 'row', gap: 10 },
    actionBtn: { 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        paddingHorizontal: 12, paddingVertical: 8, 
        borderRadius: 10 
    },
    logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    logoutText: { color: '#FCA5A5' },

    // Listado
    listContent: { paddingBottom: 30, paddingTop: 10 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderLeftWidth: 6,
        borderLeftColor: '#166534',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    pacienteContainer: { flex: 1 },
    pacienteLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    pacienteNombre: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '800' },
    
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    
    cardInfo: { gap: 8 },
    infoRow: { flexDirection: 'row', gap: 20 },
    infoText: { fontSize: 14, color: '#475569', fontWeight: '600' },
    motivoBox: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 },
    motivoText: { fontSize: 13, color: '#64748B', fontStyle: 'italic' },
    
    cardFooter: { marginTop: 12, alignItems: 'flex-end' },
    verMas: { color: '#166534', fontWeight: '700', fontSize: 12 },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    vacio: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },
});

export default MedicoDashboard;
