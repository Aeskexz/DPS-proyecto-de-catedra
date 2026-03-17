import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, RefreshControl, useWindowDimensions, SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { citasService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

// Colores profesionales para estados (manteniendo tu paleta)
const colorEstado = {
    pendiente: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
    confirmada: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
    completada: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
    cancelada: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
};

// Tarjeta de cita mejorada
const CitaCard = ({ cita }) => {
    const color = colorEstado[cita.estado] || colorEstado.pendiente;
    const horaFormateada = cita.hora_cita?.slice(0, 5);
    
    // Formatear fecha para mostrarla más amigable
    const fecha = new Date(cita.fecha_cita + 'T00:00:00');
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    
    const fechaFormateada = `${diaSemana}, ${dia} de ${mes} de ${año}`;

    return (
        <View style={[styles.card, { borderLeftColor: color.border }]}>
            <View style={styles.cardHeader}>
                <View style={styles.medicoInfo}>
                    <Text style={styles.cardMedico}>{cita.nombre_medico}</Text>
                    <View style={styles.especialidadBadge}>
                        <Text style={styles.cardEspecialidad}>{cita.especialidad}</Text>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                    <Text style={[styles.badgeText, { color: color.text }]}>{cita.estado.toUpperCase()}</Text>
                </View>
            </View>
            
            <View style={styles.cardBody}>
                <View style={styles.fechaContainer}>
                    <Text style={styles.fechaIcono}>📅</Text>
                    <View>
                        <Text style={styles.fechaCompleta}>{fechaFormateada}</Text>
                        <Text style={styles.horaTexto}>{horaFormateada} horas</Text>
                    </View>
                </View>
                
                {cita.motivo_consulta ? (
                    <View style={styles.motivoContainer}>
                        <Text style={styles.motivoLabel}>Motivo de la consulta</Text>
                        <Text style={styles.motivoTexto}>{cita.motivo_consulta}</Text>
                    </View>
                ) : null}
            </View>
            
            <View style={styles.cardFooter}>
                <View style={styles.footerLine} />
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
    const [vistaActiva, setVistaActiva] = useState('proximas'); // 'proximas' o 'pasadas'

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

    useFocusEffect(
        useCallback(() => {
            cargarCitas();
        }, [cargarCitas])
    );

    const onRefresh = () => { setRefreshing(true); cargarCitas(); };

    // Separar citas próximas y pasadas
    const hoy = new Date().toISOString().split('T')[0];
    const citasProximas = citas.filter(c => c.fecha_cita >= hoy && c.estado !== 'cancelada' && c.estado !== 'completada');
    const citasPasadas = citas.filter(c => c.fecha_cita < hoy || c.estado === 'cancelada' || c.estado === 'completada');

    const citasAMostrar = vistaActiva === 'proximas' ? citasProximas : citasPasadas;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Cargando tus citas...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header mejorado */}
            <View style={styles.header}>
                <View style={[styles.headerTop, isMobile && styles.headerTopMobile]}>
                    <View>
                        <Text style={styles.saludo}>Bienvenido de nuevo,</Text>
                        <Text style={styles.bienvenida}>{user.nombre} {user.apellido}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('AjustesCuenta')} style={styles.iconButton}>
                            <Text style={styles.iconText}>⚙️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={logout} style={[styles.iconButton, styles.logoutButton]}>
                            <Text style={styles.iconText}>🚪</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Estadísticas rápidas */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumero}>{citasProximas.length}</Text>
                        <Text style={styles.statLabel}>Próximas</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumero}>{citasPasadas.length}</Text>
                        <Text style={styles.statLabel}>Pasadas</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumero}>{citas.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>
                
                {/* Selector de vista */}
                <View style={styles.selectorContainer}>
                    <TouchableOpacity 
                        style={[styles.selectorBtn, vistaActiva === 'proximas' && styles.selectorBtnActivo]}
                        onPress={() => setVistaActiva('proximas')}
                    >
                        <Text style={[styles.selectorText, vistaActiva === 'proximas' && styles.selectorTextActivo]}>
                            Próximas
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.selectorBtn, vistaActiva === 'pasadas' && styles.selectorBtnActivo]}
                        onPress={() => setVistaActiva('pasadas')}
                    >
                        <Text style={[styles.selectorText, vistaActiva === 'pasadas' && styles.selectorTextActivo]}>
                            Pasadas
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={citasAMostrar}
                keyExtractor={(item) => String(item.id_cita)}
                renderItem={({ item }) => <CitaCard cita={item} />}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor="#2563EB"
                        colors={["#2563EB"]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>
                            {vistaActiva === 'proximas' 
                                ? 'No tienes citas próximas' 
                                : 'No tienes citas pasadas'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {vistaActiva === 'proximas' 
                                ? 'Agenda una nueva cita para comenzar' 
                                : 'Tus citas anteriores aparecerán aquí'}
                        </Text>
                        {vistaActiva === 'proximas' && (
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('NuevaCita')}
                            >
                                <Text style={styles.emptyButtonText}>Agendar nueva cita</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                contentContainerStyle={[
                    styles.listaContent,
                    citasAMostrar.length === 0 && styles.listaEmpty
                ]}
                showsVerticalScrollIndicator={false}
            />

            {/* Botón Flotante (FAB) mejorado */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('NuevaCita')}
                activeOpacity={0.8}
            >
                <Text style={styles.fabIcon}>+</Text>
                <Text style={styles.fabTexto}>Nueva Cita</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC' 
    },
    loadingText: { 
        marginTop: 10, 
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500'
    },
    
    // Header
    header: {
        backgroundColor: '#1E3A5F',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    headerTop: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTopMobile: { 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        gap: 15 
    },
    saludo: {
        color: '#93C5FD',
        fontSize: 14,
        fontWeight: '500',
    },
    bienvenida: { 
        fontSize: 22, 
        fontWeight: '800', 
        color: '#fff',
        marginTop: 2,
    },
    headerActions: { 
        flexDirection: 'row', 
        gap: 12 
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: 'rgba(239,68,68,0.2)',
    },
    iconText: {
        fontSize: 20,
    },
    
    // Estadísticas
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumero: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    statLabel: {
        color: '#93C5FD',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    
    // Selector de vista
    selectorContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 4,
    },
    selectorBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    selectorBtnActivo: {
        backgroundColor: '#fff',
    },
    selectorText: {
        color: '#BFDBFE',
        fontWeight: '600',
        fontSize: 13,
    },
    selectorTextActivo: {
        color: '#1E3A5F',
        fontWeight: '700',
    },

    // Lista
    listaContent: {
        paddingTop: 20,
        paddingBottom: 100,
        paddingHorizontal: 16,
    },
    listaEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
    },

    // Tarjetas
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        borderLeftWidth: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    medicoInfo: {
        flex: 1,
    },
    cardMedico: { 
        fontWeight: '800', 
        fontSize: 18, 
        color: '#1E3A5F',
        marginBottom: 4,
    },
    especialidadBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    cardEspecialidad: { 
        color: '#2563EB', 
        fontSize: 12, 
        fontWeight: '600',
    },
    badge: { 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 8,
    },
    badgeText: { 
        fontSize: 11, 
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    
    cardBody: {
        gap: 12,
    },
    
    fechaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 10,
    },
    fechaIcono: {
        fontSize: 20,
    },
    fechaCompleta: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
        marginBottom: 2,
    },
    horaTexto: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    
    motivoContainer: { 
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 10,
    },
    motivoLabel: { 
        fontSize: 11, 
        color: '#94A3B8', 
        fontWeight: '700', 
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    motivoTexto: { 
        color: '#475569', 
        fontSize: 14, 
        lineHeight: 20,
    },
    
    cardFooter: {
        marginTop: 12,
    },
    footerLine: {
        height: 1,
        backgroundColor: '#F1F5F9',
    },

    // Empty state
    emptyContainer: { 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
        color: '#94A3B8',
    },
    emptyTitle: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 3,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Botón Flotante (FAB) mejorado
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#2563EB',
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        elevation: 8,
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    fabIcon: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    fabTexto: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 15,
        letterSpacing: 0.5,
    },
});

export default ClienteDashboard;