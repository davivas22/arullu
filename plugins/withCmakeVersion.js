// Plugin de configuración: fija una versión de CMake más nueva para la compilación nativa.
// El CMake 3.22 que trae Android por defecto usa un Ninja que no soporta rutas de más de
// 260 caracteres en Windows (aunque LongPathsEnabled esté activado). Gradle lo descarga solo.
const { withAppBuildGradle } = require('expo/config-plugins');

const VERSION_CMAKE = '3.31.6';
const MARCA = '// arrullu: versión de CMake';

module.exports = function withCmakeVersion(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARCA)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /android\s*\{/,
        `android {\n    ${MARCA}\n    externalNativeBuild {\n        cmake {\n            version "${VERSION_CMAKE}"\n        }\n    }\n`
      );
    }
    return cfg;
  });
};
