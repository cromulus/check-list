/*********************************************************************


	Significance Labs
	Brooklyn, NYC

 	Author: Alexandra Berke (aberke)
 	Written: Summer 2014




	AngularJS controllers 

*********************************************************************/

function MainCntl($scope, $window, $location, APIservice, UserFactory, TranslateService) {
	/* This controller's scope spans over all views */
	$scope.domain = $window.location.origin;
	$scope.user;
	var showingControls;
	var view;

	var resetControls = function() {
		showingControls = false;
		if (view) { view.className = ""; }
	}

	$scope.clickHamburger = function() {
		// DO get view again each time to ensure controls work

		view = document.getElementById('view');
		if (showingControls) {
			view.className = "";
			showingControls = false;
		} else {
			view.className = "collapsed";
			showingControls = true;
		}
	}

	var setupGoogleAnalytics = function() {
		// log every new page view in production

		if ($scope.domain == "http://clean-slate2.herokuapp.com") {
			$scope.$on('$routeChangeSuccess', function(event) {
				console.log('pushing to google-analytics')
				$window.ga('send', 'pageview', { page: $location.path() });
			});
		}
	}
	$scope.logout = function(){
		$scope.user = null;
		UserFactory.logout();
	}
	var resetUser = function() {
		$scope.user = null;
		UserFactory.GETuser().then(function(user) {
			$scope.user = user;
			console.log('user', user)
		});
	}
	$scope.selectLanguage = function(language) {
		$scope.currentLanguage = TranslateService.setCurrentLanguage(language);
	}
	var init = function() {
		setupGoogleAnalytics();
		$scope.$on('$routeChangeSuccess', function(event) {
			resetUser();
			resetControls();
		});
		document.getElementById('control-view').style.display = "block";
		showingControls = false;

		$scope.currentLanguage = TranslateService.getCurrentLanguage();
	}
	init();
}


function NewCntl($scope, $location, APIservice) {

	//$scope.showAll = true; // true iff testing

	$scope.error;
	$scope.waiting;
	$scope.cleaner;
	$scope.stage;

	$scope.submitPhonenumber = function() {
		// clear out old error
		$scope.error = {};
		// show waiting
		$scope.waiting = true;
		/* ensure that phonenumber is new and valid (sends SMS message via twilio)
			if not: err
			if so: increment stage appropriately
		*/
		var phonenumber = $scope.cleaner.phonenumber;
		if (!phonenumber) {
			$scope.waiting = false;
			$scope.error.phonenumber = true;
			return;
		}

		var successCallback = function() {
			$scope.waiting = false;
			$scope.stage = 1;
		}
		var errorCallback = function(message) {
			$scope.waiting = false;
			$scope.error.message = message;
			$scope.error.phonenumber = true;
		}
		APIservice.GET('/api/cleaner/validate-new-phonenumber/' + phonenumber).then(successCallback, errorCallback);
	}

	$scope.submitPassword = function() {
		/* POSTs new user */

		// clear old error
		$scope.error = {};

		// verify both pasword and confirmPassword entered
		$scope.error.password = $scope.cleaner.password ? false : true;
		$scope.error.confirmPassword = $scope.cleaner.confirmPassword ? false : true;

		// verify password and confirmPassword match
		if ($scope.cleaner.confirmPassword != $scope.cleaner.password) {
			$scope.error.message = 'INVALID_PASSWORD_CONFIRM_ERROR';
			$scope.error.confirmPassword = true;
		}
		if ($scope.error.phonenumber||$scope.error.password||$scope.error.confirmPassword) {
			console.log('error', $scope.error)
			return false;
		}
		var successCallback = function(data) {
			$location.path('/dashboard');
		}
		var errorCallback = function(message) {
			$scope.error.message = message;
		}
		APIservice.POST('/api/cleaner', $scope.cleaner).then(successCallback, errorCallback);
	}

	function init() {
		$scope.stage = 0;
		$scope.error = {};
		$scope.waiting = false;
		$scope.cleaner = {};
	}
	init();
}

