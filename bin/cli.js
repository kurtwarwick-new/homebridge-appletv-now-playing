#!/usr/bin/env node

try {
    const appleTv = require("node-appletv-x");
    const readline = require("readline-promise");

    const rl = readline.default.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("\nScanning for devices...");

    (async () => {
        let devices = await appleTv.scan();

        if (devices && devices.length) {
            console.log("\nThese Apple TVs were found:\n");

            devices.map((device, index) => console.log(`\t${index + 1} : ${device.name} [${device.uid}]`));

            let index = await rl.questionAsync("\nPair with Apple TV (enter index) : ");
            let parsedIndex = parseInt(index);

            while(isNaN(parsedIndex) || parsedIndex > devices.length) {
                index = await rl.questionAsync("Please try again : ");
                parsedIndex = parseInt(index)
            }

            let device = devices[parseInt(index) - 1];

            console.log(`\nAttempting to connect to ${device.name} [${device.uid}]...`);

            let connectedDevice = await device.openConnection();

            console.log(`Attempting to pair with ${device.name} [${device.uid}]...`);

            let callback = await device.pair();            
            let pin = await rl.questionAsync(`\nEnter PIN shown on ${device.name} [${device.uid}] : `);
            let response = await callback(pin);

            console.log(`\nSuccessfully paired with ${device.name} [${device.uid}].\n`);
            console.log(`Please update the device configuration for ${device.name} [${device.uid}] with the following credentials :\n`);

            console.log(response.credentials.toString());
            console.log("");

        } else {
            console.log("No Apple TVs could be found.");
        }

        process.exit();
    })();
} catch (error) {
    console.error(error);
}
