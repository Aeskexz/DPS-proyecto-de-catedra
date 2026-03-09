# Comparativa de Licencias Creative Commons para Proyectos

## 📊 Resumen General

Las **licencias Creative Commons (CC)** ofrecen cuatro elementos que puedes combinar:

| Elemento | Símbolo | Significado | Restricción |
|----------|---------|-------------|-------------|
| **Atribución** | BY | Debes citar al autor | Obligatorio en todas |
| **Compartir Igual** | SA | Derivados con misma licencia | Cálculo medio |
| **No Comercial** | NC | Sin uso comercial | Restricción moderada |
| **Sin Derivados** | ND | No se puede modificar | Restricción alta |

---

## 🎯 Las 6 Licencias CC Principales

### 1. **CC BY** — Atribución
```
Simbolo: [BY]
Permite: ✅ Comercial ✅ Derivados ✅ Compartir
Requiere: 🔗 Atribución
```
**Uso ideal para:**
- Fotografías
- Contenido educativo
- Artículos de blog
- Documentación

**Ejemplo:** Wikipedia usa CC-BY-SA (variante)

---

### 2. **CC BY-SA** — Atribución-CompartirIgual ⭐ **(ELEGIDA PARA ESTE PROYECTO)**
```
Símbolo: [BY-SA]
Permite: ✅ Comercial ✅ Derivados ✅ Compartir
Requiere: 🔗 Atribución + 🔄 CompartirIgual
```
**Uso ideal para:**
- **Proyectos de software abierto**
- Documentación técnica
- Bases de datos
- Contenido colaborativo
- Proyectos educativos

**Ventajas:**
- ✅ Promueve contribuciones comunitarias
- ✅ Las mejoras vuelven al proyecto
- ✅ Legal y clara
- ✅ Ideal para equipos

**Casos reales:**
- WordPress (CC BY-SA 4.0)
- Openstreetmap (ODbL - similar a CC BY-SA)
- Wikimedia (CC BY-SA 3.0)

---

### 3. **CC BY-NC** — Atribución-NoComercial
```
Símbolo: [BY-NC]
Permite: ✅ Derivados ✅ Compartir
Requiere: 🔗 Atribución | ❌ Sin uso comercial
```
**Uso ideal para:**
- Contenido personal/blog
- Trabajos artísticos
- Investigación académica
- Materiales educativos sin lucro

**Ventaja:** Protege contra explotación comercial

---

### 4. **CC BY-NC-SA** — Atribución-NoComercial-CompartirIgual
```
Símbolo: [BY-NC-SA]
Permite: ✅ Derivados ✅ Compartir
Requiere: 🔗 Atribución | 🔄 CompartirIgual | ❌ Sin comercial
```
**Uso ideal para:**
- Cursos online gratuitos
- Contenido educativo sin fines de lucro
- Proyectos comunitarios
- Recursos de código abierto académico

**Restricción clave:** Nadie puede lucrar con tu trabajo

---

### 5. **CC BY-ND** — Atribución-SinDerivados
```
Símbolo: [BY-ND]
Permite: ✅ Comercial ✅ Compartir
Requiere: 🔗 Atribución | ❌ Sin modificaciones
```
**Uso ideal para:**
- Contenido finalizado (ebooks, PDFs)
- Artículos publicados
- Obras de arte acabadas

**Restricción:** No se puede adaptar/modificar

---

### 6. **CC BY-NC-ND** — Atribución-NoComercial-SinDerivados
```
Símbolo: [BY-NC-ND]
Permite: ✅ Compartir
Requiere: 🔗 Atribución | ❌ Sin comercial | ❌ Sin derivados
```
**Uso ideal para:**
- Contenido muy específico
- Publicaciones protegidas
- Materiales con derechos de terceros

**Restricción Alta:** Solo se puede compartir sin cambios

---

## 🔍 Comparativa para Diferentes Proyectos

### Proyecto A: Software/Código Abierto
```
RECOMENDACIÓN: CC-BY-SA 4.0 ← (NUESTRO CASO)
RAZÓN: 
- Promueve contribuciones
- Las mejoras benefician a todos
- Evita que otros privaticen tu código
- Estándar en open source
```

### Proyecto B: Contenido Educativo Gratuito
```
RECOMENDACIÓN: CC-BY-NC-SA 4.0
RAZÓN:
- Protege de explotación comercial
- Mantiene acceso libre
- Ideal para instituciones educativas
```

### Proyecto C: Fotografía/Arte Personal
```
RECOMENDACIÓN: CC-BY-NC 4.0
RAZÓN:
- Protege tu obra
- Evita lucro sin permiso
- Permite adaptaciones educativas
```

### Proyecto D: Libro/E-book
```
RECOMENDACIÓN: CC-BY-ND 4.0
RAZÓN:
- Obra finalizada
- Se puede vender
- No se puede modificar (preserva integridad)
```

---

