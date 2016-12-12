/**
 * @ngdoc function
 * @name msMapsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the msMapsApp
 */
angular.module('msMapsApp.main', [
  'msMapsApp.markers',
])
.controller('MainCtrl', function(markers) {
  'use strict'

  var vm = this

  vm.markers = markers
})
