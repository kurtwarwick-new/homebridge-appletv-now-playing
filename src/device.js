const appletv = require("node-appletv-x");

let Characteristics;

class Device {
    constructor(platform, config, device) {
        Characteristics = require("./characteristics")(platform.api);

        this.platform = platform;
        this.config = config;
        this.device = device;
        this.power = false;
        this.powerTimer = null;

        this.configureAccessory();
    }

    configureAccessory = () => {
        let accessoryUid = this.platform.api.hap.uuid.generate(`${this.device.uid}_apple_tv`);
        let deviceAccessories = this.platform.accessories.filter((accessory) => accessory.context.uid === this.device.uid);
        let accessory = deviceAccessories.find((_accessory) => _accessory.UUID === accessoryUid);

        if (!accessory) {
            this.platform.debug(`Creating accessory (${this.device.name} [${this.device.uid}]).`);

            accessory = new this.platform.api.platformAccessory(this.config.name, accessoryUid, this.platform.api.hap.Accessory.Categories.TELEVISION);

            accessory.displayName = this.config.name;
            accessory.context.uid = this.device.uid;

            this.platform.registerAccessories([accessory]);
        } else {
            this.platform.debug(`Updating accessory (${this.device.name} [${this.device.uid}]).`);

            accessory.displayName = this.config.name;
            accessory.name = this.config.name;

            this.platform.updateAccessories([accessory]);
        }

        this.platform.debug(`Accessory (${this.device.name} [${this.device.uid}]) ready.`);

        this.configureInformationService(accessory);
        //this.configureStateService(accessory);
        this.configureTVService(accessory);

        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 5000);
    };

    configureInformationService = (accessory) => {
        this.platform.debug(`Configuring the information service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            let accessoryInformationService = accessory.getService(this.platform.api.hap.Service.AccessoryInformation);

            if (!accessoryInformationService) {
                accessoryInformationService = accessory.addService(this.platform.api.hap.Service.AccessoryInformation);
            }

            accessoryInformationService
                .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, "Apple")
                .setCharacteristic(this.platform.api.hap.Characteristic.Model, "Apple TV")
                .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.device.uid)
                .setCharacteristic(this.platform.api.hap.Characteristic.Name, this.config.name);

            this.platform.debug(`Information service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.debug(`Information service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.debug(error);
        }
    };

    configureTVService = (accessory) => {
        this.platform.debug(`Configuring the TV service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            this.tvService = accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.Television);

            if (!this.tvService) {
                this.tvService = accessory.addService(this.platform.api.hap.Service.Television);
            }

            this.tvService
                .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, "Apple")
                .setCharacteristic(this.platform.api.hap.Characteristic.Model, "Apple TV")
                .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.device.uid)
                .setCharacteristic(this.platform.api.hap.Characteristic.Name, this.config.name)
                .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, this.config.name);

            this.tvService.getCharacteristic(this.platform.api.hap.Characteristic.Active).on("set", this.onPower);

            this.speakerService = accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.TelevisionSpeaker);

            if (!this.speakerService) {
                this.speakerService = accessory.addService(this.platform.api.hap.Service.TelevisionSpeaker);
            }

            this.speakerService
                .setCharacteristic(this.platform.api.hap.Characteristic.Active, this.platform.api.hap.Characteristic.Active.ACTIVE)
                .setCharacteristic(this.platform.api.hap.Characteristic.VolumeControlType, this.platform.api.hap.Characteristic.VolumeControlType.RELATIVE_WITH_CURRENT);
            this.speakerService.getCharacteristic(this.platform.api.hap.Characteristic.VolumeSelector).on("set", this.onVolumeSelector);

            accessory.addService(this.speakerService);

            this.tvService.addLinkedService(this.speakerService);

            this.platform.debug(`TV service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.debug(`TV service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.debug(error);
        }
    };

    configureStateService = (accessory) => {
        this.platform.debug(`Configuring the state service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
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

            this.stateService.getCharacteristic(this.platform.api.hap.Characteristic.On).on("set", this.onPower);

            this.device.on("nowPlaying", this.onNowPlaying);
            this.device.on("supportedCommands", this.onSupportedCommands);

            this.platform.debug(`State service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.debug(`State service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.debug(error);
        }
    };

    onVolumeSelector = async (value, next) => {
		if (this.power) {
			switch (state) {
				case this.platform.api.hap.Characteristic.VolumeSelector.INCREMENT:
					await this.device.sendKeyPressAndRelease(12, 0xE9);
					break;
				case this.platform.api.hap.Characteristic.VolumeSelector.DECREMENT:
                    await this.device.sendKeyPressAndRelease(12, 0xEA)
					break;
            }
        }
        
        next();
	}

    onPower = async (value, next) => {
        clearTimeout(this.powerTimer);

        this.platform.debug(`Turning accessory (${this.device.name} [${this.device.uid}]) ${value ? "on" : "off"}.`);

        if (this.power) {
            await this.device.sendKeyCommand(appletv.AppleTV.Key.LongTv);
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Select);
        } else {
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Tv);
        }

        this.power = value;
        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 10000);

        next();
    };

    onDeviceInfo = (message) => {
        this.power = message.payload.logicalDeviceCount == 1;
        this.stateService && this.stateService.getCharacteristic(this.platform.api.hap.Characteristic.On).updateValue(this.power);
        this.tvService && this.tvService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(this.power);

        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 5000);
    };

    onSupportedCommands = (message) => {
        if (!!message) {
            if (!message.length) {
                this.stateService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(false);
            }
        }
    };

    onNowPlaying = (message) => {
        if (message && message.playbackState && message.playbackState.length > 1) {
            message.playbackState = message.playbackState[0].toUpperCase() + message.playbackState.substring(1).toLowerCase();
        }

        this.tvService
            .getCharacteristic(Characteristics.CurrentMediaState)
            .updateValue(
                message &&
                    (message.playbackState === "playing"
                        ? Characteristic.CurrentMediaState.PLAY
                        : message.playbackState === "paused"
                        ? Characteristic.CurrentMediaState.PAUSE
                        : Characteristic.CurrentMediaState.STOP)
            );

        this.stateService && this.stateService.getCharacteristic(Characteristics.State).updateValue(message && message.playbackState ? message.playbackState : "-");
        this.stateService && this.stateService.getCharacteristic(Characteristics.Type).updateValue(message ? (message.album && message.artist ? "Music" : "Video") : "-");
        this.stateService && this.stateService.getCharacteristic(Characteristics.Title).updateValue(message && message.title ? message.title : "-");
        this.stateService && this.stateService.getCharacteristic(Characteristics.Artist).updateValue(message && message.artist ? message.artist : "-");
        this.stateService && this.stateService.getCharacteristic(Characteristics.Album).updateValue(message && message.album ? message.album : "-");
        this.stateService && this.stateService.getCharacteristic(Characteristics.Application).updateValue(message && message.appDisplayName ? message.appDisplayName : "-");
        this.stateService &&
            this.stateService.getCharacteristic(Characteristics.ApplicationBundleId).updateValue(message && message.appBundleIdentifier ? message.appBundleIdentifier : "-");
        this.stateService &&
            this.stateService.getCharacteristic(Characteristics.ElapsedTime).updateValue(message && message.elapsedTime > 0 ? Math.round(message.elapsedTime) : "-");
        this.stateService && this.stateService.getCharacteristic(Characteristics.Duration).updateValue(message && message.duration > 0 ? Math.round(message.duration) : "-");
        this.stateService && this.stateService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(message && message.playbackState === "Playing");
    };
}

module.exports = Device;