## ✅ ¿POR QUÉ CC-BY-SA 4.0 PARA ESTE PROYECTO?

```
✅ 1. PROPÓSITO EDUCATIVO
     - Sistema de Citas Médicas es proyecto de aprendizaje
     - Beneficia a estudiantes de desarrollo

✅ 2. COLABORACIÓN
     - Permite que compañeros mejoren el código
     - Fomenta contribuciones
     - Comunidad abierta

✅ 3. SOSTENIBILIDAD
     - Las mejoras vuelven al proyecto base
     - Evita fragmentación en forks privatizados
     - Asegura que el conocimiento sea compartido

✅ 4. TRANSPARENCIA
     - Todos saben qué pueden hacer
     - Sin sorpresas legales
     - Términos claros y justos

✅ 5. USO COMERCIAL PERMITIDO
     - Si quieres monetizar, ¡adelante!
     - Solo requiere atribución
     - Ideal si el proyecto crece
```

---

## 🔄 Flujo de Decisión

```
         ¿Código/Software?
              |
        ┌─────┼─────┐
        |           |
       SI          NO
        |           |
        |      ¿Fotografía/Arte?
        |      |
        |      +─→ CC-BY-NC
        |
    ¿Quieres evitar
    explotación
    comercial?
        |
    ┌───┼───┐
   SI   NO
    |    |
   CC   CC-BY-SA ← NUESTRO CASO
   BY-NC-SA
```

---

## 📋 Checklist: Implementar CC-BY-SA 4.0

- [ ] ✅ Archivo `LICENSE` con texto completo
- [ ] ✅ Archivo `LICENSE.es` en español
- [ ] ✅ `package.json` con campo `"license": "CC-BY-SA-4.0"`
- [ ] ✅ `README.md` con sección de licencia
- [ ] ✅ `LICENCIAS.md` con explicación
- [ ] ✅ `PLANTILLAS_LICENCIA.md` con ejemplos
- [ ] ✅ Este archivo: `LICENCIAS_COMPARATIVA.md`
- [ ] ⏳ Agregar headers en archivos principales
- [ ] ⏳ Crear NOTICE.md con lista de autores
- [ ] ⏳ Configurar CI/CD para verificar licencia

---

## 🌐 Recursos Útiles

### Sitios Oficiales
- **Creative Commons**: https://creativecommons.org
- **Elige Licencia**: https://choosealicense.com
- **CC Versiones**: https://creativecommons.org/about/cclicenses/

### Herramientas
- **CC License Generator**: https://creativecommons.org/choose/
- **SPDX Identifiers**: https://spdx.org/licenses/
- **License Compatibility**: https://creativecommons.org/compatiblelicenses/

### Validadores
- **GitHub License Detection**: Automático en GitHub
- **FOSSA**: https://fossa.com (análisis de licencias)
- **WhiteSource**: Escaneo de licencias en código

---

## ⚖️ Términos Legales Breves

| Licencia | English Name | Jurisdicción | URL |
|----------|---|---|---|
| CC BY | Attribution | Universal | https://creativecommons.org/licenses/by/4.0 |
| CC BY-SA | Attribution-ShareAlike | Universal | https://creativecommons.org/licenses/by-sa/4.0 |
| CC BY-NC | Attribution-NonCommercial | Universal | https://creativecommons.org/licenses/by-nc/4.0 |
| CC BY-NC-SA | Attribution-NonCommercial-ShareAlike | Universal | https://creativecommons.org/licenses/by-nc-sa/4.0 |
| CC BY-ND | Attribution-NoDerivatives | Universal | https://creativecommons.org/licenses/by-nd/4.0 |
| CC BY-NC-ND | Attribution-NonCommercial-NoDerivatives | Universal | https://creativecommons.org/licenses/by-nc-nd/4.0 |

---

## 🎓 Preguntas Frecuentes

**P: ¿Puedo cambiar la licencia después?**  
R: Parcialmente. Versiones anteriores permanecen bajo la licencia original. Nuevas versiones pueden tener otra licencia.

**P: ¿CC-BY-SA es compatible con MIT/Apache?**  
R: No completamente. Pero hay licencias compatibles listadas en https://creativecommons.org/compatiblelicenses/

**P: ¿Necesito registrar la licencia?**  
R: No. CC es automática una vez que publiques. Solo decláralo en tu README/LICENSE.

**P: ¿Qué pasa si alguien ignora la licencia?**  
R: Creative Commons tiene recursos legales, pero primero intenta negociar.

**P: ¿Puedo vender código bajo CC-BY-SA?**  
R: Sí, pero quien lo compre puede revenderlo. Si quieres exclusividad, usa un contrato separado.

---

**Última actualización:** Marzo 2026  
**Proyecto:** Sistema de Citas Médicas  
**Licencia:** CC-BY-SA 4.0 International  
**Enlace oficial:** https://creativecommons.org/licenses/by-sa/4.0/
