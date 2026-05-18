import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
    ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, 
    useWindowDimensions,
} from 'react-native';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { actualizarUsuario } from '../../services/firestore-crud';
import { getResponsive } from '../../utils/responsive';
import { ref, remove } from 'firebase/database';
import { database } from '../../services/firebase';

const AjustesCuentaScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();
    const { horizontalPadding, contentMaxWidth } = getResponsive(width);
    
    const colorPrincipal = user?.rol === 'medico' ? '#166534' : '#2563EB';
    const esAdmin = user?.rol === 'administrador';

    const [nombre, setNombre] = useState(user?.nombre || user?.displayName || '');
    const [apellido, setApellido] = useState(user?.apellido || '');

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
        if (!nombre.trim() || !apellido.trim()) {
            return showMessage('Campos requeridos', 'Nombre y apellido son obligatorios.');
        }

        setLoadingUpdate(true);
        try {
            const firebaseUser = auth.currentUser;
            if (firebaseUser) {
                await updateProfile(firebaseUser, {
                    displayName: `${nombre.trim()} ${apellido.trim()}`
                });
            }

            if (user?.uid) {
                await actualizarUsuario(user.uid, {
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    displayName: `${nombre.trim()} ${apellido.trim()}`,
                });
            }

            showMessage('Exito', 'Tus datos fueron actualizados correctamente.');
        } catch (error) {
            showMessage('Error', error.message);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleCambiarPassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return showMessage('Campos requeridos', 'Completa todos los campos de contrasena.');
        }
        if (newPassword.length < 6) {
            return showMessage('Contrasena corta', 'La nueva contrasena debe tener al menos 6 caracteres.');
        }
        if (newPassword !== confirmNewPassword) {
            return showMessage('Error', 'Las nuevas contrasenas no coinciden.');
        }

        setLoadingUpdate(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) throw new Error('No hay sesion activa');

            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPassword);

            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            showMessage('Exito', 'Tu contrasena fue actualizada.');
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                msg = 'La contrasena actual es incorrecta.';
            }
            showMessage('Error', msg);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const confirmarEliminacion = () => {
        const ejecutar = async () => {
            if (!deletePassword) return showMessage('Seguridad', 'Ingresa tu contrasena para confirmar.');
            setLoadingDelete(true);
            try {
                const firebaseUser = auth.currentUser;
                if (!firebaseUser) throw new Error('No hay sesion activa');

                const credential = EmailAuthProvider.credential(firebaseUser.email, deletePassword);
                await reauthenticateWithCredential(firebaseUser, credential);

                if (user?.uid) {
                    const userRef = ref(database, `users/${user.uid}`);
                    await remove(userRef);
                }

                await deleteUser(firebaseUser);
                await logout();
                showMessage('Adios', 'Cuenta eliminada correctamente.');
            } catch (error) {
                let msg = error.message;
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    msg = 'Contrasena incorrecta.';
                }
                showMessage('Error', msg);
            } finally {
                setLoadingDelete(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Seguro que deseas eliminar tu cuenta? Esta accion no se puede deshacer.')) ejecutar();
            return;
        }

        Alert.alert(
            'Eliminar cuenta',
            'Seguro que deseas eliminar tu cuenta? Esta accion no se puede deshacer.',
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
                            <Text style={styles.subtitle}>Gestiona tu informacion personal</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Text style={[styles.backText, { color: colorPrincipal }]}>Volver</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: colorPrincipal }]}>Datos de perfil</Text>
                        
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />

                        <Text style={styles.label}>Apellido</Text>
                        <TextInput style={styles.input} value={apellido} onChangeText={setApellido} placeholder="Tu apellido" />

                        <TouchableOpacity 
                            style={[styles.primaryBtn, { backgroundColor: colorPrincipal }]} 
                            onPress={handleActualizarDatos} 
                            disabled={loadingUpdate}
                        >
                            {loadingUpdate ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar Cambios</Text>}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <Text style={[styles.sectionTitle, { color: colorPrincipal }]}>Cambiar contrasena</Text>
                        
                        <Text style={styles.label}>Contrasena actual</Text>
                        <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="--------" />

                        <Text style={styles.label}>Nueva contrasena</Text>
                        <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Minimo 6 caracteres" />

                        <Text style={styles.label}>Confirmar nueva contrasena</Text>
                        <TextInput style={styles.input} secureTextEntry value={confirmNewPassword} onChangeText={setConfirmNewPassword} placeholder="Repite la contrasena" />

                        <TouchableOpacity 
                            style={[styles.primaryBtn, { backgroundColor: colorPrincipal }]} 
                            onPress={handleCambiarPassword} 
                            disabled={loadingUpdate}
                        >
                            {loadingUpdate ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Actualizar Contrasena</Text>}
                        </TouchableOpacity>
                    </View>

                    {esAdmin ? (
                        <View style={styles.cardInfo}>
                            <Text style={styles.sectionTitle}>Seguridad de Admin</Text>
                            <Text style={styles.infoText}>Esta cuenta tiene privilegios de administrador y no puede ser eliminada para garantizar la gestion del sistema.</Text>
                        </View>
                    ) : (
                        <View style={styles.cardDanger}>
                            <Text style={styles.dangerTitle}>Zona de peligro</Text>
                            <Text style={styles.warningText}>Una vez eliminada la cuenta, no hay marcha atras. Se borraran todas tus citas y registros.</Text>

                            <Text style={styles.label}>Contrasena de confirmacion</Text>
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
