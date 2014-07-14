/***************************************************
	Significance Labs
	Brooklyn, NYC

 	Author: Alexandra Berke (aberke)
 	Written: June 2014


 	AngularJS app

****************************************************/




var App = angular.module('App', ['ngRoute', 'houseCleanersFilters'])

	.config(function($locationProvider) {

		$locationProvider.html5Mode(true);

	})

	.config(function($provide, $compileProvider, $filterProvider) {

		// register services
		$provide.service('APIservice', APIservice);


		// register factories
		$provide.factory('TaskFactory', TaskFactory);
		$provide.factory('UserFactory', UserFactory);

	});

	// App.config --> routes in routes.js