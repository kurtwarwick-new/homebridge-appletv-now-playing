let Charactersitics = require("./characteristics");
let Hap = require("hap-nodejs");

function Device(platform, device) {
  this.platform = platform;
  this.device = device;

  this.configureAccessory = () => {
    let deviceAccessories = this.platform.accessories.filter(accessory => accessory.context.uniqueIdentifier === this.device.uniqueIdentifier);
    let accessory = deviceAccessories.find(_accessory => _accessory.Category === Hap.Categories.TELEVISION);

    if (!accessory) {
      this.platform.debug(`Creating the Apple TV accessory with id ${this.device.uniqueIdentifier}.`);

      accessory = new Hap.Accessory(this.device.name, Hap.uuid.generate(`${this.device.uniqueIdentifier}_apple_tv`));
      accessory.context.uniqueIdentifier = this.device.uniqueIdentifier;

      this.platform.registerAccessories([accessory]);
      this.platform.debug(`Apple TV accessory with id ${this.device.uniqueIdentifier} created & registered.`);
    }

    this.configureInformationService(accessory);
    this.configureTelevisionService(accessory);
  };

  this.configureInformationService = accessory => {
    this.platform.debug(`Configuring the Information Service for accessory with id ${this.device.uniqueIdentifier}.`);

    let accessoryInformationService = accessory.getService(Hap.Service.AccessoryInformation);

    if (!accessoryInformationService) {
      accessoryInformationService = accessory.addService(Hap.Service.AccessoryInformation);
    }

    accessoryInformationService
      .setCharacteristic(Hap.Characteristic.Manufacturer, "Apple")
      .setCharacteristic(Hap.Characteristic.Model, "Apple TV")
      .setCharacteristic(Hap.Characteristic.SerialNumber, this.device.uniqueIdentifier);
  };

  this.configureTelevisionService = accessory => {
    this.platform.debug(`Configuring the Television Service for accessory with id ${this.device.uniqueIdentifier}.`);

    this.service = accessory.getServiceByUUIDAndSubType(Hap.Service.Television, "Playing");

    if (!this.service) {
      this.service = accessory.addService(Hap.Service.Television, "Playing", "Playing");
    }

    !!!this.service.getCharacteristic(Charactersitics.Type) && this.service.addCharacteristic(Charactersitics.Type);
    !!!this.service.getCharacteristic(Charactersitics.Title) && this.service.addCharacteristic(Charactersitics.Title);
    !!!this.service.getCharacteristic(Charactersitics.Artist) && this.service.addCharacteristic(Charactersitics.Artist);
    !!!this.service.getCharacteristic(Charactersitics.Album) && this.service.addCharacteristic(Charactersitics.Album);
    !!!this.service.getCharacteristic(Charactersitics.Application) && this.service.addCharacteristic(Charactersitics.Application);
    !!!this.service.getCharacteristic(Charactersitics.ApplicationBundleId) && this.service.addCharacteristic(Charactersitics.ApplicationBundleId);
    !!!this.service.getCharacteristic(Charactersitics.Elapsed) && this.service.addCharacteristic(Charactersitics.Elapsed);
    !!!this.service.getCharacteristic(Charactersitics.Duration) && this.service.addCharacteristic(Charactersitics.Duration);

    this.device.on("nowPlaying", this.onNowPlaying);
  };

  this.onNowPlaying = message => {
    this.platform.debug(`Now Playing information received for accessory with id ${this.device.uniqueIdentifier}.`);
    this.platform.debug(message);

    this.service.getCharacteristic(Charactersitics.Type).updateValue(message ? (message.album && message.artist ? "Music" : "Video") : "-");
    this.service.getCharacteristic(Charactersitics.Title).updateValue(message && message.title ? message.title : "-");
    this.service.getCharacteristic(Charactersitics.Artist).updateValue(message && message.artist ? message.artist : "-");
    this.service.getCharacteristic(Charactersitics.Album).updateValue(message && message.album ? message.album : "-");
    this.service.getCharacteristic(Charactersitics.Application).updateValue(message && message.appDisplayName ? message.appDisplayName : "-");
    this.service.getCharacteristic(Charactersitics.ApplicationBundleId).updateValue(message && message.appBundleIdentifier ? message.appBundleIdentifier : "-");
    this.service.getCharacteristic(Charactersitics.Elapsed).updateValue(message && message.elapsedTime ? message.elapsedTime : "-");
    this.service.getCharacteristic(Charactersitics.Duration).updateValue(message && message.duration ? message.duration : "-");

    this.service.getCharacteristic(Hap.Characteristic.Active).updateValue(message && message.playbackState === "playing");
  };

  this.configureAccessory();
};


module.exports = Device;