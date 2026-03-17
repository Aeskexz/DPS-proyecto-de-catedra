import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, 
    useWindowDimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getResponsive } from '../../utils/responsive';

const AjustesCuentaScreen = ({ navigation }) => {
    const { user, updateMiCuenta, eliminarMiCuenta } = useAuth();
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
    
    // Detectamos el color principal según el rol para mantener la identidad
    const colorPrincipal = user?.rol === 'medico' ? '#166534' : '#2563EB';
    const esAdmin = user?.rol === 'administrador' || user?.id_rol === 1;

    const [nombre, setNombre] = useState(user?.nombre || '');
    const [apellido, setApellido] = useState(user?.apellido || '');
    const [username, setUsername] = useState(user?.username || '');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [deletePassword, setDeletePassword] = useState('');
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const showMessage = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleActualizarDatos = async () => {
        if (!nombre.trim() || !apellido.trim() || !username.trim()) {
            return showMessage('Campos requeridos', 'Nombre, apellido y usuario son obligatorios.');
        }

        setLoadingUpdate(true);
        try {
            await updateMiCuenta({
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                username: username.trim(),
            });
            showMessage('Éxito', 'Tus datos fueron actualizados correctamente.');
        } catch (error) {
            showMessage('Error', error.message);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleCambiarPassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return showMessage('Campos requeridos', 'Completa todos los campos de contraseña.');
        }
        if (newPassword.length < 8) {
            return showMessage('Contraseña corta', 'La nueva contraseña debe tener al menos 8 caracteres.');
        }
        if (newPassword !== confirmNewPassword) {
            return showMessage('Error', 'Las nuevas contraseñas no coinciden.');
        }

        setLoadingUpdate(true);
        try {
            await updateMiCuenta({
                current_password: currentPassword,
                new_password: newPassword,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            showMessage('Éxito', 'Tu contraseña fue actualizada.');
        } catch (error) {
            showMessage('Error', error.message);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const confirmarEliminacion = () => {
        const ejecutar = async () => {
            if (!deletePassword) return showMessage('Seguridad', 'Ingresa tu contraseña para confirmar.');
            setLoadingDelete(true);
            try {
                await eliminarMiCuenta(deletePassword);
                showMessage('Adiós', 'Cuenta eliminada correctamente.');
            } catch (error) {
                showMessage('Error', error.message);
            } finally {
                setLoadingDelete(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) ejecutar();
            return;
        }

        Alert.alert(
            'Eliminar cuenta',
            '¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
            [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: ejecutar }]
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}> 
                <View style={[styles.wrapper, { maxWidth: contentMaxWidth }]}> 
                    
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Mi Cuenta</Text>
                            <Text style={styles.subtitle}>Gestiona tu información personal</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Text style={[styles.backText, { color: colorPrincipal }]}>Volver</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sección: Datos Personales */}
                    <View style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: colorPrincipal }]}>Datos de perfil</Text>
                        
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />

                        <Text style={styles.label}>Apellido</Text>
                        <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Tu apellido" />

                        <Text style={styles.label}>Nombre de usuario</Text>
                        <TextInput style={styles.input} value={username} autoCapitalize="none" onChangeText={setUsername} placeholder="usuario123" />

                        <TouchableOpacity 
                            style={[styles.primaryBtn, { backgroundColor: colorPrincipal }]} 
                            onPress={handleActualizarDatos} 
                            disabled={loadingUpdate}
                        >
                            {loadingUpdate ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar Cambios</Text>}
                        </TouchableOpacity>
                    </View>

                    {/* Sección: Seguridad */}
                    <View style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: colorPrincipal }]}>Cambiar contraseña</Text>
                        
                        <Text style={styles.label}>Contraseña actual</Text>
                        <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" />

                        <Text style={styles.label}>Nueva contraseña</Text>
                        <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Mínimo 8 caracteres" />

                        <Text style={styles.label}>Confirmar nueva contraseña</Text>
                        <TextInput style={styles.input} secureTextEntry value={confirmNewPassword} onChangeText={setConfirmNewPassword} placeholder="Repite la contraseña" />

                        <TouchableOpacity 
                            style={[styles.primaryBtn, { backgroundColor: colorPrincipal }]} 
                            onPress={handleCambiarPassword} 
                            disabled={loadingUpdate}
                        >
                            {loadingUpdate ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Actualizar Contraseña</Text>}
                        </TouchableOpacity>
                    </View>

                    {/* Sección: Peligro */}
                    {esAdmin ? (
                        <View style={styles.cardInfo}>
                            <Text style={styles.sectionTitle}>🛡️ Seguridad de Admin</Text>
                            <Text style={styles.infoText}>Esta cuenta tiene privilegios de administrador y no puede ser eliminada para garantizar la gestión del sistema.</Text>
                        </View>
                    ) : (
                        <View style={styles.cardDanger}>
                            <Text style={styles.dangerTitle}>Zona de peligro</Text>
                            <Text style={styles.warningText}>Una vez eliminada la cuenta, no hay marcha atrás. Se borrarán todas tus citas y registros.</Text>

                            <Text style={styles.label}>Contraseña de confirmación</Text>
                            <TextInput
                                style={[styles.input, { borderColor: '#FCA5A5' }]}
                                secureTextEntry
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                                placeholder="Confirma para eliminar"
                            />

                            <TouchableOpacity style={styles.dangerBtn} onPress={confirmarEliminacion} disabled={loadingDelete}>
                                {loadingDelete ? <ActivityIndicator color="#fff" /> : <Text style={styles.dangerBtnText}>Eliminar mi cuenta permanentemente</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { paddingVertical: 20, paddingBottom: 50 },
    wrapper: { width: '100%', alignSelf: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
    subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
    backBtn: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, elevation: 2 },
    backText: { fontWeight: '700' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardInfo: { backgroundColor: '#E0F2FE', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#7DD3FC' },
    cardDanger: {
        backgroundColor: '#FFF1F2',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 15 },
    dangerTitle: { fontSize: 17, fontWeight: '700', color: '#991B1B', marginBottom: 10 },
    label: { color: '#475569', marginBottom: 6, fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
    input: {
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        marginBottom: 16,
        fontSize: 15,
    },
    primaryBtn: {
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 5,
    },
    primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    warningText: { color: '#991B1B', marginBottom: 15, fontSize: 13, lineHeight: 18 },
    infoText: { color: '#0369A1', fontSize: 14, lineHeight: 20 },
    dangerBtn: {
        backgroundColor: '#DC2626',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 5,
    },
    dangerBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default AjustesCuentaScreen;
