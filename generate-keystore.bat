@echo off
echo 🔐 Generando clave de firma para NamuStock App...
echo.
echo ⚠️  IMPORTANTE: Guarda bien la contraseña que ingreses, la necesitarás para futuras actualizaciones
echo.

"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore android\app\namustock-key.keystore -alias namustock -keyalg RSA -keysize 2048 -validity 10000 -storepass namustock123 -keypass namustock123 -dname "CN=NamuStock, OU=Development, O=NamuStock, L=Parana, ST=Entre Rios, C=AR"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Clave de firma generada exitosamente!
    echo 📍 Ubicación: android\app\namustock-release-key.keystore
    echo.
    echo 📋 IMPORTANTE:
    echo - Guarda la contraseña en un lugar seguro
    echo - NO subas el archivo .keystore a GitHub
    echo - Haz backup de este archivo para futuras actualizaciones
) else (
    echo.
    echo ❌ Error generando la clave de firma
)

pause