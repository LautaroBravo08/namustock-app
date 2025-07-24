@echo off
echo 🔑 Generando keystore para firma digital de APK...
echo.

REM Verificar si Java está instalado
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Java no está instalado o no está en el PATH
    echo Instala Java JDK desde: https://adoptium.net/
    pause
    exit /b 1
)

REM Crear directorio android si no existe
if not exist "android" mkdir android

REM Generar keystore
echo 📝 Generando keystore...
keytool -genkey -v -keystore android/namustock-release-key.keystore -alias namustock-key -keyalg RSA -keysize 2048 -validity 10000 -storepass namustock123 -keypass namustock123 -dname "CN=NamuStock, OU=Development, O=NamuStock App, L=City, S=State, C=US"

if %errorlevel% equ 0 (
    echo ✅ Keystore generado exitosamente: android/namustock-release-key.keystore
    echo.
    
    REM Crear archivo keystore.properties
    echo 📝 Creando archivo keystore.properties...
    (
        echo storeFile=namustock-release-key.keystore
        echo storePassword=namustock123
        echo keyAlias=namustock-key
        echo keyPassword=namustock123
    ) > android/keystore.properties
    
    echo ✅ Archivo keystore.properties creado
    echo.
    echo 🎉 Configuración de firma completada!
    echo Ahora puedes construir APKs firmados digitalmente.
    echo.
) else (
    echo ❌ Error generando keystore
)

pause