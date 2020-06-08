const appletv = require("node-appletv-x");
const Accessory = require("./accessory");

let Characteristics;

class SwitchAccessory extends Accessory {
    constructor() {
        this.type = SwitchAccessory.Type;
    }

    configureServices = () => {
        this.configureAccessoryInformationService();
        this.configureSwitchService();

        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 5000);
    };

    configureAccessoryInformationService = () => {
        this.platform.debug(`configuring ${this.type} accessory information service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            this.accessory
                .getService(this.platform.api.hap.Service.AccessoryInformation)
                .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, "Apple")
                .setCharacteristic(this.platform.api.hap.Characteristic.Model, "Apple TV")
                .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.device.uid)
                .setCharacteristic(this.platform.api.hap.Characteristic.Name, this.config.name);

            this.platform.debug(`${this.type} accessory information service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.log(`${this.type} accessory information service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.log(error);
        }
    };

    configureSwitchService = () => {
        this.platform.debug(`configuring switch service for ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            this.switchService = this.accessory.getService(this.platform.api.hap.Service.Switch);

            if (!this.switchService) {
                this.switchService = this.accessory.addService(
                    this.platform.api.hap.Service.Switch,
                    `${this.device.name} Switch`,
                    `${this.accessory.context.uid}_switch`
                );
            }

            !this.switchService.getCharacteristic(Characteristics.State) && this.switchService.addCharacteristic(Characteristics.State);
            !this.switchService.getCharacteristic(Characteristics.Type) && this.switchService.addCharacteristic(Characteristics.Type);
            !this.switchService.getCharacteristic(Characteristics.Title) && this.switchService.addCharacteristic(Characteristics.Title);
            !this.switchService.getCharacteristic(Characteristics.Artist) && this.switchService.addCharacteristic(Characteristics.Artist);
            !this.switchService.getCharacteristic(Characteristics.Album) && this.switchService.addCharacteristic(Characteristics.Album);
            !this.switchService.getCharacteristic(Characteristics.Application) && this.switchService.addCharacteristic(Characteristics.Application);
            !this.switchService.getCharacteristic(Characteristics.ApplicationBundleId) && this.switchService.addCharacteristic(Characteristics.ApplicationBundleId);
            !this.switchService.getCharacteristic(Characteristics.ElapsedTime) && this.switchService.addCharacteristic(Characteristics.ElapsedTime);
            !this.switchService.getCharacteristic(Characteristics.Duration) && this.switchService.addCharacteristic(Characteristics.Duration);
            !this.switchService.getCharacteristic(this.platform.api.hap.Characteristic.Active) && this.switchService.addCharacteristic(this.platform.api.hap.Characteristic.Active);

            this.switchService.getCharacteristic(this.platform.api.hap.Characteristic.On).on("set", this.onPower);

            this.device.on("nowPlaying", this.onNowPlaying);
            this.device.on("supportedCommands", this.onSupportedCommands);

            this.platform.debug(`switch service for ${this.type} accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.debug(`switch service for ${this.type} accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.debug(error);
        }
    };

    onPower = async (value, next) => {
        clearTimeout(this.powerTimer);

        this.platform.debug(`turning ${this.type} accessory (${this.device.name} [${this.device.uid}]) ${value ? "on" : "off"}.`);

        if (value && !this.power) {
            await this.device.sendKeyCommand(appletv.AppleTV.Key.LongTv);
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Select);
        } else if (!value && this.power) {
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Tv);
        }

        this.power = value;
        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 10000);

        next();
    };

    onDeviceInfo = (message) => {
        this.power = message.payload.logicalDeviceCount == 1;
        this.switchService && this.switchService.getCharacteristic(this.platform.api.hap.Characteristic.On).updateValue(this.power);
        this.tvService && this.tvService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(this.power);

        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 5000);
    };

    onSupportedCommands = (message) => {
        if (!!message) {
            if (!message.length) {
                this.switchService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(false);
            }
        }
    };

    onNowPlaying = (message) => {
        if (message && message.playbackState && message.playbackState.length > 1) {
            message.playbackState = message.playbackState[0].toUpperCase() + message.playbackState.substring(1).toLowerCase();
        }

        this.switchService.getCharacteristic(Characteristics.State).updateValue(message && message.playbackState ? message.playbackState : "-");
        this.switchService.getCharacteristic(Characteristics.Type).updateValue(message ? (message.album && message.artist ? "Music" : "Video") : "-");
        this.switchService.getCharacteristic(Characteristics.Title).updateValue(message && message.title ? message.title : "-");
        this.switchService.getCharacteristic(Characteristics.Artist).updateValue(message && message.artist ? message.artist : "-");
        this.switchService.getCharacteristic(Characteristics.Album).updateValue(message && message.album ? message.album : "-");
        this.switchService.getCharacteristic(Characteristics.Application).updateValue(message && message.appDisplayName ? message.appDisplayName : "-");
        this.switchService.getCharacteristic(Characteristics.ApplicationBundleId).updateValue(message && message.appBundleIdentifier ? message.appBundleIdentifier : "-");
        this.switchService.getCharacteristic(Characteristics.ElapsedTime).updateValue(message && message.elapsedTime > 0 ? Math.round(message.elapsedTime) : "-");
        this.switchService.getCharacteristic(Characteristics.Duration).updateValue(message && message.duration > 0 ? Math.round(message.duration) : "-");
        this.switchService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(message && message.playbackState === "Playing");
    };
}

SwitchAccessory.Type = "switch";

module.exports = SwitchAccessory;
