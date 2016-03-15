/**
 * Created by teng on 21.01.2015.
 */

module.exports = {
  parseInt: function (value) {
    var intValue = parseInt(value);
    return _isInt(intValue) ? intValue : null;
  },
  isInt: function (value) {
    return _isInt(value);
  }
}

function _isInt (value) {
  return !isNaN(value) && (function (x) {
      return (x | 0) === x;
    })(parseFloat(value))
}
