# Sistema de Actualizaciones con Firebase

Este sistema permite actualizar automáticamente la aplicación móvil usando Firebase Storage y Firestore.

## 📋 Configuración Inicial

### 1. Configurar Firestore

1. Ejecuta el script de configuración:
```bash
node firebase-config/firestore-setup.js
```

2. Aplica las reglas de seguridad:
   - Ve a [Firebase Console](https://console.firebase.google.com)
   - Selecciona tu proyecto
   - Ve a **Firestore Database > Rules**
   - Copia y pega el contenido de `firestore-rules.txt`
   - Haz clic en **Publicar**

### 2. Configurar Firebase Storage

1. Aplica las reglas de seguridad:
   - Ve a [Firebase Console](https://console.firebase.google.com)
   - Selecciona tu proyecto
   - Ve a **Storage > Rules**
   - Copia y pega el contenido de `storage-rules.txt`
   - Haz clic en **Publicar**

2. Crea la carpeta `apks` en Storage (se creará automáticamente al subir el primer APK)

## 🚀 Uso del Sistema

### Para Desarrolladores

1. **Generar nueva versión:**
```bash
# Construir la aplicación
npm run build:android

# Subir automáticamente a Firebase
node scripts/auto-deploy-firebase.js
```

2. **Subir manualmente:**
```bash
# Editar la versión en auto-deploy-firebase.js
# Ejecutar el script
node scripts/auto-deploy-firebase.js
```

### Para Usuarios

- La aplicación verificará automáticamente actualizaciones cada 5 minutos
- Se mostrará un modal cuando haya una actualización disponible
- Los usuarios pueden descargar e instalar la actualización desde la app

## 📁 Estructura de Archivos

```
firebase-config/
├── firestore-setup.js     # Script de configuración inicial
├── firestore-rules.txt    # Reglas de seguridad para Firestore
├── storage-rules.txt      # Reglas de seguridad para Storage
└── README.md             # Esta documentación

scripts/
└── auto-deploy-firebase.js # Script de despliegue automático

src/
├── services/
│   └── UpdateService.js   # Servicio de actualizaciones
└── components/
    └── UpdateModal.js     # Modal de actualización
```

## 🔧 Configuración de Firebase

### Documento Firestore: `appConfig/version`

```json
{
  "version": "1.2.0",
  "buildNumber": 68,
  "releaseDate": "2024-01-15T10:30:00Z",
  "notes": "Nueva funcionalidad agregada",
  "apkPath": "apks/namustock-v1.2.0.apk",
  "mandatory": false,
  "minSupportedVersion": "1.0.0",
  "downloadUrl": "https://...",
  "fileSize": 25600000,
  "checksum": "sha256-hash",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Firebase Storage: `/apks/`

- `namustock-v1.1.67.apk`
- `namustock-v1.2.0.apk`
- `namustock-v1.2.1.apk`

## 🔒 Seguridad

- **Firestore**: Solo lectura pública para `appConfig/version`
- **Storage**: Solo lectura pública para carpeta `apks/`
- **Escritura**: Solo mediante Admin SDK (scripts de despliegue)

## 🐛 Solución de Problemas

### Error: "No se puede descargar la actualización"
- Verificar que el APK existe en Firebase Storage
- Verificar que las reglas de Storage permiten lectura pública
- Verificar la conexión a internet

### Error: "No se puede verificar actualizaciones"
- Verificar que el documento `appConfig/version` existe en Firestore
- Verificar que las reglas de Firestore permiten lectura pública
- Verificar la configuración de Firebase en la app

### Error: "No se puede instalar la actualización"
- Verificar que la app tiene permisos para instalar APKs
- Verificar que el archivo descargado no está corrupto
- Verificar que hay suficiente espacio en el dispositivo

## 📱 Flujo de Actualización

1. **Verificación**: La app verifica cada 5 minutos si hay actualizaciones
2. **Comparación**: Compara la versión actual con la de Firebase
3. **Notificación**: Muestra modal si hay actualización disponible
4. **Descarga**: Usuario inicia descarga del APK
5. **Instalación**: Se abre el instalador del sistema Android
6. **Completado**: Usuario confirma instalación

## 🔄 Versionado

- **Formato**: `MAJOR.MINOR.PATCH` (ej: 1.2.0)
- **Build Number**: Número incremental (ej: 68)
- **Comparación**: Se usa comparación semántica de versiones

## 📊 Monitoreo

- Los eventos de actualización se registran en la consola del navegador
- Se pueden agregar analytics para monitorear el uso del sistema
- Firebase Console muestra estadísticas de descargas de Storage