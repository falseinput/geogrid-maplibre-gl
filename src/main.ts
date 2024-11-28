import { FilterSpecification, GeoJSONSource, LngLatBounds, Map } from 'maplibre-gl';
import { classnames, PLUGIN_PREFIX } from './constants';
import { Elements } from './types';
import { createMultiLineString } from './helpers/geojson';
import { createMeridiansGeometry, createParallelsGeometry } from './helpers/geometry';
import { createLabelElement, createLabelsContainerElement } from './helpers/html';
import { getGridDensity } from './helpers/get-grid-density';
import { formatDegrees } from './helpers/formatters';
import { calculateBottomMostNotOcludedLatitude, calculateLeftEdgeLongitude, calculateLeftMostNotOcludedLongitude, calculateRightEdgeLongitude, calculateRightMostNotOccludedLongitude, calculateTopMostNotOcludedLatitude } from './helpers/calculations';

export interface GridStyle {
    color?: string,
    width?: number;
}

export interface GeoGridOptions {
    /**
     * Instance of maplibre-gl-js map.
     */
    map: maplibregl.Map
    /**
     * The ID of the layer before which the grid layers will be placed.
     * If undefined, the grid layers are added on top of all layers.
     * @default undefined
     */
    beforeLayerId?: string | undefined;
   /**
     * The style options for the grid lines.
     * @default { color: '#000000', width: 1 }
     * @example
     * {
     *   color: '#ff0000',
     *   width: 2
     * }
     */
    style?: GridStyle
    /**
     * The zoom level range within which the grid is visible.
     * Defined as an array [minZoom, maxZoom].
     * @default [0, 22]
     */
    zoomLevelRange?: [number, number]
   /**
     * A function that defines the density of the grid lines.
     * The density is the distance between grid lines, measured in degrees.
     * @param zoomLevel The current zoom level of the map.
     * @returns The distance between grid lines in degrees.
     */
    gridDensity?: (zoomLevel: number) => number;
    /**
     * A function to format the grid labels.
     * By default, formats the labels as "[degrees]° [minutes]` [seconds]``".
     * @param degreesFloat A floating-point number representing degrees.
     * @returns A formatted label string.
     */
    formatLabels?: (degreesFloat: number) => string
}

/**
 * Creates customizable geographic grid and adds it to the map.
 */
export class GeoGrid {
    private map: Map;
    private config = {
        beforeLayerId: undefined as string | undefined,
        zoomLevelRange: [0, 22],
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
        this.config.zoomLevelRange = options.zoomLevelRange || this.config.zoomLevelRange;
        this.config.style.color = options.style?.color || this.config.style.color;
        this.config.style.width = options.style?.width || this.config.style.width;
        this.config.formatLabels = options.formatLabels || this.config.formatLabels;
        this.config.gridDensity = options.gridDensity || this.config.gridDensity;

        this.map.once('load', this.add);
    }

     /**
     * Adds grid back to the map.
     * You only need to call this function if remove() was called.
     */
    add = () => {
        const labelsContainer = this.map.getContainer().querySelector(`.${classnames.container}`);

        if (labelsContainer) {
            return;
        }

        this.map.getContainer().appendChild(this.elements.labelsContainer);
        this.map.on('move', this.onMove);
        this.map.on('remove', this.removeEventListeners);
        this.map.on('projectiontransition', this.onProjectionTransition);

        const densityInDegrees = this.config.gridDensity(Math.floor(this.map.getZoom()));
        this.addLayersAndSources(densityInDegrees);
    }

    /**
     * Removes grid from the map.
     */
    remove = () => {
        this.map.off('remove', this.removeEventListeners);
        this.removeEventListeners();

        // Remove html elements
        this.removeLabels();
        this.map.getContainer().removeChild(this.elements.labelsContainer);

        // Remove layers and sources
        this.map.removeLayer(this.config.parallersLayerName);
        this.map.removeLayer(this.config.meridiansLayerName);
        this.map.removeSource(this.config.parallersSourceName);
        this.map.removeSource(this.config.meridiansSourceName);
    }

