# geogrid-maplibre-gl

GeoGrid is a maplibre-gl-js plugin for displaying customizable geographic grid on the map.

<img src="./assets/geogrid.png" />

# Features

* Displays geographic grid with labels.
* Allows changing grid densisty per zoom level.
* Make grid visible only on specific zoom level range with `zoomLevelRange`.
* Allows changing labels display format. Default is: <code>[degrees]° [minutes]` [seconds]``</code>
* Styling labels is done with CSS, easily add text shadow, blending mode etc.
* Style grid by changing color of width via API.
* Place grid lines under any of exisiting layers with `beforeLayerId`.
* Labels hide automatically when the map is not facing north.
* No impact on performance: only elements visible in viewport are added.
* Remove programatically by calling `remove()`.
* Works with any maplibre-gl-js version.
* TypeScript types available.
* Available as a JavaScript Module.

## Installation

Get it from NPM:

```bash
npm i -E geogrid-maplibre-gl
```

Or from the CDN:

```html
<script type="module" src="https://unpkg.com/geogrid-maplibre-gl@latest"></script>
<link href="https://unpkg.com/geogrid-maplibre-gl@latest/dist/geogrid.css" rel="stylesheet" />
```

## Usage

Minimal example:

```js
import { GeoGrid } from 'geogrid-maplibre-gl';
// Import css from 'geogrid-maplibre-gl/dist/geogrid.css'

// const map = new maplibregl.Map(...);

new GeoGrid({ map })
```

All options:

```js
import { GeoGrid } from 'geogrid-maplibre-gl';

// const map = new maplibregl.Map(...);

new GeoGrid({ 
    map,
    beforeLayerId: 'labels'
    style: {
        color: 'rgba(255, 255, 255, 0.5)'
        width: 2
    },
    zoomLevelRange: [0, 13],
    gridDensity: (zoomLevel) => 10;
    formatLabels: (degreesFloat) => Math.floor(degreesFloat);
});
```

Programatically removing and re-adding:

```js
const geogrid = new GeoGrid({ map });

// On some event
geogrid.remove();

// On another event
geogrid.add();
```

## Styling

You can override the following CSS classes:
* `geogrid` - Labels container.
* `geogrid__label` - Label elements.
* `geogrid__label--left` - Labels on the left.
* `geogrid__label--right` - Labels on the right.
* `geogrid__label--top` - Labels on the top.
* `geogrid__label--bottom` - Labels on the bottom.
