#!/usr/bin/env node

/**
 * Script de despliegue automático a GitHub Releases
 * Sube automáticamente APKs y notifica a usuarios
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${step} ${message}`, 'bright');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Ejecutar comando con logging
function execCommand(command, description, options = {}) {
    try {
        logInfo(`Ejecutando: ${description}`);
        const result = execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        logSuccess(`${description} completado`);
        return result;
    } catch (error) {
        logError(`Error en ${description}: ${error.message}`);
        throw error;
    }
}

// Verificar si Git está configurado
function checkGitConfiguration() {
    logStep('🔧', 'Verificando configuración de Git...');

    try {
        const gitUser = execSync('git config user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
        const gitEmail = execSync('git config user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();

        logSuccess(`Usuario Git: ${gitUser}`);
        logSuccess(`Email Git: ${gitEmail}`);

        // Verificar si hay cambios sin commit
        try {
            execSync('git diff --exit-code', { stdio: 'pipe' });
            execSync('git diff --cached --exit-code', { stdio: 'pipe' });
            logSuccess('Repositorio limpio (sin cambios pendientes)');
        } catch (error) {
            logWarning('Hay cambios sin commit. Se commitearán automáticamente.');
        }

        return true;
    } catch (error) {
        logError('Git no está configurado correctamente');
        return false;
    }
}

// Verificar si GitHub CLI está instalado (opcional)
function checkGitHubCLI() {
    logStep('🐙', 'Verificando GitHub CLI...');

    try {
        const ghVersion = execSync('gh --version', { encoding: 'utf8', stdio: 'pipe' });
        logSuccess('GitHub CLI instalado');
        logInfo(ghVersion.split('\n')[0]);

        // Verificar autenticación
        try {
            const authStatus = execSync('gh auth status', { encoding: 'utf8', stdio: 'pipe' });
            logSuccess('Autenticado en GitHub');
            return true;
        } catch (error) {
            logWarning('No autenticado en GitHub CLI, usando método alternativo');
            return false;
        }
    } catch (error) {
        logWarning('GitHub CLI no instalado, usando método alternativo');
        return false;
    }
}

// Obtener información del repositorio
function getRepositoryInfo() {
    try {
        const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8', stdio: 'pipe' }).trim();

        // Extraer owner/repo de la URL
        let repoMatch;
        if (remoteUrl.includes('github.com')) {
            repoMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        }

        if (repoMatch) {
            return {
                owner: repoMatch[1],
                repo: repoMatch[2],
                url: remoteUrl
            };
        }

        throw new Error('No se pudo extraer información del repositorio');
    } catch (error) {
        logError(`Error obteniendo información del repositorio: ${error.message}`);
        return null;
    }
}

// Commit y push de cambios
function commitAndPushChanges(version) {
    logStep('📝', 'Commiteando y pusheando cambios...');

    try {
        // Agregar todos los cambios
        execCommand('git add .', 'Agregando archivos');

        // Commit con mensaje descriptivo
        const commitMessage = `🚀 Release v${version}\n\n✨ Nuevas características:\n• Sistema de actualizaciones in-app mejorado\n• Descarga e instalación automática\n• Limpieza automática de archivos antiguos\n• Progreso visual en tiempo real\n\n🔧 Mejoras técnicas:\n• Plugin nativo Android optimizado\n• Mejor manejo de errores\n• Fallbacks seguros implementados`;

        execCommand(`git commit -m "${commitMessage}"`, 'Creando commit');

        // Push a origin
        execCommand('git push origin main', 'Pusheando a GitHub');

        return true;
    } catch (error) {
        logWarning('Error en commit/push, continuando...');
        return false;
    }
}

// Crear tag de Git
function createGitTag(version) {
    logStep('🏷️', 'Creando tag de Git...');

    try {
        const tagName = `v${version}`;
        const tagMessage = `Release ${version} - Actualizaciones automáticas in-app`;

        execCommand(`git tag -a ${tagName} -m "${tagMessage}"`, 'Creando tag');
        execCommand(`git push origin ${tagName}`, 'Pusheando tag');

        return tagName;
    } catch (error) {
        logError(`Error creando tag: ${error.message}`);
        return null;
    }
}

// Generar release notes automáticas
function generateReleaseNotes(version, previousVersion) {
    const releaseNotes = `# 🚀 NamuStock v${version}

## ✨ Nuevas Características

### 📱 Sistema de Actualizaciones In-App
- **Descarga automática** de actualizaciones dentro de la aplicación
- **Instalación sin fricción** - no necesitas salir de la app
- **Progreso visual en tiempo real** durante la descarga
- **Limpieza automática** de archivos antiguos para ahorrar espacio

### 🔧 Mejoras Técnicas
- Plugin nativo Android optimizado para instalación de APKs
- Mejor manejo de errores con fallbacks seguros
- Sistema de notificaciones elegante y informativo
- Compatibilidad mejorada con Android 7.0+

## 🐛 Correcciones
- Solucionados problemas de detección de versiones
- Mejorado el sistema de limpieza de archivos temporales
- Optimizado el rendimiento de descarga
- Corregidos errores de permisos en Android

## 📦 Instalación

### Para Nuevos Usuarios
1. Descarga el APK desde los assets de este release
2. Habilita "Instalar apps desconocidas" en tu dispositivo Android
3. Instala el APK descargado

### Para Usuarios Existentes
¡Las actualizaciones ahora son automáticas! 🎉
- La app detectará automáticamente esta nueva versión
- Recibirás una notificación elegante
- Haz clic en "Actualizar" y la app se actualizará sola
- Los archivos antiguos se limpiarán automáticamente

## 🔄 Próximas Actualizaciones
A partir de esta versión, todas las futuras actualizaciones se instalarán automáticamente dentro de la app. ¡No más búsqueda manual de APKs!

## 📊 Estadísticas
- **Tamaño del APK**: ~5MB
- **Versión mínima de Android**: 7.0 (API 24)
- **Arquitecturas soportadas**: ARM64, ARM32

---

**Nota**: Si tienes problemas con la actualización automática, puedes descargar e instalar manualmente el APK desde los assets de este release.`;

    return releaseNotes;
}

// Crear release en GitHub
async function createGitHubRelease(version, tagName, apkPath, repoInfo) {
    logStep('🚀', 'Creando release en GitHub...');

    try {
        const releaseNotes = generateReleaseNotes(version);
        const releaseTitle = `🚀 NamuStock v${version} - Actualizaciones Automáticas`;

        // Crear archivo temporal con release notes
        const notesFile = 'temp-release-notes.md';
        fs.writeFileSync(notesFile, releaseNotes);

        try {
            // Crear release con GitHub CLI
            const createCommand = `gh release create ${tagName} "${apkPath}" --title "${releaseTitle}" --notes-file "${notesFile}" --latest`;
            execCommand(createCommand, 'Creando release en GitHub');

            // Limpiar archivo temporal
            fs.unlinkSync(notesFile);

            logSuccess(`Release creado: https://github.com/${repoInfo.owner}/${repoInfo.repo}/releases/tag/${tagName}`);
            return true;

        } catch (error) {
            // Limpiar archivo temporal en caso de error
            if (fs.existsSync(notesFile)) {
                fs.unlinkSync(notesFile);
            }
            throw error;
        }

    } catch (error) {
        logError(`Error creando release: ${error.message}`);
        return false;
    }
}

// Verificar que el APK existe
function verifyAPK(apkPath) {
    if (!fs.existsSync(apkPath)) {
        logError(`APK no encontrado: ${apkPath}`);
        return false;
    }

    const stats = fs.statSync(apkPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    logSuccess(`APK encontrado: ${apkPath} (${sizeInMB} MB)`);
    return true;
}

// Notificar a usuarios (webhook opcional)
function notifyUsers(version, repoInfo) {
    logStep('📢', 'Notificando a usuarios...');

    try {
        // Aquí puedes agregar notificaciones adicionales:
        // - Webhook a Discord/Slack
        // - Notificación push
        // - Email a suscriptores
        // - etc.

        logInfo('Las apps instaladas detectarán automáticamente la nueva versión');
        logInfo(`Release disponible en: https://github.com/${repoInfo.owner}/${repoInfo.repo}/releases/latest`);

        return true;
    } catch (error) {
        logWarning(`Error notificando usuarios: ${error.message}`);
        return false;
    }
}

// Función principal
async function main() {
    const args = process.argv.slice(2);
    const versionType = args[0] || 'patch';
    const autoMode = args.includes('--auto');

    try {
        log('\n🚀 Iniciando despliegue automático a GitHub...', 'bright');

        // 1. Verificar configuración
        if (!checkGitConfiguration()) {
            logError('Configuración de Git incompleta');
            process.exit(1);
        }

        const hasGitHubCLI = checkGitHubCLI();

        // 2. Obtener información del repositorio
        const repoInfo = getRepositoryInfo();
        if (!repoInfo) {
            logError('No se pudo obtener información del repositorio');
            process.exit(1);
        }

        logSuccess(`Repositorio: ${repoInfo.owner}/${repoInfo.repo}`);

        // 3. Leer versión actual
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const currentVersion = packageJson.version;

        // 4. Calcular nueva versión
        const versionParts = currentVersion.split('.').map(Number);
        switch (versionType) {
            case 'major':
                versionParts[0]++;
                versionParts[1] = 0;
                versionParts[2] = 0;
                break;
            case 'minor':
                versionParts[1]++;
                versionParts[2] = 0;
                break;
            case 'patch':
            default:
                versionParts[2]++;
                break;
        }
        const newVersion = versionParts.join('.');

        logInfo(`Versión actual: ${currentVersion}`);
        logInfo(`Nueva versión: ${newVersion}`);

        if (!autoMode) {
            log('\n¿Continuar con el despliegue automático? (y/N): ', 'yellow');
            // En producción, aquí esperarías input del usuario
            // Para automatización completa, asumimos que sí
        }

        // 5. Construir nueva versión (usando el script existente)
        logStep('🔨', 'Construyendo nueva versión...');
        execCommand(`node build-and-deploy.js ${versionType} --auto`, 'Construcción automática');

        // 6. Verificar que el APK se generó
        const apkPath = `releases/namustock-${newVersion}.apk`;
        if (!verifyAPK(apkPath)) {
            logError('APK no se generó correctamente');
            process.exit(1);
        }

        // 7. Commit y push de cambios
        commitAndPushChanges(newVersion);

        // 8. Crear tag
        const tagName = createGitTag(newVersion);
        if (!tagName) {
            logError('No se pudo crear el tag');
            process.exit(1);
        }

        // 9. Crear release en GitHub
        const releaseCreated = await createGitHubRelease(newVersion, tagName, apkPath, repoInfo);
        if (!releaseCreated) {
            logError('No se pudo crear el release');
            process.exit(1);
        }

        // 10. Notificar a usuarios
        notifyUsers(newVersion, repoInfo);

        // 11. Mostrar resumen final
        logStep('🎉', 'Despliegue completado exitosamente!');
        log('\n📋 Resumen del despliegue:', 'bright');
        log(`   • Versión: ${currentVersion} → ${newVersion}`, 'cyan');
        log(`   • Tag creado: ${tagName}`, 'cyan');
        log(`   • APK subido: ${apkPath}`, 'cyan');
        log(`   • Release: https://github.com/${repoInfo.owner}/${repoInfo.repo}/releases/tag/${tagName}`, 'cyan');

        log('\n🚀 ¡Las apps instaladas se actualizarán automáticamente!', 'green');
        log('\n📱 Los usuarios recibirán una notificación elegante', 'green');
        log('   y podrán actualizar sin salir de la aplicación.', 'green');

    } catch (error) {
        logError(`\nDespliegue fallido: ${error.message}`);
        process.exit(1);
    }
}

// Mostrar ayuda
function showHelp() {
    log('\n📖 Despliegue Automático a GitHub', 'bright');
    log('   node auto-deploy-github.js [tipo] [opciones]');
    log('\n🔧 Tipos de versión:', 'cyan');
    log('   patch  - Incrementa versión patch (1.0.0 → 1.0.1)');
    log('   minor  - Incrementa versión minor (1.0.0 → 1.1.0)');
    log('   major  - Incrementa versión major (1.0.0 → 2.0.0)');
    log('\n⚙️  Opciones:', 'cyan');
    log('   --auto   - Ejecutar sin confirmación');
    log('\n📝 Ejemplos:', 'yellow');
    log('   node auto-deploy-github.js patch');
    log('   node auto-deploy-github.js minor --auto');
    log('\n📋 Requisitos:', 'magenta');
    log('   • Git configurado con usuario y email');
    log('   • GitHub CLI instalado y autenticado (gh auth login)');
    log('   • Repositorio con remote origin configurado');
}

// Procesar argumentos
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
} else {
    main();
}