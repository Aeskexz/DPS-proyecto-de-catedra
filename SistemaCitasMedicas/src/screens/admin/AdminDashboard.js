// ============================================================
// src/screens/admin/AdminDashboard.js
// ============================================================
// RESPONSABLE: Equipo Frontend / Backend
// ESTADO: Completo. Vista Dual (Pacientes y Médicos) para web y móvil.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
    ActivityIndicator, Alert, RefreshControl, Platform, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { medicosService, clientesService } from '../../services/api';

const AdminDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();
    const [medicos, setMedicos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const [editForm, setEditForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        username: '',
        telefono: '',
        id_especialidad: '',
        numero_colegiado: '',
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [restoringPasswordKey, setRestoringPasswordKey] = useState(null);

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
                window.alert(' Usuario eliminado/desactivado correctamente.');
            } else {
                Alert.alert('Éxito', 'Usuario eliminado/desactivado correctamente.');
            }
            cargarDatos();
        } catch (e) {
            if (Platform.OS === 'web') {
                window.alert(' Error: ' + e.message);
            } else {
                Alert.alert('Error', e.message);
            }
        }
    };

    const iniciarEdicion = (tipo, item) => {
        setEditingKey(`${tipo}-${item.id_usuario}`);
        setEditForm({
            nombre: item.nombre || '',
            apellido: item.apellido || '',
            email: item.email || '',
            username: item.username || '',
            telefono: item.telefono || '',
            id_especialidad: item.id_especialidad ? String(item.id_especialidad) : '',
            numero_colegiado: item.numero_colegiado || '',
        });
    };

    const cancelarEdicion = () => {
        setEditingKey(null);
        setEditForm({
            nombre: '',
            apellido: '',
            email: '',
            username: '',
            telefono: '',
            id_especialidad: '',
            numero_colegiado: '',
        });
    };

    const guardarEdicion = async (tipo, itemId) => {
        if (!editForm.nombre.trim() || !editForm.apellido.trim() || !editForm.email.trim() || !editForm.username.trim()) {
            Alert.alert('Campos requeridos', 'Nombre, apellido, correo y usuario son obligatorios.');
            return;
        }

        if (tipo === 'medico' && !editForm.id_especialidad) {
            Alert.alert('Campo requerido', 'La especialidad es obligatoria para médicos.');
            return;
        }

        setSavingEdit(true);
        try {
            if (tipo === 'medico') {
                await medicosService.editar(itemId, {
                    nombre: editForm.nombre.trim(),
                    apellido: editForm.apellido.trim(),
                    email: editForm.email.trim(),
                    username: editForm.username.trim(),
                    telefono: editForm.telefono.trim() || null,
                    id_especialidad: parseInt(editForm.id_especialidad, 10),
                    numero_colegiado: editForm.numero_colegiado.trim() || null,
                });
            } else {
                await clientesService.editar(itemId, {
                    nombre: editForm.nombre.trim(),
                    apellido: editForm.apellido.trim(),
                    email: editForm.email.trim(),
                    username: editForm.username.trim(),
                    telefono: editForm.telefono.trim() || null,
                });
            }
            Alert.alert('Éxito', 'Registro actualizado correctamente.');
            cancelarEdicion();
            cargarDatos();
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setSavingEdit(false);
        }
    };

    const restaurarPassword = async (tipo, itemId, nombre) => {
        const ejecutar = async () => {
            const actionKey = `${tipo}-${itemId}`;
            setRestoringPasswordKey(actionKey);
            try {
                const result = tipo === 'medico'
                    ? await medicosService.restaurarPassword(itemId)
                    : await clientesService.restaurarPassword(itemId);

                const mensaje = `${result.message}\n\nContraseña temporal: ${result.password_temporal}`;
                if (Platform.OS === 'web') {
                    window.alert(mensaje);
                } else {
                    Alert.alert('Contraseña restaurada', mensaje);
                }
            } catch (e) {
                Alert.alert('Error', e.message);
            } finally {
                setRestoringPasswordKey(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`¿Restaurar contraseña de ${nombre}?`)) {
                ejecutar();
            }
        } else {
            Alert.alert(
                'Restaurar contraseña',
                `¿Restaurar contraseña de ${nombre}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Restaurar', onPress: ejecutar },
                ]
            );
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7C3AED" />;

    const renderItemUsuario = ({ item, tipo }) => {
        const cardKey = `${tipo}-${item.id_usuario}`;
        const isEditing = editingKey === cardKey;
        const isRestoring = restoringPasswordKey === cardKey;

        return (
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
                {tipo === 'medico' && <Text style={styles.detalles}>{item.especialidad}</Text>}

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.editarBtn} onPress={() => iniciarEdicion(tipo, item)}>
                        <Text style={styles.editarText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.restaurarBtn}
                        onPress={() => restaurarPassword(tipo, item.id_usuario, `${item.nombre} ${item.apellido}`)}
                        disabled={isRestoring}
                    >
                        <Text style={styles.restaurarText}>{isRestoring ? 'Restaurando...' : 'Restaurar contraseña'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.eliminarBtn}
                        onPress={() => confirmarEliminacion(tipo, item.id_usuario, item.nombre)}
                    >
                        <Text style={styles.eliminarText}>Eliminar</Text>
                    </TouchableOpacity>
                </View>

                {isEditing && (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre"
                            value={editForm.nombre}
                            onChangeText={(v) => setEditForm((prev) => ({ ...prev, nombre: v }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Apellido"
                            value={editForm.apellido}
                            onChangeText={(v) => setEditForm((prev) => ({ ...prev, apellido: v }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo"
                            autoCapitalize="none"
                            value={editForm.email}
                            onChangeText={(v) => setEditForm((prev) => ({ ...prev, email: v }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Usuario"
                            autoCapitalize="none"
                            value={editForm.username}
                            onChangeText={(v) => setEditForm((prev) => ({ ...prev, username: v }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Teléfono"
                            value={editForm.telefono}
                            onChangeText={(v) => setEditForm((prev) => ({ ...prev, telefono: v }))}
                        />

                        {tipo === 'medico' && (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ID Especialidad"
                                    keyboardType="numeric"
                                    value={editForm.id_especialidad}
                                    onChangeText={(v) => setEditForm((prev) => ({ ...prev, id_especialidad: v }))}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="N° Colegiado"
                                    value={editForm.numero_colegiado}
                                    onChangeText={(v) => setEditForm((prev) => ({ ...prev, numero_colegiado: v }))}
                                />
                            </>
                        )}

                        <View style={styles.editActionsRow}>
                            <TouchableOpacity
                                style={styles.guardarBtn}
                                onPress={() => guardarEdicion(tipo, item.id_usuario)}
                                disabled={savingEdit}
                            >
                                <Text style={styles.guardarText}>{savingEdit ? 'Guardando...' : 'Guardar'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelarBtn} onPress={cancelarEdicion}>
                                <Text style={styles.cancelarText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/*  Header  */}
            <View style={styles.header}>
                <View style={[styles.headerInfo, width < 760 && styles.headerInfoMobile]}>
                    <Text style={styles.titulo}>Panel de Control Supremo</Text>
                    <Text style={styles.subtitulo}>{user.nombre} · {medicos.length} Médicos · {clientes.length} Pacientes</Text>
                </View>
                <View style={[styles.headerActions, width < 760 && styles.headerActionsMobile]}>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('RegistrarMedico', { onVolver: cargarDatos })}>
                        <Text style={styles.addBtnTexto}>+ Registrar Médico</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('AjustesCuenta')}>
                        <Text style={styles.settings}>Ajustes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout}>
                        <Text style={styles.logout}>Salir</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/*  Contenido Dual  */}
            <View style={[styles.contentRow, isLargeScreen ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>

                {/*  Columna Pacientes (Izquierda)  */}
                <View style={[styles.columna, isLargeScreen && { marginRight: 8 }]}>
                    <View style={styles.columnaHeader}>
                        <Text style={styles.columnaTitulo}> Pacientes</Text>
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

                {/*  Columna Médicos (Derecha)  */}
                <View style={[styles.columna, isLargeScreen && { marginLeft: 8 }, !isLargeScreen && { marginTop: 20 }]}>
                    <View style={[styles.columnaHeader, { backgroundColor: '#E0E7FF' }]}>
                        <Text style={[styles.columnaTitulo, { color: '#3730A3' }]}> Médicos</Text>
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
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    detalles: { color: '#64748B', fontSize: 13, marginBottom: 2 },

    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
    editarBtn: { alignSelf: 'flex-start', backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    editarText: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 12 },
    restaurarBtn: { alignSelf: 'flex-start', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    restaurarText: { color: '#92400E', fontWeight: 'bold', fontSize: 12 },

    eliminarBtn: { alignSelf: 'flex-start', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    eliminarText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },

    editContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8,
        backgroundColor: '#F8FAFC',
        fontSize: 13,
    },
    editActionsRow: { flexDirection: 'row', gap: 8 },
    guardarBtn: { backgroundColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
    guardarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    cancelarBtn: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
    cancelarText: { color: '#334155', fontWeight: '700', fontSize: 12 },

    vacio: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 15 },
});

export default AdminDashboard;
