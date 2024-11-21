import { classnames } from '../constants';

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
    format: (degress: number) => string
) => {
    const alignTopOrBottom = align === 'top' || align === 'bottom';
    const el = document.createElement('div');
    el.classList.add(classnames.label, `${classnames.label}--${align}`);
    el.innerText = format(value);
    el.setAttribute(alignTopOrBottom ? 'longitude' : 'latitude', value.toFixed(20));
    el.style.position = 'absolute';
    el.style[alignTopOrBottom ? 'left' : align ] = `${x.toString()}px`;
    el.style[alignTopOrBottom ? align : 'top'] = `${y.toString()}px`;
    return el;
}