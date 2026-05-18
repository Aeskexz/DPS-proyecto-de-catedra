USE investigacion_descriptiva;

UPDATE admins
SET password = '$2a$12$NSHc.yCn5seyjkgx7.WZa.TOhYdX8Y1hyXRLJ.iM3WGcNA/X5GE7q'
WHERE username = 'admin';

INSERT INTO doctores (codigo_id, nombre, especialidad, email, username, password, disponible_consulta)
VALUES (
    'D-00150001',
    'Carlos Torrez',
    'Cardiologia',
    'carlos.torrez@citasmedicas.local',
    'ctorrez',
    '$2a$12$INiegX2OdSvAQCnQOK2QJOhjjUGz/lqoDnr4h8OIJ3pVaGgSc7iSi',
    1
);

INSERT INTO doctores (codigo_id, nombre, especialidad, email, username, password, disponible_consulta)
VALUES (
    'D-00150002',
    'Maria Esperanza',
    'Pediatria',
    'maria.esperanza@citasmedicas.local',
    'mesperanza',
    '$2a$12$H4Hzlttb8SXO/i/2hAHQeuFbmeTQBWv7cwrO2IkfhSwXxrwPAMMIe',
    1
);
