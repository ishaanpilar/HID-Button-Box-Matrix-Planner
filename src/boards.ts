// Board profiles: which pins are safe to use for a button matrix, and how
// each board's firmware should talk to the host as a USB HID gamepad.
//
// These pin lists are deliberately conservative — they exclude pins with
// board-specific caveats (strapping pins, flash/PSRAM pins, native-USB D+/D-,
// the only hardware serial, etc.) so a generated wiring plan is safe by
// default. Always cross-check against your exact board's pinout diagram
// before soldering, especially for RP2040 (pinout varies a lot in
// "Pro Micro"-style boards) and ESP32-S3 (varies by flash/PSRAM module).

export type BoardId = "pro-micro" | "rp2040" | "esp32-s3";

export interface BoardProfile {
  id: BoardId;
  name: string;
  shortName: string;
  /** Pin labels usable for matrix rows/cols, in the order they'll be assigned. */
  matrixPins: string[];
  /** Absolute cap on HID button count this sketch template supports. */
  maxHidButtons: number;
  hidStrategy: "arduino-joystick" | "tinyusb-gamepad";
  notes: string[];
}

export const BOARDS: Record<BoardId, BoardProfile> = {
  "pro-micro": {
    id: "pro-micro",
    name: "SparkFun Pro Micro / Arduino Leonardo (ATmega32U4)",
    shortName: "Pro Micro",
    // Excludes pin 0/1 (RX/TX, shared with USB-serial debugging) by default.
    matrixPins: [
      "2", "3", "4", "5", "6", "7", "8", "9",
      "10", "14", "15", "16", "18", "19", "20", "21",
    ],
    maxHidButtons: 32,
    hidStrategy: "arduino-joystick",
    notes: [
      "Requires the \"Joystick\" library by Matthew Heironimus (Arduino Library Manager: \"Joystick\").",
      "Pins 0 (RX) / 1 (TX) are reserved here in case you want Serial for debugging — free them up if you need 2 more matrix pins.",
      "Native USB HID — no bootloader/driver tricks needed on 32U4 boards.",
    ],
  },
  rp2040: {
    id: "rp2040",
    name: "RP2040 (\"Pro Micro\"-style boards: Adafruit KB2040, SparkFun Pro Micro RP2040, etc.)",
    shortName: "RP2040",
    // Generic GPIO numbers. Exact silkscreen labels vary by board — map these
    // logical GP numbers to your specific board's pinout diagram.
    matrixPins: [
      "GP0", "GP1", "GP2", "GP3", "GP4", "GP5", "GP6", "GP7",
      "GP8", "GP9", "GP10", "GP26", "GP27", "GP28", "GP29",
    ],
    maxHidButtons: 32,
    hidStrategy: "tinyusb-gamepad",
    notes: [
      "Requires the \"Adafruit TinyUSB Library\" (Arduino Library Manager) and Tools > USB Stack: \"Adafruit TinyUSB\".",
      "GPIO numbers are logical GP numbers from the Earle Philhower arduino-pico core — confirm against your specific board's silkscreen, boards differ.",
      "Avoid GP23-25 on boards derived directly from Raspberry Pi Pico (SMPS/LED/VBUS-sense) — already excluded here.",
    ],
  },
  "esp32-s3": {
    id: "esp32-s3",
    name: "ESP32-S3 (native USB)",
    shortName: "ESP32-S3",
    // Conservative safe GPIO set: excludes strapping pins (0,3,45,46), native
    // USB D+/D- (19,20), and the flash/PSRAM range commonly reserved on
    // modules with octal PSRAM (26-32+). Check your module variant.
    matrixPins: [
      "1", "2", "4", "5", "6", "7", "8", "9",
      "10", "11", "12", "13", "14", "15", "16", "17",
      "18", "21", "35", "36", "37",
    ],
    maxHidButtons: 32,
    hidStrategy: "tinyusb-gamepad",
    notes: [
      "Requires the \"Adafruit TinyUSB Library\" and Tools > USB Mode: \"USB-OTG (TinyUSB)\".",
      "Pin safety depends on your exact module (WROOM-1 vs N16R8 etc.) — GPIO26-32 are frequently reserved for octal PSRAM and are excluded here; GPIO35-37 are only free on modules without octal PSRAM. Verify against your module's datasheet.",
      "GPIO0/3/45/46 (strapping) and 19/20 (native USB D-/D+) are excluded.",
    ],
  },
};

export const BOARD_LIST = Object.values(BOARDS);
