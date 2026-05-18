import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
} from 'firebase/database';
import { database } from './firebase';

// CITAS

export const crearCita = async (citaData) => {
  try {
    const nuevaCitaRef = push(ref(database, 'citas'));
    const citaId = nuevaCitaRef.key;

    await set(nuevaCitaRef, {
      ...citaData,
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
    });

    return citaId;
  } catch (error) {
    console.error('Error creando cita:', error);
    throw error;
  }
};

export const obtenerCitas = async (clienteId = null) => {
  try {
    const citasRef = ref(database, 'citas');
    const snapshot = await get(citasRef);

    if (!snapshot.exists()) {
      return [];
    }

    const datos = snapshot.val();
    let citas = Object.entries(datos).map(([id, data]) => ({
      id,
      ...data,
    }));

    if (clienteId) {
      citas = citas.filter(cita => cita.clienteId === clienteId);
    }

    citas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return citas;
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    throw error;
  }
};

export const actualizarCita = async (citaId, datos) => {
  try {
    const citaRef = ref(database, `citas/${citaId}`);
    await update(citaRef, {
      ...datos,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error actualizando cita:', error);
    throw error;
  }
};

export const eliminarCita = async (citaId) => {
  try {
    const citaRef = ref(database, `citas/${citaId}`);
    await remove(citaRef);
  } catch (error) {
    console.error('Error eliminando cita:', error);
    throw error;
  }
};

// MEDICOS

export const crearMedico = async (medicoData) => {
  try {
    const nuevoMedicoRef = push(ref(database, 'medicos'));
    const medicoId = nuevoMedicoRef.key;

    await set(nuevoMedicoRef, {
      ...medicoData,
      createdAt: new Date().toISOString(),
    });

    return medicoId;
  } catch (error) {
    console.error('Error creando medico:', error);
    throw error;
  }
};

export const obtenerMedicos = async () => {
  try {
    const medicosRef = ref(database, 'medicos');
    const snapshot = await get(medicosRef);

    if (!snapshot.exists()) {
      return [];
    }

    const datos = snapshot.val();
    const medicos = Object.entries(datos).map(([id, data]) => ({
      id,
      ...data,
    }));

    return medicos;
  } catch (error) {
    console.error('Error obteniendo medicos:', error);
    throw error;
  }
};

export const actualizarMedico = async (medicoId, datos) => {
  try {
    const medicoRef = ref(database, `medicos/${medicoId}`);
    await update(medicoRef, datos);
  } catch (error) {
    console.error('Error actualizando medico:', error);
    throw error;
  }
};

export const eliminarMedico = async (medicoId) => {
  try {
    const medicoRef = ref(database, `medicos/${medicoId}`);
    await remove(medicoRef);
  } catch (error) {
    console.error('Error eliminando medico:', error);
    throw error;
  }
};

// USUARIOS

export const crearUsuario = async (uid, datos) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await set(userRef, {
      ...datos,
      createdAt: new Date().toISOString(),
    });
    return uid;
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }
};

export const obtenerUsuario = async (uid) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    return { uid, ...snapshot.val() };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    throw error;
  }
};

export const actualizarUsuario = async (uid, datos) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, datos);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    throw error;
  }
};

// ESCUCHADORES EN TIEMPO REAL

export const escucharCitas = (clienteId, callback) => {
  const citasRef = ref(database, 'citas');

  const unsub = onValue(citasRef, (snapshot) => {
    if (snapshot.exists()) {
      const datos = snapshot.val();
      let citas = Object.entries(datos).map(([id, data]) => ({
        id,
        ...data,
      }));

      if (clienteId) {
        citas = citas.filter(cita => cita.clienteId === clienteId);
      }

      callback(citas);
    } else {
      callback([]);
    }
  });

  return unsub;
};

export const escucharMedicos = (callback) => {
  const medicosRef = ref(database, 'medicos');

  const unsub = onValue(medicosRef, (snapshot) => {
    if (snapshot.exists()) {
      const datos = snapshot.val();
      const medicos = Object.entries(datos).map(([id, data]) => ({
        id,
        ...data,
      }));
      callback(medicos);
    } else {
      callback([]);
    }
  });

  return unsub;
};
