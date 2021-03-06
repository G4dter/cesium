
angular.module('cesium.home.controllers', ['cesium.services'])

  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('app.home', {
        url: "/home",
        views: {
          'menuContent': {
            templateUrl: "templates/home/home.html",
            controller: 'HomeCtrl'
          }
        }
      })

      .state('app.join', {
        url: "/join",
        views: {
          'menuContent': {
            templateUrl: "templates/home/home.html",
            controller: 'JoinCtrl'
          }
        }
      })
    ;

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');

  })

  .controller('HomeCtrl', HomeController)

  .controller('JoinCtrl', JoinController)
;


function NewAccountWizardController($scope, $ionicModal, $state, $ionicSideMenuDelegate, UIUtils, $q, $timeout, CryptoUtils, BMA, Wallet) {

  $scope.accountData = {};
  $scope.accountForm = {};
  $scope.slides = {
    slider: null,
    options: {
      loop: false,
      effect: 'slide',
      speed: 500
    }
  };

  // Called to navigate to the main app
  $scope.cancel = function() {
    $scope.newAccountModal.hide();
    $timeout(function(){
      $scope.accountData = {};
      $scope.accountForm = {};
      $scope.newAccountModal.remove();
      $scope.newAccountModal = null;
      $scope.slides.slider = null;
    }, 200);
  };

  $scope.setAccountForm =  function(accountForm) {
    $scope.accountForm = accountForm;
  };

  $scope.slidePrev = function() {
    $scope.slides.slider.unlockSwipes();
    $scope.slides.slider.slidePrev();
    $scope.slides.slider.lockSwipes();
  };

  $scope.slideNext = function() {
      $scope.slides.slider.unlockSwipes();
      $scope.slides.slider.slideNext();
      $scope.slides.slider.lockSwipes();
    };

  $scope.newAccount = function() {
    var showModal = function() {
      $scope.slides.slider.lockSwipes();
      $scope.slides.slider.slideTo(0);
      UIUtils.loading.hide();
      $scope.newAccountModal.show();
      // TODO: remove default
      /*$timeout(function() {
        $scope.accountData.currency = $scope.knownCurrencies[0];
        $scope.accountData.isMember = true;
        $scope.next();
        $scope.next();
      }, 300);*/
    };

    if (!$scope.newAccountModal) {
      UIUtils.loading.show();
      // Create the account modal that we will use later
      $ionicModal.fromTemplateUrl('templates/home/new_account_wizard.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.newAccountModal = modal;
        $scope.newAccountModal.hide()
        .then(function(){
          $scope.loadCurrencies()
          .then(function (res) {
            $scope.knownCurrencies = res;
            $scope.search.looking = false;
            if (!!res && res.length == 1) {
              $scope.selectedCurrency = res[0].id;
            }
            showModal();
          });
        });

      });
    }
    else {
      showModal();
    }
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
  });

  $scope.selectCurrency = function(currency) {
    $scope.accountData.currency = currency;
    $scope.slideNext();
  };

  $scope.selectAccountTypeMember = function(bool) {
    $scope.accountData.isMember = bool;
    $scope.slideNext();
  };

  $scope.showAccountPubkey = function() {
    $scope.accountData.computing=true;
    CryptoUtils.connect($scope.accountData.username, $scope.accountData.password).then(
        function(keypair) {
            $scope.accountData.pubkey = CryptoUtils.util.encode_base58(keypair.signPk);
            $scope.accountData.computing=false;
        }
    )
    .catch(function(err) {
      $scope.accountData.computing=false;
      console.error('>>>>>>>' , err);
      UIUtils.alert.error('ERROR.CRYPTO_UNKNOWN_ERROR');
    });
  };

  $scope.doNewAccount = function() {
    $scope.accountForm.$submitted=true;
    if(!$scope.accountForm.$valid) {
      return;
    }

    UIUtils.loading.show();
    $scope.newAccountModal.hide()
    .then(function(){
      Wallet.login($scope.accountData.username, $scope.accountData.password)
        .then(function() {
          if (!$scope.accountData.isMember) {
            // Reset account data, and open wallet view
            $scope.cancel();
            $state.go('app.view_wallet');
            return;
          }

          // Send self
          Wallet.self($scope.accountData.pseudo, false/*do NOT load membership here*/)
            .then(function() {
              // Send membership IN
              Wallet.membership.inside()
              .then(function() {
                // Reset account data, and open wallet view
                $scope.cancel();
                $state.go('app.view_wallet');
              })
              .catch(UIUtils.onError('ERROR.SEND_MEMBERSHIP_IN_FAILED'));
            })
            .catch(UIUtils.onError('ERROR.SEND_IDENTITY_FAILED'));
        })
        .catch(function(err) {
          UIUtils.loading.hide();
          console.error('>>>>>>>' , err);
          UIUtils.alert.error('ERROR.CRYPTO_UNKNOWN_ERROR');
        });
    });
  };

  // TODO: remove auto add account when done
  /*$timeout(function() {
    $scope.newAccount();
  }, 400);
  */
}

function HomeController($scope, $ionicModal, $state, $ionicSideMenuDelegate, UIUtils, $q, $timeout, CryptoUtils, BMA, Wallet,  APP_CONFIG) {

  NewAccountWizardController.call(this, $scope, $ionicModal, $state, $ionicSideMenuDelegate, UIUtils, $q, $timeout, CryptoUtils, BMA, Wallet);

}

function JoinController($scope, $ionicModal, $state, $ionicSideMenuDelegate, UIUtils, $q, $timeout, CryptoUtils, BMA, Wallet, APP_CONFIG) {

  NewAccountWizardController.call(this, $scope, $ionicModal, $state, $ionicSideMenuDelegate, UIUtils, $q, $timeout, CryptoUtils, BMA, Wallet);

  // open new account wizard
  $timeout(function() {
    $scope.newAccount();
  }, 100);

}
