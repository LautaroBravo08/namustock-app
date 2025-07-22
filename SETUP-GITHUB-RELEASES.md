# 🚀 Configuración de GitHub Releases

## Prerrequisitos

1. **GitHub CLI instalado**:
   ```bash
   # Windows (con Chocolatey)
   choco install gh
   
   # macOS (con Homebrew)
   brew install gh
   
   # Linux
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   ```

2. **Autenticación con GitHub**:
   ```bash
   gh auth login
   ```

3. **Repositorio en GitHub**:
   - Crea un repositorio en GitHub
   - Conecta tu proyecto local: `git remote add origin https://github.com/tu-usuario/tu-repo.git`

## Configuración

1. **Actualiza .env.production**:
   ```env
   REACT_APP_GITHUB_REPO=tu-usuario/tu-repositorio
   ```

2. **Primer release**:
   ```bash
   npm run release:patch
   ```

## Uso

```bash
# Crear release patch (1.0.0 -> 1.0.1)
npm run release:patch

# Crear release minor (1.0.0 -> 1.1.0)
npm run release:minor

# Crear release major (1.0.0 -> 2.0.0)
npm run release:major
```

## Verificación

1. Ve a tu repositorio en GitHub
2. Verifica que el release se haya creado
3. Descarga el APK para probar
4. Las actualizaciones automáticas deberían funcionar

## Troubleshooting

- **Error "gh not found"**: Instala GitHub CLI
- **Error de autenticación**: Ejecuta `gh auth login`
- **APK no se sube**: Verifica que se compile correctamente
