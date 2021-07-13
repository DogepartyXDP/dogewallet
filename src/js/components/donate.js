function DonationViewModel() {

  var self = this;

  var quantityValidator = {
    required: true,
    isValidPositiveQuantity: self,
    validation: {
      validator: function(val, self) {
        var address = self.sourceAddress();
        var quantity = self.quantity();
        if (self.donationCurrency() === KEY_ASSET.XDP) {
          return parseFloat(quantity) <= self.balancesXDP[address];
        } else {
          return parseFloat(quantity) <= self.balancesDOGE[address];
        }
      },
      message: i18n.t('quantity_exceeds_balance'),
      params: self
    }
  }

  self.shown = ko.observable(false);
  self.availableAddresses = ko.observableArray([]);
  self.sourceAddress = ko.observable(null).extend(quantityValidator);
  self.balancesXDP = {};
  self.balancesDOGE = {};
  self.quantity = ko.observable(null).extend(quantityValidator);
  self.donationCurrency = ko.observable(KEY_ASSET.DOGE);


  self.validationModel = ko.validatedObservable({
    quantity: self.quantity
  });

  self.show = function() {
    self.init();
    self.shown(true);
  }

  self.hide = function() {
    self.shown(false);
  }

  self.init = function() {

    // prepare source addresses
    self.availableAddresses([]);
    self.balancesXDP = {};
    var addresses = WALLET.getAddressesList(true);
    var options = []
    for (var i = 0; i < addresses.length; i++) {
      var dogeBalance = WALLET.getBalance(addresses[i][0], KEY_ASSET.DOGE, true);
      options.push({
        address: addresses[i][0],
        label: addresses[i][1] + ' (' + [round(dogeBalance, 2), KEY_ASSET.DOGE, '/', round(addresses[i][2], 2), KEY_ASSET.XDP].join(' ') + ')'
      });
      self.balancesDOGE[addresses[i][0]] = dogeBalance;
      self.balancesXDP[addresses[i][0]] = addresses[i][2];
    }
    self.availableAddresses(options);
  }

  self.submitDonation = function() {
    $.jqlog.debug('submitDonation');
    if (!self.validationModel.isValid()) {
      self.validationModel.errors.showAllMessages();
      return false;
    }

    var params = {
      source: self.sourceAddress(),
      quantity: denormalizeQuantity(self.quantity()),
      asset: self.donationCurrency(),
      destination: DONATION_ADDRESS,
      _asset_divisible: true
    };

    $.jqlog.debug(params);

    var onSuccess = function(txHash, data, endpoint, addressType, armoryUTx) {
      var message = "<b>";
      if (armoryUTx) {
        message += i18n.t("you_are_choosing_to_donate", self.quantity(), self.donationCurrency());
      } else {
        message += i18n.t("you_chose_to_donate", self.quantity(), self.donationCurrency());
      }
      message += " " + i18n.t("thank_you");
      message += "</b> ";
      WALLET.showTransactionCompleteDialog(message + " " + i18n.t(ACTION_PENDING_NOTICE), message, armoryUTx);
    }

    WALLET.doTransaction(self.sourceAddress(), "create_send", params, onSuccess);
    self.hide();
  }

}

/*NOTE: Any code here is only triggered the first time the page is visited. Put JS that needs to run on the
  first load and subsequent ajax page switches in the .html <script> tag*/
