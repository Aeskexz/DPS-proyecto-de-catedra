import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, useWindowDimensions, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { medicosService, citasService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

const NuevaCitaScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
    const [medicos, setMedicos] = useState([]);
    const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fechaTexto, setFechaTexto] = useState('');

    const [hora, setHora] = useState('');
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [cargandoMedicos, setCargandoMedicos] = useState(true);

    // Horas disponibles para días de semana (Lunes - Viernes): 7:00 AM - 5:00 PM
    const horasDiasSemana = [
        { value: '07:00', label: '7:00 AM' },
        { value: '07:30', label: '7:30 AM' },
        { value: '08:00', label: '8:00 AM' },
        { value: '08:30', label: '8:30 AM' },
        { value: '09:00', label: '9:00 AM' },
        { value: '09:30', label: '9:30 AM' },
        { value: '10:00', label: '10:00 AM' },
        { value: '10:30', label: '10:30 AM' },
        { value: '11:00', label: '11:00 AM' },
        { value: '11:30', label: '11:30 AM' },
        { value: '12:00', label: '12:00 PM' },
        { value: '12:30', label: '12:30 PM' },
        { value: '14:00', label: '2:00 PM' },
        { value: '14:30', label: '2:30 PM' },
        { value: '15:00', label: '3:00 PM' },
        { value: '15:30', label: '3:30 PM' },
        { value: '16:00', label: '4:00 PM' },
        { value: '16:30', label: '4:30 PM' },
        { value: '17:00', label: '5:00 PM' },
    ];

    const horasSabado = [
        { value: '07:00', label: '7:00 AM' },
        { value: '07:30', label: '7:30 AM' },
        { value: '08:00', label: '8:00 AM' },
        { value: '08:30', label: '8:30 AM' },
        { value: '09:00', label: '9:00 AM' },
        { value: '09:30', label: '9:30 AM' },
        { value: '10:00', label: '10:00 AM' },
        { value: '10:30', label: '10:30 AM' },
        { value: '11:00', label: '11:00 AM' },
        { value: '11:30', label: '11:30 AM' },
        { value: '12:00', label: '12:00 PM' },
        { value: '12:30', label: '12:30 PM' },
    ];

    const getHorasDisponibles = () => {
        if (!fechaTexto) return horasDiasSemana;

        const fecha = new Date(fechaTexto + 'T00:00:00');
        const diaSemana = fecha.getDay();

        if (diaSemana === 0) return [];
        if (diaSemana === 6) return horasSabado;
        return horasDiasSemana;
    };

    const horasDisponibles = getHorasDisponibles();

    const getDiaSeleccionado = () => {
        if (!fechaTexto) return '';
        const fecha = new Date(fechaTexto + 'T00:00:00');
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return dias[fecha.getDay()];
    };

    useEffect(() => {
        medicosService.getLista()
            .then(setMedicos)
            .catch((e) => Alert.alert('Error', e.message))
            .finally(() => setCargandoMedicos(false));
    }, []);

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);

        let f = currentDate.toISOString().split('T')[0];
        setFechaTexto(f);

        const fecha = new Date(f + 'T00:00:00');
        const diaSemana = fecha.getDay();

        if (diaSemana === 0) {
            setHora('');
        } else if (diaSemana === 6 && hora) {
            const horaNumerica = parseInt(hora.split(':')[0]);
            if (horaNumerica >= 14) {
                setHora('');
            }
        }
    };

    const handleCrearCita = async () => {
        if (fechaTexto) {
            const fecha = new Date(fechaTexto + 'T00:00:00');
            const year = fecha.getFullYear();

            if (year !== 2026) {
                Alert.alert('Año no válido', 'Las citas solo se pueden agendar para el año 2026.');
                return;
            }

            const diaSemana = fecha.getDay();
            if (diaSemana === 0) {
                Alert.alert('Día no disponible', 'Los domingos no hay atención. Por favor selecciona otro día.');
                return;
            }
        }

        if (!medicoSeleccionado || !fechaTexto || !hora) {
            Alert.alert('Campos requeridos', 'Selecciona médico, fecha y hora.');
            return;
        }

        setLoading(true);
        try {
            await citasService.crearCita({
                id_medico: medicoSeleccionado.id_medico,
                fecha_cita: fechaTexto,
                hora_cita: hora + ':00',
                motivo_consulta: motivo.trim() || undefined,
            });

            Alert.alert('¡Cita creada!', 'Tu cita fue registrada exitosamente.', [
                {
                    text: 'Entendido',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error al crear cita', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (cargandoMedicos) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;
    }

    return (
        <ScrollView style={styles.main} contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}> 
            <View style={[styles.wrapper, { maxWidth: contentMaxWidth }]}> 
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.titulo}>Agendar Cita</Text>
                    <Text style={styles.subtitulo}>Selecciona fecha en el calendario</Text>
                </View>
            </View>

            <Text style={styles.seccionTitulo}>1. Elige tu especialista</Text>
            <View style={styles.medicoList}>
                {medicos.map((m) => (
                    <TouchableOpacity
                        key={m.id_medico}
                        style={[styles.medicoCard, medicoSeleccionado?.id_medico === m.id_medico && styles.medicoSeleccionado]}
                        onPress={() => setMedicoSeleccionado(m)}
                    >
                        <Text style={[styles.medicoNombre, medicoSeleccionado?.id_medico === m.id_medico && styles.textoBlanco]}>{m.nombre_completo}</Text>
                        <Text style={[styles.medicoEsp, medicoSeleccionado?.id_medico === m.id_medico && styles.textoAzulClaro]}>{m.especialidad}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.formCard}>
                <Text style={styles.seccionTitulo}>2. Detalles de la cita</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fecha de la Cita</Text>
                    {Platform.OS === 'web' ? (
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                min="2026-01-01"
                                max="2026-12-31"
                                value={fechaTexto}
                                onChange={(e) => {
                                    const f = e.target.value;
                                    setFechaTexto(f);
                                    if (f) setDate(new Date(f));
                                }}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    fontSize: '15px',
                                    border: '1.5px solid #F1F5F9',
                                    borderRadius: '12px',
                                    backgroundColor: '#F8FAFC',
                                    fontFamily: 'inherit',
                                    color: '#1E293B',
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            />
                        </div>
                    ) : (
                        <TouchableOpacity
                            style={styles.inputPicker}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={fechaTexto ? styles.inputText : styles.placeholderText}>
                                {fechaTexto ? fechaTexto : "Seleccionar fecha..."}
                            </Text>
                            <Text style={styles.calendarIcon}>📅</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {Platform.OS !== 'web' && showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        minimumDate={new Date('2026-01-01')}
                        maximumDate={new Date('2026-12-31')}
                    />
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hora de la Cita</Text>
                    {fechaTexto && (() => {
                        const fecha = new Date(fechaTexto + 'T00:00:00');
                        const diaSemana = fecha.getDay();

                        if (diaSemana === 0) {
                            return (
                                <View style={styles.domingoContainer}>
                                    <Text style={styles.domingoIcon}>⛔</Text>
                                    <Text style={styles.domingoTexto}>No hay atención los domingos</Text>
                                </View>
                            );
                        }

                        if (diaSemana === 6) {
                            return (
                                <>
                                    {Platform.OS === 'web' ? (
                                        <select
                                            value={hora}
                                            onChange={(e) => setHora(e.target.value)}
                                            disabled={horasDisponibles.length === 0}
                                            style={{
                                                width: '100%',
                                                padding: '14px 16px',
                                                fontSize: '15px',
                                                border: '1.5px solid #F1F5F9',
                                                borderRadius: '12px',
                                                backgroundColor: horasDisponibles.length === 0 ? '#F1F5F9' : '#F8FAFC',
                                                fontFamily: 'inherit',
                                                color: hora ? '#1E293B' : '#94A3B8',
                                                outline: 'none',
                                                cursor: horasDisponibles.length === 0 ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <option value="" disabled>Seleccionar hora...</option>
                                            {horasDisponibles.map((h) => (
                                                <option key={h.value} value={h.value}>{h.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <TouchableOpacity style={styles.inputPicker}>
                                            <Text style={hora ? styles.inputText : styles.placeholderText}>
                                                {hora ? horasDisponibles.find(h => h.value === hora)?.label || hora : "Seleccionar hora..."}
                                            </Text>
                                            <Text style={styles.calendarIcon}>🕐</Text>
                                        </TouchableOpacity>
                                    )}
                                    <Text style={styles.horaNota}>📅 Sábado: solo disponible de 7:00 AM a 12:30 PM</Text>
                                </>
                            );
                        }

                        return (
                            <>
                                {Platform.OS === 'web' ? (
                                    <select
                                        value={hora}
                                        onChange={(e) => setHora(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            fontSize: '15px',
                                            border: '1.5px solid #F1F5F9',
                                            borderRadius: '12px',
                                            backgroundColor: '#F8FAFC',
                                            fontFamily: 'inherit',
                                            color: hora ? '#1E293B' : '#94A3B8',
                                            outline: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="" disabled>Seleccionar hora...</option>
                                        {horasDisponibles.map((h) => (
                                            <option key={h.value} value={h.value}>{h.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <TouchableOpacity style={styles.inputPicker}>
                                        <Text style={hora ? styles.inputText : styles.placeholderText}>
                                            {hora ? horasDisponibles.find(h => h.value === hora)?.label || hora : "Seleccionar hora..."}
                                        </Text>
                                        <Text style={styles.calendarIcon}>🕐</Text>
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.horaNota}>🕐 Disponible de 7:00 AM a 5:00 PM (cerramos 1:00 PM - 2:00 PM por almuerzo)</Text>
                            </>
                        );
                    })()}
                    {!fechaTexto && (
                        <Text style={styles.horaNota}>📅 Selecciona una fecha para ver las horas disponibles</Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Motivo</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Motivo de la consulta..."
                        multiline
                        value={motivo}
                        onChangeText={setMotivo}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.boton, (loading || !medicoSeleccionado) && styles.botonDisabled]}
                onPress={handleCrearCita}
                disabled={loading || !medicoSeleccionado}
            >
                <Text style={styles.botonTexto}>{loading ? "Cargando..." : "Confirmar Reservación"}</Text>
            </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    main: { backgroundColor: '#F8FAFC' },
    container: { paddingVertical: 20, flexGrow: 1 },
    wrapper: { width: '100%', alignSelf: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 20 },
    backBtn: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 2 },
    backText: { color: '#1E3A5F', fontSize: 24, fontWeight: 'bold' },
    titulo: { fontSize: 24, fontWeight: '800', color: '#1E3A5F' },
    subtitulo: { fontSize: 14, color: '#64748B' },
    seccionTitulo: { fontSize: 16, fontWeight: '700', color: '#1E3A5F', marginBottom: 15 },
    medicoList: { marginBottom: 10 },
    medicoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    medicoSeleccionado: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
    medicoNombre: { fontWeight: '700', color: '#1E3A5F', fontSize: 16 },
    medicoEsp: { color: '#64748B', fontSize: 13 },
    textoBlanco: { color: '#fff' },
    textoAzulClaro: { color: '#93C5FD' },
    formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
    input: { borderWidth: 1.5, borderColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, backgroundColor: '#F8FAFC' },
    // Estilo para el selector de fecha
    inputPicker: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#F1F5F9', borderRadius: 12, 
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F8FAFC' 
    },
    inputText: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
    placeholderText: { fontSize: 15, color: '#94A3B8' },
    calendarIcon: { fontSize: 18 },
    textArea: { height: 80, textAlignVertical: 'top' },
    horaNota: { fontSize: 12, color: '#64748B', marginTop: 6, fontStyle: 'italic' },
    domingoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1.5,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    domingoIcon: { fontSize: 24 },
    domingoTexto: { fontSize: 14, color: '#991B1B', fontWeight: '600' },
    boton: { backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 10, marginBottom: 40 },
    botonDisabled: { backgroundColor: '#94A3B8' },
    botonTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default NuevaCitaScreen;
