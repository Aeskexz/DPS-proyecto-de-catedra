// ============================================================
// src/screens/medico/DetalleCitaMedico.js
// ============================================================
// RESPONSABLE: Equipo Frontend
// ESTADO: Completo. El médico puede cambiar estado y agregar notas.
//
// TODO PARA TUS COMPAÑEROS:
//   - Agregar historial de citas previas del mismo paciente
//   - Mostrar alerta de confirmación antes de cambiar estado
// ============================================================

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
            Alert.alert('Guardado', 'Cita actualizada correctamente.', [
                { text: 'OK', onPress: () => { if (onVolver) onVolver(); navigation.goBack(); } },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}> 
            <View style={[styles.wrapper, { maxWidth: contentMaxWidth }]}> 
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.back}>← Volver</Text>
            </TouchableOpacity>

            <Text style={styles.titulo}>Detalle de Cita</Text>

            <View style={styles.infoCard}>
                <Text style={styles.label}>Paciente</Text>
                <Text style={styles.valor}>{cita.nombre_paciente}</Text>
                <Text style={styles.label}>Correo</Text>
                <Text style={styles.valor}>{cita.email_paciente}</Text>
                <Text style={styles.label}>Fecha y Hora</Text>
                <Text style={styles.valor}>{cita.fecha_cita}  {cita.hora_cita?.slice(0, 5)}</Text>
                {cita.motivo_consulta ? (
                    <>
                        <Text style={styles.label}>Motivo</Text>
                        <Text style={styles.valor}>{cita.motivo_consulta}</Text>
                    </>
                ) : null}
            </View>

            <Text style={styles.seccion}>Actualizar Estado</Text>
            <View style={styles.estadosRow}>
                {ESTADOS.map((e) => (
                    <TouchableOpacity
                        key={e}
                        style={[styles.estadoBtn, estadoSel === e && styles.estadoBtnSel]}
                        onPress={() => setEstadoSel(e)}
                    >
                        <Text style={[styles.estadoText, estadoSel === e && styles.estadoTextSel]}>
                            {e.charAt(0).toUpperCase() + e.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.seccion}>Notas del Médico</Text>
            <TextInput
                style={styles.textarea}
                placeholder="Agrega observaciones o indicaciones para el paciente..."
                multiline
                value={notas}
                onChangeText={setNotas}
                textAlignVertical="top"
            />

            <TouchableOpacity
                style={[styles.boton, loading && { opacity: 0.6 }]}
                onPress={guardar}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Guardar Cambios</Text>}
            </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { paddingVertical: 20, backgroundColor: '#F0FDF4', flexGrow: 1 },
    wrapper: { width: '100%', alignSelf: 'center' },
    back: { color: '#166534', fontWeight: '600', marginTop: 30, marginBottom: 10 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#166534', marginBottom: 20 },
    infoCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    },
    label: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 8 },
    valor: { fontSize: 15, color: '#1E293B', marginTop: 2 },
    seccion: { fontSize: 15, fontWeight: '700', color: '#166534', marginBottom: 10 },
    estadosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    estadoBtn: {
        borderWidth: 1.5, borderColor: '#16A34A', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 6,
    },
    estadoBtnSel: { backgroundColor: '#16A34A' },
    estadoText: { color: '#16A34A', fontWeight: '600', fontSize: 13 },
    estadoTextSel: { color: '#fff' },
    textarea: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1',
        borderRadius: 10, padding: 14, minHeight: 100, fontSize: 14, marginBottom: 20,
    },
    boton: {
        backgroundColor: '#166534', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginBottom: 40,
    },
    botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default DetalleCitaMedico;
