const appletv = require("node-appletv-x");
const Device = require("./device");

module.exports = (log, config, api) => {
    this.log = log;
    this.config = config;
    this.api = api;

    this.accessories = [];
    this.devices = [];

    // this.debug = debug.bind(this);
    // this.registerAccessories = registerAccessories.bind(this);
    // this.unregisterAccessories = unregisterAccessories.bind(this);
    // this.updateAccessories = updateAccessories.bind(this);
    // this.configureAccessory = configureAccessory.bind(this);
    // this.apiDidFinishLaunching = apiDidFinishLaunching.bind(this);
    // this.onScanComplete = onScanComplete.bind(this);
    // this.scanForDevice = scanForDevice.bind(this);
    // this.onDeviceConnected = onDeviceConnected.bind(this);
    // this.onDeviceConnectionFailed = onDeviceConnectionFailed.bind(this);
    // this.cleanupAccessory = cleanupAccessory.bind(this);

    // function registerAccessories(accessories) {
    //     this.api.registerPlatformAccessories(Platform.pluginName, Platform.platformName, accessories);
    // }

    // function unregisterAccessories(accessories) {
    //     this.api.unregisterPlatformAccessories(Platform.pluginName, Platform.platformName, accessories);
    // }

    this.updateAccessories = (accessories) => {
        this.api.updatePlatformAccessories(accessories);
    };

    this.debug = (message) => {
        if (this.config && this.config.debug) {
            this.log(message);
        }
    };

    // this.configureAccessory = (accessory) => {
    //     if (!accessory.context.uid) {
    //         this.debug(`Removing cached accessory width id ${accessory.UUID}`);

    //         this.api.unregisterPlatformAccessories(Platform.pluginName, Platform.platformName, [accessory]);
    //     } else {
    //         this.accessories.push(accessory);

    //         this.debug(`Loaded cached accessory width id ${accessory.UUID}`);
    //     }
    // };

    this.apiDidFinishLaunching = async () => {
        // if (!this.config.devices) {
        //     this.debug("No devices have bene configured.");

        //     return;
        // }

        // this.debug("Cleaning up orphaned accessories...");

        // this.accessories.map(this.cleanupAccessory);

        // this.debug("Scanning for Apple TVs...");

        // this.config.devices.map(await this.scanForDevice);

        this.config.devices.map(async (devicesConfiguration) => {
            try {
                let credentials = appletv.parseCredentials(devicesConfiguration.credentials);

                this.debug(`scanning for apple tv with identifier ${credentials.uniqueIdentifier}.`);

                let devices = await appletv.scan(credentials.uniqueIdentifier);

                this.debug(`apple tv with identifier ${credentials.uniqueIdentifier} found.`);
                this.debug(`attempting to connect to apple tv with identifier ${credentials.uniqueIdentifier}.`);

                let connectedDevice = await devices[0].openConnection(credentials);

                this.debug(`connected to apple tv with identifier ${credentials.uniqueIdentifier}.`);

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
    };

    // this.cleanupAccessory = accessory => {
    //     let foundAccessory = this.config.devices.filter(deviceConfiguration => {
    //       let credentials = appletv.parseCredentials(deviceConfiguration.credentials);
    //       accessory.UUID === `${credentials.uniqueIdentifier}_apple_tv`;
    //     });

    //     if(!foundAccessory) {
    //       this.debug(`Removing orphaned accessory [${accessory.uid}].`);
    //       this.unregisterAccessories([accessory]);
    //     }
    // }

    // this.scanForDevice = async deviceConfiguration => {
    //     let credentials = appletv.parseCredentials(deviceConfiguration.credentials);

    //     this.debug(`Scanning for Apple TV with identifier ${credentials.uniqueIdentifier}.`);

    //     let devices = appletv.scan(credentials.uniqueIdentifier);

    //     this.onScanComplete(devices, credentials, deviceConfiguration);
    // }

    // async function onScanComplete(devices, credentials, deviceConfiguration) {
    //     if (devices.length) {
    //         let device = devices[0];

    //         this.debug(`Found Apple TV ${device.name} [${device.uid}].`);
    //         this.debug(`Attempting to connect to Apple TV ${device.name} [${device.uid}].`);

    //         let connectedDevice = device.openConnection(device.credentials).then(connectedDevice => {
    //           this.debug("connected.");
    //           connectedDevice.on("nowPlaying", message => this.debug("NOWPLAYING"));
    //           connectedDevice.on("message", message => this.debug("message"));
    //           //this.onDeviceConnected(deviceConfiguration, connectedDevice), this.onDeviceConnectionFailed);
    //         });
    //     } else {
    //         this.debug(`Unable to find Apple TV with identifier ${credentials.uniqueIdentifier}. Please try and pair with your device again.`);
    //     }

    //     this.debug("Scanning complete.");
    // }

    // function onDeviceConnected(deviceConfiguration, device) {
    //     device.on("nowPlaying", message => this.debug(message));
    //     this.devices.push(new Device(this, deviceConfiguration, device));

    //     this.debug(`Connected to ${device.name} [${device.uid}].`);
    // }

    // function onDeviceConnectionFailed(device) {
    //     this.debug(device);
    //     this.debug(`Unable to connect to Apple TV.`);
    // }

    this.api.on("didFinishLaunching", this.apiDidFinishLaunching);
}

// Platform.pluginName = "homebridge-appletv-now-playing";
// Platform.platformName = "AppleTvNowPlayingPlatform";

// module.exports = Platform;
