/* jshint esversion: 8 */
/* jshint browser: true */
'use strict';

let map;
let panoViewer;
let guessLatLng = null;
let routeBase = null;

const MAP_DEFAULT_CENTER = [20, 0];
const MAP_DEFAULT_ZOOM = 2;
const HOVER_INVALIDATE_DELAY = 260;
const RESIZE_INVALIDATE_DELAY = 200;
const DEFAULT_PANO_TYPE = 1;

function getRouteBaseFromPath() {
    const path = window.location.pathname;
    return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

function splitRouteBase(base) {
    const parts = base.split('-');
    if (parts.length !== 2) {
        console.error('Invalid challenge URL:', base);
        return null;
    }
    return { competition: parts[0], challenge: parts[1] };
}

function setChallengeTitle(challenge) {
    const header = document.getElementById('chall-title');
    if (!header) {
        return;
    }

    const formatted = challenge.charAt(0).toUpperCase() + challenge.slice(1);
    header.textContent = formatted;
}

function renderStaticPanorama(container, panoramaPath) {
    container.classList.add('pano-static');
    container.innerHTML = '';

    const image = document.createElement('img');
    image.src = panoramaPath;
    image.alt = 'Challenge panorama';
    image.decoding = 'async';
    image.loading = 'lazy';

    container.appendChild(image);
    panoViewer = null;
}

function initPanorama(competition, challenge, panoType) {
    const container = document.getElementById('pano');
    if (!container) {
        console.error('Panorama container missing');
        return;
    }

    const panoramaPath = `/img/${competition}/${challenge}/pano.jpg`;

    if (panoType === 1) {
        if (typeof PhotoSphereViewer === 'undefined') {
            console.error('PhotoSphereViewer missing; falling back to static panorama render');
            renderStaticPanorama(container, panoramaPath);
            return;
        }

        container.classList.remove('pano-static');
        container.innerHTML = '';

        panoViewer = new PhotoSphereViewer.Viewer({
            container,
            panorama: panoramaPath,
            caption: `${competition} / ${challenge}`,
            touchmoveTwoFingers: true,
            mousewheelCtrlKey: true,
            navbar: ['zoom', 'fullscreen']
        });
        return;
    }

    renderStaticPanorama(container, panoramaPath);
}

function initMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }

    map = L.map('map').setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let guessMarker = null;

    map.on('click', (event) => {
        guessLatLng = event.latlng;

        if (guessMarker) {
            guessMarker.setLatLng(event.latlng);
            return;
        }

        guessMarker = L.marker(event.latlng).addTo(map);
    });
}

function setupMapInvalidation() {
    const mapBox = document.getElementById('map-box');
    if (mapBox) {
        const invalidate = () => {
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, HOVER_INVALIDATE_DELAY);
        };

        mapBox.addEventListener('mouseenter', invalidate);
        mapBox.addEventListener('mouseleave', invalidate);
    }

    window.addEventListener('resize', () => {
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, RESIZE_INVALIDATE_DELAY);
    });
}

async function fetchChallengeMeta(competition, challenge) {
    try {
        const response = await fetch(`/${competition}-${challenge}/meta`);

        if (!response.ok) {
            return DEFAULT_PANO_TYPE;
        }

        const payload = await response.json();
        return typeof payload.panoType === 'number' ? payload.panoType : DEFAULT_PANO_TYPE;
    } catch (error) {
        console.error('Failed to fetch challenge metadata', error);
        return DEFAULT_PANO_TYPE;
    }
}

async function initialize() {
    routeBase = getRouteBaseFromPath();
    const routeParts = splitRouteBase(routeBase);

    if (!routeParts) {
        return;
    }

    const { competition, challenge } = routeParts;
    const panoType = await fetchChallengeMeta(competition, challenge);

    setChallengeTitle(challenge);
    initPanorama(competition, challenge, panoType);
    initMap();
    setupMapInvalidation();
}

function submitGuess() {
    const resultEl = document.getElementById('chall-result');

    if (!guessLatLng) {
        if (resultEl) {
            resultEl.textContent = 'Click on the map to choose a location first.';
        }
        return;
    }

    const base = routeBase || getRouteBaseFromPath();
    const url = `/${base}/submit`;

    $.ajax({
        url,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify([guessLatLng.lat, guessLatLng.lng]),
        success: function (data) {
            if (resultEl) {
                resultEl.textContent = data;
            }
        },
        error: function (_xhr, status) {
            if (resultEl) {
                resultEl.textContent = 'Error sending guess: ' + status;
            }
        }
    });
}

