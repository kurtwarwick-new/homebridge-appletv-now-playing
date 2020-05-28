# Homebridge Apple TV - Now Playing

A [homebridge](https://github.com/nfarina/homebridge) plugin that exposes Apple TV devices to Homekit, along with it's current Power State, Playback State and Now Playing Information.

## Overview

This plugin exposes the Apple TV as a switch device, with the switch power state representing the Apple TV power state. The playback state is exposed through the Active charceristic and all other now playing information get's exposed through customised characteristics.

The media type is calculated by checking artist and album information. This characterist comes in handy if you would like to setup automations that dim light for only videos and not music.

## Sample Configuration

```yaml
{    
  "platform": "AppleTvNowPlayingPlatform",
  "debug": true, 
  "devices": [        
    {            
      "name": "Lounge Apple TV",            
      "credentials": "C8309D5A-4AAD-4338-8B45...."        
    }    
  ]
}
```
### Configuration Definition

* **platform**: The identifier for the platform (*AppleTvNowPlayingPlatform*).
* **debug** [*optional*]: Enables limited debugging.
* **devices**: A list of devices you would like to register with the platform.     
  * **name**: The name you would like to expose for the device.
  * **credentials**: The credentials neede to authorise connection to the device.

## Retrieving credentials

In order to retrieve credentials for your Apple TV, please follow these step

1. Execute the cli application bundled with this package from the package directory
```
/path/to/homebridge-appletv-now-playing $ node .\bin\cli.js
```
2. Choose the device with which you would like to pair.
3. Enter the PIN shown on your device.

Example:

```
/path/to/homebridge-appletv-now-playing $ node .\bin\cli.js

Scanning for devices...
These Apple TVs were found:

        1 : Lounge [C8309D5A-XXXX-XXXX-XXXX-2F7F2E813680]

Pair with Apple TV (enter index) : 1

Attempting to connect to Lounge [C8309D5A-XXXX-XXXX-XXXX-2F7F2E813680]...
Attempting to pair with Lounge [C8309D5A-XXXX-XXXX-XXXX-2F7F2E813680]...

Enter PIN shown on Lounge [C8309D5A-XXXX-XXXX-XXXX-2F7F2E813680] : 1234

Successfully paired with Lounge [C8309D5A-XXXX-XXXX-XXXX-2F7F2E813680].

Please update your configuration with the following credentials for this device:

C8309D5A-XXXX-XXXX-XXXX-2F7F2E813680:27y934hj523843kj2432423j4234kj23423kj4234j......
```
