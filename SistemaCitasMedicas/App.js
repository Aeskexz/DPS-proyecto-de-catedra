// ============================================================
// App.js - Punto de entrada de la aplicación React Native
// ============================================================
// RESPONSABLE: Equipo Frontend / Integración
// ESTADO: Completo. Envuelve toda la app con el proveedor de Auth.
// ============================================================
//
// LICENCIA: Creative Commons Attribution-ShareAlike 4.0 International
// URL: https://creativecommons.org/licenses/by-sa/4.0/
//
// © 2024-2026 Sistema de Citas Médicas
// Proyecto educativo bajo CC-BY-SA 4.0
// 
// Bajo esta licencia puedes usar, modificar y distribuir
// siempre que: atribuyas la autoría original y compartas 
// derivados bajo la misma licencia.
// ============================================================

import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      {/* AppNavigator muestra Auth o la app según si hay sesión activa y el rol */}
      <AppNavigator />
    </AuthProvider>
  );
}
