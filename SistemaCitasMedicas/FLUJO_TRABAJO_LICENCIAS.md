# 🔐 Guía de Implementación de Licencias - Flujo de Trabajo

## Control de Versiones y Licencias

Este documento explica cómo mantener las licencias Creative Commons en tu flujo de trabajo Git.

---

## 📌 Archivos de Licencia Principales

Todos estos archivos **DEBEN estar en la raíz del proyecto** y **NO deben ser modificados** (exceto NOTICE.md):

```
SistemaCitasMedicas/
├── LICENSE                      # CC-BY-SA 4.0 completo (Inglés)
├── LICENSE.es                   # CC-BY-SA 4.0 completo (Español)
├── NOTICE.md                    # Autores y dependencias
├── LICENCIAS.md                 # Guía de implementación
├── LICENCIAS_COMPARATIVA.md     # Comparativa de licencias
├── PLANTILLAS_LICENCIA.md       # Ejemplos de uso
└── package.json                 # Con "license": "CC-BY-SA-4.0"
```

---

## ✅ Checklist: Antes de Hacer Push

### 1. Verificar Archivos de Licencia
```bash
# Asegúrate de que existen los archivos
ls -la LICENSE LICENSE.es LICENCIAS.md package.json
```

### 2. Verificar Identificador SPDX
```bash
# En package.json, debe haber:
grep '"license"' package.json

# Resultado esperado:
# "license": "CC-BY-SA-4.0",
```

### 3. Verificar README
```bash
# El README debe tener una sección de licencia
grep -i "licencia\|license" README.md
```

### 4. Headers en Archivos Principales
```bash
# Archivos que DEBEN tener header:
# App.js, server.js, rutas principales

grep -l "LICENCIA\|LICENSE" App.js src/**/*.js backend/**/*.js
```

---

## 🔄 Proceso de Contribución

### Paso 1: Clonar el Repositorio
```bash
git clone <url-del-repo>
cd SistemaCitasMedicas
```

### Paso 2: Crear Rama Feature
```bash
git checkout -b feature/mi-mejora
```

### Paso 3: Hacer Cambios
```bash
# Edita archivos, agrega funcionalidad, etc.
```

### Paso 4: Agregar Licencia a Archivos Nuevos
```bash
# Si creas un archivo nuevo, agrégale esto al inicio:

/**
 * archivo-nuevo.js
 * Descripción breve
 * 
 * LICENCIA: CC-BY-SA 4.0
 * © 2024-2026 Sistema de Citas Médicas
 */

// TU CÓDIGO AQUÍ
```

### Paso 5: Commit
```bash
git add .
git commit -m "feat: agregué nueva funcionalidad bajo CC-BY-SA 4.0"
```

### Paso 6: Push
```bash
git push origin feature/mi-mejora
```

### Paso 7: Pull Request
- En la descripción, menciona que los cambios cumplen con CC-BY-SA 4.0
- Referencia los archivos LICENCIAS.md y PLANTILLAS_LICENCIA.md

---

## 🔧 Pre-commit Hook (Opcional)

Para verificar automáticamente que los archivos tengan la licencia:

### Crear archivo `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Pre-commit hook: Verificar licencias

echo "Verificando archivos de licencia..."

# Checkear que LICENSE existe
if [ ! -f LICENSE ]; then
    echo "❌ ERROR: Archivo LICENSE no encontrado"
    exit 1
fi

# Checkear package.json
if ! grep -q '"license": "CC-BY-SA-4.0"' package.json; then
    echo "⚠️  ADVERTENCIA: package.json no tiene license field correcto"
fi

# Checkear README
if ! grep -qi "licencia\|license" README.md; then
    echo "⚠️  ADVERTENCIA: README.md no menciona la licencia"
fi

echo "✅ Verificación completada"
exit 0
```

### Hacer ejecutable
```bash
chmod +x .git/hooks/pre-commit
```

---

## 📝 Actualizar NOTICE.md

Cuando se agreguen nuevos autores o cambios importantes:

```bash
# 1. Editar NOTICE.md
nano NOTICE.md

# 2. Agregar entrada en la tabla de contribuciones
# | Tu Nombre | Tu Rol | Tu Contribución | Fecha |

# 3. Commit
git add NOTICE.md
git commit -m "docs: actualizar NOTICE.md con nuevo contribuyente"
```

---

## 🔄 Flujo Completo: Ejemplo

### Escenario: Agregar nueva funcionalidad

```bash
# 1. Clonar y preparar
git clone https://github.com/usuario/SistemaCitasMedicas.git
cd SistemaCitasMedicas
git checkout -b feature/nueva-caracteristica

# 2. Crear nuevo archivo
cat > src/components/NuevoComponente.js << 'EOF'
/**
 * NuevoComponente.js
 * Mi nuevo componente
 * 
 * LICENCIA: CC-BY-SA 4.0
 * © 2024-2026 Sistema de Citas Médicas
 */

import React from 'react';

export default function NuevoComponente() {
  return <div>Mi componente</div>;
}
EOF

# 3. Verificar licencias (pre-commit hook)
npm run check-licenses  # si exists

# 4. Commit
git add .
git commit -m "feat: nuevo componente bajo CC-BY-SA 4.0"

# 5. Push
git push origin feature/nueva-caracteristica