    private removeEventListeners = () => {
        this.map.off('move', this.onMove);
    }

    private onMove = () => {
        this.updateLabelsVisibility();
        this.removeLabels();

        const densityInDegrees = this.config.gridDensity(Math.floor(this.map.getZoom()));
        this.drawLabels(densityInDegrees);
        this.updateGrid(densityInDegrees);
    }

    private onProjectionTransition = () => {
        this.onMove();
    }

    private addLayersAndSources = (densityInDegrees: number) => {
        const bounds = this.map.getBounds();

        const filter: FilterSpecification = [
            'all',
            ['>=', ['zoom'], this.config.zoomLevelRange[0]],
            ['<=', ['zoom'], this.config.zoomLevelRange[1]]
        ];

        this.map.addSource(this.config.parallersSourceName, {
            type: 'geojson',
            data: {
                type: 'MultiLineString',
                coordinates: createParallelsGeometry(densityInDegrees, bounds)
            }
        });

        this.map.addLayer({
            id: this.config.parallersLayerName,
            filter,
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
            filter,
            type: 'line',
            source: this.config.meridiansSourceName,
            paint: {
                'line-color': this.config.style.color,
                'line-width': this.config.style.width
            }
        }, this.config.beforeLayerId);

        this.drawLabels(densityInDegrees);
    }

    private drawLabels = (densityInDegrees: number) => {
        const currentZoomLevel = Math.floor(this.map.getZoom());
        const isInZoomLevelRange = currentZoomLevel >= this.config.zoomLevelRange[0] || currentZoomLevel <= this.config.zoomLevelRange[1];

        if (!isInZoomLevelRange) {
            return;
        }

        const bounds = this.map.getBounds();
        const isGlobeProjection = this.map.getStyle().projection?.type === 'globe';
        let currentLattitude = Math.ceil(bounds.getSouth() / densityInDegrees) * densityInDegrees;
        for (; currentLattitude < bounds.getNorth(); currentLattitude += densityInDegrees) {
            if (isGlobeProjection) {
                const leftLabel = this.drawLeftLabel(currentLattitude);
                if (leftLabel) {
                    this.elements.labels.push(leftLabel);
                    this.elements.labelsContainer.appendChild(leftLabel);
                }

                const rightLabel = this.drawRightLabel(currentLattitude);
                if (rightLabel) {
                    this.elements.labels.push(rightLabel);
                    this.elements.labelsContainer.appendChild(rightLabel);
                }
            } else {
                const y = this.map.project([0, currentLattitude]).y;

                const elements = [
                    createLabelElement(currentLattitude, 0, y, 'left', this.config.formatLabels),
                    createLabelElement(currentLattitude, 0, y, 'right', this.config.formatLabels),
                ];

                elements.forEach(element => {
                    this.elements.labels.push(element);
                    this.elements.labelsContainer.appendChild(element);
                });
            }
        }

        let currentLongitude = Math.ceil(bounds.getWest() / densityInDegrees) * densityInDegrees;
        for (; currentLongitude < bounds.getEast(); currentLongitude += densityInDegrees) {
            if (isGlobeProjection) {
                const topLabel = this.drawTopLabel(currentLongitude, bounds);
                const bottomLabel = this.drawBottomLabel(currentLongitude, bounds);
 
                if (topLabel) {
                    this.elements.labels.push(topLabel);
                    this.elements.labelsContainer.appendChild(topLabel);
                }
                if (bottomLabel) {
                    this.elements.labels.push(bottomLabel);
                    this.elements.labelsContainer.appendChild(bottomLabel);
                }
            } else {
                const x = this.map.project([currentLongitude, 0]).x;
                const topLabel = createLabelElement(currentLongitude, x, 0, 'top', this.config.formatLabels);
                const bottomLabel = createLabelElement(currentLongitude, x, 0, 'bottom', this.config.formatLabels);

                this.elements.labels.push(topLabel);
                this.elements.labels.push(bottomLabel);
                this.elements.labelsContainer.appendChild(topLabel);
                this.elements.labelsContainer.appendChild(bottomLabel);
            }
        }
    }

