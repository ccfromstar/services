var nodeUtil = require('util');
var crypto = require('crypto');

function _formatedNow(){
    var date = new Date();
    var now = "";
    now = date.getFullYear()+"-";
    now = now + (date.getMonth()+1)+"-";
    now = now + date.getDate()+" ";
    now = now + date.getHours()+":";
    now = now + date.getMinutes()+":";
    now = now + date.getSeconds();
    return now;
}

exports.isEmpty = function (object) {
    var obj;
    for (obj in object) {
        return false;
    }
    return true;
}

exports.getNow = function(){
    var date = new Date(); //日期对象
    var now = "";
    now = date.getFullYear()+"";
    now = now + (date.getMonth()+1)+"";//取月的时候取的是当前月-1如果想取当前月+1就可以了
    now = now + date.getDate()+"";
    now = now + date.getHours()+"";
    now = now + date.getMinutes()+"";
    now = now + date.getSeconds()+"";
    return now;
}

exports.getNowFormatString = function(){
    return _formatedNow();
}

exports.isInt = function(value) {
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}
exports.getDateFullYear = function (date) {
    return date.getFullYear();
}
exports.getDateMonth = function (date) {
    var month = date.getMonth()+1;
    return month < 10 ? ('0'+month) : month;
}
exports.getDateDay = function (date) {
    var day = date.getDate();
    return day < 10 ? ('0'+day) : day;
}
exports.checkPwdStrength = function(pwd) {
    var score = _scorePassword(pwd);
    if (score < 30 )
        return false;
    if (score > 80)
        return "strong";
    if (score > 60)
        return "good";
    if (score >= 30)
        return "weak";
}
function _scorePassword(pwd) {

    if (!pwd) {
        return 0;
    }

    var score = 0;
    // award every unique letter until 5 repetitions
    var letters = new Object();
    for (var i=0; i<pwd.length; i++) {
        letters[pwd[i]] = (letters[pwd[i]] || 0) + 1;
        score += 5.0 / letters[pwd[i]];
    }

    // bonus points for mixing it up
    var variations = {
        digits: /\d/.test(pwd),
        lower: /[a-z]/.test(pwd),
        upper: /[A-Z]/.test(pwd),
        nonWords: /\W/.test(pwd)
    }

    var variationCount = 0;
    for (var check in variations) {
        variationCount += (variations[check] == true) ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    return parseInt(score);
}

/**
 * md5 加密
 * @param data
 * @returns {string}
 */
exports.md5 = function(data) {
    return crypto.createHash('md5').update(data).digest('hex').toUpperCase();
}