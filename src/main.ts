import { GeoJSONSource, LngLatBounds, Map } from 'maplibre-gl';
import { MAX_LATTITUDE, MAX_LONGITUDE, MIN_LATTITUDE, MIN_LONGITUDE, PLUGIN_PREFIX } from './constants';
import { Postition } from './types';
import { createMultiLineString } from './geojson';

interface Elements {
    labels: HTMLElement[]
    labelsContainer: HTMLElement;
}

export class GeoGrid {
    private map: Map;
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
        map.on('move', this.onMove);
        
        map.on('remove', () => {
            map.off('move', this.onMove)
        });
    }

    onLoad = () => {
        const densityInDegrees = this.config.gridDensity(Math.floor(this.map.getZoom()));
        this.addLayersAndSources(densityInDegrees);
    }

    onMove = () => {
        this.updateLabelsVisibility();
        this.removeLabels();

        const densityInDegrees = this.config.gridDensity(Math.floor(this.map.getZoom()));
        this.drawLabels(densityInDegrees);
        this.updateGrid(densityInDegrees);
    }

    addLayersAndSources = (densityInDegrees: number) => {
        const bounds = this.map.getBounds();

        this.map.addSource(this.config.parallersSourceName, {
            type: 'geojson',
            data: {
                type: 'MultiLineString',
                coordinates: createParallelsGeometry(densityInDegrees, bounds)
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
                coordinates: createMeridiansGeometry(densityInDegrees, bounds)
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
        const bounds = this.map.getBounds();
        let currentLattitude = Math.ceil(bounds.getSouth() / densityInDegrees) * densityInDegrees;
        for (; currentLattitude < bounds.getNorth(); currentLattitude += densityInDegrees) {  
            const y = this.map.project([0, currentLattitude]).y;
            const elements = [
                createLabelElement(currentLattitude, 0, y, 'left', this.config.formatLabels),
                createLabelElement(currentLattitude, 0, y, 'right', this.config.formatLabels),
            ];

            elements.forEach(element => {
                this.elements.labels.push(element);
                this.elements.labelsContainer.appendChild(element);
            })
        }

        let currentLongitude = Math.ceil(bounds.getWest() / densityInDegrees) * densityInDegrees;
        for (; currentLongitude < bounds.getEast(); currentLongitude += densityInDegrees) {
            const x = this.map.project([currentLongitude, 0]).x;
            const elements = [
                createLabelElement(currentLongitude, x, 0, 'top', this.config.formatLabels),
                createLabelElement(currentLongitude, x, 0, 'bottom', this.config.formatLabels),
            ];
        
            elements.forEach(element => {
                this.elements.labels.push(element);
                this.elements.labelsContainer.appendChild(element);
            });
        }
    }

    updateGrid = (densityInDegrees: number) => {
        const bounds = this.map.getBounds();
        const parallersSource: GeoJSONSource = this.map.getSource(this.config.parallersSourceName) as GeoJSONSource;
        parallersSource.setData(
            createMultiLineString(
                createParallelsGeometry(densityInDegrees, bounds) 
            )
        );
        const meridiansSource: GeoJSONSource = this.map.getSource(this.config.meridiansSourceName) as GeoJSONSource;
        meridiansSource.setData(
            createMultiLineString(
                createMeridiansGeometry(densityInDegrees, bounds) 
            )
        );
    }

    updateLabelsVisibility = () => {
        const isRotated = Math.abs(this.map.getBearing()) !== 0;
        if (isRotated) {
            this.elements.labelsContainer.style.display = 'none';
        } else {
            this.elements.labelsContainer.style.display = 'block';
        }
    }

    removeLabels = () => {
        this.elements.labels = [];
        this.elements.labelsContainer.innerHTML = '';
    }
}

const createParallelsGeometry = (densityInDegrees: number, bounds: LngLatBounds) => {
    const geometry: Postition[][] = [];
    let currentLattitude = Math.ceil(bounds.getSouth() / densityInDegrees) * densityInDegrees;
    for (; currentLattitude < bounds.getNorth(); currentLattitude += densityInDegrees) {
        geometry.push([[MIN_LONGITUDE, currentLattitude], [MAX_LONGITUDE, currentLattitude]]);
    }
    return geometry;
}

const createMeridiansGeometry = (densityInDegrees: number, bounds: LngLatBounds) => {
    const geometry: Postition[][] = [];
    let currentLongitude = Math.ceil(bounds.getWest() / densityInDegrees) * densityInDegrees;
     for (; currentLongitude < bounds.getEast(); currentLongitude += densityInDegrees) {
        geometry.push([[currentLongitude, MIN_LATTITUDE], [currentLongitude, MAX_LATTITUDE]]);
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
  
  