USE sistema_citas_medicas;

-- ============================================================
-- 1. ACTUALIZAR CONTRASEÑA DEL ADMINISTRADOR
-- Usuario: admin
-- Nueva contraseña: SoyAdministrador452503
-- ============================================================
UPDATE usuarios
SET password_hash = '$2a$12$NSHc.yCn5seyjkgx7.WZa.TOhYdX8Y1hyXRLJ.iM3WGcNA/X5GE7q'
WHERE username = 'admin';

-- ============================================================
-- 2. REGISTRAR MÉDICOS
-- Utilizando el stored procedure `sp_registrar_medico`
-- Parámetros: nombre, apellido, email, username, password_hash, id_especialidad, numero_colegiado, telefono
-- ============================================================

-- Médico 1: Carlos Torrez
-- Contraseña: Torrez23
CALL sp_registrar_medico(
    'Carlos', 
    'Torrez', 
    'carlos.torrez@citasmedicas.local', 
    'ctorrez', 
    '$2a$12$INiegX2OdSvAQCnQOK2QJOhjjUGz/lqoDnr4h8OIJ3pVaGgSc7iSi', 
    1, -- 1 = Medicina General (ajustable)
    'CM-00150', 
    '7000-1111'
);

-- Médico 2: Maria Esperanza
-- Contraseña: Ma23ranza01
CALL sp_registrar_medico(
    'Maria', 
    'Esperanza', 
    'maria.esperanza@citasmedicas.local', 
    'mesperanza', 
    '$2a$12$H4Hzlttb8SXO/i/2hAHQeuFbmeTQBWv7cwrO2IkfhSwXxrwPAMMIe', 
    2, -- 2 = Pediatría (ajustable)
    'CM-00151', 
    '7000-2222'
);
