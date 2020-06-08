const appletv = require("node-appletv-x");

let Characteristics;

class TelevisionAccessory extends Accessory {
    constructor() {
        this.type = "television";
    }

    configureServices = () => {
        this.configureAccessoryInformationService();
        this.configureTVService();
        this.configureInputServices();

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

    configureTVService = () => {
        this.platform.debug(`configuring television service for ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);

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

            this.platform.debug(`television service for ${this.type} accessory (${this.device.name} [${this.device.uid}]) configured.`);
        } catch (error) {
            this.platform.log(`television service for ${this.type} accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.log(error);
        }
    };

    configureInputServices = () => {
        this.platform.debug(`configuring input service(s) for ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);

        try {
            if (this.config.inputs && this.config.inputs.length) {
                if (this.accessory.context.inputs && this.accessory.context.inputs.length > this.config.inputs.length) {
                    let difference = this.accessory.context.inputs.length - this.config.inputs.length;

                    for (let index = this.accessory.context.inputs.length - 1; index > difference - 1; index--) {
                        let inputService = accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.InputSource, `${this.accessory.context.uid}_input_${index}`);

                        if (inputService) {
                            this.platform.debug(`removing orphansed input service for ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);
                            this.accessory.removeService(inputService);
                        }
                    }
                }

                this.accessory.context.inputs = this.config.inputs;

                this.config.inputs.forEach((input, index) => {
                    this.platform.debug(`configuring input service ${input.name} [${index}] for ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);

                    let inputService = this.accessory.getServiceByUUIDAndSubType(this.platform.api.hap.Service.InputSource, `${this.accessory.context.uid}_input_${index}`);

                    if (!inputService) {
                        inputService = this.accessory.addService(
                            this.platform.api.hap.Service.InputSource,
                            `${this.device.name} '${input.name}' Input`,
                            `${this.accessory.context.uid}_input_${index}`
                        );
                    }

                    inputService
                        .setCharacteristic(this.platform.api.hap.Characteristic.Identifier, index)
                        .setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, input.name)
                        .setCharacteristic(this.platform.api.hap.Characteristic.CurrentVisibilityState, this.platform.api.hap.Characteristic.CurrentVisibilityState.SHOWN);

                    this.tvService.addLinkedService(inputService);

                    this.platform.debug(`input service ${input.name} [${index}] for ${this.type} accessory (${this.device.name} [${this.device.uid}]) configured.`);
                });
            } else if (this.accessory.context.inputs) {
                for (let index = 0; index < this.accessory.context.inputs.length; index++) {
                    let inputService = accessory.getService(this.platform.api.hap.Service.InputSource);

                    if (inputService) {
                        this.platform.debug(`removing orphansed input service for ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);
                        this.accessory.removeService(this.platform.api.hap.Service.InputSource);
                    }
                }
            }
        } catch (error) {
            this.platform.log(`input service(s) for ${this.type} accessory (${this.device.name} [${this.device.uid}]) could not be configured.`);
            this.platform.log(error);
        }
    };

    onInputConfiguredName = async (index, value, next) => {
        this.accessory.context.inputs[index].name = value;

        next();
    };

    onInput = async (value, next) => {
        this.platform.debug(`opening app ${value} for ${this.type}  accessory (${this.device.name} [${this.device.uid}]).`);

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

        this.platform.debug(`turning ${this.type} accessory (${this.device.name} [${this.device.uid}]) ${value ? "on" : "off"}.`);

        if (value && !this.power) {
            await this.device.sendKeyCommand(appletv.AppleTV.Key.LongTv);
            await this.device.sendKeyCommand(appletv.AppleTV.Key.Select);
        } else if (!value && this.power) {
            await this.device.sendKeyPressAndRelease(1, 0x83);
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

        this.tvService
            .getCharacteristic(this.platform.api.hap.Characteristics.CurrentMediaState)
            .updateValue(
                message &&
                    (message.playbackState === "playing"
                        ? this.platform.api.hap.Characteristic.CurrentMediaState.PLAY
                        : message.playbackState === "paused"
                        ? this.platform.api.hap.Characteristic.CurrentMediaState.PAUSE
                        : this.platform.api.hap.Characteristic.CurrentMediaState.STOP)
            );
    };
}

module.exports = TelevisionAccessory;
