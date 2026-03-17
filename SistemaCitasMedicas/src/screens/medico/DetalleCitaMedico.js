import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, ScrollView, useWindowDimensions
} from 'react-native';
import { citasService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

const ESTADOS = ['pendiente', 'confirmada', 'completada', 'cancelada'];

const DetalleCitaMedico = ({ route, navigation }) => {
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
    const { cita, onVolver } = route.params;
    const [estadoSel, setEstadoSel] = useState(cita.estado);
    const [notas, setNotas] = useState('');
    const [loading, setLoading] = useState(false);

    const guardar = async () => {
        setLoading(true);
        try {
            await citasService.actualizarEstado(cita.id_cita, estadoSel, notas.trim() || undefined);
            Alert.alert('¡Éxito!', 'La ficha de la cita ha sido actualizada.', [
                { text: 'Entendido', onPress: () => { if (onVolver) onVolver(); navigation.goBack(); } },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.main} contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}> 
            <View style={[styles.wrapper, { maxWidth: contentMaxWidth }]}> 
            
            {/* Header con estilo de barra superior */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitulo}>Expediente de Cita</Text>
            </View>

            {/* Ficha del Paciente */}
            <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.pacienteNombre}>{cita.nombre_paciente}</Text>
                    <Text style={styles.pacienteEmail}>{cita.email_paciente}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.detalleFila}>
                    <View style={styles.detalleItem}>
                        <Text style={styles.label}>FECHA</Text>
                        <Text style={styles.valor}>{cita.fecha_cita}</Text>
                    </View>
                    <View style={styles.detalleItem}>
                        <Text style={styles.label}>HORA</Text>
                        <Text style={styles.valor}>{cita.hora_cita?.slice(0, 5)} HS</Text>
                    </View>
                </View>

                {cita.motivo_consulta && (
                    <View style={styles.motivoBox}>
                        <Text style={styles.label}>MOTIVO DE CONSULTA</Text>
                        <Text style={styles.motivoTexto}>{cita.motivo_consulta}</Text>
                    </View>
                )}
            </View>

            {/* Control de Estado */}
            <Text style={styles.seccionTitulo}>Actualizar situación</Text>
            <View style={styles.estadosContainer}>
                {ESTADOS.map((e) => {
                    const esSeleccionado = estadoSel === e;
                    return (
                        <TouchableOpacity
                            key={e}
                            activeOpacity={0.7}
                            style={[styles.estadoChip, esSeleccionado && styles.estadoChipSel]}
                            onPress={() => setEstadoSel(e)}
                        >
                            <Text style={[styles.estadoChipText, esSeleccionado && styles.estadoChipTextSel]}>
                                {e.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Notas Médicas */}
            <Text style={styles.seccionTitulo}>Observaciones Médicas</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.textarea}
                    placeholder="Escriba aquí el diagnóstico, recetas o indicaciones..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={notas}
                    onChangeText={setNotas}
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity
                style={[styles.botonGuardar, loading && { opacity: 0.7 }]}
                onPress={guardar}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.botonTexto}>Finalizar y Guardar</Text>
                )}
            </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    main: { backgroundColor: '#F8FAFC' },
    container: { paddingVertical: 20, flexGrow: 1 },
    wrapper: { width: '100%', alignSelf: 'center' },
    
    // Header
    headerBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 15 },
    backButton: { paddingRight: 15 },
    backText: { color: '#166534', fontWeight: '700', fontSize: 16 },
    headerTitulo: { fontSize: 20, fontWeight: '800', color: '#1E293B', flex: 1 },

    // Ficha Paciente
    infoCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 25,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
        borderTopWidth: 4, borderTopColor: '#166534'
    },
    cardHeader: { marginBottom: 15 },
    pacienteNombre: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
    pacienteEmail: { fontSize: 14, color: '#64748B', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 15 },
    detalleFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    detalleItem: { flex: 1 },
    label: { fontSize: 11, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5 },
    valor: { fontSize: 16, color: '#1E293B', fontWeight: '600', marginTop: 4 },
    motivoBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 5 },
    motivoTexto: { fontSize: 14, color: '#475569', marginTop: 4, lineHeight: 20 },

    // Estados
    seccionTitulo: { fontSize: 15, fontWeight: '800', color: '#334155', marginBottom: 12, paddingLeft: 5 },
    estadosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
    estadoChip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0'
    },
    estadoChipSel: { backgroundColor: '#166534', borderColor: '#166534' },
    estadoChipText: { color: '#64748B', fontWeight: '700', fontSize: 12 },
    estadoChipTextSel: { color: '#fff' },

    // Input
    inputWrapper: { backgroundColor: '#fff', borderRadius: 15, padding: 5, elevation: 1 },
    textarea: {
        minHeight: 120, padding: 15, fontSize: 15, color: '#1E293B',
    },

    // Botón
    botonGuardar: {
        backgroundColor: '#166534', borderRadius: 16, paddingVertical: 18,
        alignItems: 'center', marginTop: 30, marginBottom: 40,
        elevation: 6, shadowColor: '#166534', shadowOpacity: 0.3, shadowRadius: 8
    },
    botonTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default DetalleCitaMedico;
