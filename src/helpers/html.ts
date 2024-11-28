import { classnames } from '../constants';
import { LabelStyle } from '../main';

export const createLabelsContainerElement = () => {
    const el = document.createElement('div');
    el.classList.add(classnames.container, classnames.containerOverride);
    el.style.position = 'relative';
    el.style.height = '100%';
    el.style.pointerEvents = 'none';
   
    return el;
}

export const createLabelElement = (
    value: number,
    x: number,
    y: number, 
    align: 'left' | 'right' | 'top' | 'bottom',
    format: (degress: number) => string,
    labelStyle: LabelStyle
) => {
    const alignTopOrBottom = align === 'top' || align === 'bottom';
    const el = document.createElement('div');
    el.classList.add(classnames.label, `${classnames.label}--${align}`);

    console.log(labelStyle);

    if (labelStyle.color) {
        el.style.color = labelStyle.color;
    }
    if (labelStyle.fontFamily) {
        el.style.fontFamily = labelStyle.fontFamily;
    }
    if (labelStyle.fontSize) {
        el.style.fontSize = labelStyle.fontSize;
    }
    if (labelStyle.textShadow) {
        el.style.textShadow = labelStyle.textShadow;
    }

    el.innerText = format(value);
    el.setAttribute(alignTopOrBottom ? 'longitude' : 'latitude', value.toFixed(20));
    el.style.position = 'absolute';
    el.style[alignTopOrBottom ? 'left' : align ] = `${x.toString()}px`;
    el.style[alignTopOrBottom ? align : 'top'] = `${y.toString()}px`;

    return el;
}