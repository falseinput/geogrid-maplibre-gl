import { GeoJSONSource, Map } from 'maplibre-gl';
import { MAX_LATTITUDE, MAX_LONGITUDE, MIN_LONGITUDE, PLUGIN_PREFIX } from './constants';
import { Postition } from './types';
import { createMultiLineString } from './geojson';

interface Elements {
    labels: HTMLElement[]
    labelsContainer: HTMLElement;
}

export class GeoGrid {
    private map: Map;
    private previousZoom = 0;
    private config = {
        parallersLayerName: `${PLUGIN_PREFIX}_parallers`,
        parallersSourceName: `${PLUGIN_PREFIX}_parallers_source`,
        parallersStep: (zoomLevel: number) => 40 / Math.pow(Math.floor(zoomLevel) + 1, 2),
        formatLabels: formatDegrees
    };
    private elements: Elements = {
        labels: [],
        labelsContainer: createLabelsContainerElement()
    };
    constructor(map: Map) {
        this.map = map;

        this.map._container.appendChild(this.elements.labelsContainer);
        map.once('load', this.onLoad);
        map.on('zoom', this.onZoom);
        map.on('move', this.updateLabelPositions);
        
        map.on('remove', () => {
            map.off('zoom', this.onZoom);
            map.off('move', this.updateLabelPositions)
        });
    }

    onLoad = () => {
        this.previousZoom = this.map.getZoom();
        const parallersStep = this.config.parallersStep(this.map.getZoom());
   
        this.map.addSource(this.config.parallersSourceName, {
            type: 'geojson',
            data: {
                type: 'MultiLineString',
                coordinates: createParallelsGeometry(parallersStep)
            }
        });

        this.map.addLayer({
            id: this.config.parallersLayerName,
            type: 'line',
            source: this.config.parallersSourceName
        });

        this.drawLabels(parallersStep);
    }

    drawLabels = (stepInDegrees: number) => {
        for (let currentLattitude = 0; currentLattitude < MAX_LATTITUDE; currentLattitude += stepInDegrees) {
            const northY = this.map.project([0, currentLattitude]).y;
            const southY = this.map.project([0, -currentLattitude]).y;

            const elements = [
                createLabelElement(currentLattitude, 0, northY, 'left', this.config.formatLabels),
                createLabelElement(-currentLattitude, 0, southY, 'left', this.config.formatLabels),
                createLabelElement(currentLattitude, 0, northY, 'right', this.config.formatLabels),
                createLabelElement(-currentLattitude, 0, southY, 'right', this.config.formatLabels),
            ];

            elements.forEach(element => {
                this.elements.labels.push(element);
                this.elements.labelsContainer.appendChild(element);
            })
        }
    }

    updateLabelPositions = () => {
        this.elements.labels.forEach(el => {
            el.style.top = `${this.map.project([0, parseFloat(el.getAttribute('latitude')!)]).y}px`
        });
    }

    onZoom = () => {
        const currentZoom = Math.floor(this.map.getZoom());
        const stepsInDegrees = this.config.parallersStep(currentZoom);

        this.removeLabels();
        this.drawLabels(stepsInDegrees);

        if (currentZoom != Math.floor(this.previousZoom)) {
        
            const parallersSource: GeoJSONSource = this.map.getSource(this.config.parallersSourceName) as GeoJSONSource;
            parallersSource.setData(
                createMultiLineString(
                    createParallelsGeometry(stepsInDegrees) 
                )
            );
        }

        this.previousZoom = currentZoom;
    }

    removeLabels = () => {
        this.elements.labels = [];
        this.elements.labelsContainer.innerHTML = '';
    }
}

const createParallelsGeometry = (stepInDegrees: number) => {
    const geometry: Postition[][] = [];
    for (let currentLattitude = 0; currentLattitude < MAX_LATTITUDE; currentLattitude += stepInDegrees) {
        geometry.push([[MIN_LONGITUDE, currentLattitude], [MAX_LONGITUDE, currentLattitude]]);
        geometry.push([[MIN_LONGITUDE, -currentLattitude], [MAX_LONGITUDE, -currentLattitude]]);
    }
    return geometry;
}

const createLabelsContainerElement = () => {
    const el = document.createElement('div');
    el.style.position = 'relative';
   
    return el;
}

const createLabelElement = (
    latitude: number,
    x: number,
    y: number, align: 'left' | 'right',
    format: (degress: number) => string
) => {
    const el = document.createElement('div');
    el.innerText = format(latitude);
    el.setAttribute('latitude', latitude.toFixed(20));
    el.style.position = 'absolute';
    el.style[align] = `${x.toString()}px`;
    el.style.top = `${y.toString()}px`;
    return el;
}

const formatDegrees = (degressFloat: number) => {
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