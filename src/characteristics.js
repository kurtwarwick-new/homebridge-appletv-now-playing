let inherits = require("util").inherits;
let Hap = require("hap-nodejs");

const Charactersitics = {
  Type: function() {
    this.UUID = "cb07b525-084f-4e40-83b0-76013d9c6436";

    Hap.Characteristic.call(this, "Type", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  },
  Title: function() {
    this.UUID = "b6e8eb16-9f0e-4a15-902b-f415c0ac5570";

    Hap.Characteristic.call(this, "Title", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  },
  Artist: function() {
    this.UUID = "5c9506e7-d60c-4fe0-8614-1677d74867c8";

    Hap.Characteristic.call(this, "Artist", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  },
  Album: function() {
    this.UUID = "ffcdb20b-bf68-4018-a0be-8bac52bf4fdd";

    Hap.Characteristic.call(this, "Album", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  },
  Application: function() {
    this.UUID = "3b29ffb8-debf-4512-9572-78fd43294263";

    Hap.Characteristic.call(this, "Application", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  },
  ApplicationBundleId: function() {
    this.UUID = "75448494-3c05-4962-acaf-29dcd7baca66";

    Hap.Characteristic.call(this, "ApplicationBundleId", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  },
  Elapsed: function() {
    this.UUID = "51d56c6c-131b-4b92-bf22-9bcc7e66b877";

    Hap.Characteristic.call(this, "Elapsed", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  },
  Duration: function() {
    this.UUID = "af4bcf1f-bbe6-483b-969c-9149926e3328";

    Hap.Characteristic.call(this, "Duration", this.UUID);

    this.setProps({
      format: Hap.Characteristic.Formats.STRING,
      perms: [Hap.Characteristic.Perms.READ, Hap.Characteristic.Perms.NOTIFY]
    });

    this.value = this.getDefaultValue();
  }
};

inherits(Charactersitics.Type, Hap.Characteristic);
inherits(Charactersitics.Title, Hap.Characteristic);
inherits(Charactersitics.Artist, Hap.Characteristic);
inherits(Charactersitics.Album, Hap.Characteristic);
inherits(Charactersitics.Application, Hap.Characteristic);
inherits(Charactersitics.ApplicationBundleId, Hap.Characteristic);
inherits(Charactersitics.Elapsed, Hap.Characteristic);
inherits(Charactersitics.Duration, Hap.Characteristic);

module.exports = Charactersitics;
