import { Map } from 'maplibre-gl';

export const calculateTopMostNotOcludedLatitude = (map: Map, longitude: number) => {
    let result: number | undefined = undefined;
    const step = map.getZoom() > 12 ? 0.01 : 1;
    const centerLat =  map.getCenter().lat
    for (let latitude = centerLat; latitude < 85; latitude += step) {
        const isOccluded = map.transform.isLocationOccluded({ lng: longitude, lat: latitude});
        if (!isOccluded) {
            result = latitude
        }
    }

    return result;
}

export const calculateLeftMostNotOcludedLongitude = (map: Map, latitude: number) => {
    let result: number | undefined = undefined;
    const step = 0.5;
    const centerLng =  map.getCenter().lng;
    for (let longitude = centerLng; longitude > centerLng -90; longitude -= step) {
        const isOccluded = map.transform.isLocationOccluded({ lng: longitude, lat: latitude});
        if (!isOccluded) {
            result = longitude
        }
    }

    return result;
}

export const calculateRightMostNotOccludedLongitude = (map: Map, latitude: number) => {
    let result: number | undefined = undefined;
    const step = 0.5;
    const centerLng = map.getCenter().lng;

    for (let longitude = centerLng; longitude < centerLng + 90; longitude += step) {
        const isOccluded = map.transform.isLocationOccluded({ lng: longitude, lat: latitude });
        if (!isOccluded) {
            result = longitude;
        }
    }

    return result;
};


export const calculateBottomMostNotOcludedLatitude = (map: Map, longitude: number) => {
    let result: number | undefined = undefined;
    const step = map.getZoom() > 12 ? 0.01 : 1;
    const centerLat =  map.getCenter().lat
    for (let latitude = centerLat; latitude > -85; latitude -= step) {
        const isOccluded = map.transform.isLocationOccluded({ lng: longitude, lat: latitude});
        if (!isOccluded) {
            result = latitude
        }
    }

    return result;
}

export const calculateLeftEdgeLongitude = (map: Map, latitude: number) => {
    let lng = map.getCenter().lng;
    let intersects = false;
    const maxIterations = 180;
    let it = 0;
    // We are limiting the loop because some meridians may never intersect with the screen edge
    // and will pass the break condition (x <= 0)
    while (it < maxIterations) {
        lng--;

        const x = map.project([lng, latitude]).x;
        if (x <= 0) {
            intersects = true;
            break;
        }

        it++;
    }

    return intersects ? lng : null;
}

export const calculateRightEdgeLongitude = (map: Map, latitude: number) => {
    let lng = map.getCenter().lng;
    let intersects = false;
    const maxIterations = 180;
    let it = 0;
    const screenWidth = map.getContainer().offsetWidth;

    // Limiting the loop because some meridians may never intersect with the screen edge
    // and will pass the break condition (x <= 0)
    while (it < maxIterations) {
        lng++;

        const x = map.project([lng, latitude]).x;
        if (x >= screenWidth) {
            intersects = true;
            break;
        }

        it++;
    }

    return intersects ? lng : null;
}
