let AppleTv = require("node-appletv-x");
let lodash = require("lodash");
let Device = require("./device");

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
  this.registerDevice = registerDevice.bind(this);
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

    AppleTv.scan().then(this.onScanComplete);
  }

  function onScanComplete(devices) {
    this.debug(`Found ${devices.length} Apple TV devices.`);

    lodash.each(this.config.devices, deviceConfiguration => this.registerDevice(deviceConfiguration, devices));

    this.debug("Scanning complete.");
  }

  function registerDevice(deviceConfiguration, devices) {
    let credentials = AppleTv.parseCredentials(deviceConfiguration.credentials);
    let device = lodash.find(devices, _device => _device.uid === credentials.uniqueIdentifier);

    if (!device) {
      this.debug(`Apple TV with id ${credentials.uniqueIdentifier} was not found.`);

      return;
    }

    this.debug(`Connecting to Apple TV with id ${credentials.uniqueIdentifier}...`);

    device.openConnection(credentials).then(device => this.onDeviceConnected(deviceConfiguration, device), this.onDeviceConnectionFailed);
  }

  function onDeviceConnected(deviceConfiguration, device) {
    this.devices.push(new Device(this, deviceConfiguration, device));

    this.debug(`Connected to Apple TV with id ${device.uid}.`);
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
