/***************************************************
	Significance Labs
	Brooklyn, NYC

 	Author: Alexandra Berke (aberke)
 	Written: Summer 2014


 	AngularJS app

****************************************************/





var ChecklistApp = angular.module('ChecklistApp', ['ngRoute', 'translateModule'])

	.config(function($locationProvider) {

		$locationProvider.html5Mode(true);

	})

	.config(function($provide, $filterProvider) {

		// register services
		$provide.service('APIservice', APIservice);
		$provide.service('UtilityService', UtilityService);


		// register factories
		$provide.factory('TaskFactory', TaskFactory);
		$provide.factory('UserFactory', UserFactory);
		$provide.factory('GeolocationFactory', GeolocationFactory);

		// register filters
		$filterProvider.register('telephone', TelephoneFilter);

	});

	// App.config --> routes in routes.js