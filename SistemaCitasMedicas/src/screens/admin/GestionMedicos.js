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
    StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { medicosService } from '../../services/api';

const GestionMedicos = ({ navigation, route }) => {
    const [medicos, setMedicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const data = await medicosService.getLista();
            setMedicos(data);
        } catch (e) { Alert.alert('Error', e.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const desactivar = (id, nombre) => {
        Alert.alert('Desactivar médico', `¿Desactivar a ${nombre}? Sus citas pendientes serán canceladas.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Desactivar', style: 'destructive',
                onPress: async () => {
                    try {
                        await medicosService.eliminar(id);
                        if (route.params?.onVolver) route.params.onVolver();
                        cargar();
                    } catch (e) { Alert.alert('Error', e.message); }
                },
            },
        ]);
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7C3AED" />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>Médicos Activos</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RegistrarMedico', { onVolver: cargar })}>
                    <Text style={styles.nuevo}>+ Nuevo</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={medicos}
                keyExtractor={(item) => String(item.id_medico)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} />}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.nombre}>{item.nombre_completo}</Text>
                        <Text style={styles.esp}>{item.especialidad}</Text>
                        <Text style={styles.info}>{item.email}</Text>
                        {item.telefono ? <Text style={styles.info}>📞 {item.telefono}</Text> : null}
                        {item.numero_colegiado ? <Text style={styles.info}>🪪 Colegiado: {item.numero_colegiado}</Text> : null}
                        <TouchableOpacity
                            style={styles.desactivarBtn}
                            onPress={() => desactivar(item.id_medico, item.nombre_completo)}
                        >
                            <Text style={styles.desactivarText}>Desactivar</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.vacio}>No hay médicos registrados.</Text>}
                contentContainerStyle={{ paddingBottom: 32 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF5FF' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#4C1D95', padding: 20, paddingTop: 50,
    },
    back: { color: '#C4B5FD', fontWeight: '600' },
    titulo: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    nuevo: { color: '#A78BFA', fontWeight: '700' },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16,
        marginTop: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    },
    nombre: { fontWeight: '700', fontSize: 16, color: '#3B0764', marginBottom: 2 },
    esp: { color: '#7C3AED', fontSize: 13, marginBottom: 6, fontWeight: '600' },
    info: { color: '#64748B', fontSize: 13, marginBottom: 2 },
    desactivarBtn: { marginTop: 10, alignSelf: 'flex-end' },
    desactivarText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
    vacio: { textAlign: 'center', color: '#94A3B8', marginTop: 60, fontSize: 16 },
});

export default GestionMedicos;
