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

        this.accessory = deviceAccessories.find((_accessory) => _accessory.UUID === accessoryUid);

        if (!this.accessory) {
            this.platform.debug(`Creating accessory (${this.device.name} [${this.device.uid}]).`);

            this.accessory = new this.platform.api.platformAccessory(this.config.name, accessoryUid, this.platform.api.hap.Accessory.Categories.TELEVISION);
            this.accessory.displayName = this.config.name;
            this.accessory.context.uid = this.device.uid;

            this.platform.registerAccessories([this.accessory]);
        } else {
            this.platform.debug(`Updating accessory (${this.device.name} [${this.device.uid}]).`);

            this.accessory.displayName = this.config.name;
            this.accessory.name = this.config.name;

            this.platform.updateAccessories([this.accessory]);
        }

        this.configureServices();

        this.platform.log(`Accessory (${this.device.name} [${this.device.uid}]) ready.`);
    };

    configureServices = () => {
        this.configureAccessoryInformationService();
        this.configureTVService();
        this.configureInputServices();
        this.configureSwitchService();

        this.powerTimer = setTimeout(() => this.device.sendIntroduction().then(this.onDeviceInfo), 5000);
    };

    configureAccessoryInformationService = () => {
        this.platform.debug(`Configuring accessory information service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            this.accessory
                .getService(this.platform.api.hap.Service.AccessoryInformation)
                .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, "Apple")
                .setCharacteristic(this.platform.api.hap.Characteristic.Model, "Apple TV")
                .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.device.uid)
                .setCharacteristic(this.platform.api.hap.Characteristic.Name, this.config.name);

            this.platform.debug(`Accessory information service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.log(`Accessory information service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.log(error);
        }
    };

    configureTVService = () => {
        if (!this.config.showTvAccessory) {
            let tvService = this.accessory.getService(this.platform.api.hap.Service.Television);

            if (tvService) {
                this.platform.debug(`Removing television service for accessory (${this.device.name} [${this.device.uid}]).`);
                this.accessory.removeService(tvService);
            }

            return;
        }

        this.platform.debug(`Configuring television service for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            this.tvService = this.accessory.getService(this.platform.api.hap.Service.Television);

            if (!this.tvService) {
                this.tvService = this.accessory.addService(this.platform.api.hap.Service.Television, `${this.device.name} Television`);
            }

            this.tvService
                .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, "Apple")
                .setCharacteristic(this.platform.api.hap.Characteristic.Model, "Apple TV")
                .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.device.uid)
                .setCharacteristic(this.platform.api.hap.Characteristic.Name, this.config.name)
                .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, this.config.name);

            this.tvService.getCharacteristic(this.platform.api.hap.Characteristic.Active).on("set", this.onPower);
            this.tvService.getCharacteristic(this.platform.api.hap.Characteristic.ActiveIdentifier).on("set", this.onInput);

            this.platform.debug(`Television service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.log(`Television service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.log(error);
        }
    };

    configureInputServices = () => {
        if (!this.config.showTvAccessory) {
            return;
        }

        this.platform.debug(`Configuring input service(s) for accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            if (this.config.inputs && this.config.inputs.length) {
                if (this.accessory.context.inputs && this.accessory.context.inputs.length > this.config.inputs.length) {
                    let difference = this.accessory.context.inputs.length - this.config.inputs.length;

                    for (let index = this.accessory.context.inputs.length - 1; index > difference - 1; index--) {
                        let inputService = accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.InputSource, `${this.accessory.context.uid}_input_${index}`);

                        if (inputService) {
                            this.platform.debug(`Removing orphansed input service for accessory (${this.device.name} [${this.device.uid}]).`);
                            this.accessory.removeService(inputService);
                        }
                    }
                }

                this.accessory.context.inputs = this.config.inputs;

                this.config.inputs.forEach((input, index) => {
                    this.platform.debug(`Configuring input service ${input.name} [${index}] for accessory (${this.device.name} [${this.device.uid}]).`);

                    let inputService = this.accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.InputSource, `${this.accessory.context.uid}_input_${index}`);

                    if (!inputService) {
                        inputService = this.accessory.addService(
                            this.platform.api.hap.Service.InputSource,
                            `${this.device.name} '${input.name}' Input`,
                            `${accessory.context.uid}_input_${index}`
                        );
                    }

                    inputService
                        .setCharacteristic(this.platform.api.hap.Characteristic.Identifier, index)
                        .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, input.name)
                        //.setCharacteristic(this.platform.api.hap.Characteristic.IsConfigured, this.platform.api.hap.Characteristic.IsConfigured.CONFIGURED)
                        .setCharacteristic(this.platform.api.hap.Characteristic.CurrentVisibilityState, this.platform.api.hap.Characteristic.CurrentVisibilityState.SHOWN);

                    //inputService.getCharacteristic(Characteristic.ConfiguredName).on("set", (value, next) => this.onInputConfiguredName(index, value, next));

                    this.tvService.addLinkedService(inputService);

                    this.platform.debug(`Input service ${input.name} [${index}] for accessory (${this.device.name} [${this.device.uid}]) configured.`);
                });
            } else if (this.accessory.context.inputs) {
                for (let index = 0; index < this.accessory.context.inputs.length; index++) {
                    let inputService = accessory.getService(this.platform.api.hap.Service.InputSource);

                    if (inputService) {
                        this.platform.debug(`Removing orphansed input service for accessory (${this.device.name} [${this.device.uid}]).`);
                        this.accessory.removeService(this.platform.api.hap.Service.InputSource);
                    }
                }
            }
        } catch (error) {
            this.platform.log(`Input service(s) for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.log(error);
        }
    };

    configureSwitchService = () => {
        this.platform.debug(`Configuring switch service for accessory (${this.device.name} [${this.device.uid}]).`);

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

            this.platform.debug(`Switch service for accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.debug(`Switch service for accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.debug(error);
        }
    };

    onInputConfiguredName = async (index, value, next) => {
        this.accessory.context.inputs[index].name = value;

        next();
    };

    onInput = async (value, next) => {
        this.platform.debug(`Opening app ${value} accessory (${this.device.name} [${this.device.uid}]).`);

        let input = this.config.inputs[value];
        let column = input.index % 5;
        let row = (input.index - column) / 5;

        await this.device.sendKeyCommand(appletv.AppleTV.Key.Tv);

        setTimeout(async () => {
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Tv);

            for (let i = 0; i < column - 1; i++) {
                await this.device.sendKeyCommand(appletv.AppleTV.Key.Right);
            }

            for (let i = 0; i < row; i++) {
                await this.device.sendKeyCommand(appletv.AppleTV.Key.Down);
            }
        }, 1000);

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

        if (!this.config.showTvAccessory) {
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

module.exports = Device;
