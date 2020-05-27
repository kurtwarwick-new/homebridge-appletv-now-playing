
const Platform = require('./src/platform_temp');

module.exports = function (homebridge) {
    homebridge.registerPlatform("homebridge-appletv-now-playing", "AppleTvNowPlayingPlatform", Platform, true);
}