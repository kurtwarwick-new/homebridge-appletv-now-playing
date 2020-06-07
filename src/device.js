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

        this.configureInformationService(accessory);

        this.config.displayAsTv ? this.configureTVService(accessory) : this.configureStateService(accessory);

        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 5000);

        this.platform.log(`Accessory (${this.device.name} [${this.device.uid}]) ready.`);
    };

    configureInformationService = (accessory) => {
        this.platform.debug(`Configuring the information service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            let accessoryInformationService = accessory.getServiceByUUIDAndSubType(`${accessory.context.uid}_information`);

            if (!accessoryInformationService) {
                accessoryInformationService = new this.platform.api.hap.Service.AccessoryInformation(`${this.device.name} Information`, `${accessory.context.uid}_information`);

                accessory.addService(accessoryInformationService);
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
        this.platform.debug(`Configuring the television service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            let switchService = accessory.getServiceByUUIDAndSubType(`${accessory.context.uid}_switch`);

            if (switchService) {
                this.platform.debug(`Removing the switch service for accessory (${this.device.name} [${this.device.uid}]).`);

                accessory.removeService(switchService);
            }

            this.tvService = accessory.getServiceByUUIDAndSubType(`${accessory.context.uid}_television`);

            if (!this.tvService) {
                this.tvService = new this.platform.api.hap.Service.Television(`${this.device.name} Television`, `${accessory.context.uid}_television`);

                accessory.addService(this.tvService);
            }

            this.tvService
                .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, "Apple")
                .setCharacteristic(this.platform.api.hap.Characteristic.Model, "Apple TV")
                .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.device.uid)
                .setCharacteristic(this.platform.api.hap.Characteristic.Name, this.config.name)
                .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, this.config.name);

            this.tvService.getCharacteristic(this.platform.api.hap.Characteristic.Active).on("set", this.onPower);
            this.tvService.getCharacteristic(this.platform.api.hap.Characteristic.ActiveIdentifier).on("set", this.onInput);

            this.speakerService = accessory.getServiceByUUIDAndSubType(`${accessory.context.uid}_speaker`);

            if (!this.speakerService) {
                this.speakerService = newthis.platform.api.hap.Service.TelevisionSpeaker(`${this.device.name} Television Speaker`, `${accessory.context.uid}_speaker`);

                accessory.addService(this.speakerService);
            }

            this.speakerService
                .setCharacteristic(this.platform.api.hap.Characteristic.Active, this.platform.api.hap.Characteristic.Active.ACTIVE)
                .setCharacteristic(this.platform.api.hap.Characteristic.VolumeControlType, this.platform.api.hap.Characteristic.VolumeControlType.ABSOLUTE);
            this.speakerService.getCharacteristic(this.platform.api.hap.Characteristic.VolumeSelector).on("set", this.onVolumeSelector);

            this.tvService.addLinkedService(this.speakerService);

            if (this.config.inputs && this.config.inputs.length) {
                if (accessory.context.inputs && accessory.context.inputs.length > this.config.inputs.length) {
                    let difference = accessory.context.inputs.length - this.config.inputs.length;

                    for (let index = accessory.context.inputs.length - 1; index > difference - 1; index--) {
                        let inputService = accessory.getServiceByUUIDAndSubType(`${accessory.context.uid}_input_${index}`);

                        if (inputService) {
                            this.platform.debug(`Removing orphansed input service for accessory (${this.device.name} [${this.device.uid}]).`);

                            accessory.removeService(inputService);
                        }
                    }
                }

                accessory.context.inputs = this.config.inputs;

                this.config.inputs.forEach((input, index) => {
                    this.platform.debug(`Configuring input service ${input.name} [${index}] for accessory (${this.device.name} [${this.device.uid}]).`);

                    let inputService = accessory.getServiceByUUIDAndSubType(`${accessory.context.uid}_input_${index}`);

                    if (!inputService) {
                        inputService = new this.platform.api.hap.Service.InputSource(`${this.device.name} '${input.name}' Input`, `${accessory.context.uid}_input_${index}`);

                        accessory.addService(inputService);
                    }

                    inputService
                        .setCharacteristic(this.platform.api.hap.Characteristic.Identifier, index)
                        .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, input.name)
                        .setCharacteristic(this.platform.api.hap.Characteristic.IsConfigured, this.platform.api.hap.Characteristic.IsConfigured.CONFIGURED)
                        .setCharacteristic(this.platform.api.hap.Characteristic.CurrentVisibilityState, this.platform.api.hap.Characteristic.CurrentVisibilityState.SHOWN);

                    // this.inputsService.getCharacteristic(Characteristic.ConfiguredName).on("set", (name, callback) => {
                    //     savedNames[inputReference] = name;
                    //     fs.writeFile(this.customInputsFile, JSON.stringify(savedNames, null, 2), (error) => {
                    //         if (error) {
                    //             this.log.error("Device: %s %s, new Input name saved failed, error: %s", this.host, this.name, error);
                    //         } else {
                    //             this.log.info("Device: %s %s, new Input name saved successful, name: %s reference: %s", this.host, this.name, name, inputReference);
                    //         }
                    //     });
                    //     callback(null);
                    // });

                    this.tvService.addLinkedService(inputService);

                    this.platform.debug(`Input service ${input.name} [${index}] for accessory (${this.device.name} [${this.device.uid}]) configured.`);
                });
            }

            this.platform.debug(`Television service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.debug(`Television service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.debug(error);
        }
    };

    configureStateService = (accessory) => {
        this.platform.debug(`Configuring the state service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            let tvService = accessory.getServiceByUUIDAndSubType(`${accessory.context.uid}_switch`, this.platform.api.hap.Service.Television);

            if (tvService) {
                this.platform.debug(`Removing the television service for accessory (${this.device.name} [${this.device.uid}]).`);

                accessory.removeService(tvService);
            }

            this.switchService = accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.Switch);

            if (!this.switchService) {
                this.switchService = accessory.addService(this.platform.api.hap.Service.Switch, `${accessory.context.uid}_switch`);
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

            this.platform.debug(`State service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.debug(`State service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.debug(error);
        }
    };

    onVolumeSelector = async (value, next) => {
        if (this.power) {
            switch (value) {
                case this.platform.api.hap.Characteristic.VolumeSelector.INCREMENT:
                    this.platform.debug(`Incrementing volume for accessory (${this.device.name} [${this.device.uid}]).`);
                    await this.device.sendKeyPressAndRelease(12, 0xe9);
                    break;
                case this.platform.api.hap.Characteristic.VolumeSelector.DECREMENT:
                    this.platform.debug(`Decrementing volume for accessory (${this.device.name} [${this.device.uid}]).`);
                    await this.device.sendKeyPressAndRelease(12, 0xea);
                    break;
            }
        }

        next();
    };

    onInput = async (value, next) => {
        this.platform.debug(`Opening app ${value} accessory (${this.device.name} [${this.device.uid}]).`);

        let input = this.config.inputs[value];
        let row = input.index % 5;
        let column = (input.index - row) / 5;

        this.platform.debug(`TV.`);
        await this.device.sendKeyCommand(appletv.AppleTV.Key.Tv);
        this.platform.debug(`TV.`);
        await this.device.sendKeyCommand(appletv.AppleTV.Key.Tv);

        for (let i = 0; i < row; i++) {
            this.platform.debug(`right.`);
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Right);
        }

        for (let i = 0; i < column; i++) {
            this.platform.debug(`down.`);
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Down);
        }

        next();
    };

    onPower = async (value, next) => {
        clearTimeout(this.powerTimer);

        this.platform.debug(`Turning accessory (${this.device.name} [${this.device.uid}]) ${value ? "on" : "off"}.`);

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

        this.tvService &&
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

        this.switchService && this.switchService.getCharacteristic(Characteristics.State).updateValue(message && message.playbackState ? message.playbackState : "-");
        this.switchService && this.switchService.getCharacteristic(Characteristics.Type).updateValue(message ? (message.album && message.artist ? "Music" : "Video") : "-");
        this.switchService && this.switchService.getCharacteristic(Characteristics.Title).updateValue(message && message.title ? message.title : "-");
        this.switchService && this.switchService.getCharacteristic(Characteristics.Artist).updateValue(message && message.artist ? message.artist : "-");
        this.switchService && this.switchService.getCharacteristic(Characteristics.Album).updateValue(message && message.album ? message.album : "-");
        this.switchService && this.switchService.getCharacteristic(Characteristics.Application).updateValue(message && message.appDisplayName ? message.appDisplayName : "-");
        this.switchService &&
            this.switchService.getCharacteristic(Characteristics.ApplicationBundleId).updateValue(message && message.appBundleIdentifier ? message.appBundleIdentifier : "-");
        this.switchService &&
            this.switchService.getCharacteristic(Characteristics.ElapsedTime).updateValue(message && message.elapsedTime > 0 ? Math.round(message.elapsedTime) : "-");
        this.switchService && this.switchService.getCharacteristic(Characteristics.Duration).updateValue(message && message.duration > 0 ? Math.round(message.duration) : "-");
        this.switchService && this.switchService.getCharacteristic(this.platform.api.hap.Characteristic.Active).updateValue(message && message.playbackState === "Playing");
    };
}

module.exports = Device;
