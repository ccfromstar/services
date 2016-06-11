var http = require('http');  

var qs = require('querystring');  

exports.sendSMS = function (_mobile,_content){

var post_data = {  
    action: "send",  
    userid: 165,
    account: "",
    password: "",
    mobile:Number(_mobile),
    content:_content,
    sendTime:"",
    extno:""
};  
  
var content = qs.stringify(post_data);  
  
var options = {  
    hostname: '203.110.164.10',  
    port: 8888,  
    path: '/sms.aspx',  
    method: 'POST',  
    headers: {  
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'  
    }  
};  
  
var req = http.request(options, function (res) {  
    console.log('STATUS: ' + res.statusCode);  
    console.log('HEADERS: ' + JSON.stringify(res.headers));  
    res.setEncoding('utf8');  
    res.on('data', function (chunk) {  
        console.log('BODY: ' + chunk);  
    });  
});  
  
req.on('error', function (e) {  
    console.log('problem with request: ' + e.message);  
});  
  
// write data to request body  
req.write(content);  
  
req.end();
 
} 