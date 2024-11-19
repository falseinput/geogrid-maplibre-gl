import { GeoJSONSource, Map } from 'maplibre-gl';
import { PLUGIN_PREFIX } from './constants';
import { Elements } from './types';
import { createMultiLineString } from './helpers/geojson';
import { createMeridiansGeometry, createParallelsGeometry } from './helpers/geometry';
import { createLabelElement, createLabelsContainerElement } from './helpers/html';
import { getGridDensity } from './helpers/get-grid-density';
import { formatDegrees } from './helpers/formatters';

export interface GridStyle {
    color: string,
    width: number;
}

export interface GeoGridOptions {
    /**
     * Instance of maplibre-gl-js map.
     */
    map: maplibregl.Map
    /**
     * Id of the layer before which grid grid layers will be placed.
     * @default undefined
     */
    beforeLayerId?: string | undefined;
    /**
     * Grid style.
     * @example
     * ```
     * {
     *   color: '#ff0000'
     *   width: 2
     * }
     * ```
     */
    style?: GridStyle
    /**
     * Function that sets density of the grid. Density is defined as the distance between grid lines in degress.
     */
    gridDensity?: (zoomLevel: number) => number;
    /**
     * Function that takes degrees float and returns formatted label string.
     * By default, returns string in format "[degrees]° [minutes]` [seconds]``"
     */
    formatLabels?: (degreesFloat: number) => string
}

/**
 * Creates customizable geographic grid and adds it to the map.
 *
 */
export class GeoGrid {
    private map: Map;
    private config = {
        beforeLayerId: undefined as string | undefined,
        parallersLayerName: `${PLUGIN_PREFIX}_parallers`,
        parallersSourceName: `${PLUGIN_PREFIX}_parallers_source`,
        meridiansLayerName: `${PLUGIN_PREFIX}_meridians`,
        meridiansSourceName: `${PLUGIN_PREFIX}_meridians_source`,
        style: {
            color: '#000000',
            width: 1
        },
        gridDensity: getGridDensity,
        formatLabels: formatDegrees
    };
    private elements: Elements = {
        labels: [],
        labelsContainer: createLabelsContainerElement()
    };
    constructor(options: GeoGridOptions) {
        if (!options.map) {
            throw new Error('GeoGrid: "map" option is required');
        }

        this.map = options.map;
        this.config.beforeLayerId = options.beforeLayerId || this.config.beforeLayerId;
        this.config.style.color = options.style?.color || this.config.style.color;
        this.config.style.width = options.style?.width || this.config.style.width;
        this.config.formatLabels = options.formatLabels || this.config.formatLabels;
        this.config.gridDensity = options.gridDensity || this.config.gridDensity;

        this.map._container.appendChild(this.elements.labelsContainer);
        this.map.once('load', this.onLoad);
        this.map.on('move', this.onMove);
        this.map.on('remove', () => {
            this.map.off('move', this.onMove)
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
            source: this.config.parallersSourceName,
            paint: {
                'line-color': this.config.style.color,
                'line-width': this.config.style.width
            }
        }, this.config.beforeLayerId);

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
            source: this.config.meridiansSourceName,
            paint: {
                'line-color': this.config.style.color,
                'line-width': this.config.style.width
            }
        }, this.config.beforeLayerId);

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
        const isFacingNorth = Math.abs(this.map.getBearing()) === 0;
        this.elements.labelsContainer.style.display = isFacingNorth ? 'block' : 'none';
    }

    removeLabels = () => {
        this.elements.labels = [];
        this.elements.labelsContainer.innerHTML = '';
    }
}
