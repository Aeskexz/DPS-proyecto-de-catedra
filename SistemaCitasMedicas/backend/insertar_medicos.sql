USE sistema_citas_medicas;

UPDATE usuarios
SET password_hash = '$2a$12$NSHc.yCn5seyjkgx7.WZa.TOhYdX8Y1hyXRLJ.iM3WGcNA/X5GE7q'
WHERE username = 'admin';

EXEC sp_registrar_medico
    'Carlos',
    'Torrez',
    'carlos.torrez@citasmedicas.local',
    'ctorrez',
    '$2a$12$INiegX2OdSvAQCnQOK2QJOhjjUGz/lqoDnr4h8OIJ3pVaGgSc7iSi',
    1,
    'CM-00150',
    '7000-1111';

EXEC sp_registrar_medico
    'Maria',
    'Esperanza',
    'maria.esperanza@citasmedicas.local',
    'mesperanza',
    '$2a$12$H4Hzlttb8SXO/i/2hAHQeuFbmeTQBWv7cwrO2IkfhSwXxrwPAMMIe',
    2,
    'CM-00151',
    '7000-2222';
