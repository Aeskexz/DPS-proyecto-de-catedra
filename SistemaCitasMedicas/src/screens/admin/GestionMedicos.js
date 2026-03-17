// ============================================================
// src/screens/admin/GestionMedicos.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. Lista de médicos activos con opción de desactivar.
//
// TODO PARA TUS COMPAÑEROS:
//   - Agregar pantalla de edición de médico (PUT /api/medicos/:id)
//   - Mostrar horarios de disponibilidad de cada médico
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, RefreshControl, useWindowDimensions, TextInput, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { medicosService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

const GestionMedicos = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth, isMobile } = getResponsive(width);
    const [medicos, setMedicos] = useState([]);
    const [medicosFiltrados, setMedicosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    const cargar = useCallback(async () => {
        try {
            const data = await medicosService.getLista();
            setMedicos(data);
            setMedicosFiltrados(data);
        } catch (e) { 
            Alert.alert('Error', e.message); 
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    // Filtro de búsqueda
    useEffect(() => {
        if (busqueda.trim() === '') {
            setMedicosFiltrados(medicos);
        } else {
            const termino = busqueda.toLowerCase().trim();
            const filtrados = medicos.filter(m => 
                m.nombre_completo.toLowerCase().includes(termino) ||
                m.email.toLowerCase().includes(termino) ||
                m.especialidad.toLowerCase().includes(termino) ||
                (m.numero_colegiado && m.numero_colegiado.toLowerCase().includes(termino))
            );
            setMedicosFiltrados(filtrados);
        }
    }, [busqueda, medicos]);

    const desactivar = (id, nombre) => {
        Alert.alert(
            'Desactivar médico',
            `¿Estás seguro de desactivar al Dr. ${nombre}?\n\nSus citas pendientes serán canceladas.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desactivar', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await medicosService.eliminar(id);
                            Alert.alert('Médico desactivado', `El Dr. ${nombre} ha sido desactivado.`);
                            if (route.params?.onVolver) route.params.onVolver();
                            cargar();
                        } catch (e) { 
                            Alert.alert('Error', e.message); 
                        }
                    },
                },
            ]
        );
    };

    const verDetalle = (medico) => {
        Alert.alert(
            `Dr. ${medico.nombre_completo}`,
            `${medico.especialidad}\n\n` +
            `Email: ${medico.email}\n` +
            `Teléfono: ${medico.telefono || 'No registrado'}\n` +
            `Colegiado: ${medico.numero_colegiado || 'No registrado'}\n` +
            `Usuario: @${medico.username}`,
            [{ text: 'Cerrar' }]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.loadingText}>Cargando profesionales...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.titulo}>Médicos</Text>
                        <Text style={styles.subtitulo}>
                            {medicosFiltrados.length} de {medicos.length} profesionales
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('RegistrarMedico', { onVolver: cargar })}
                    >
                        <Text style={styles.addIcon}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Barra de búsqueda */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por nombre, email o especialidad..."
                        placeholderTextColor="#94A3B8"
                        value={busqueda}
                        onChangeText={setBusqueda}
                    />
                    {busqueda ? (
                        <TouchableOpacity onPress={() => setBusqueda('')}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Lista */}
            <FlatList
                data={medicosFiltrados}
                keyExtractor={(item) => String(item.id_medico)}
                contentContainerStyle={[
                    styles.lista,
                    { paddingHorizontal: horizontalPadding }
                ]}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={() => { setRefreshing(true); cargar(); }} 
                        tintColor="#7C3AED"
                        colors={["#7C3AED"]}
                    />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => verDetalle(item)}
                        style={[styles.card, { maxWidth: contentMaxWidth, alignSelf: 'center' }]}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.medicoInfo}>
                                <Text style={styles.nombre}>{item.nombre_completo}</Text>
                                <View style={styles.especialidadBadge}>
                                    <Text style={styles.especialidadText}>{item.especialidad}</Text>
                                </View>
                            </View>
                            <View style={[styles.estadoBadge, { backgroundColor: item.activo ? '#DCFCE7' : '#FEE2E2' }]}>
                                <View style={[styles.estadoIndicador, { backgroundColor: item.activo ? '#16A34A' : '#DC2626' }]} />
                                <Text style={[styles.estadoText, { color: item.activo ? '#166534' : '#991B1B' }]}>
                                    {item.activo ? 'ACTIVO' : 'INACTIVO'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Email:</Text>
                                <Text style={styles.infoText}>{item.email}</Text>
                            </View>
                            {item.telefono ? (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Teléfono:</Text>
                                    <Text style={styles.infoText}>{item.telefono}</Text>
                                </View>
                            ) : null}
                            {item.numero_colegiado ? (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Colegiado:</Text>
                                    <Text style={styles.infoText}>{item.numero_colegiado}</Text>
                                </View>
                            ) : null}
                        </View>

                        <TouchableOpacity
                            style={styles.desactivarBtn}
                            onPress={() => desactivar(item.id_medico, item.nombre_completo)}
                        >
                            <Text style={styles.desactivarText}>Desactivar</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>
                            {busqueda ? 'No se encontraron médicos' : 'No hay médicos registrados'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {busqueda 
                                ? 'Intenta con otra búsqueda' 
                                : 'Comienza registrando tu primer médico'}
                        </Text>
                        {busqueda ? (
                            <TouchableOpacity 
                                style={styles.clearFiltersBtn}
                                onPress={() => setBusqueda('')}
                            >
                                <Text style={styles.clearFiltersText}>Limpiar búsqueda</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={styles.emptyBtn}
                                onPress={() => navigation.navigate('RegistrarMedico', { onVolver: cargar })}
                            >
                                <Text style={styles.emptyBtnText}>+ Registrar médico</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListHeaderComponent={
                    medicosFiltrados.length > 0 && busqueda ? (
                        <View style={styles.statsHeader}>
                            <Text style={styles.statsText}>
                                Mostrando {medicosFiltrados.length} resultados
                            </Text>
                        </View>
                    ) : null
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#FAF5FF' 
    },
    
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#FAF5FF'
    },
    loadingText: {
        marginTop: 10,
        color: '#7C3AED',
        fontSize: 14,
        fontWeight: '500'
    },

    // Header
    header: {
        backgroundColor: '#4C1D95',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backIcon: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    headerTextContainer: {
        flex: 1,
    },
    titulo: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 2,
    },
    subtitulo: {
        fontSize: 12,
        color: '#C4B5FD',
        fontWeight: '500',
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addIcon: {
        color: '#4C1D95',
        fontSize: 24,
        fontWeight: '800',
    },

    // Búsqueda
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        elevation: 2,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
        color: '#94A3B8',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        padding: 0,
    },
    clearIcon: {
        fontSize: 16,
        color: '#94A3B8',
        padding: 4,
    },

    // Lista
    lista: {
        paddingTop: 16,
        paddingBottom: 30,
    },
    statsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
    },
    statsText: {
        color: '#6B21A8',
        fontSize: 13,
        fontWeight: '600',
    },

    // Tarjetas
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        width: '100%',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
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
    nombre: {
        fontSize: 16,
        fontWeight: '800',
        color: '#3B0764',
        marginBottom: 4,
    },
    especialidadBadge: {
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    especialidadText: {
        fontSize: 11,
        color: '#7C3AED',
        fontWeight: '700',
    },
    estadoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    estadoIndicador: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    estadoText: {
        fontSize: 10,
        fontWeight: '800',
    },

    // Cuerpo de la tarjeta
    cardBody: {
        marginBottom: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    infoLabel: {
        width: 70,
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },

    // Botón desactivar
    desactivarBtn: {
        backgroundColor: '#FEE2E2',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    desactivarText: {
        color: '#DC2626',
        fontWeight: '700',
        fontSize: 14,
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3B0764',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyBtn: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 3,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    clearFiltersBtn: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    clearFiltersText: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default GestionMedicos;
