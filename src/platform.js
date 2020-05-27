const appletv = require("node-appletv-x");
const Device = require("./device");

function Platform(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.accessories = [];
    this.devices = [];

    this.debug = debug.bind(this);
    this.registerAccessories = registerAccessories.bind(this);
    this.unregisterAccessories = unregisterAccessories.bind(this);
    this.updateAccessories = updateAccessories.bind(this);
    this.configureAccessory = configureAccessory.bind(this);
    this.apiDidFinishLaunching = apiDidFinishLaunching.bind(this);
    this.onScanComplete = onScanComplete.bind(this);
    this.scanForDevice = scanForDevice.bind(this);
    this.onDeviceConnected = onDeviceConnected.bind(this);
    this.onDeviceConnectionFailed = onDeviceConnectionFailed.bind(this);

    function registerAccessories(accessories) {
        this.api.registerPlatformAccessories(Platform.pluginName, Platform.platformName, accessories);
    }

    function unregisterAccessories(accessories) {
        this.api.unregisterPlatformAccessories(Platform.pluginName, Platform.platformName, accessories);
    }

    function updateAccessories(accessories) {
        this.api.updatePlatformAccessories(accessories);
    }

    function debug(message) {
        if (this.config && this.config.debug) {
            this.log(message);
        }
    }

    function configureAccessory(accessory) {
        if (!accessory.context.uid) {
            this.debug(`Removing cached accessory width id ${accessory.UUID}`);

            this.api.unregisterPlatformAccessories(Platform.pluginName, Platform.platformName, [accessory]);
        } else {
            this.accessories.push(accessory);

            this.debug(`Loaded cached accessory width id ${accessory.UUID}`);
        }
    }

    function apiDidFinishLaunching() {
        if (!this.config.devices) {
            this.debug("No devices have bene configured.");

            return;
        }

        this.debug("Scanning for Apple TVs...");

        config.devices.map(this.scanForDevice);
    }

    function scanForDevice(deviceConfiguration) {
        let credentials = appletv.parseCredentials(deviceConfiguration.credentials);

        this.debug(`Scanning for Apple TV with identifier ${credentials.uniqueIdentifier}.`);

        appletv.scan(credentials.uniqueIdentifier).then((devices) => this.onScanComplete(devices, credentials, deviceConfiguration));
    }

    function onScanComplete(devices, credentials, deviceConfiguration) {
        if (devices.length) {
            let device = devices[0];

            this.debug(`Found Apple TV ${device.name} [${device.uid}].`);
            this.debug(`Attempting to connect to Apple TV ${device.name} [${device.uid}].`);

            device.openConnection(device.credentials).then((device) => this.onDeviceConnected(deviceConfiguration, device), this.onDeviceConnectionFailed);
        } else {
            this.debug(`Unable to find Apple TV with identifier ${credentials.uniqueIdentifier}. Please try and pair with your device again.`);
        }

        this.debug("Scanning complete.");
    }

    function onDeviceConnected(deviceConfiguration, device) {
        this.devices.push(new Device(this, deviceConfiguration, device));

        this.debug(`Connected to ${device.name} [${device.uid}].`);
    }

    function onDeviceConnectionFailed(device) {
        this.debug(device);
        this.debug(`Unable to connect to Apple TV.`);
    }

    this.api.on("didFinishLaunching", this.apiDidFinishLaunching);
}

Platform.pluginName = "homebridge-appletv-now-playing";
Platform.platformName = "AppleTvNowPlayingPlatform";

module.exports = Platform;
