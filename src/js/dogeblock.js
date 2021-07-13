Dogeblock = {};

Dogeblock.getBalances = function(addresses, dwkeys, callback) {

  WALLET.retrieveDOGEAddrsInfo(addresses, function(dogeData) {
    $.jqlog.debug('Updating normalized balances for a single addresses at dogeblock ' + addresses)
    failoverAPI("get_normalized_balances", {'addresses': addresses}, function(assetsData, endpoint) {
      var data = {};
      // extracts all asset except DOGE
      for (var i in assetsData) {
        e = assetsData[i];
        data[e.address] = data[e.address] || {};
        data[e.address][e.asset] = {
          'balance': e.quantity,
          'owner': e.owner
        }
      }
      // extracts DOGE only if balance>0 or other assets in data[e.addr]
      for (var i in dogeData) {
        e = dogeData[i];
        if (data[e.addr] || e.confirmedRawBal > 0) {
          data[e.addr] = data[e.addr] || {};
          data[e.addr][KEY_ASSET.DOGE] = {
            'balance': e.confirmedRawBal,
            'txouts': e.rawUtxoData.length
          };
          if (dwkeys[e.addr]) {
            data[e.addr][KEY_ASSET.DOGE]['privkey'] = dwkeys[e.addr].getWIF();
          }
        }
      }
      callback(data);
    });
  });

}
