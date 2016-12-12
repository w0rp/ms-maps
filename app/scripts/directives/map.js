angular.module('msMapsApp.directives.map', [])
/* global d3 */
/* global google */
/* global L */

.directive('googleMapsVisualisation', () => ({
  restrict: 'E',
  scope: {
    val: '=',
    homeLocation: '=',
    locationType: '=',
  },
  link: function(scope, element, attrs) {
    const societyURL = 'https://www.mssociety.org.uk'
    const markerBaseURL = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|"
    const colorMap = {
      branches: 'F76300',
      specialists: 'CC0066',
      treatments: '0057A3',
      information_points: '004354',
      support_groups: '5A1B55',
      information_events: '00A482',
      fundraising_events: '818F98',
      financial_aid: 'BAC733',
      branch_events: '0B3326',
    }

    const markerImageMap = {}

    Object.keys(colorMap).forEach(id => {
      const color = colorMap[id]

      const markerImage = new google.maps.MarkerImage(
        markerBaseURL + color,
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34)
      )

      markerImageMap[id] = markerImage
    })

    function getCenter(coordsInput) {
      var totalLng = 0
      var totalLat = 0
      Object.keys(coordsInput).forEach((key) => {
        totalLng += coordsInput[key][0]
        totalLat += coordsInput[key][1]
      })

      return [totalLat / Object.keys(coordsInput).length, totalLng / Object.keys(coordsInput).length]
    }

    function getZoom(coordsInput) {
      var bounds = new google.maps.LatLngBounds()
      Object.keys(coordsInput).forEach((key) => {
        bounds.extend(new google.maps.LatLng(coordsInput[key][1], coordsInput[key][0]))
      })

      return bounds
    }

    function getDistance(from, to) {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(from.lat, from.lng),
        new google.maps.LatLng(to.lat, to.lng)
      )

      return distance
    }

    const mapLocations = {}

    function setLocationVisibility(location) {
      const visibility = scope.locationType === 'all'
        || location.type === scope.locationType

      location.marker.setVisible(visibility)
      location.circle.setVisible(visibility)
    }

    function mapRender(newMapData) {
      const map = new google.maps.Map(d3.select(element[0]).node(), {
        zoom: 12,
        center: new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      })

      let lastWindowOpen = null

      Object.keys(newMapData).forEach((itemKey) => {
        var item = newMapData[itemKey]

        const location = {}
        mapLocations[itemKey] = location

        // Get the coloured icon for the location,
        // default to the same icon used for branches.
        const markerImage = markerImageMap[item.type] || markerImageMap.branches

        location.htmlTemplate = item.bubble
        location.type = item.type
        location.infoWindow = new google.maps.InfoWindow({content: ''})
        location.marker = new google.maps.Marker({
          position: {lat: item.lat, lng: item.lng},
          map: map,
          title: item.title,
          icon: markerImage,
        })

        // Add circle overlay and bind to marker
        location.circle = new google.maps.Circle({
          map: map,
          radius: 4000,
          fillColor: '#' + (colorMap[item.type] || colorMap.branches),
          fillOpacity: 0.5,
          strokeWeight: 0,
        })
        location.circle.bindTo('center', location.marker, 'position')

        setLocationVisibility(location)

        location.marker.addListener('click', () => {
          if (lastWindowOpen != null) {
            lastWindowOpen.close()
          }

          location.infoWindow.open(map, location.marker)

          lastWindowOpen = location.infoWindow
        })
      })

      return map
    }

    const map = mapRender(scope.val)

    function updateInfoWindows() {
      var closerTypes = {
        branches: {id: null, distance: null},
        specialists: {id: null, distance: null},
        treatments: {id: null, distance: null},
        information_points: {id: null, distance: null},
        support_groups: {id: null, distance: null},
        information_events: {id: null, distance: null},
        fundraising_events: {id: null, distance: null},
        financial_aid: {id: null, distance: null},
        branch_events: {id: null, distance: null},
      }

      Object.keys(mapLocations).forEach(itemKey => {
        const location = mapLocations[itemKey]
        const locationCoords = {
          lat: location.marker.getPosition().lat(),
          lng: location.marker.getPosition().lng(),
        }
        const metersDistance = getDistance(scope.homeLocation, locationCoords)

        if (closerTypes[location.type].id == null || closerTypes[location.type]['distance'] > metersDistance) {
          closerTypes[location.type].id = itemKey
          closerTypes[location.type]['distance'] = metersDistance
        }

        location.infoWindow.setContent(
          location.htmlTemplate
            .replace('!miles', (metersDistance / 1000).toFixed(2) + 'km')
            .replace(/href="(\/near-me[^"]+)"/, 'href="' + societyURL + '$1"')
            .replace('<a', '<a target="_blank"')
        )
      })
    }

    updateInfoWindows()

    function updateVisibility() {
      Object.keys(mapLocations)
        .map(key => mapLocations[key])
        .forEach(location => { setLocationVisibility(location) })
    }

    updateVisibility()

    scope.$watch('homeLocation', () => {
      updateInfoWindows()

      map.setCenter(new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng))
    })

    scope.$watch('locationType', () => {
      updateVisibility()
    })
  },
}))
