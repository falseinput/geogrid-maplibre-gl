import { GeoJSONSource, Map } from 'maplibre-gl';
import { MAX_LATTITUDE, PLUGIN_PREFIX } from './constants';
import { Postition } from './types';
import { createMultiLineString } from './geojson';


export class GeoGrid {
    private map: Map;
    private previousZoom = 0;
    private config = {
        parallersLayerName: `${PLUGIN_PREFIX}_parallers`,
        parallersSourceName: `${PLUGIN_PREFIX}_parallers_source`,
        parallersStep: (zoomLevel: number) => 40 / Math.pow(Math.floor(zoomLevel) + 1, 2)
    };
    constructor(map: Map) {
        this.map = map;
        map.once('load', this.onLoad);
        map.on('zoom', this.onZoom);
        
        map.on('remove', () => {
            map.off('zoom', this.onZoom);
        });
    }

    onLoad = () => {
        this.previousZoom = this.map.getZoom();
   
        this.map.addSource(this.config.parallersSourceName, {
            type: 'geojson',
            data: {
                type: 'MultiLineString',
                coordinates: createParallelsGeometry(this.config.parallersStep(this.map.getZoom()))
            }
        });

        this.map.addLayer({
            id: this.config.parallersLayerName,
            type: 'line',
            source: this.config.parallersSourceName
        });
    }

    onZoom = () => {
        const currentZoom = Math.floor(this.map.getZoom());

        if (currentZoom != Math.floor(this.previousZoom)) {
            console.log(currentZoom);
            const parallersSource: GeoJSONSource = this.map.getSource(this.config.parallersSourceName) as GeoJSONSource;
            parallersSource.setData(
                createMultiLineString(
                    createParallelsGeometry(this.config.parallersStep(currentZoom))
                )
            );
        }

        this.previousZoom = currentZoom;
    }
}

const createParallelsGeometry = (stepInDegrees: number) => {
    const geometry: Postition[][] = [];
    for (let currentLattitude = 0; currentLattitude < MAX_LATTITUDE; currentLattitude += stepInDegrees) {
        geometry.push([[-180, currentLattitude], [180, currentLattitude]]);
        geometry.push([[-180, -currentLattitude], [180, -currentLattitude]]);
    }
    return geometry;
}