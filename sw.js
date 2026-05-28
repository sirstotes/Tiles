var GHPATH = '/TileCanvas';
var APP_PREFIX = 'tlc_';
var VERSION = 'version_004';
var URLS = [    
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/style.css`,
  `${GHPATH}/scripts/p5.min.js`,
  `${GHPATH}/scripts/actions.js`,
  `${GHPATH}/scripts/maker.js`,
  `${GHPATH}/scripts/selection.js`,
  `${GHPATH}/scripts/shapes.js`,
  `${GHPATH}/scripts/sketch.js`,
  `${GHPATH}/scripts/tools.js`,
  `${GHPATH}/assets/bezier-wedge.png`,
  `${GHPATH}/assets/bezier.png`,
  `${GHPATH}/assets/bottom.png`,
  `${GHPATH}/assets/cancel.png`,
  `${GHPATH}/assets/circle.png`,
  `${GHPATH}/assets/confirm.png`,
  `${GHPATH}/assets/copy.png`,
  `${GHPATH}/assets/crop.png`,
  `${GHPATH}/assets/curve.png`,
  `${GHPATH}/assets/down.png`,
  `${GHPATH}/assets/erase.png`,
  `${GHPATH}/assets/eye-closed.png`,
  `${GHPATH}/assets/eye-dropper.png`,
  `${GHPATH}/assets/eye-open.png`,
  `${GHPATH}/assets/fill.png`,
  `${GHPATH}/assets/flip_horizontal.png`,
  `${GHPATH}/assets/flip_vertical.png`,
  `${GHPATH}/assets/gear.png`,
  `${GHPATH}/assets/grid.png`,
  `${GHPATH}/assets/group.png`,
  `${GHPATH}/assets/icon.png`,
  `${GHPATH}/assets/inverse-quadrant.png`,
  `${GHPATH}/assets/layers.png`,
  `${GHPATH}/assets/left.png`,
  `${GHPATH}/assets/line.png`,
  `${GHPATH}/assets/menu.png`,
  `${GHPATH}/assets/minus.png`,
  `${GHPATH}/assets/palette.png`,
  `${GHPATH}/assets/pan.png`,
  `${GHPATH}/assets/paste.png`,
  `${GHPATH}/assets/plus.png`,
  `${GHPATH}/assets/quadrant.png`,
  `${GHPATH}/assets/redo.png`,
  `${GHPATH}/assets/right.png`,
  `${GHPATH}/assets/rotate_clockwise.png`,
  `${GHPATH}/assets/rotate_counterclockwise.png`,
  `${GHPATH}/assets/select.png`,
  `${GHPATH}/assets/square.png`,
  `${GHPATH}/assets/top.png`,
  `${GHPATH}/assets/undo.png`,
  `${GHPATH}/assets/ungroup.png`,
  `${GHPATH}/assets/up.png`,
  `${GHPATH}/assets/wedge.png`,
  `${GHPATH}/assets/JetBrainsMono-ExtraBold.ttf`
]

var CACHE_NAME = APP_PREFIX + VERSION
self.addEventListener('fetch', function (e) {
  console.log('Fetch request : ' + e.request.url);
  e.respondWith(
    caches.match(e.request).then(function (request) {
      if (request) { 
        console.log('Responding with cache : ' + e.request.url);
        return request
      } else {       
        console.log('File is not cached, fetching : ' + e.request.url);
        return fetch(e.request)
      }
    })
  )
})

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('Installing cache : ' + CACHE_NAME);
      return cache.addAll(URLS)
    })
  )
})

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keyList) {
      var cacheWhitelist = keyList.filter(function (key) {
        return key.indexOf(APP_PREFIX)
      })
      cacheWhitelist.push(CACHE_NAME);
      return Promise.all(keyList.map(function (key, i) {
        if (cacheWhitelist.indexOf(key) === -1) {
          console.log('Deleting cache : ' + keyList[i] );
          return caches.delete(keyList[i])
        }
      }))
    })
  )
})