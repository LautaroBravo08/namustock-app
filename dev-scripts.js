#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 NamuStock App - Multiplataforma Development\n');
console.log('═══════════════════════════════════════════');
console.log('📱 DESARROLLO:');
console.log('1. 🌐 Web (React Dev Server)');
console.log('2. 💻 Desktop (Electron)');
console.log('3. 📱 Android (Android Studio)');
console.log('4. 📱 iOS (Xcode)');
console.log('');
console.log('🏗️  BUILD & DISTRIBUCIÓN:');
console.log('5. 📦 Build All Platforms');
console.log('6. 🪟 Build Windows (.exe)');
console.log('7. 🍎 Build macOS (.dmg)');
console.log('8. 🐧 Build Linux (.AppImage)');
console.log('9. 📱 Build Mobile Apps');
console.log('');
console.log('🔧 UTILIDADES:');
console.log('10. 🔄 Sync Mobile Platforms');
console.log('11. 🧹 Clean Install');
console.log('12. 🔔 Test Notifications');
console.log('13. 📱 Build Android APK');
console.log('0. Salir\n');

rl.question('Ingresa tu opción (0-13): ', (answer) => {
  const option = parseInt(answer);
  
  switch(option) {
    case 1:
      console.log('🌐 Iniciando servidor de desarrollo web...');
      runCommand('npm', ['start']);
      break;
      
    case 2:
      console.log('💻 Iniciando aplicación Electron...');
      runCommand('npm', ['run', 'dev:electron']);
      break;
      
    case 3:
      console.log('📱 Abriendo proyecto Android...');
      runCommand('npm', ['run', 'dev:android']);
      break;
      
    case 4:
      console.log('📱 Abriendo proyecto iOS...');
      runCommand('npm', ['run', 'dev:ios']);
      break;
      
    case 5:
      console.log('📦 Construyendo todas las plataformas...');
      buildAllPlatforms();
      break;
      
    case 6:
      console.log('🪟 Construyendo para Windows...');
      runCommand('npm', ['run', 'dist:windows']);
      break;
      
    case 7:
      console.log('🍎 Construyendo para macOS...');
      runCommand('npm', ['run', 'dist:mac']);
      break;
      
    case 8:
      console.log('🐧 Construyendo para Linux...');
      runCommand('npm', ['run', 'dist:linux']);
      break;
      
    case 9:
      console.log('📱 Construyendo apps móviles...');
      runCommand('npm', ['run', 'cap:build']);
      break;
      
    case 10:
      console.log('🔄 Sincronizando plataformas móviles...');
      runCommand('npx', ['cap', 'sync']);
      break;
      
    case 11:
      console.log('🧹 Limpiando e instalando dependencias...');
      cleanInstall();
      break;
      
    case 12:
      console.log('🔔 Probando sistema de notificaciones...');
      testNotifications();
      break;
      
    case 13:
      console.log('📱 Construyendo APK de Android...');
      buildAndroidAPK();
      break;
      
    case 0:
      console.log('👋 ¡Hasta luego!');
      process.exit(0);
      break;
      
    default:
      console.log('❌ Opción inválida');
      process.exit(1);
  }
  
  rl.close();
});

