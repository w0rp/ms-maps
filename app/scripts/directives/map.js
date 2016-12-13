/**
 * This module draws the map and controls in the center of the application.
 */
angular.module('msMapsApp.directives.map', [])
/* global d3 */
/* global google */
/* global L */

.directive('googleMapsVisualisation', () => ({
  restrict: 'E',
  scope: {
    // This binding holds all of the map marker data to render in the map.
    val: '=',
    // This binding holds a location with {lat, lng} coordinates for where
    // the user is.
    homeLocation: '=',
    // This binding sets a type of location to filter down to on the map.
    // The string 'all' shows all locations.
    locationType: '=',
    // When this binding is `true`, the distance should be printed in
    // miles, instead of kilometres
    shouldShowDistanceInMiles: '=',
    // When this binding is `true`, only the nearest locations of each
    // type will be shown on the map.
    shouldShowClosestOnly: '=',
    // When this binding is not `true`, map markers will be hidden.
    shouldShowMarkers: '=',
    // When this binding is not `true`, coverage via radii will be hidden.
    shouldShowCoverage: '=',
    // This binding describes the travel method to use for the directions.
    travelMethod: '=',
    lastDirectionsLocation: '=',
  },
  link: function(scope, element, attrs) {
    'use strict'

    // Set up some map data
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

    // Create coloured images for each type of location, to use later.
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

    // Make the map immutable now we have defined it.
    Object.freeze(markerImageMap)

    // Given two locations in coordinates, return the distance between those
    // locations in metres.
    const getDistance = (from, to) =>
      google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(from.lat, from.lng),
        new google.maps.LatLng(to.lat, to.lng)
      )

    // This map will store locations after we have processed the markers
    const mapLocations = {}

    // Given a location, return `true` if that location has been selected,
    // according to the type filters
    const isLocationTypeSelected = location => scope.locationType === 'all'
      || location.type === scope.locationType

    // Given a location, return `true` if that location is nearby, according
    // to our "nearby" filtering. Only the nearest locations will return `true`
    const isLocationNearby = location => !scope.shouldShowClosestOnly
      || Object.keys(closerTypes)
        .map(key => closerTypes[key].id)
        .indexOf(location.id) >= 0

    // Given a location, apply current filters to show or hide it.
    const setLocationVisibility = location => {
      const visible = isLocationTypeSelected(location)
        && isLocationNearby(location)

      location.marker.setVisible(visible && scope.shouldShowMarkers)
      location.circle.setVisible(visible && scope.shouldShowCoverage)
    }

    let lastWindowOpen = null

    const renderMap = () => {
      const map = new google.maps.Map(element[0], {
        zoom: 12,
        center: new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      })

      Object.keys(scope.val).forEach((itemKey) => {
        var item = scope.val[itemKey]

        const location = {}
        mapLocations[itemKey] = location

        // Get the coloured icon for the location,
        // default to the same icon used for branches.
        const markerImage = markerImageMap[item.type] || markerImageMap.branches

        // We need to remember latitude an longitude for calculations later on.
        location.lat = item.lat
        location.lng = item.lng
        // Remember the ID on the object, used for filtering later.
        location.id = itemKey
        // Take the location HTML from MS Society and add a 'Show Directions'
        // button to it.
        location.htmlTemplate = item.bubble
          + '<button type="button" data-location-id="'
          + location.id
          + '">Show Directions</button>'
        location.type = item.type
        // Set up an info window, which will show details about the centre,
        // distance to it, a button to show directions to it, etc.
        location.infoWindow = new google.maps.InfoWindow({content: ''})
        location.marker = new google.maps.Marker({
          position: {lat: item.lat, lng: item.lng},
          map: map,
          title: item.title,
          icon: markerImage,
        })

        // Add a circle to show around the marker.
        location.circle = new google.maps.Circle({
          map: map,
          // 4 kilometres of coverage around each centre.
          radius: 4000,
          fillColor: '#' + (colorMap[item.type] || colorMap.branches),
          fillOpacity: 0.1,
          strokeWeight: 1,
          strokeColor: '#' + (colorMap[item.type] || colorMap.branches),
        })
        // Bind the circle to the marker, so it displays in the right place.
        location.circle.bindTo('center', location.marker, 'position')

        setLocationVisibility(location)

        // Add a location click handler so it opens the info window.
        location.marker.addListener('click', () => {
          // Close previously opened windows and remove directions when
          // looking at a new location.
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

    const map = renderMap()

    // Create an extra marker to show where we are.
    // The location can be changed later.
    const homeMarker = new google.maps.Marker({
      position: {lat: scope.homeLocation.lat, lng: scope.homeLocation.lng},
      map: map,
      title: 'You are here',
      icon: 'https://maps.gstatic.com/mapfiles/ms2/micons/man.png',
    })

    let lastDirectionsLocation = null

    // Given a location, calculate a route to the location from the user's
    // location, and draw the route on the map.
    const calcRouteToLocation = location => {
      // Set up bounds so we can focus on the route on the map.
      const start = new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng)
      const end = new google.maps.LatLng(location.lat, location.lng)
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(start)
      bounds.extend(end)

      const request = {
        origin: start,
        destination: end,
        // The travel method is taken from the binding.
        travelMode: google.maps.TravelMode[scope.travelMethod],
      }
      const directionsService = new google.maps.DirectionsService()

      // Request directions from point A to B.
      directionsService.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          scope.lastDirectionsLocation = location

          // Focus on the route we drew
          map.fitBounds(bounds)
          // Set up the directions to draw on the map.
          directionsDisplay.setDirections(response)
          // Don't show automatic makers. We have markers already.
          directionsDisplay.setOptions({suppressMarkers: true})
          directionsDisplay.setMap(map)

          // Hide the radii for coverage when we show directions.
          scope.shouldShowCoverage = false
          scope.$apply()
        }
      })
    }

    // Set up a listener for clicks on the 'Show Directions' buttons.
    // When a button is clicked, directions to the location will be drawn.
    element.click(event => {
      const id = $(event.target).attr('data-location-id')

      if (id) {
        calcRouteToLocation(mapLocations[id])

        if (lastWindowOpen != null) {
          lastWindowOpen.close()
        }
      }
    })

    const updateInfoWindows = () => {
      // Recalculate the closest locations when we update the windows again.
      closerTypes = {}

      Object.keys(colorMap).forEach(type => {
        closerTypes[type] = {id: null, distance: null}
      })

      // Reset the HTML text in each location to include distance,
      // corrected hyperlinks, and figure out which locations are nearest
      // to us for each type.
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
    }

    updateInfoWindows()

    // After some update to filters, update the visibility of every location,
    // so they are shown or hidden according to our filters.
    const updateVisibility = () => {
      Object.keys(mapLocations)
        .map(key => mapLocations[key])
        .forEach(location => { setLocationVisibility(location) })
    }

    updateVisibility()

    // Watch values to update the map dynamically when the values change.
    scope.$watch('homeLocation', () => {
      updateInfoWindows()

      // Re-centre the map on our location when it changes.
      map.setCenter(new google.maps.LatLng(scope.homeLocation.lat, scope.homeLocation.lng))
      // Move the marker for us to our new location.
      homeMarker.setPosition(scope.homeLocation)
      updateVisibility()
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
    // Change the directions when the travel method changes.
    scope.$watch('travelMethod', () => {
      if (scope.lastDirectionsLocation) {
        calcRouteToLocation(scope.lastDirectionsLocation)
      }
    })
  },
}))
