import { LngLatBounds } from 'maplibre-gl';
import { MAX_LATTITUDE, MAX_LONGITUDE, MIN_LATTITUDE, MIN_LONGITUDE } from '../constants';
import { Postition } from '../types';

export const createParallelsGeometry = (densityInDegrees: number, bounds: LngLatBounds) => {
    const geometry: Postition[][] = [];
    let currentLattitude = Math.ceil(bounds.getSouth() / densityInDegrees) * densityInDegrees;
    for (; currentLattitude < bounds.getNorth(); currentLattitude += densityInDegrees) {
        geometry.push([[MIN_LONGITUDE, currentLattitude], [MAX_LONGITUDE, currentLattitude]]);
    }
    return geometry;
}

export const createMeridiansGeometry = (densityInDegrees: number, bounds: LngLatBounds) => {
    const geometry: Postition[][] = [];
    let currentLongitude = Math.ceil(bounds.getWest() / densityInDegrees) * densityInDegrees;
     for (; currentLongitude < bounds.getEast(); currentLongitude += densityInDegrees) {
        geometry.push([[currentLongitude, MIN_LATTITUDE], [currentLongitude, MAX_LATTITUDE]]);
    }
    return geometry; 
}
