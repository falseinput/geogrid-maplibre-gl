export const formatDegrees = (degressFloat: number) => {
    const degrees =  Math.floor(degressFloat);
    const degreessFractionalPart = degressFloat - degrees;
    const minutesFloat = degreessFractionalPart * 60;
    const minutes = Math.floor(minutesFloat);
    const minutesFractionalPart = minutesFloat - minutes;
    const seconds = Math.round(minutesFractionalPart - Math.floor(minutesFractionalPart));

    let output = `${degrees.toString()}°`;

    if (minutes !== 0) {
        output += ` ${minutes}′`;
    }

    if (seconds !== 0) {
        output += ` ${seconds}′′`;
    }

    return output;
}
