let AppleTv = require("node-appletv");
let lodash = require("lodash");

function Platform(log, config, api) {
  this.log = log;
  this.config = config;
  this.api = api;

  this.accessories = [];
  this.devices = [];

  this.api.on("didFinishLaunching", this.apiDidFinishLaunching);

  this.registerAccessories = accessories => this.api.registerPlatformAccessories(Platform.pluginName, Platform.platformName, accessories);

  this.debug = message => {
    if (this.config && this.config.debug) {
      this.log(message);
    }
  };

  this.configureAccessory = accessory => {
    this.accessories.push(accessory);
  };

  this.apiDidFinishLaunching = () => {
    this.debug("Scanning for Apple TVs...");

    AppleTv.scan().then(this.onScanComplete);
  };

  this.onScanComplete = devices => {
    this.debug(`Found ${devices.length} Apple TV devices.`);

    lodash.each(this.config.devices, deviceConfiguration => this.registerDevice(deviceConfiguration, devices));

    this.debug("Scanning complete.");
  };

  this.registerDevice = (deviceConfiguration, devices) => {
    let credentials = AppleTv.parseCredentials(deviceConfiguration.credentials);
    let device = lodash.find(devices, _device => _device.uid === credentials.uniqueIdentifier);

    if (!device) {
      this.debug(`Apple TV with id ${credentials.uniqueIdentifier} was not found.`);

      return;
    }

    this.debug(`Connecting to Apple TV with id ${credentials.uniqueIdentifier}...`);

    device.openConnection(credentials).then(this.onDeviceConnected, this.onDeviceConnectionFailed);
  };

  this.onDeviceConnected = device => {
    this.devices.push();

    this.debug(`Connected to Apple TV with id ${device.uid}.`);
  };

  this.onDeviceConnectionFailed = device => {
    this.debug(device);
    this.debug(`Unable to connect to Apple TV.`);
  };
};

Platform.pluginName = "homebridge-appletv-now-playing";
Platform.platformName = "AppleTvNowPlayingPlatform";

module.exports = Platform;