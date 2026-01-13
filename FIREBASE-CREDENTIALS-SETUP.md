# 🔑 Configuración de Credenciales de Firebase para Deploy Automático

## Pasos para Habilitar Subida Automática Completa

### 1. Descargar Credenciales de Servicio

1. Ve a Firebase Console:
   ```
   https://console.firebase.google.com/project/namu-inv/settings/serviceaccounts/adminsdk
   ```

2. Haz clic en "Generate New Private Key" (Generar nueva clave privada)

3. Se descargará un archivo JSON similar a: `namu-inv-firebase-adminsdk-xxxxx.json`

4. **IMPORTANTE**: Renombra el archivo a: `firebase-credentials.json`

5. Mueve el archivo a la raíz de tu proyecto:
   ```
   c:\Users\Gordo\Desktop\namustock-app\firebase-credentials.json
   ```

### 2. Agregar al .gitignore

Asegúrate de que este archivo **NUNCA** se suba a Git:

```bash
# En .gitignore, agrega:
firebase-credentials.json
*-adminsdk-*.json
```

### 3. Usar el Deploy Automatizado

Una vez configurado, ejecuta:

```bash
npm run firebase:auto
```

¡Y todo se subirá automáticamente! 🚀

## ⚠️ Seguridad

- **NUNCA** compartas el archivo de credenciales
- **NUNCA** lo subas a Git
- Mantenlo seguro en tu computadora local
- Es como una contraseña maestra de tu proyecto Firebase

## ✅ Verificación

Después de agregar las credenciales, el script:
- ✅ Detectará automáticamente las credenciales
- ✅ Subirá el APK sin intervención manual
- ✅ Actualizará Firestore automáticamente
- ✅ Todo en un solo comando

## 🎯 Resultado

Antes: 10 pasos manuales
Ahora: 1 comando → `npm run firebase:auto`
