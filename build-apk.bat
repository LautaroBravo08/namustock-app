@echo off
echo 🔨 Construyendo APK de NamuStock App...
echo.

echo 📦 Paso 1: Construyendo proyecto React...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en el build de React
    pause
    exit /b 1
)

echo ✅ Build de React completado
echo.

echo 🔄 Paso 2: Sincronizando con Capacitor...
call npx cap sync
if %errorlevel% neq 0 (
    echo ❌ Error en la sincronización
    pause
    exit /b 1
)

echo ✅ Sincronización completada
echo.

echo 📱 Paso 3: Construyendo APK...
cd android
call gradlew clean
call gradlew assembleDebug --stacktrace
if %errorlevel% neq 0 (
    echo ❌ Error construyendo APK
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ✅ APK construido exitosamente!
echo 📍 Ubicación: android\app\build\outputs\apk\debug\app-debug.apk
echo.

echo 📋 INSTRUCCIONES PARA INSTALAR:
echo 1. Copia el APK a tu teléfono
echo 2. En tu teléfono: Configuración → Seguridad → Fuentes desconocidas (activar)
echo 3. O: Configuración → Apps → Acceso especial → Instalar apps desconocidas
echo 4. Busca el APK en tu teléfono y tócalo para instalar
echo.

pause