# 6. Abrir PR y mencionar:
# "Este PR implementa [funcionalidad] bajo license CC-BY-SA 4.0.
#  Ver LICENCIAS.md para detalles."
```

---

## 🚨 Cosas a EVITAR

### ❌ NO HAGAS:

1. **Cambiar la licencia sin autorización**
   ```bash
   # ❌ INCORRECTO
   rm LICENSE
   echo "MIT License" > LICENSE
   ```

2. **Eliminar archivos de licencia**
   ```bash
   # ❌ INCORRECTO
   git rm LICENSE LICENSE.es
   ```

3. **Modificar contenido de LICENSE/LICENSE.es**
   ```bash
   # ❌ INCORRECTO
   echo "Mis términos personalizados" >> LICENSE
   ```

4. **Ignorar la licencia en archivos nuevos**
   ```bash
   // ❌ INCORRECTO - SIN LICENCIA
   function miFuncion() {}
   
   // ✅ CORRECTO - CON LICENCIA
   /**
    * LICENCIA: CC-BY-SA 4.0
    */
   function miFuncion() {}
   ```

5. **Usar otra licencia sin consenso**
   ```bash
   # ❌ INCORRECTO
   "license": "MIT"  // debería ser "CC-BY-SA-4.0"
   ```

---

## ✅ Cosas que SÍ DEBES HACER

### ✅ SÍ DEBES:

1. **Mantener archivos de licencia sincronizados**
   ```bash
   # Si actualizas la licencia, sincroniza todos
   LICENSE ← CANONICAL
   LICENSE.es ← MISMA VERSIÓN
   package.json ← "CC-BY-SA-4.0"
   README.md ← REFERENCIA AMBOS
   ```

2. **Documentar cambios importantes**
   ```bash
   # Actualizar NOTICE.md si:
   # - Se agrega nuevo autor
   # - Se cambia versión del proyecto
   # - Se agregan nuevas dependencias
   ```

3. **Respetar la licencia en derivados**
   ```bash
   # Si haces un fork, mantén CC-BY-SA 4.0
   # Si agregas código, también es CC-BY-SA 4.0
   # Si modificas, actualiza NOTICE.md
   ```

4. **Comunicar cambios de licencia**
   ```bash
   # Si ALGUNA VEZ necesitaras cambiar la licencia:
   # 1. Proponer en un issue del repo
   # 2. Obtener consenso de contribuyentes
   # 3. Documentar el cambio en CHANGELOG
   # 4. Mantener código antiguo bajo licencia anterior
   ```

---

## 📋 Comandos Útiles

### Verificar Licencia en Archivos
```bash
# Buscar archivos sin encabezado de licencia
find . -name "*.js" ! -exec grep -l "LICENCIA\|LICENSE" {} \;

# Contar archivos con licencia
find . -name "*.js" -exec grep -l "CC-BY-SA" {} \; | wc -l
```

### Ver Estado de Licencias
```bash
# En GitHub (automático):
# 1. Ve a: Insights > License
# 2. O mira el lado derecho del repo: "CC-BY-SA-4.0 License"

# O en terminal:
git log --pretty=format:"%h %s" --grep="licencia\|license"
```

### Validar Archivo LICENSE
```bash
# Verificar que el archivo está completo
wc -l LICENSE          # Debe tener ~350+ líneas
grep -c "Creative Commons" LICENSE  # Debe encontrar múltiples coincidencias
```

---

## 🔐 Proteger la Licencia

### En GitHub (Recomendado)

1. **Ir a Settings > Branches**
2. **Crear regla de protección para main:**
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Include administrators

3. **En el PR template** (crear `.github/pull_request_template.md`):
```markdown
## Licencia

- [ ] Entiendo que este proyecto está bajo CC-BY-SA 4.0
- [ ] Mi código será licensed bajo CC-BY-SA 4.0
- [ ] No cambio los archivos LICENSE o LICENSE.es
- [ ] Agregué headers de licencia a archivos nuevos (si aplica)
```

---

## 📚 Referencias Rápidas

| Tarea | Comando/Archivo |
|-------|-----------------|
| Ver licencia completa | `cat LICENSE` |
| Ver licencia en español | `cat LICENSE.es` |
| Ver guía de implementación | `cat LICENCIAS.md` |
| Ver comparativa de CC | `cat LICENCIAS_COMPARATIVA.md` |
| Ver plantillas | `cat PLANTILLAS_LICENCIA.md` |
| Ver autores | `cat NOTICE.md` |
| Verificar metadata | `grep license package.json` |

---

## 🎓 Educación del Equipo

### Para Nuevos Contribuyentes:

1. **Leer primero:**
   - LICENCIAS.md (5 min)
   - PLANTILLAS_LICENCIA.md (10 min)

2. **Entender:**
   - Qué significa CC-BY-SA 4.0
   - Por qué se eligió para este proyecto
   - Cómo atribuir correctamente

3. **Implementar:**
   - Agregar headers a archivos nuevos
   - Mantener archivo NOTICE.md actualizado
   - Respetar la licencia en todos los commits

---

## 📞 Soporte

Si tienes dudas sobre la licencia:

1. **Leer:** LICENCIAS_COMPARATIVA.md
2. **Consultar:** PLANTILLAS_LICENCIA.md
3. **Verificar:** NOTICE.md para ver ejemplos
4. **Preguntar:** Crear issue con etiqueta `[LICENCIA]`

---

**Última Actualización:** Marzo 2026  
**Versión:** 1.0  
**Licencia:** CC-BY-SA 4.0 International  
**Mantenedor:** Sistema de Citas Médicas Team
