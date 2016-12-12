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

  vm.markers = markers
  vm.locationType = 'branches'
  vm.homeLocation = Object.freeze({lat: 51.56, lng: -0.25})

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      vm.homeLocation = Object.freeze({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    })
  }

  vm.runAddressSearch = () => {
    const geocoder = new google.maps.Geocoder()

    geocoder.geocode({address: vm.address}, (results, status) => {
      if (status === 'OK') {
        const location = results[0].geometry.location

        vm.homeLocation = Object.freeze({lat: location.lat(), lng: location.lng()})
      } else {
        /* Show an error here? */
      }

      $scope.$digest()
    })
  }
})
