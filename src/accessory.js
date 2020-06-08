class Accessory {
    constructor(type, platform, config, device) {
        this.type = type;
        this.platform = platform;
        this.config = config;
        this.device = device;
        this.power = false;
        this.powerTimer = null;
        this.characteristics = require("./characteristics")(platform.api);

        this.configureAccessory();
    }

    configureAccessory = () => {
        let accessoryUid = this.platform.api.hap.uuid.generate(`${this.device.uid}_apple_tv_${this.type}`);
        let deviceAccessories = this.platform.accessories.filter((accessory) => accessory.context.uid === this.device.uid);

        this.accessory = deviceAccessories.find((_accessory) => _accessory.UUID === accessoryUid);

        if (!this.accessory) {
            this.platform.debug(`creating ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);

            this.accessory = new this.platform.api.platformAccessory(this.config.name, accessoryUid);
            this.accessory.displayName = this.config.name;
            this.accessory.context.uid = this.device.uid;

            this.platform.registerAccessories([this.accessory]);
        } else {
            this.platform.debug(`updating ${this.type} accessory (${this.device.name} [${this.device.uid}]).`);

            this.accessory.displayName = this.config.name;
            this.accessory.name = this.config.name;

            this.platform.updateAccessories([this.accessory]);
        }

        Accessory.prototype.configureServices && Accessory.prototype.configureServices.call(this);

        this.platform.log(`${this.type} accessory (${this.device.name} [${this.device.uid}]) ready.`);
    };
}

module.exports = Accessory;