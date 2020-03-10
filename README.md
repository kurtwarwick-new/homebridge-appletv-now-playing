# Homebridge Apple TV - Now Playing

A [homebridge](https://github.com/nfarina/homebridge) that exposes Apple TV devices to Homekit, along with it's current Power State, Playback State and Now Playing Information.

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


### MORE TO COME. WIP
