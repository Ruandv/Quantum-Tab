import { CssStyle, Position, Dimensions, DEFAULT_WIDGET_CONSTRAINTS } from "./common";

export const defaultPosition: Position = { x: 50, y: 50 };
export const defaultStyle: CssStyle = {
    border: 0,
    radius: 12,
    blur: 10,
    backgroundColorRed: 30,
    backgroundColorGreen: 214,
    backgroundColorBlue: 230,
    transparency: 0.5,
    alignment: 'center',
    justify: "center"
};
export const defaultDimensions: Dimensions = { width: DEFAULT_WIDGET_CONSTRAINTS.DEFAULT_WIDTH, height: DEFAULT_WIDGET_CONSTRAINTS.DEFAULT_HEIGHT };
