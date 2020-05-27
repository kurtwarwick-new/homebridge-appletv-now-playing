const appletv = require("node-appletv-x");
const Device = require("./device");

function Platform(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.debug = message => {
        if (this.config && this.config.debug) {
            this.log(message);
        }
    }

    this.api.on("didFinishLaunching", async () => {
        config.devices.map(async (devicesConfiguration) => {
            try {
                let credentials = appletv.parseCredentials(devicesConfiguration.credentials);

                config.verbose && console.log(`scanning for apple tv with identifier ${credentials.uniqueIdentifier}.`);

                let devices = await appletv.scan(credentials.uniqueIdentifier);

                config.verbose && console.log(`apple tv with identifier ${credentials.uniqueIdentifier} found.`);
                config.verbose && console.log(`attempting to connect to apple tv with identifier ${credentials.uniqueIdentifier}.`);

                let connectedDevice = await devices[0].openConnection(credentials);

                config.verbose && console.log(`connected to apple tv with identifier ${credentials.uniqueIdentifier}.`);

                connectedDevice.on("nowPlaying", this.debug);
                connectedDevice.on("supportedCommands", this.debug);

                setInterval(
                    () =>
                        connectedDevice.sendIntroduction().then(this.debug),
                    5000
                );
            } catch (error) {
                console.error(error);
            }
        });
    });
}

Platform.pluginName = "homebridge-appletv-now-playing";
Platform.platformName = "AppleTvNowPlayingPlatform";

module.exports = Platform;
