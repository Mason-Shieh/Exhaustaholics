export const envelopeTemplates = {
  sports_coupe: {
    wheelbaseInches: 104,
    trackWidthInches: 62,
    groundClearanceInches: 4.8,
    tunnelKeepOut: { widthInches: 8, heightInches: 6 },
    axleKeepOut: { frontLengthInches: 10, rearLengthInches: 12, widthInches: 54 },
  },
  sedan: {
    wheelbaseInches: 110,
    trackWidthInches: 63,
    groundClearanceInches: 5.2,
    tunnelKeepOut: { widthInches: 8, heightInches: 6 },
    axleKeepOut: { frontLengthInches: 11, rearLengthInches: 13, widthInches: 55 },
  },
  hatchback: {
    wheelbaseInches: 105,
    trackWidthInches: 61,
    groundClearanceInches: 5.5,
    tunnelKeepOut: { widthInches: 7, heightInches: 5.5 },
    axleKeepOut: { frontLengthInches: 10, rearLengthInches: 12, widthInches: 53 },
  },
  truck: {
    wheelbaseInches: 127,
    trackWidthInches: 68,
    groundClearanceInches: 8.5,
    tunnelKeepOut: { widthInches: 10, heightInches: 8 },
    axleKeepOut: { frontLengthInches: 13, rearLengthInches: 15, widthInches: 60 },
  },
  suv: {
    wheelbaseInches: 112,
    trackWidthInches: 64,
    groundClearanceInches: 8,
    tunnelKeepOut: { widthInches: 9, heightInches: 7 },
    axleKeepOut: { frontLengthInches: 12, rearLengthInches: 14, widthInches: 57 },
  },
} as const;

export type VehicleClass = keyof typeof envelopeTemplates;