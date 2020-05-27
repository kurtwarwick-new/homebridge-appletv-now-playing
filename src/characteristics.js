let inherits = require("util").inherits;

module.exports = function Charactersitics(api) {
    api.hap.Characteristic.State = function () {
        api.hap.Characteristic.call(this, "State", api.hap.Characteristic.State.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.State.UUID = "0f640472-cb79-4786-9095-4c8c14a7b00c";

    inherits(api.hap.Characteristic.State, api.hap.Characteristic);

    api.hap.Characteristic.Type = function () {
        api.hap.Characteristic.call(this, "Media Type", api.hap.Characteristic.Type.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.Type.UUID = "cb07b525-084f-4e40-83b0-76013d9c6436";

    inherits(api.hap.Characteristic.Type, api.hap.Characteristic);

    api.hap.Characteristic.Title = function () {
        api.hap.Characteristic.call(this, "Title", api.hap.Characteristic.Title.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.Title.UUID = "b6e8eb16-9f0e-4a15-902b-f415c0ac5570";

    inherits(api.hap.Characteristic.Title, api.hap.Characteristic);

    api.hap.Characteristic.Artist = function () {
        api.hap.Characteristic.call(this, "Artist", api.hap.Characteristic.Artist.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.Artist.UUID = "5c9506e7-d60c-4fe0-8614-1677d74867c8";

    inherits(api.hap.Characteristic.Artist, api.hap.Characteristic);

    api.hap.Characteristic.Album = function () {
        api.hap.Characteristic.call(this, "Album", api.hap.Characteristic.Album.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.Album.UUID = "ffcdb20b-bf68-4018-a0be-8bac52bf4fdd";

    inherits(api.hap.Characteristic.Album, api.hap.Characteristic);

    api.hap.Characteristic.Application = function () {
        api.hap.Characteristic.call(this, "Application", api.hap.Characteristic.Application.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.Application.UUID = "3b29ffb8-debf-4512-9572-78fd43294263";

    inherits(api.hap.Characteristic.Application, api.hap.Characteristic);

    api.hap.Characteristic.ApplicationBundleId = function () {
        api.hap.Characteristic.call(this, "Application Bundle Id", api.hap.Characteristic.ApplicationBundleId.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.ApplicationBundleId.UUID = "75448494-3c05-4962-acaf-29dcd7baca66";

    inherits(api.hap.Characteristic.ApplicationBundleId, api.hap.Characteristic);

    api.hap.Characteristic.ElapsedTime = function () {
        api.hap.Characteristic.call(this, "Elapsed Time", api.hap.Characteristic.ElapsedTime.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.ElapsedTime.UUID = "51d56c6c-131b-4b92-bf22-9bcc7e66b877";

    inherits(api.hap.Characteristic.ElapsedTime, api.hap.Characteristic);

    api.hap.Characteristic.Duration = function () {
        api.hap.Characteristic.call(this, "Duration", api.hap.Characteristic.Duration.UUID);

        this.setProps({
            format: api.hap.Characteristic.Formats.STRING,
            perms: [api.hap.Characteristic.Perms.READ, api.hap.Characteristic.Perms.NOTIFY],
        });

        this.value = this.getDefaultValue();
    };

    api.hap.Characteristic.Duration.UUID = "af4bcf1f-bbe6-483b-969c-9149926e3328";

    inherits(api.hap.Characteristic.Duration, api.hap.Characteristic);

    return api.hap.Characteristic;
};
