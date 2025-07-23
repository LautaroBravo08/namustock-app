// Gestor de releases automático para GitHub
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config/app.config.js');
const VersionManager = require('./version-manager.js');

class ReleaseManager {
  constructor() {
    this.versionManager = new VersionManager();
    this.repoPath = path.join(__dirname, '..');
  }

  // Verificar si git está configurado
  checkGitSetup() {
    try {
      execSync('git --version', { stdio: 'pipe' });
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      console.log(`✅ Git configurado correctamente`);
      console.log(`   Repositorio: ${remoteUrl}`);
      return true;
    } catch (error) {
      console.error(`❌ Git no está configurado correctamente: ${error.message}`);
      return false;
    }
  }

  // Verificar estado del repositorio
  checkRepoStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      console.log(`📍 Rama actual: ${currentBranch}`);
      
      if (status.trim()) {
        console.log(`⚠️  Cambios pendientes detectados:`);
        console.log(status);
        return { hasChanges: true, branch: currentBranch };
      } else {
        console.log(`✅ Repositorio limpio`);
        return { hasChanges: false, branch: currentBranch };
      }
    } catch (error) {
      console.error(`❌ Error verificando estado del repositorio: ${error.message}`);
      return { hasChanges: false, branch: 'unknown' };
    }
  }

  // Ejecutar tests
  runTests() {
    try {
      console.log(`🧪 Ejecutando tests...`);
      execSync('npm test -- --watchAll=false --passWithNoTests', { stdio: 'inherit' });
      console.log(`✅ Tests completados exitosamente`);
      return true;
    } catch (error) {
      console.error(`❌ Tests fallaron: ${error.message}`);
      return false;
    }
  }

  // Build de producción
  buildProduction() {
    try {
      console.log(`🏗️  Creando build de producción...`);
      execSync('npm run build', { stdio: 'inherit' });
      console.log(`✅ Build completado exitosamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error durante el build: ${error.message}`);
      return false;
    }
  }

  // Sincronizar con Capacitor
  syncCapacitor() {
    try {
      console.log(`📱 Sincronizando con Capacitor...`);
      execSync('npx cap sync', { stdio: 'inherit' });
      console.log(`✅ Capacitor sincronizado exitosamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error sincronizando Capacitor: ${error.message}`);
      return false;
    }
  }

  // Crear commit y tag
  createCommitAndTag(version) {
    try {
      console.log(`📝 Creando commit y tag para v${version}...`);
      
      // Agregar todos los cambios
      execSync('git add .', { stdio: 'pipe' });
      
      // Crear commit
      const commitMessage = `🚀 Release v${version}\n\n- Versión actualizada automáticamente\n- Build de producción incluido\n- Configuraciones actualizadas`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      
      // Crear tag
      const tagMessage = `Release version ${version}`;
      execSync(`git tag -a v${version} -m "${tagMessage}"`, { stdio: 'pipe' });
      
      console.log(`✅ Commit y tag v${version} creados`);
      return true;
    } catch (error) {
      console.error(`❌ Error creando commit/tag: ${error.message}`);
      return false;
    }
  }

  // Push al repositorio
  pushToRepository() {
    try {
      console.log(`⬆️  Subiendo cambios al repositorio...`);
      
      // Push de commits
      execSync('git push origin HEAD', { stdio: 'inherit' });
      
      // Push de tags
      execSync('git push --tags', { stdio: 'inherit' });
      
      console.log(`✅ Cambios subidos exitosamente`);
      return true;
    } catch (error) {
      console.error(`❌ Error subiendo cambios: ${error.message}`);
      return false;
    }
  }

  // Generar notas de release
  generateReleaseNotes(version, oldVersion) {
    const versionInfo = this.versionManager.getCurrentVersionInfo();
    
    const notes = `## 🚀 Nueva versión ${version}

### ✨ Características principales
${versionInfo.features.map(feature => `- ${feature}`).join('\n')}

### 📱 Descargas
- **Android APK**: [Descargar](${config.downloads.android})
- **Android AAB**: [Play Store](${config.downloads.android.replace('.apk', '.aab')})

### 🔧 Información técnica
- **Versión anterior**: ${oldVersion}
- **Nueva versión**: ${version}
- **Fecha de build**: ${versionInfo.buildDate}
- **Plataformas soportadas**: Android, iOS, Web, Windows, macOS, Linux

### 📋 Instalación
1. Descarga el archivo APK desde los enlaces de arriba
2. Habilita "Fuentes desconocidas" en tu dispositivo Android
3. Instala la aplicación
4. ¡Disfruta de las nuevas características!

### 🐛 Reportar problemas
Si encuentras algún problema, por favor [crea un issue](${config.repository.url}/issues/new).

---
*Esta release fue generada automáticamente* 🤖`;

    return notes;
  }

  // Crear release en GitHub (requiere GitHub CLI)
  createGitHubRelease(version, oldVersion) {
    try {
      console.log(`🎯 Creando release en GitHub...`);
      
      // Verificar si GitHub CLI está instalado
      execSync('gh --version', { stdio: 'pipe' });
      
      const releaseNotes = this.generateReleaseNotes(version, oldVersion);
      const notesFile = path.join(__dirname, '..', 'temp-release-notes.md');
      
      // Escribir notas temporalmente
      fs.writeFileSync(notesFile, releaseNotes);
      
      // Crear release
      const releaseCommand = `gh release create v${version} --title "Release v${version}" --notes-file "${notesFile}"`;
      execSync(releaseCommand, { stdio: 'inherit' });
      
      // Limpiar archivo temporal
      fs.unlinkSync(notesFile);
      
      console.log(`✅ Release v${version} creado en GitHub`);
      return true;
    } catch (error) {
      if (error.message.includes('gh --version')) {
        console.log(`⚠️  GitHub CLI no está instalado. El release se creará automáticamente con GitHub Actions.`);
        return true;
      }
      console.error(`❌ Error creando release: ${error.message}`);
      return false;
    }
  }

  // Proceso completo de release
  async createRelease(versionType = 'patch', options = {}) {
    const {
      skipTests = false,
      skipBuild = false,
      skipPush = false,
      dryRun = false
    } = options;

    try {
      console.log(`\n🚀 Iniciando proceso de release (${versionType})...`);
      console.log(`   Modo: ${dryRun ? 'DRY RUN' : 'PRODUCCIÓN'}`);
      
      // Verificaciones iniciales
      if (!this.checkGitSetup()) {
        throw new Error('Git no está configurado correctamente');
      }

      const repoStatus = this.checkRepoStatus();
      if (repoStatus.hasChanges && !dryRun) {
        console.log(`⚠️  Hay cambios pendientes. Continuando...`);
      }

      // Obtener versión actual
      const currentVersionInfo = this.versionManager.getCurrentVersionInfo();
      const oldVersion = currentVersionInfo.version;

      // Actualizar versión
      console.log(`\n📦 Actualizando versión...`);
      const versionResult = await this.versionManager.updateVersion(versionType);
      
      if (!versionResult.success) {
        throw new Error(`Error actualizando versión: ${versionResult.error}`);
      }

      const newVersion = versionResult.newVersion;

      if (dryRun) {
        console.log(`\n🔍 DRY RUN - Los siguientes pasos se ejecutarían:`);
        console.log(`   1. Ejecutar tests: ${!skipTests ? 'SÍ' : 'NO'}`);
        console.log(`   2. Build de producción: ${!skipBuild ? 'SÍ' : 'NO'}`);
        console.log(`   3. Sincronizar Capacitor: SÍ`);
        console.log(`   4. Crear commit y tag: SÍ`);
        console.log(`   5. Push al repositorio: ${!skipPush ? 'SÍ' : 'NO'}`);
        console.log(`   6. Crear GitHub release: SÍ`);
        return { success: true, version: newVersion, dryRun: true };
      }

      // Ejecutar tests
      if (!skipTests && !this.runTests()) {
        throw new Error('Tests fallaron');
      }

      // Build de producción
      if (!skipBuild && !this.buildProduction()) {
        throw new Error('Build falló');
      }

      // Sincronizar Capacitor
      if (!this.syncCapacitor()) {
        throw new Error('Sincronización de Capacitor falló');
      }

      // Crear commit y tag
      if (!this.createCommitAndTag(newVersion)) {
        throw new Error('Error creando commit/tag');
      }

      // Push al repositorio
      if (!skipPush && !this.pushToRepository()) {
        throw new Error('Error subiendo cambios');
      }

      // Crear GitHub release
      this.createGitHubRelease(newVersion, oldVersion);

      // Resumen final
      console.log(`\n🎉 ¡Release completado exitosamente!`);
      console.log(`\n📋 Resumen:`);
      console.log(`   Versión anterior: ${oldVersion}`);
      console.log(`   Nueva versión: ${newVersion}`);
      console.log(`   Build number: ${versionResult.buildNumber}`);
      console.log(`   Repositorio: ${config.repository.url}`);
      console.log(`   Release URL: ${config.repository.url}/releases/tag/v${newVersion}`);
      
      console.log(`\n📱 Próximos pasos:`);
      console.log(`   1. GitHub Actions construirá automáticamente el APK`);
      console.log(`   2. Los usuarios recibirán notificación de actualización`);
      console.log(`   3. La app se actualizará automáticamente`);

      return {
        success: true,
        oldVersion,
        newVersion,
        buildNumber: versionResult.buildNumber,
        releaseUrl: `${config.repository.url}/releases/tag/v${newVersion}`
      };

    } catch (error) {
      console.error(`\n❌ Error durante el release: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const releaseManager = new ReleaseManager();
  const versionType = process.argv[2] || 'patch';
  const isDryRun = process.argv.includes('--dry-run');
  const skipTests = process.argv.includes('--skip-tests');
  const skipBuild = process.argv.includes('--skip-build');
  const skipPush = process.argv.includes('--skip-push');

  releaseManager.createRelease(versionType, {
    dryRun: isDryRun,
    skipTests,
    skipBuild,
    skipPush
  });
}

module.exports = ReleaseManager;