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

  function updateAddress(geocodeResults) {
    vm.formattedAddress = geocodeResults[0].formatted_address
  }

  function lookupAddress(latLng) {
    geocoder.geocode({location: latLng}, (results, status) => {
      if (status === 'OK') {
        updateAddress(results)
      } else {
        /* Show an error here? */
      }

      $scope.$digest()
    })
  }

  function getLocation(callback) {
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

  /* Get the location somehow, and update the address when we are done */
  getLocation(location => {
    vm.homeLocation = location
    lookupAddress(location)
  })

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

  vm.updateTravelMethodToDriving = () => {

      vm.walking = false
      vm.transit = false
      vm.driving = true
      vm.travelMethod = 'DRIVING'

  }

  vm.updateTravelMethodToWalking = () => {
      vm.driving = false
      vm.transit = false
      vm.walking = true
      vm.travelMethod = 'WALKING'

  }

  vm.updateTravelMethodToTransit = () => {

      vm.walking = false
      vm.driving = false
      vm.transit = true
      vm.travelMethod = 'TRANSIT'

  }
})
