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
    shouldShowDistanceInMiles: '=',
    shouldShowClosestOnly: '=',
    shouldShowMarkers: '=',
    shouldShowCoverage: '=',
  },
  link: function(scope, element, attrs) {
    'use strict'

    const directionsDisplay = new google.maps.DirectionsRenderer()
    const milesCoefficient = 0.621371
    const societyURL = 'https://www.mssociety.org.uk'
    const markerBaseURL = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|"
    const colorMap = Object.freeze({
      branches: 'F76300',
      specialists: 'CC0066',
      treatments: '0057A3',
      information_points: '004354',
      support_groups: '5A1B55',
      information_events: '00A482',
      fundraising_events: '818F98',
      branch_events: '0B3326',
    })
    const markerImageMap = {}
    let closerTypes = {}

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

    Object.freeze(markerImageMap)

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

    const isLocationTypeSelected = location => scope.locationType === 'all'
      || location.type === scope.locationType

    const isLocationTypeInNearby = location => !scope.shouldShowClosestOnly
      || Object.keys(closerTypes)
        .map(key => closerTypes[key].id)
        .indexOf(location.id) >= 0

    function setLocationVisibility(location) {
      const visible = isLocationTypeSelected(location)
        && isLocationTypeInNearby(location)

      location.marker.setVisible(visible && scope.shouldShowMarkers)
      location.circle.setVisible(visible && scope.shouldShowCoverage)
    }

    let lastWindowOpen = null

    function mapRender(newMapData) {
      const map = new google.maps.Map(d3.select(element[0]).node(), {
        zoom: 12,
        center: new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      })

      Object.keys(newMapData).forEach((itemKey) => {
        var item = newMapData[itemKey]

        const location = {}
        mapLocations[itemKey] = location

        // Get the coloured icon for the location,
        // default to the same icon used for branches.
        const markerImage = markerImageMap[item.type] || markerImageMap.branches

        location.lat = item.lat
        location.lng = item.lng
        location.id = itemKey
        location.htmlTemplate = item.bubble
          + '<button type="button" data-location-id="'
          + location.id
          + '">Show Directions</button>'
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
          fillOpacity: 0.1,
          strokeWeight: 1,
          strokeColor: '#' + (colorMap[item.type] || colorMap.branches),
        })
        location.circle.bindTo('center', location.marker, 'position')

        setLocationVisibility(location)

        location.marker.addListener('click', () => {
          if (lastWindowOpen != null) {
            lastWindowOpen.close()
            directionsDisplay.setMap(null)
          }
          location.infoWindow.open(map, location.marker)

          lastWindowOpen = location.infoWindow
        })
      })

      return map
    }

    const map = mapRender(scope.val)

    const homeMarker = new google.maps.Marker({
      position: {lat: scope.homeLocation.lat, lng: scope.homeLocation.lng},
      map: map,
      title: 'You are here',
      icon: 'https://maps.gstatic.com/mapfiles/ms2/micons/man.png',
    })

    element.click(event => {
      const id = $(event.target).attr('data-location-id')

      if (id) {
        calcRouteToLocation(mapLocations[id])

        if (lastWindowOpen != null) {
          lastWindowOpen.close()
        }
      }
    })

    function calcRouteToLocation(location) {
      const start = new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng)
      const end = new google.maps.LatLng(location.lat, location.lng)
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(start)
      bounds.extend(end)

      const request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
      }
      const directionsService = new google.maps.DirectionsService()

      directionsService.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          map.fitBounds(bounds)
          directionsDisplay.setDirections(response)
          directionsDisplay.setOptions({suppressMarkers: true})
          directionsDisplay.setMap(map)

          scope.shouldShowCoverage = false
          scope.$apply()
        }
      })
    }

    function updateInfoWindows() {
      closerTypes = {}

      Object.keys(colorMap).forEach(type => {
        closerTypes[type] = {id: null, distance: null}
      })

      Object.keys(mapLocations).forEach(itemKey => {
        const location = mapLocations[itemKey]
        const locationCoords = {
          lat: location.marker.getPosition().lat(),
          lng: location.marker.getPosition().lng(),
        }
        const metersDistance = getDistance(scope.homeLocation, locationCoords)

        if (closerTypes[location.type].id == null || closerTypes[location.type].distance > metersDistance) {
          closerTypes[location.type].id = itemKey
          closerTypes[location.type].distance = metersDistance
        }

        location.infoWindow.setContent(
          location.htmlTemplate
            .replace('!miles', scope.shouldShowDistanceInMiles
              ? (metersDistance / 1000 * milesCoefficient).toFixed(2) + ' miles'
              : (metersDistance / 1000).toFixed(2) + 'km'
            )
            .replace(/href="(\/near-me[^"]+)"/, 'href="' + societyURL + '$1"')
            .replace('<a', '<a target="_blank"')
        )
      })

      return closerTypes
    }

    closerTypes = updateInfoWindows()

    function updateVisibility() {
      Object.keys(mapLocations)
        .map(key => mapLocations[key])
        .forEach(location => { setLocationVisibility(location) })
    }

    updateVisibility()

    scope.$watch('homeLocation', () => {
      updateInfoWindows()

      map.setCenter(new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng))
      updateVisibility()
      homeMarker.setPosition(scope.homeLocation)
    })

    scope.$watch('shouldShowDistanceInMiles', () => {
      updateInfoWindows()
    })

    scope.$watch('shouldShowClosestOnly', () => {
      updateVisibility()

      if (scope.shouldShowClosestOnly) {
        directionsDisplay.setMap(null)
      }
    })
    scope.$watch('shouldShowMarkers', () => {
      updateVisibility()
    })
    scope.$watch('shouldShowCoverage', () => {
      updateVisibility()
    })
    scope.$watch('locationType', () => {
      updateVisibility()
    })
  },
}))