function runCommand(command, args) {
  const child = spawn(command, args, { 
    stdio: 'inherit', 
    shell: true 
  });
  
  child.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Proceso terminó con código ${code}`);
    }
  });
}

function buildProduction() {
  console.log('📦 Construyendo aplicación web...');
  
  const buildWeb = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit', 
    shell: true 
  });
  
  buildWeb.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build web completado');
      console.log('🔄 Sincronizando con plataformas móviles...');
      
      const syncMobile = spawn('npx', ['cap', 'sync'], { 
        stdio: 'inherit', 
        shell: true 
      });
      
      syncMobile.on('close', (syncCode) => {
        if (syncCode === 0) {
          console.log('✅ Sincronización completada');
          console.log('💻 ¿Quieres crear instaladores desktop? (npm run dist)');
        }
      });
    }
  });
}

function buildAllPlatforms() {
  console.log('📦 Construyendo aplicación web...');
  
  const buildWeb = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit', 
    shell: true 
  });
  
  buildWeb.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build web completado');
      console.log('🔄 Sincronizando con plataformas móviles...');
      
      const syncMobile = spawn('npx', ['cap', 'sync'], { 
        stdio: 'inherit', 
        shell: true 
      });
      
      syncMobile.on('close', (syncCode) => {
        if (syncCode === 0) {
          console.log('✅ Sincronización móvil completada');
          console.log('💻 Construyendo aplicaciones desktop...');
          
          const buildDesktop = spawn('npm', ['run', 'dist:all'], { 
            stdio: 'inherit', 
            shell: true 
          });
          
          buildDesktop.on('close', (desktopCode) => {
            if (desktopCode === 0) {
              console.log('✅ ¡Todas las plataformas construidas exitosamente!');
              console.log('📁 Revisa la carpeta "dist" para los instaladores desktop');
              console.log('📱 Usa Android Studio/Xcode para generar APK/IPA');
            }
          });
        }
      });
    }
  });
}

function testNotifications() {
  console.log('🔔 Guía para probar notificaciones:');
  console.log('');
  console.log('📋 PASOS:');
  console.log('1. 📱 Instala la app en tu dispositivo Android');
  console.log('2. 🔐 Inicia sesión con tu cuenta');
  console.log('3. ⚙️  Ve a Configuraciones → Notificaciones');
  console.log('4. 🔔 Activa el interruptor de notificaciones');
  console.log('5. ✅ Acepta los permisos cuando te los solicite');
  console.log('6. 🧪 Usa el botón "Probar Notificación"');
  console.log('7. ⏰ Verifica que llegue la notificación de prueba');
  console.log('');
  console.log('📊 DATOS DE PRUEBA:');
  console.log('- La notificación se programa para mañana a las 9:00 AM');
  console.log('- Incluye productos con bajo stock y próximos a vencer');
  console.log('- Al tocar la notificación, abre la app');
  console.log('');
  console.log('🔧 SOLUCIÓN DE PROBLEMAS:');
  console.log('- Si no llegan: Verifica permisos en Configuración del sistema');
  console.log('- Solo funciona en la app móvil nativa (no en web)');
  console.log('- Asegúrate de tener productos en tu inventario');
}

function buildAndroidAPK() {
  console.log('📱 Construyendo APK de Android...');
  console.log('');
  console.log('🔄 Paso 1: Construyendo proyecto React...');
  
  const buildWeb = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit', 
    shell: true 
  });
  
  buildWeb.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build web completado');
      console.log('🔄 Paso 2: Sincronizando con Android...');
      
      const syncAndroid = spawn('npx', ['cap', 'sync'], { 
        stdio: 'inherit', 
        shell: true 
      });
      
      syncAndroid.on('close', (syncCode) => {
        if (syncCode === 0) {
          console.log('✅ Sincronización completada');
          console.log('📱 Paso 3: Abriendo Android Studio...');
          
          const openAndroid = spawn('npx', ['cap', 'open', 'android'], { 
            stdio: 'inherit', 
            shell: true 
          });
          
          openAndroid.on('close', () => {
            console.log('');
            console.log('📋 INSTRUCCIONES PARA ANDROID STUDIO:');
            console.log('1. 🔨 Build → Build Bundle(s) / APK(s) → Build APK(s)');
            console.log('2. ⏳ Espera a que compile (puede tomar unos minutos)');
            console.log('3. 🔔 Aparecerá una notificación cuando termine');
            console.log('4. 📁 Haz clic en "locate" para encontrar el APK');
            console.log('5. 📍 Ubicación: android/app/build/outputs/apk/debug/');
            console.log('');
            console.log('📱 INSTALACIÓN:');
            console.log('- Copia el APK a tu teléfono');
            console.log('- Habilita "Fuentes desconocidas" en configuración');
            console.log('- Toca el APK para instalar');
            console.log('');
            console.log('🎯 FUNCIONALIDADES INCLUIDAS:');
            console.log('✅ Gestión completa de inventario');
            console.log('✅ Autenticación con Firebase');
            console.log('✅ Sincronización en tiempo real');
            console.log('✅ Notificaciones push diarias');
            console.log('✅ Alertas de bajo stock y vencimientos');
            console.log('✅ Interfaz nativa Android');
          });
        }
      });
    }
  });
}

function cleanInstall() {
  console.log('🧹 Eliminando node_modules y package-lock.json...');
  
  const cleanCmd = process.platform === 'win32' 
    ? ['rmdir', '/s', '/q', 'node_modules', '&', 'del', 'package-lock.json']
    : ['rm', '-rf', 'node_modules', 'package-lock.json'];
  
  const clean = spawn(cleanCmd[0], cleanCmd.slice(1), { 
    stdio: 'inherit', 
    shell: true 
  });
  
  clean.on('close', (code) => {
    console.log('📦 Instalando dependencias...');
    
    const install = spawn('npm', ['install'], { 
      stdio: 'inherit', 
      shell: true 
    });
    
    install.on('close', (installCode) => {
      if (installCode === 0) {
        console.log('✅ Instalación limpia completada');
        console.log('🔄 Sincronizando plataformas...');
        runCommand('npx', ['cap', 'sync']);
      }
    });
  });
}