const appletv = require("node-appletv-x");

const SwitchAccessory = require("./accessory.switch");
const TelevisionAccessory = require("./accessory.television");

class Platform {
    constructor(log, config, api) {
        this.debug = this.debug.bind(this);
        this.log = this.log.bind(this);
        this.registerAccessories = this.registerAccessories.bind(this);
        this.unregisterAccessories = this.unregisterAccessories.bind(this);
        this.updateAccessories = this.updateAccessories.bind(this);
        this.configureAccessory = this.configureAccessory.bind(this);
        this.removeAccessory = this.removeAccessory.bind(this);
        this.cleanupAccessory = this.cleanupAccessory.bind(this);
        this.loadDevice = this.loadDevice.bind(this);
        this.onApiDidFinishLaunching = this.onApiDidFinishLaunching.bind(this);

        this.log = log;
        this.config = config;
        this.api = api;
        this.accessories = [];
        this.devices = [];

        this.api.on("didFinishLaunching", this.onApiDidFinishLaunching);
    }

    debug(message) {
        if (this.config && this.config.debug) {
            this.log(message.toLowerCase());
        }
    };

    log(message) {
        this.log(message.toLowerCase());
    };

    registerAccessories(accessories) {
        this.api.registerPlatformAccessories(Platform.pluginName, Platform.platformName, accessories);
    };

    unregisterAccessories(accessories) {
        this.api.unregisterPlatformAccessories(Platform.pluginName, Platform.platformName, accessories);
    };

    updateAccessories(accessories) {
        this.api.updatePlatformAccessories(accessories);
    };

    configureAccessory(accessory) {
        if (!accessory.context.uid) {
            this.debug(`Removing cached accessory width id ${accessory.UUID}`);

            this.api.unregisterPlatformAccessories(Platform.pluginName, Platform.platformName, [accessory]);
        } else {
            this.accessories.push(accessory);

            this.debug(`Loaded cached accessory width id ${accessory.UUID}`);
        }
    };

    removeAccessory(accessory) {
        this.debug(`Removing accessory width id ${accessory.UUID}`);

        this.api.unregisterPlatformAccessories(Platform.pluginName, Platform.platformName, [accessory]);
    };

    cleanupAccessory(accessory) {
        let foundAccessory = this.config.devices.filter((deviceConfiguration) => {
            let credentials = appletv.parseCredentials(deviceConfiguration.credentials);
            return accessory.UUID === `${credentials.uniqueIdentifier}_apple_tv_${SwitchAccessory.Type}`;
        });

        if (!foundAccessory) {
            this.debug(`Removing orphaned ${SwitchAccessory.Type} accessory [${accessory.uid}].`);

            this.unregisterAccessories([accessory]);
        }

        foundAccessory = this.config.devices.filter((deviceConfiguration) => {
            let credentials = appletv.parseCredentials(deviceConfiguration.credentials);
            return deviceConfiguration.showTVAccessory && accessory.UUID === `${credentials.uniqueIdentifier}_apple_tv_${TelevisionAccessory.Type}`;
        });

        if (!foundAccessory) {
            this.debug(`Removing orphaned ${TelevisionAccessory.Type} accessory [${accessory.uid}].`);

            this.unregisterAccessories([accessory]);
        }
    };

    async loadDevice(deviceConfiguration) {
        let credentials = appletv.parseCredentials(deviceConfiguration.credentials);

        this.debug(`Scanning for Apple TV [${credentials.uniqueIdentifier}].`);

        let devices = await appletv.scan(credentials.uniqueIdentifier);

        this.debug(`Apple TV [${credentials.uniqueIdentifier}] found.`);
        this.debug(`Attempting to connect to Apple TV [${credentials.uniqueIdentifier}].`);

        let connectedDevice = await devices[0].openConnection(credentials);

        this.debug(`Connected to ${connectedDevice.name} [${connectedDevice.uid}].`);
        this.debug(`Loading ${SwitchAccessory.Type} acessory for ${connectedDevice.name} [${connectedDevice.uid}].`);

        this.devices.push(new SwitchAccessory(this, deviceConfiguration, connectedDevice));

        if(deviceConfiguration.showTvAccessory) {
            this.debug(`Loading ${TelevisionAccessory.Type} acessory for ${connectedDevice.name} [${connectedDevice.uid}].`);
            this.devices.push(new TelevisionAccessory(this, deviceConfiguration, connectedDevice));
        }
    };

    onApiDidFinishLaunching() {
        if (!this.config.devices) {
            this.debug("No Apple TV devices have been configured.");
            return;
        }

        this.debug("Cleaning up orphaned accessories...");

        this.accessories.map(this.cleanupAccessory);

        this.debug("Loading configured Apple TVs...");

        this.config.devices.map(this.loadDevice);
    };
}

Platform.pluginName = "homebridge-appletv-now-playing";
Platform.platformName = "AppleTvNowPlayingPlatform";

module.exports = Platform;