function LoginCntl($scope, $location, APIservice, UserFactory) {

	$scope.cleaner = {};
	$scope.error = {};

	$scope.login = function() {
		$scope.error = {};
		var errorCallback = function(message) {
			$scope.error.message = message;
		}
		var successCallback = function(data) {
			$location.path('/dashboard'); 
		}
		UserFactory.login($scope.cleaner).then(successCallback, errorCallback);
	}
}

function ResetPasswordCntl($scope, $timeout, $location, APIservice) {

	$scope.error = {};
	$scope.stage = 0;
	$scope.cleaner = {};
	$scope.sendAgainEnabled = true;

	$scope.sendResetCode = function() {
		/* send the reset code and hide send-again button for enough seconds to recieve SMS */
		$scope.error = {};
		$scope.sendAgainEnabled = false;
		$timeout(function() {
			$scope.sendAgainEnabled = true;
		}, 6000);

		var errorCallback = function(message) {
			$scope.error.message = message;
		}
		var successCallback = function(data) {
			$scope.stage = 1;
		}
		APIservice.POST("/auth/send-reset-code", $scope.cleaner).then(successCallback, errorCallback);
	}
	$scope.submitNewPassword = function() {
		// clear old error
		$scope.error = {};

		// verify reset_code, password, and confirmPassword all entered
		$scope.error.reset_code = $scope.cleaner.reset_code ? false : true;
		$scope.error.password = $scope.cleaner.password ? false : true;
		$scope.error.confirmPassword = $scope.cleaner.confirmPassword ? false : true;

		// verify password matches confirmPassword
		if (!$scope.cleaner.confirmPassword || $scope.cleaner.confirmPassword != $scope.cleaner.password) {
			$scope.error.message = "INVALID_PASSWORD_CONFIRM_ERROR";
			$scope.error.confirmPassword = true;
		}
		if ($scope.error.password || $scope.error.confirmPassword) {
			return false;
		}

		var errorCallback = function(message) {
			$scope.error.message = message;
		}
		var successCallback = function(data) {
			$location.path('/dashboard');
		}
		APIservice.PUT("/auth/reset-password", $scope.cleaner).then(successCallback, errorCallback);
	}
}

function DashboardCntl($scope, $window, $location, APIservice, UtilityService, UserFactory, TranslateService, user, lists) {

	$scope.lists;

	$scope.deleteList = function(list) {
		var msg = TranslateService.translate("DELETE_LIST_CONFIRM_MSG");
		msg += ("\n\n");
		msg += TranslateService.translate(list.name || 'UNTITLED');
		var confirmed = $window.confirm(msg);
		if (!confirmed) {
			return;
		}
		var successCallback = function() {
			// remove list from scope
			UtilityService.removeFromList($scope.lists, list, '_id');
			// remove list from UserFactory
			UserFactory.removeList(list);
		}
		var errorCallback = function(message) {
			console.log('ERROR in deleteList', message, 'TODO');
		}
		APIservice.DELETE('/api/list/' + list._id).then(successCallback, errorCallback);
	}

	$scope.newList = function() {
		var successCallback = function(list) {
			UserFactory.addList(list);
			$location.path('/list/' + list._id + '/edit');
		}
		APIservice.POST('/api/cleaner/' + user._id + '/list').then(successCallback);
	}

	$scope.selectList = function(list) {
		$location.path('/list/' + list._id);
	}
	$scope.editList = function(list) {
		$location.path('/list/' + list._id + '/edit');
	}

	var init = function() {
		$scope.lists = lists;
		// turn last_modified date strings into date objects
		for (var i=0; i<$scope.lists.length; i++) {
			$scope.lists[i].last_modified = UtilityService.dateStringToDate($scope.lists[i].last_modified);
		}
	}
	init();
}

