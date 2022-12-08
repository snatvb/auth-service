/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = function (wallaby) {
  return {
    autoDetect: true,
    setup: function (wallaby) {
      if (global._tsconfigPathsRegistered) {
        return
      }
      const tsConfigPaths = require('tsconfig-paths')
      const tsconfig = require('./tsconfig.json')
      tsConfigPaths.register({
        baseUrl: tsconfig.compilerOptions.baseUrl,
        paths: tsconfig.compilerOptions.paths,
      })
      global._tsconfigPathsRegistered = true
    },
  }
}
