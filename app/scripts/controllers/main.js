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
  vm.homeLocation = {lat: 51.56, lng: -0.25}

  vm.runAddressSearch = () => {
    console.log('running address search')

    const geocoder = new google.maps.Geocoder()

    geocoder.geocode({address: vm.address}, (results, status) => {
      console.log(status)

      if (status === 'OK') {
        const location = results[0].geometry.location

        vm.homeLocation = {lat: location.lat(), lng: location.lng()}
      } else {
        /* Show an error here? */
      }

      $scope.$digest()
    })
  }
})
