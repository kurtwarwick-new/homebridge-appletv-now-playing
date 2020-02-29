const lodash = require("lodash");

let Characteristics;

module.exports = function Device(platform, config, device) {
  this.platform = platform;
  this.config = config;
  this.device = device;

  Characteristics = require("./characteristics")(this.platform.api);

  this.configureAccessory = configureAccessory.bind(this);
  this.configureInformationService = configureInformationService.bind(this);
  this.configureStateService = configureStateService.bind(this);
  this.onNowPlaying = onNowPlaying.bind(this);

  function configureAccessory() {
    let accessoryUid = this.platform.api.hap.uuid.generate(`${this.device.uid}_apple_tv`);
    let deviceAccessories = this.platform.accessories.filter(accessory => accessory.context.uid === this.device.uid);
    let accessory = deviceAccessories.find(_accessory => _accessory.UUID === accessoryUid);

    this.platform.api.unregisterPlatformAccessories([new this.platform.api.platformAccessory(this.config.name, accessoryUid)]);

    if (!accessory) {
      if (!accessory) {
        this.platform.debug(`Creating the Apple TV accessory ${this.config.name}, with id ${this.device.uid}.`);

        accessory = new this.platform.api.platformAccessory(this.config.name, accessoryUid, this.platform.api.hap.Accessory.Categories.TELEVISION);
        accessory.context.uid = this.device.uid;

        this.platform.registerAccessories([accessory]);
      } else {
        this.platform.debug(`Updating the Apple TV accessory ${this.config.name}, with id ${this.device.uid}.`);

        accessory.displayName = this.config.name;

        this.platform.updateAccessories([accessory]);
      }

      this.platform.debug(`Apple TV accessory with id ${this.device.uid} created & registered.`);
    }

    this.configureInformationService(accessory);
    this.configureStateService(accessory);
  }

  function configureInformationService(accessory) {
    this.platform.debug(`Configuring the Information Service for accessory with id ${this.device.uid}.`);

    let accessoryInformationService = accessory.getService(this.platform.api.hap.Service.AccessoryInformation);

    if (!accessoryInformationService) {
      accessoryInformationService = accessory.addService(this.platform.api.hap.Service.AccessoryInformation);
    }

    accessoryInformationService
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, "Apple")
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, "Apple TV")
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.device.uid);
  }

  function configureStateService(accessory) {
    this.platform.debug(`Configuring the State Switch Service for accessory with id ${this.device.uid}.`);

    this.stateService = accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.Switch);

    if (!this.stateService) {
      this.stateService = accessory.addService(this.platform.api.hap.Service.Switch);
    }

    !this.stateService.getCharacteristic(Characteristics.State) && this.stateService.addCharacteristic(Characteristics.State);
    !this.stateService.getCharacteristic(Characteristics.Type) && this.stateService.addCharacteristic(Characteristics.Type);
    !this.stateService.getCharacteristic(Characteristics.Title) && this.stateService.addCharacteristic(Characteristics.Title);
    !this.stateService.getCharacteristic(Characteristics.Artist) && this.stateService.addCharacteristic(Characteristics.Artist);
    !this.stateService.getCharacteristic(Characteristics.Album) && this.stateService.addCharacteristic(Characteristics.Album);
    !this.stateService.getCharacteristic(Characteristics.Application) && this.stateService.addCharacteristic(Characteristics.Application);
    !this.stateService.getCharacteristic(Characteristics.ApplicationBundleId) && this.stateService.addCharacteristic(Characteristics.ApplicationBundleId);
    !this.stateService.getCharacteristic(Characteristics.ElapsedTime) && this.stateService.addCharacteristic(Characteristics.ElapsedTime);
    !this.stateService.getCharacteristic(Characteristics.Duration) && this.stateService.addCharacteristic(Characteristics.Duration);

    !this.stateService.getCharacteristic(this.platform.api.hap.Characteristic.Active) && this.stateService.addCharacteristic(this.platform.api.hap.Characteristic.Active);

    this.device.on("nowPlaying", this.onNowPlaying);
  }

  function onNowPlaying(message) {
    this.platform.debug(`Now Playing information received for accessory with id ${this.device.uid}.`);
    this.platform.debug(message);

    if (message.playbackState && message.playbackState.length > 1) {
      message.playbackState = message.playbackState[0].toUpperCase() + message.playbackState.substring(1).toLowerCase();
    }

    this.stateService.getCharacteristic(Characteristics.State).updateValue(message && message.playbackState ? message.playbackState : "-");
    this.stateService.getCharacteristic(Characteristics.Type).updateValue(message ? (message.album && message.artist ? "Music" : "Video") : "-");
    this.stateService.getCharacteristic(Characteristics.Title).updateValue(message && message.title ? message.title : "-");
    this.stateService.getCharacteristic(Characteristics.Artist).updateValue(message && message.artist ? message.artist : "-");
    this.stateService.getCharacteristic(Characteristics.Album).updateValue(message && message.album ? message.album : "-");
    this.stateService.getCharacteristic(Characteristics.Application).updateValue(message && message.appDisplayName ? message.appDisplayName : "-");
    this.stateService.getCharacteristic(Characteristics.ApplicationBundleId).updateValue(message && message.appBundleIdentifier ? message.appBundleIdentifier : "-");
    this.stateService.getCharacteristic(Characteristics.ElapsedTime).updateValue(message && message.elapsedTime > 0 ? message.elapsedTime : "-");
    this.stateService.getCharacteristic(Characteristics.Duration).updateValue(message && message.duration > 0 ? message.duration : "-");

    this.stateService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(message && message.playbackState === "playing");
  }

  this.configureAccessory();
};
