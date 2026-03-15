import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getResponsive } from '../../utils/responsive';

const AjustesCuentaScreen = ({ navigation }) => {
    const { user, updateMiCuenta, eliminarMiCuenta } = useAuth();
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
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
            showMessage('Éxito', 'Tus datos fueron actualizados.');
        } catch (error) {
            showMessage('Error', error.message);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleCambiarPassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return showMessage('Campos requeridos', 'Debes ingresar contraseña actual, nueva contraseña y su confirmación.');
        }

        if (newPassword.length < 8) {
            return showMessage('Contraseña inválida', 'La nueva contraseña debe tener al menos 8 caracteres.');
        }

        if (newPassword !== confirmNewPassword) {
            return showMessage('Contraseñas no coinciden', 'La confirmación de la nueva contraseña no coincide.');
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
            if (!deletePassword) {
                return showMessage('Campo requerido', 'Ingresa tu contraseña para eliminar tu cuenta.');
            }

            setLoadingDelete(true);
            try {
                await eliminarMiCuenta(deletePassword);
                showMessage('Cuenta eliminada', 'Tu cuenta fue eliminada correctamente.');
            } catch (error) {
                showMessage('Error', error.message);
            } finally {
                setLoadingDelete(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                ejecutar();
            }
            return;
        }

        Alert.alert(
            'Eliminar cuenta',
            '¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: ejecutar },
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}> 
                <View style={[styles.wrapper, { maxWidth: contentMaxWidth }]}> 
                <View style={styles.header}>
                    <Text style={styles.title}>Ajustes de cuenta</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.back}>Volver</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Datos de perfil</Text>
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

                    <Text style={styles.label}>Apellido</Text>
                    <TextInput style={styles.input} value={apellido} onChangeText={setApellido} />

                    <Text style={styles.label}>Usuario</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        autoCapitalize="none"
                        onChangeText={setUsername}
                    />

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleActualizarDatos} disabled={loadingUpdate}>
                        {loadingUpdate ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar datos</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
                    <Text style={styles.label}>Contraseña actual</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />

                    <Text style={styles.label}>Nueva contraseña</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />

                    <Text style={styles.label}>Confirmar nueva contraseña</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                    />

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleCambiarPassword} disabled={loadingUpdate}>
                        {loadingUpdate ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Actualizar contraseña</Text>}
                    </TouchableOpacity>
                </View>

                {esAdmin ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Seguridad de cuenta</Text>
                        <Text style={styles.infoText}>La cuenta administrador está protegida y no se puede eliminar para evitar pérdida de acceso al sistema.</Text>
                    </View>
                ) : (
                    <View style={styles.cardDanger}>
                        <Text style={styles.sectionTitle}>Eliminar cuenta</Text>
                        <Text style={styles.warningText}>Esta acción elimina tu cuenta de forma permanente.</Text>

                        <Text style={styles.label}>Confirma tu contraseña</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            value={deletePassword}
                            onChangeText={setDeletePassword}
                        />

                        <TouchableOpacity style={styles.dangerBtn} onPress={confirmarEliminacion} disabled={loadingDelete}>
                            {loadingDelete ? <ActivityIndicator color="#fff" /> : <Text style={styles.dangerBtnText}>Eliminar mi cuenta</Text>}
                        </TouchableOpacity>
                    </View>
                )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    content: { paddingVertical: 16, paddingBottom: 40 },
    wrapper: { width: '100%', alignSelf: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
    back: { color: '#2563EB', fontWeight: '600' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        elevation: 2,
    },
    cardDanger: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
    label: { color: '#334155', marginBottom: 4, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#F8FAFC',
        marginBottom: 12,
    },
    primaryBtn: {
        backgroundColor: '#2563EB',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
    warningText: { color: '#991B1B', marginBottom: 10 },
    infoText: { color: '#334155', marginBottom: 4 },
    dangerBtn: {
        backgroundColor: '#DC2626',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    dangerBtnText: { color: '#fff', fontWeight: '700' },
});

export default AjustesCuentaScreen;
