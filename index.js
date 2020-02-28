
const Platform = require('./src/platform');

module.exports = function (homebridge) {
    homebridge.registerPlatform(Platform.pluginName, Platform.platformName, AppleTvPlatform, true);
}