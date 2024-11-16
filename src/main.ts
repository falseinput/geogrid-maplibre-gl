import { GeoJSONSource, Map } from 'maplibre-gl';
import { MAX_LATTITUDE, MAX_LONGITUDE, MIN_LATTITUDE, MIN_LONGITUDE, PLUGIN_PREFIX } from './constants';
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
        meridiansLayerName: `${PLUGIN_PREFIX}_meridians`,
        meridiansSourceName: `${PLUGIN_PREFIX}_meridians_source`,
        gridDensity: getGridDensity,
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
        map.on('move', this.onMove);
        
        map.on('remove', () => {
            map.off('zoom', this.onZoom);
            map.off('move', this.onMove)
        });
    }

    onLoad = () => {
        this.previousZoom = this.map.getZoom();
        const densityInDegrees = this.config.gridDensity(this.map.getZoom());
   
        this.map.addSource(this.config.parallersSourceName, {
            type: 'geojson',
            data: {
                type: 'MultiLineString',
                coordinates: createParallelsGeometry(densityInDegrees)
            }
        });

        this.map.addLayer({
            id: this.config.parallersLayerName,
            type: 'line',
            source: this.config.parallersSourceName
        });

        this.map.addSource(this.config.meridiansSourceName, {
            type: 'geojson',
            data: {
                type: 'MultiLineString',
                coordinates: createMeridiansGeometry(densityInDegrees)
            }
        });

        this.map.addLayer({
            id: this.config.meridiansLayerName,
            type: 'line',
            source: this.config.meridiansSourceName
        });

        this.drawLabels(densityInDegrees);
    }

    drawLabels = (densityInDegrees: number) => {
        for (let currentLattitude = 0; currentLattitude < MAX_LATTITUDE; currentLattitude += densityInDegrees) {
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

        for (let currentLongitude = 0; currentLongitude < MAX_LONGITUDE; currentLongitude += densityInDegrees) {
            const eastX = this.map.project([currentLongitude, 0]).x;
            const westX = this.map.project([-currentLongitude, 0]).x;
        
            const elements = [
                createLabelElement(currentLongitude, eastX, 0, 'top', this.config.formatLabels),
                createLabelElement(-currentLongitude, westX, 0, 'top', this.config.formatLabels),
                createLabelElement(currentLongitude, eastX, 0, 'bottom', this.config.formatLabels),
                createLabelElement(-currentLongitude, westX, 0, 'bottom', this.config.formatLabels),
            ];
        
            elements.forEach(element => {
                this.elements.labels.push(element);
                this.elements.labelsContainer.appendChild(element);
            });
        }
    }

    onMove = () => {
        this.updateLabelsVisibility();
        this.updateLabelPositions();
    }

    updateLabelsVisibility = () => {
        const isRotated = Math.abs(this.map.getBearing()) !== 0;
        if (isRotated) {
            this.elements.labelsContainer.style.display = 'none';
        } else {
            this.elements.labelsContainer.style.display = 'block';
        }
    }

    updateLabelPositions = () => {
        this.elements.labels.forEach(el => {
            const latitude = el.getAttribute('latitude');
            const longitude = el.getAttribute('longitude');

            if (latitude) {
                el.style.top = `${this.map.project([0, parseFloat(latitude!)]).y}px`;
            }

            if (longitude) {
                el.style.left = `${this.map.project([parseFloat(longitude!), 0]).x}px`;
            }            
        });
    }

    onZoom = () => {
        const currentZoom = Math.floor(this.map.getZoom());
        const densityInDegrees = this.config.gridDensity(currentZoom);

        this.removeLabels();
        this.drawLabels(densityInDegrees);

        if (currentZoom != Math.floor(this.previousZoom)) {
            const parallersSource: GeoJSONSource = this.map.getSource(this.config.parallersSourceName) as GeoJSONSource;
            parallersSource.setData(
                createMultiLineString(
                    createParallelsGeometry(densityInDegrees) 
                )
            );
            const meridiansSource: GeoJSONSource = this.map.getSource(this.config.meridiansSourceName) as GeoJSONSource;
            meridiansSource.setData(
                createMultiLineString(
                    createMeridiansGeometry(densityInDegrees) 
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

const createParallelsGeometry = (densityInDegrees: number) => {
    const geometry: Postition[][] = [];
    for (let currentLattitude = 0; currentLattitude < MAX_LATTITUDE; currentLattitude += densityInDegrees) {
        geometry.push([[MIN_LONGITUDE, currentLattitude], [MAX_LONGITUDE, currentLattitude]]);
        geometry.push([[MIN_LONGITUDE, -currentLattitude], [MAX_LONGITUDE, -currentLattitude]]);
    }
    return geometry;
}

const createMeridiansGeometry = (densityInDegrees: number) => {
    const geometry: Postition[][] = [];
    for (let currentLongitude = 0; currentLongitude < MAX_LONGITUDE; currentLongitude += densityInDegrees) {
        geometry.push([[currentLongitude, MIN_LATTITUDE], [currentLongitude, MAX_LATTITUDE]]);
        geometry.push([[-currentLongitude, MIN_LATTITUDE], [-currentLongitude, MAX_LATTITUDE]]);
    }
    return geometry; 
}

const createLabelsContainerElement = () => {
    const el = document.createElement('div');
    el.style.position = 'relative';
    el.style.height = '100%';
    el.style.pointerEvents = 'none';
   
    return el;
}

const createLabelElement = (
    value: number,
    x: number,
    y: number, 
    align: 'left' | 'right' | 'top' | 'bottom',
    format: (degress: number) => string
) => {
    const alignTopOrBottom = align === 'top' || align === 'bottom';
    const el = document.createElement('div');
    el.innerText = format(value);
    el.setAttribute(alignTopOrBottom ? 'longitude' : 'latitude', value.toFixed(20));
    el.style.position = 'absolute';
    el.style[alignTopOrBottom ? 'left' : align ] = `${x.toString()}px`;
    el.style[alignTopOrBottom ? align : 'top'] = `${y.toString()}px`;
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

function getGridDensity(zoom: number) {
    switch (zoom) {
      case 0:
        return 30;
      case 1:
        return 15;
      case 2:
        return 10;
      case 3:
        return 7.5;
      case 4:
        return 5;
      case 5:
        return 3;
      case 6:
        return 2;
      case 7:
        return 1.5;
      case 8:
        return 0.75;
      case 9:
        return 0.5;
      case 10:
        return 0.25;
      case 11:
        return 0.125;
      case 12:
        return 0.075;
      case 13:
        return 0.05;
      case 14:
        return 0.025;
      default:
        return 0.01;
    }
  }
  
  