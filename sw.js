var GHPATH = '/TileCanvas';
var APP_PREFIX = 'tlc_';
var VERSION = 'version_002';
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
  `${GHPATH}/scripts/bezier-wedge.png`,
  `${GHPATH}/scripts/bezier.png`,
  `${GHPATH}/scripts/bottom.png`,
  `${GHPATH}/scripts/cancel.png`,
  `${GHPATH}/scripts/circle.png`,
  `${GHPATH}/scripts/copy.png`,
  `${GHPATH}/scripts/crop.png`,
  `${GHPATH}/scripts/curve.png`,
  `${GHPATH}/scripts/down.png`,
  `${GHPATH}/scripts/erase.png`,
  `${GHPATH}/scripts/eye-closed.png`,
  `${GHPATH}/scripts/eye-dropper.png`,
  `${GHPATH}/scripts/eye-open.png`,
  `${GHPATH}/scripts/fill.png`,
  `${GHPATH}/scripts/gear.png`,
  `${GHPATH}/scripts/grid.png`,
  `${GHPATH}/scripts/group.png`,
  `${GHPATH}/scripts/icon.png`,
  `${GHPATH}/scripts/inverse-quadrant.png`,
  `${GHPATH}/scripts/layers.png`,
  `${GHPATH}/scripts/left.png`,
  `${GHPATH}/scripts/line.png`,
  `${GHPATH}/scripts/menu.png`,
  `${GHPATH}/scripts/minus.png`,
  `${GHPATH}/scripts/palette.png`,
  `${GHPATH}/scripts/pan.png`,
  `${GHPATH}/scripts/plus.png`,
  `${GHPATH}/scripts/quadrant.png`,
  `${GHPATH}/scripts/redo.png`,
  `${GHPATH}/scripts/right.png`,
  `${GHPATH}/scripts/select.png`,
  `${GHPATH}/scripts/square.png`,
  `${GHPATH}/scripts/top.png`,
  `${GHPATH}/scripts/undo.png`,
  `${GHPATH}/scripts/ungroup.png`,
  `${GHPATH}/scripts/up.png`,
  `${GHPATH}/scripts/wedge.png`
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