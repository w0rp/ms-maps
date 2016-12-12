angular.module('msMapsApp.directives.map', [])
/* global d3 */
/* global google */
/* global L */

.directive('googleMapsVisualisation', () => ({
  restrict: 'E',
  scope: {
    val: '=',
    homeLocation: '=',
  },
  link: function(scope, element, attrs) {
    const colorMap = {
      branches: 'F76300',
      specialists: 'CC0066',
      treatments: '0057A3',
      information_points: '004354',
      support_groups: '5A1B55',
      information_events: '00A482',
      fundraising_events: '818F98',
      financial_aid: 'BAC733',
      branch_event: '0B3326',
    }

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

    function mapRender(newMapData) {
      var coords = {}

      var map = new google.maps.Map(d3.select(element[0]).node(), {
        zoom: 8,
        center: new google.maps.LatLng(51.56, -0.25),
        mapTypeId: google.maps.MapTypeId.TERRAIN,
      })

      let lastWindowOpen = null

      Object.keys(newMapData).forEach((itemKey) => {
        var item = newMapData[itemKey]

        const location = {}
        mapLocations[itemKey] = location

        location.htmlTemplate = item.bubble
        location.infoWindow = new google.maps.InfoWindow({content: ''})
        location.marker = new google.maps.Marker({
          position: {lat: item.lat, lng: item.lng},
          map: map,
          title: 'Uluru (Ayers Rock)',
        })

        location.marker.addListener('click', () => {
          if (lastWindowOpen != null) {
            lastWindowOpen.close()
          }

          const metersDistance = getDistance(scope.homeLocation, item)

          location.infoWindow.setContent(item.bubble.replace(
            '!miles',
            (metersDistance / 1000).toFixed(2) + 'km'
          ))

          location.infoWindow.open(map, location.marker)

          lastWindowOpen = location.infoWindow
        })
      })
    }

    mapRender(scope.val)

    function updateInfoWindows() {
      Object.keys(mapLocations).forEach(itemKey => {
        const location = mapLocations[itemKey]
        const locationCoords = {
          lat: location.marker.getPosition().lat(),
          lng: location.marker.getPosition().lng(),
        }
        const metersDistance = getDistance(scope.homeLocation, locationCoords)

        location.infoWindow.setContent(location.htmlTemplate.replace(
          '!miles',
          (metersDistance / 1000).toFixed(2) + 'km'
        ))
      })
    }

    updateInfoWindows()

    scope.$watch('homeLocation', () => {
      updateInfoWindows()
    })
  },
}))