    private updateGrid = (densityInDegrees: number) => {
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

    private updateLabelsVisibility = () => {
        const isFacingNorth = Math.abs(this.map.getBearing()) === 0;
        this.elements.labelsContainer.style.display = isFacingNorth ? 'block' : 'none';
    }

    private removeLabels = () => {
        this.elements.labels = [];
        this.elements.labelsContainer.innerHTML = '';
    }

    private drawBottomLabel(currentLongitude: number, bounds: LngLatBounds) {
        const bottomMostNotOcludedLatitude = calculateBottomMostNotOcludedLatitude(this.map, currentLongitude);
        if (!bottomMostNotOcludedLatitude) {
            return;
        }

        const mostSouthNotOccludedLat = bottomMostNotOcludedLatitude % -90;
        // The case when the bottom of the screen is beyond (on the other side) the south pole in the globe projection.
        if (mostSouthNotOccludedLat > bounds.getSouth()) {
            return;
        }

        const x = this.map.project([currentLongitude, bounds.getSouth()]).x;
        const isBottomYOccluded = this.map.transform.isLocationOccluded(this.map.unproject([x, this.map.getCanvas().offsetHeight]));

         if (isBottomYOccluded) {
            return;
        }

        return createLabelElement(
            currentLongitude,
            x,
            0,
            'bottom',
            this.config.formatLabels
        );
    }

    private drawTopLabel(currentLongitude: number, bounds: LngLatBounds) {
        const topMostNotOcludedLatitute = calculateTopMostNotOcludedLatitude(this.map, currentLongitude);
        if (!topMostNotOcludedLatitute) {
            return;
        }

        const mostNorthNotOccludedLat = topMostNotOcludedLatitute % 90;

        // The case when top of the screen is beyond (on the other side) north pole in the globe projection.
        if (mostNorthNotOccludedLat < bounds.getNorth()) {
            return;
        }

        const x = this.map.project([currentLongitude, bounds.getNorth()]).x;
        const isTopYOccluded = this.map.transform.isLocationOccluded(this.map.unproject([x, 0]));

        if (isTopYOccluded) {
            return;
        }

        return createLabelElement(
            currentLongitude,
            x,
            0,
            'top',
            this.config.formatLabels
        );
    }

    private drawLeftLabel(currentLatitude: number) {
        const leftMostNotOcludedLongitude = calculateLeftMostNotOcludedLongitude(this.map, currentLatitude);
        if (leftMostNotOcludedLongitude === undefined) {
            return;
        }

        const edgeIntersectionLng = calculateLeftEdgeLongitude(this.map, currentLatitude);
        if (edgeIntersectionLng === null) {
            return;
        }

        const x = 0;
        const y = this.map.project([edgeIntersectionLng, currentLatitude]).y;
        return createLabelElement(
            currentLatitude,
            x,
            y,
            'left',
            this.config.formatLabels
        );
    }

    private drawRightLabel(currentLatitude: number) {
        const rightMostNotOccludedLongitude = calculateRightMostNotOccludedLongitude(this.map, currentLatitude);

        if (rightMostNotOccludedLongitude === undefined) {
            return;
        }

        const edgeIntersectionLng = calculateRightEdgeLongitude(this.map, currentLatitude);

        if (edgeIntersectionLng === null) {
            return;
        }

        const x = 0;
        const y = this.map.project([edgeIntersectionLng, currentLatitude]).y;
        return createLabelElement(
            currentLatitude,
            x,
            y,
            'right',
            this.config.formatLabels
        );
    }
}

