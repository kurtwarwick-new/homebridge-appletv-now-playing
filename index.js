
const Platform = require('./src/platform');

module.exports = function (homebridge) {
    homebridge.registerPlatform("homebridge-appletv-now-playing", "AppleTvNowPlayingPlatform", Platform, true);
}