function ListModeCntl($scope, $location) {
	/* Always nested within list-view
		therefore always has $scope of ListCntl as parent $scope
			-- therefore has $scope.mode
	*/
	$scope.mode; // inherited from $scope of ListCntl
	$scope.list; // inherited from $scope of ListCntl
	
}

function ListCntl($scope, $location, TaskFactory, APIservice, GeolocationFactory, user, list, editMode) {
	/* View exists in two alternative states (modes_:
		edit-mode: collapsable rooms with editable tasks
		clean-mode: static task list that is nearly identical to client's receipt
	*/
	$scope.view = 'list';
	$scope.user = user;
	$scope.mode; // either 'edit' or 'clean'
	$scope.list;
	$scope.editingListInfo;
	$scope.showingNotes;
	$scope.editingNotes;
	$scope.editingPrice;
	$scope.sendStatus; // states: undefined/null, 'sending', 'sent'
	$scope.error;

	$scope.changeMode = function(mode) {
		var path = '/list/' + $scope.list._id + ( mode=='edit' ? '/edit' : '');
		$location.path(path);
	}

	$scope.useCurrentLocation = function() {
		$scope.error = {};
		$scope.nearestLocations = [];
		var successCallback = function(nearestLocations) {
			$scope.nearestLocations = nearestLocations;
		}
		var errorCallback = function(message) {
			$scope.error.message = message;
			$scope.nearestLocations = null;
		}
		GeolocationFactory.getNearestLocations(successCallback, errorCallback);
	}
	$scope.useLocation = function(location) {
		$scope.list.location = location;
		$scope.nearestLocations = null;
	}

	$scope.saveList = function() {
		$scope.error = {};
		$scope.editingListInfo = false;

		var errorCallback = function(message) {
			$scope.error.message = message;
			$scope.editingListInfo = true;
		}
		var successCallback = function(data) {
			console.log('successCallback', data)
			$scope.list._id = ($scope.list._id || data._id);
		}
		APIservice.PUT('/api/list/' + $scope.list._id, $scope.list).then(successCallback, errorCallback);
	}
	var saveRoomCount = function(room) {
		var errorCallback = function(message) {
			$scope.error.message = message;
		}
		var successCallback = function(data) {
			console.log('successCallback', data)
		}
		APIservice.PUT('/api/room/' + room._id, room).then(successCallback, errorCallback);
	}
	$scope.incrementRoomCount = function(room) {
		room.count = room.count ? (room.count + 1) : 1;
		saveRoomCount(room);
	}
	$scope.decrementRoomCount = function(room) {
		room.count = room.count ? (room.count - 1) : 0;
		saveRoomCount(room);
	}


	$scope.clickListInfo = function() {
		$scope.editingListInfo ? $scope.saveList() : $scope.editingListInfo = true;
	}
	$scope.clickNotes = function() {
		$scope.showingNotes = !$scope.showingNotes;
		if (!$scope.list.notes) { // show textarea
			$scope.editingNotes = true;
		}
	}
	$scope.saveNotes = function() {
		$scope.saveList();
		$scope.editingNotes = false;
	}
	$scope.editNotes = function() { $scope.editingNotes = true; }

	$scope.savePrice = function() {
		$scope.editingPrice = false;
		$scope.saveList();
	}
	$scope.editPrice = function() { $scope.editingPrice = true; }

	$scope.clickRoom = function(room) {
		room.active = room.active ? false : true;
	}
	$scope.selectAllTasks = function(room) {
		for (var i=0; i<room.tasks.length; i++) {
			var task = room.tasks[i];
			console.log(task)
			if (!task.selected) {
				selectTask(room, task);
			}
		}
	}
	$scope.clickTask = function(room, task) {
		task.selected ? unselectTask(room, task) : selectTask(room, task);
	}
	$scope.addCustomTask = function(room, newCustomTask) {
		var newTask = TaskFactory.generateCustomTask(newCustomTask, room.type);
		room.tasks.push(newTask);
		saveTask(room, newTask);
	}
	var unselectTask = function(room, task) {
		task.selected = false;
		deleteTask(task);
	}
	var selectTask = function(room, task) {
		task.selected = true;
		saveTask(room, task);
	}
	var saveTask = function(room, task) {
		var successCallback = function(data) {
			// this is saved to the correct place in scope
			task._id = data._id;
			console.log('successCallback for saveTask. list:', $scope.list)
		}
		var errorCallback = function(message) {
			console.log('ERROR', message, 'TODO: HANDLE');
		}
		APIservice.POST('/api/room/' + room._id + '/task', task).then(successCallback, errorCallback);
	}
	var deleteTask = function(task) {
		if (!task._id) { return; }
		// UI feedback already handled by clickTask -- looks unselected
		var successCallback = function(data) {
			console.log('successCallback to delete', data)
		}
		var errorCallback = function(message) {
			console.log('ERROR', message, 'TODO: HANDLE');
		}
		APIservice.DELETE('/api/task/' + task._id).then(successCallback, errorCallback);
	}

	var registerPhonenumberListener = function() {
		/* after sending list, user should be able to edit phonenumber and resend 
			However ng-change listeners are expensive
				--> Only register listener after sendList 
					(when user would presumably see they got phonenumber wrong and want to resend)
		*/
		$scope.$watch('list.phonenumber', function(newValue, oldValue) {
			if (newValue != oldValue) {
				$scope.sendStatus = null;
			}
		});
	}

	$scope.sendList = function() {
		$scope.sendStatus = 'sending';
		$scope.error = {};
		/* if still need to edit list info, force them to do so
			open up the list editing and scroll to top of the page where it is
		*/ 
		var successCallback = function() {
			$scope.editingListInfo = false;
			$scope.sendStatus = 'sent';
		}
		var errorCallback = function(message) {
			$scope.editingListInfo = true;
			document.body.scrollTop = document.documentElement.scrollTop = 0;
			$scope.error.message = message;
			$scope.sendStatus = null;
		}
		if (!$scope.list.phonenumber) {
			errorCallback('PHONENUMBER_REQUIRED_ERROR');
			return false;
		}
		APIservice.PUT('/api/list/' + $scope.list._id + '/send', $scope.list).then(successCallback, errorCallback);
		registerPhonenumberListener();
	}

	var GETrooms = function() {
		var successCallback = function(rooms) {
			// initialize room.count to 0 if not set
			for (var i=0; i<rooms.length; i++) {
				rooms[i].count = (rooms[i].count || 1);
			}

			$scope.list.rooms = TaskFactory.setupRoomsTasks(rooms);
		}
		var errorCallback = function(message) {
			console.log('TODO -- handle error')
		}
		APIservice.GET('/api/room/search?populate_tasks=true&_list=' + $scope.list._id).then(successCallback, errorCallback);
	}
	

	var init = function() {
		if (editMode) { 
			$scope.mode = 'edit';
		} else {
			$scope.mode = 'clean';
		}
		$scope.editingListInfo = false;

		$scope.list = list;
		$scope.list._cleaner = user._id;
		$scope.list.rooms = [];
		GETrooms();

		$scope.today = new Date(); // for cleaning log title


		/* backwards compatibility:
			phonenumbers stored as strings need be converted to integers
		*/
		if ($scope.list.phonenumber) {
			$scope.list.phonenumber = Number($scope.list.phonenumber);
		}

		console.log('list', $scope.list)
	}
	init();
}

function ReceiptCntl($scope, UtilityService, receipt) {
	$scope.cleaner;
	$scope.list; // for now receipt mimicing list

	var init = function() {
		receipt.date = UtilityService.dateStringToDate(receipt.date);
		$scope.cleaner = receipt.cleaner;
		$scope.list = receipt;


		console.log('list', $scope.list)
	}
	init();
}







