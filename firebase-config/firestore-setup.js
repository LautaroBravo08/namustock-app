// Script para configurar la estructura inicial de Firestore para el sistema de actualizaciones
// Ejecutar este script una vez para crear el documento de configuración

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuración de Firebase (reemplazar con tus credenciales)
const firebaseConfig = {
    // Tu configuración de Firebase aquí
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "tu-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para configurar el documento de versión inicial
async function setupVersionDocument() {
    try {
        const versionDoc = doc(db, 'appConfig', 'version');
        
        const initialVersionData = {
            version: '1.1.67', // Versión actual de la app
            buildNumber: 67,
            releaseDate: new Date().toISOString(),
            notes: 'Versión inicial del sistema de actualizaciones con Firebase',
            apkPath: 'apks/namustock-v1.1.67.apk', // Ruta en Firebase Storage
            mandatory: false, // Si la actualización es obligatoria
            minSupportedVersion: '1.0.0', // Versión mínima soportada
            downloadUrl: '', // Se generará automáticamente
            fileSize: 0, // Tamaño del archivo en bytes
            checksum: '', // Hash del archivo para verificar integridad
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await setDoc(versionDoc, initialVersionData);
        console.log('✅ Documento de versión creado exitosamente');
        console.log('📄 Datos:', initialVersionData);
        
    } catch (error) {
        console.error('❌ Error al crear documento de versión:', error);
    }
}

// Función para actualizar la versión (usar cuando se suba una nueva versión)
async function updateVersion(newVersionData) {
    try {
        const versionDoc = doc(db, 'appConfig', 'version');
        
        const updateData = {
            ...newVersionData,
            updatedAt: new Date().toISOString()
        };

        await setDoc(versionDoc, updateData, { merge: true });
        console.log('✅ Versión actualizada exitosamente');
        console.log('📄 Nuevos datos:', updateData);
        
    } catch (error) {
        console.error('❌ Error al actualizar versión:', error);
    }
}

// Ejecutar configuración inicial
setupVersionDocument();

// Ejemplo de cómo actualizar a una nueva versión:
/*
updateVersion({
    version: '1.2.0',
    buildNumber: 68,
    releaseDate: new Date().toISOString(),
    notes: 'Nueva funcionalidad agregada:\n- Mejoras en la interfaz\n- Corrección de errores\n- Optimizaciones de rendimiento',
    apkPath: 'apks/namustock-v1.2.0.apk',
    mandatory: false,
    fileSize: 25600000, // 25.6 MB
    checksum: 'sha256-hash-del-archivo'
});
*/

export { setupVersionDocument, updateVersion };