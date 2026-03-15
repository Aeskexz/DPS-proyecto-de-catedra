#  Sistema de Citas Médicas

Aplicación móvil cross-platform (React Native / Expo) con backend Node.js + Express + MySQL para gestionar citas médicas con roles de **administrador**, **médico** y **cliente (paciente)**.

---

##  Estructura del Proyecto

```
SistemaCitasMedicas/
 App.js                        # Punto de entrada React Native
 src/
    context/
       AuthContext.js        # Estado global de sesión (JWT + AsyncStorage)
    navigation/
       AppNavigator.js       # Navegación condicional por rol
    services/
       api.js                # Cliente Axios + servicios por entidad
    screens/
        auth/
           LoginScreen.js
           RegisterScreen.js
        cliente/
           ClienteDashboard.js
           NuevaCitaScreen.js
        medico/
           MedicoDashboard.js
           DetalleCitaMedico.js
        admin/
            AdminDashboard.js
            GestionMedicos.js
            RegistrarMedico.js
 backend/
     server.js                 # Servidor Express principal
     config/db.js              # Pool de conexiones MySQL
     middleware/auth.js        # JWT + control de roles
     routes/
        auth.js               # Login y registro
        citas.js              # CRUD de citas
        medicos.js            # Gestión de médicos
        especialidades.js     # Catálogo de especialidades
     .env.example              # Plantilla de variables de entorno
```

---

##  Cómo Arrancar el Proyecto

### 1. Base de Datos
Importa el script SQL en PhpMyAdmin (archivo `database.sql` en la raíz del repo).

### 2. Backend (Node.js)
```bash
cd backend
copy .env.example .env        # Windows
# Edita .env con tus credenciales de MySQL y JWT_SECRET
npm install
npm run dev                   # Inicia en http://localhost:3001
```

### 3. App React Native (Expo)
```bash
# Volver a la raíz del proyecto
npm start
# Escanea el QR con Expo Go (Android/iOS)
# o presiona 'w' para abrir en navegador
```

>  **Si pruebas en dispositivo físico**, cambia `localhost` por la IP de tu PC en `src/services/api.js`.

---

##  Distribución de Tareas del Equipo

###  Ya implementado (Rafael)
- Estructura completa del proyecto y backend funcional
- Autenticación JWT con bcrypt
- Control de roles (admin / médico / cliente)
- Pantallas: Login, Registro, Dashboards x3, NuevaCita, DetalleCita, GestionMedicos, RegistrarMedico
- Integración con Stored Procedures de la BD

---

###  Tareas Pendientes para Compañeros

####  Compañero A — Mejoras de UI/UX
| Archivo | Tarea |
|---|---|
| `LoginScreen.js` | Agregar logo de la clínica, mejorar paleta de colores corporativa |
| `RegisterScreen.js` | Integrar un `DatePicker` nativo para `fecha_nacimiento` |
| `NuevaCitaScreen.js` | Reemplazar TextInput de fecha/hora con `DatePicker` y `TimePicker` |
| `RegistrarMedico.js` | Convertir campo de especialidad en `Picker` (dropdown) |
| Todas las pantallas | Implementar modo oscuro / temas con `StyleSheet` global |

####  Compañero B — Funcionalidades de Cliente
| Archivo | Tarea |
|---|---|
| `ClienteDashboard.js` | Agregar botón "Cancelar Cita" llamando a `PUT /api/citas/:id/estado` |
| `ClienteDashboard.js` | Agregar filtro de citas por estado (tabs: Activas / Pasadas) |
| `NuevaCitaScreen.js` | Mostrar solo los horarios disponibles del médico seleccionado (requiere endpoint `GET /api/medicos/:id/slots?fecha=`) |
| `backend/routes/medicos.js` | Implementar `GET /api/medicos/:id/slots` para calcular horas libres |

####  Compañero C — Panel del Médico y Admin
| Archivo | Tarea |
|---|---|
| `MedicoDashboard.js` | Agregar filtro por fecha (hoy / semana) y contador de citas por estado |
| `DetalleCitaMedico.js` | Mostrar historial de citas previas del mismo paciente |
| `AdminDashboard.js` | Agregar pantalla de Auditoría (`GET /api/auditoria`) con log de acciones |
| `AdminDashboard.js` | Mostrar estadísticas: total citas, médicos activos, pacientes registrados |
| `GestionMedicos.js` | Pantalla de edición de datos del médico (`PUT /api/medicos/:id`) |
| `backend/routes/medicos.js` | Implementar `PUT /api/medicos/:id` para editar datos del médico |
| `backend/routes/` | Crear `routes/auditoria.js` con `GET /api/auditoria` (solo admin) |

---

##  Roles y Contraseñas por Defecto

| Rol | Descripción |
|---|---|
| **administrador** | Control total: gestiona médicos, ve todas las citas, puede eliminarlas |
| **médico** | Ve sus citas asignadas, puede confirmar/completar y agregar notas |
| **cliente** | Se registra, crea y consulta sus propias citas |

> El administrador inicial se crea directamente en la BD con el script SQL. Recuerda generar su hash bcrypt real antes de usarlo en producción.

---

##  Endpoints del API

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Todos | Iniciar sesión |
| POST | `/api/auth/register` | Público | Registrar nuevo paciente |
| GET | `/api/citas` | Todos | Lista de citas según rol |
| POST | `/api/citas` | Cliente | Crear nueva cita |
| PUT | `/api/citas/:id/estado` | Médico / Admin | Cambiar estado + notas |
| DELETE | `/api/citas/:id` | Admin | Eliminar cita (con auditoría) |
| GET | `/api/medicos` | Todos | Lista de médicos activos |
| GET | `/api/medicos/:id` | Todos | Detalle + horarios de un médico |
| POST | `/api/medicos` | Admin | Registrar nuevo médico |
| DELETE | `/api/medicos/:id` | Admin | Desactivar médico |
| GET | `/api/especialidades` | Todos | Catálogo de especialidades |

---

##  Licencia

Este proyecto está bajo la licencia **Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0)**.

[![CC BY-SA 4.0](https://licensebuttons.net/l/by-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-sa/4.0/)

### Permisos permitidos 
-  **Uso Comercial** - Úsalo con fines lucrativos
-  **Modificación** - Adapta y mejora el código
-  **Distribución** - Comparte el código original o modificado

### Condiciones requeridas 
-  **Atribución (BY)** - Debes citar la autoría original
-  **CompartirIgual (SA)** - Distribuye derivados bajo la misma licencia CC-BY-SA 4.0

 Documentación completa:
- [LICENSE](LICENSE) - Texto legal en inglés
- [LICENSE.es](LICENSE.es) - Texto legal en español
- [LICENCIAS.md](LICENCIAS.md) - Guía de implementación de CC

---

##  Gestión del Proyecto (Scrum/Kanban)

>  **[Tablero de Notion/Trello]** — *(Agrega aquí el enlace público al tablero)*

- **Product Owner:** [nombre]
- **Scrum Master:** [nombre]
- **Desarrolladores:** Rafael, Compañero A, Compañero B, Compañero C
