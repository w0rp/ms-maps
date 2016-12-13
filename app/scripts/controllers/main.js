/**
 * @ngdoc function
 * @name msMapsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the msMapsApp
 */
angular.module('msMapsApp.main', [
  'msMapsApp.markers',
  'msMapsApp.directives.map',
])
.controller('MainCtrl', function($scope, markers) {
  'use strict'
  /* global google */

  var vm = this

  const defaultLocation = Object.freeze({lat: 51.56, lng: -0.25})
  const geocoder = new google.maps.Geocoder()

  vm.markers = markers
  vm.locationType = 'branches'
  vm.homeLocation = defaultLocation
  vm.formattedAddress = ''
  vm.unitType = 'kilometres'
  vm.shouldShowDistanceInMiles = false
  vm.shouldShowMarkers = true
  vm.shouldShowCoverage = true
  vm.driving = true
  vm.walking = false
  vm.transit = false
  vm.travelMethod = 'DRIVING'

  // Given some geocode results, update the address shown on the page.
  const updateAddress = geocodeResults => {
    vm.formattedAddress = geocodeResults[0].formatted_address
  }

  // Given a location, look up the full address name, etc, and update it
  // on the page if we can find it.
  const lookupAddress = latLng => {
    geocoder.geocode({location: latLng}, (results, status) => {
      if (status === 'OK') {
        updateAddress(results)
      } else {
        /* Show an error here? */
      }

      $scope.$digest()
    })
  }

  // Given some callback for when we are done, determine the current location
  // The HTML5 geolocation API will be used if available,
  // and if all else fails we will use a constant default location instead.
  const getLocation = callback => {
    if (navigator.geolocation == null) {
      callback(defaultLocation)

      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        callback(Object.freeze({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }))
      },
      () => {
        /* geolocation lookup failed */
        callback(defaultLocation)
      }
    )
  }

  // Get the location somehow, and update the address when we are done
  getLocation(location => {
    vm.homeLocation = location
    lookupAddress(location)
  })

  /**
   * This method on the controller will run another address search when the
   * address the user has typed is updated. If the lookup via Google Maps API
   * succeeds, the user's location will be updated, which will update them map.
   */
  vm.runAddressSearch = () => {
    geocoder.geocode({address: vm.address}, (results, status) => {
      if (status === 'OK') {
        updateAddress(results)

        const location = results[0].geometry.location

        vm.homeLocation = Object.freeze({lat: location.lat(), lng: location.lng()})
      } else {
        /* Show an error here? */
      }

      $scope.$digest()
    })
  }
})
