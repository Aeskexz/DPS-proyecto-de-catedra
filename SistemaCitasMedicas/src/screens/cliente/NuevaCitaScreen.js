import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, useWindowDimensions, Platform
} from 'react-native';
// IMPORTANTE: Asegúrate de tener esta librería
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { medicosService, citasService } from '../../services/api';
import { getResponsive } from '../../utils/responsive';

const NuevaCitaScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
    const [medicos, setMedicos] = useState([]);
    const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
    
    // Estados para la fecha y el calendario
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [fechaTexto, setFechaTexto] = useState(''); // Lo que se envía a la DB
    
    const [hora, setHora] = useState('');
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);
    const [cargandoMedicos, setCargandoMedicos] = useState(true);

    useEffect(() => {
        medicosService.getLista()
            .then(setMedicos)
            .catch((e) => Alert.alert('Error', e.message))
            .finally(() => setCargandoMedicos(false));
    }, []);

    // Función que maneja el cambio de fecha en el calendario
    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios'); // En iOS queda abierto, en Android se cierra
        setDate(currentDate);

        // Formatear la fecha a YYYY-MM-DD para la base de datos
        let f = currentDate.toISOString().split('T')[0];
        setFechaTexto(f);
    };

    const handleCrearCita = async () => {
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
                    onPress: () => {
                        if (route.params?.onVolver) route.params.onVolver();
                        navigation.goBack();
                    },
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
                
                {/* CAMBIO AQUÍ: Al tocar este campo se abre el calendario */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fecha de la Cita</Text>
                    <TouchableOpacity 
                        style={styles.inputPicker} 
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={fechaTexto ? styles.inputText : styles.placeholderText}>
                            {fechaTexto ? fechaTexto : "Seleccionar fecha..."}
                        </Text>
                        <Text style={styles.calendarIcon}>📅</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        minimumDate={new Date()} // No permite citas en el pasado
                    />
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hora (HH:MM)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 14:30"
                        value={hora}
                        onChangeText={setHora}
                        keyboardType="numeric"
                    />
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
    boton: { backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 10, marginBottom: 40 },
    botonDisabled: { backgroundColor: '#94A3B8' },
    botonTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default NuevaCitaScreen;
