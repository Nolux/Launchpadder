const midi = require("midi");
const events = require("events");
const _ = require("lodash");
const fs = require("fs");
const settings = require("./settings");

const launchpad = new events.EventEmitter();

// Setup input/output MIDI
const input = new midi.Input();
const output = new midi.Output();

// Connect to Launchpad over MIDI
const init = (midiIn, midiOut) => {
  // Open the first available input port.
  input.openPort(midiIn);

  output.openPort(midiOut);

  input.ignoreTypes(false, true, false);

  // Set Launchpad to programmer mode
  output.sendMessage([240, 0, 32, 41, 2, 13, 14, 1, 247]);

  // Callback for messages recived over MIDI
  input.on("message", (deltaTime, message) => {
    // Get current pressed key from State
    event = {
      ..._.find(keys, { pad: message[1] }),
    };

    // Switch depending on message type
    switch (message[0]) {
      case 144: // Regular Pad
        switch (message[2]) {
          case 127:
            launchpad.emit("buttonDown", event);
            break;
          case 0:
            launchpad.emit("buttonUp", event);
            break;
          default:
            break;
        }
        break;
      case 176: // Option Pad
        switch (message[2]) {
          case 127:
            launchpad.emit("buttonDown", event);
            break;
          case 0:
            launchpad.emit("buttonUp", event);
            break;
          default:
            break;
        }
        break;
      default:
        // unknown
        console.log("Received unknown midi data", message);
        break;
    }
  });
  launchpad.emit("Connected", { midiIn: midiIn, midiOut: midiOut });
};

launchpad.connect = (midiIn = 1, midiOut = 1) => {
  retry = setInterval(() => {
    try {
      console.log(
        `Trying to connect to "${input.getPortName(
          midiIn
        )}" and "${output.getPortName(midiOut)}"`
      );
      init(midiIn, midiOut);
      clearInterval(retry);
    } catch (err) {
      console.log("Failed to connect \nRetrying in 2500ms");
    }
  }, settings.reconnectInterval);
};

// Setup state for leds
let keys = require("./keys.json");

// Assign indexes needed for callbacks
for (let i = 0; i < keys.length; i++) {
  keys[i].arrayIndex = i;
}

// Update state function
const changeState = ({ pad, color }) => {
  index = _.findIndex(keys, { pad: pad });
  keys[index] = {
    ...keys[index],
    color: color,
  };
};

launchpad.led = {
  on: (number, color) => {
    // Turn on Pad
    changeState({ pad: number, color });
    output.sendMessage([144, number, color]);
  },
  off: (number) => {
    // Turn off Pad
    changeState({ pad: number, color: 0 });
    output.sendMessage([144, number, 0]);
  },
  flash: (number, color) => {
    // Flash single Pad
    // Turn pad off first to enable flashing
    output.sendMessage([144, number, 0]);
    changeState({ pad: number, color });
    // Flash Pad
    output.sendMessage([145, number, color]);
  },
  pulse: (number, color) => {
    // Pulse one Pad
    changeState({ pad: number, color });
    output.sendMessage([146, number, color]);
  },
  sendText: (text, color, speed = 7, loop = 0) => {
    // Display text on the Launchpad
    asciiArray = text.split("").map((letter) => letter.charCodeAt(0));
    array = [
      240, // Start of setup
      0,
      32,
      41,
      2,
      13, // end of setup
      speed, //1-9
      loop, // Loop 1-0
      7, // Speed 1-144
      0, // color spec mode
      color,
    ];
    asciiArray.map((e) => array.push(e));
    array.push(247);

    console.log("sending: ", array);
    output.sendMessage(array);
  },
  clear: () => {
    // clear current page
    keys.map((key) => {
      if (key.type !== "led") {
        changeState({ pad: key.pad, color: 0 });
        output.sendMessage([146, key.pad, 0]);
      }
    });
  },
  getColor: (pad) => {
    // Get pressed Pad color
    selectedPad = _.find(keys, { pad });
    return selectedPad.color;
  },
  ping: () => {
    //TODO: needs to return some sort of time
    output.sendMessage([240, 126, 127, 6, 1, 247]);
  },
  keys: keys,
};

launchpad.page = {
  save: () => {
    // Push current page data to data array
    console.log(this);
    launchpad.page.data.push({
      pageNumber: launchpad.page.data.length + 1,
      data: keys.concat(),
    });
  },

  load: (pageNumber, pagedata = []) => {
    // Load page data from internal state or json data
    pageLoaded = _.find(launchpad.page.data, { pageNumber });
    if (pageLoaded) {
      console.log(pageLoaded.data[0]);
      console.log(
        pageLoaded.data[0].color === keys[pageLoaded.data[0].arrayIndex].color
      );
      if (pagedata.length > 0) {
        // Load pagedata from load command
        //TODO:
      } else {
        // Load from saved page data
        pageLoaded.data.map((key) => {
          if (key.color !== keys[key.arrayIndex].color) {
            launchpad.led.on(key.pad, key.color);
          }
        });
      }
    }
  },

  getPages: () => {
    // Get current pages
    return { pages: launchpad.page.data, count: launchpad.page.data.length };
  },
  data: [],
};

// Check if panel is still connected
setInterval(() => {
  console.log(output.isPortOpen()); // this will always be true unless input/output.closePort() is called

  // Send set programmer mode
  output.sendMessage([240, 0, 32, 41, 2, 13, 14, 1, 247]);
}, settings.reconnectInterval);

module.exports = launchpad;
