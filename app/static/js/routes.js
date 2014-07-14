/***************************************************
	Significance Labs
	Brooklyn, NYC

 	Author: Alexandra Berke (aberke)
 	Written: June 2014


 	AngularJS app

****************************************************/


App.config(function($routeProvider) {

	var userOrRedirect = function(UserFactory, $location) {
		return UserFactory.GETuser().then(function(user) {
			if (!user) { /* user isn't logged in - redirect to home */
				$location.path('/');
			}
			return user; /* success: return user object */
		});
	};

	$routeProvider
		.when('/', {
			templateUrl: '/static/html/partials/index.html',
		})
		.when('/new', {
			templateUrl: '/static/html/partials/new.html',
			controller: NewCntl,
		})
		.when('/test', {
			templateUrl: '/static/html/partials/test.html',
			controller: NewCntl,
		})
		.when('/sign-in', {
			templateUrl: '/static/html/partials/sign-in.html',
			controller: LoginCntl,
		})
		.when('/reset-password', {
			templateUrl: '/static/html/partials/reset-password.html',
			controller: ResetPasswordCntl,
		})
		.when('/dashboard', {
			templateUrl: '/static/html/partials/dashboard-view.html',
			controller: DashboardCntl,
			resolve: {
				user: userOrRedirect,
				lists: function(UserFactory) {
					return UserFactory.GETlists().then(function(lists) {
						console.log('UserFactory.then', lists)
						return lists;
					});
				} ,
			},
		})
		.when('/list/new', {
			templateUrl: '/static/html/partials/list-view.html',
			controller: ListCntl,
			resolve: {
				user: userOrRedirect,
			},
		})
		.when('/list/:id', {
			templateUrl: '/static/html/partials/list-view.html',
			controller: ListCntl,
		})
		.otherwise({
			redirectTo: '/'
		});
});







