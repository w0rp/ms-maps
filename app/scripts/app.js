/**
 * @ngdoc overview
 * @name msMapsApp
 * @description
 * # msMapsApp
 *
 * Main module of the application.
 */
angular
.module('msMapsApp', [
  'ngAnimate',
  'ngCookies',
  'ngResource',
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  'msMapsApp.main',
])
.config(($routeProvider) => {
  'use strict'

  $routeProvider
    .when('/', {
      templateUrl: 'views/main.html',
      controller: 'MainCtrl',
      controllerAs: 'vm',
    })
    .otherwise({
      redirectTo: '/',
    })
})
