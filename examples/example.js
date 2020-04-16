const lp = require("./launchpadder");

currentColor = 5;

lp.on("connected", (e) => {
  // Setup for panel
  lp.led.clear(); // Clear the whole panel
  lp.led.on(99, 22); // Set top right led to green
});
lp.on("buttonDown", (event) => {
  if (event.type === "pad") {
    console.log(lp.led.getColor(event.pad));
    lp.led.keys[event.arrayIndex].color > 0
      ? lp.led.off(event.pad)
      : lp.led.on(event.pad, currentColor);
  }
  if (event.pad === 98) {
    lp.led.clear();
  }
  if (event.pad === 97) {
    lp.led.keys.map((key) => {
      if (key.pad !== 99) {
        lp.led.on(key.pad, currentColor);
      }
    });
  }
  if (event.pad === 96) {
    lp.led.keys.map((key) => {
      if (key.pad !== 99) {
        lp.led.pulse(key.pad, currentColor);
      }
    });
  }
  if (event.pad === 95) {
    lp.led.keys.map((key) => {
      if (key.pad !== 99) {
        lp.led.flash(key.pad, currentColor);
      }
    });
  }
  if (event.pad === 93) {
    lp.led.sendText("Hello dev!", currentColor, 7);
  }
  if (event.pad === 94) {
    active = true;
    activeColor = currentColor;
    lp.led.keys.map((key) => {
      if (key.type == "pad") {
        lp.led.on(key.pad, activeColor);
        activeColor += 1;
        console.log(activeColor);
      }
    });
    currentColor += 64;
    if (currentColor > 127) {
      currentColor = 0;
    }
  }
  if (event.pad === 89) {
    lp.page.save();
    console.log(lp.page.data);
  }
  if (event.pad === 79) {
    lp.page.load(1);
  }
  if (event.pad === 69) {
    console.log(lp.page.data[0].data[0]);
  }
  if (event.pad === 91 || event.pad === 92) {
    console.log("color change", currentColor);
    event.pad === 91 ? (currentColor += 1) : (currentColor -= 1);
    lp.led.on(91, currentColor);
    lp.led.on(92, currentColor);
    lp.led.on(99, currentColor);
  } else {
    //lp.led.off(event.pad);
  }
});
lp.on("buttonUp", (event) => {
  //console.log("recived event: ", event);
});

lp.connect(1, 1);
