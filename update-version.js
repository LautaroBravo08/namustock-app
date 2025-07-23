// DEPRECATED: Este archivo ha sido reemplazado por scripts/version-manager.js
// Mantenido por compatibilidad, pero redirige al nuevo sistema

const VersionManager = require('./scripts/version-manager.js');

console.log('⚠️  Este script está deprecated. Usando el nuevo VersionManager...');

const versionManager = new VersionManager();
const updateType = process.argv[2] || 'patch';

versionManager.updateVersion(updateType);