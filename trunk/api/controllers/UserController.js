/**
 * Created by teng on 21.11.2014.
 */

var MAX = 100;
var LIMIT = 10;
var imgPath = sails.config.globals.url.shipImg.default;
var User = require('./user.js');
var sms = require('./sms.js');
var utils = require('./utils.js');
var nodemailer = require('nodemailer');

module.exports = {

  authUser: function (req, res) {
    var pwd = req.param('password');
    var login = req.param('loginName');
    var openId = req.param('openId');

    //console.log(pwd);
    //console.log(login);
    //console.log(openId);

    if ( openId ) {

        var sql = "SELECT u.id, u.name, c.short_name AS company, u.departmentName AS department, u.mobile_phone AS mobilePhone,u.weixin_open_id as openid FROM user u, company c WHERE  u.weixin_open_id='" + openId + "' AND u.company_id = c.id";
        ApiModel.query(sql, function(err, resUser) {
            if (err) {
               // nodeUtil.log("webservicesAuth authUser: failed to get user!" + err);
                res.json({error: 'auth failed! Error code: AUTH001'});
                //return false;
            }
            if ( resUser && resUser.length > 0) {
                res.json(resUser[0]);
            }
            //res.json({error: 'auth failed! Error code: AUTH002'});
        });

    } else {
        if (!pwd || !login) {
            res.json({error: 'missing required parameters!'});
        }

        // login using pwd
        var user = new User({
            loginName: login,
            password: utils.md5(pwd)
        });

        user.checkLogin(function (result) {
            if (result == "loginWrong") {
                res.json({error: 'login failed!'});
                //return false;
            }

            user.id = result;
            var sql = "SELECT u.id, u.name, c.short_name AS company, u.departmentName AS department, u.mobile_phone AS mobilePhone,u.weixin_open_id as openid FROM user u, company c WHERE u.id=" + user.id + " AND u.company_id = c.id";
            ApiModel.query(sql, function (err, resUser) {
                if (err) {
                    //nodeUtil.log("webservicesAuth: failed to get user!");
                    res.json({error: err});
                    //return false;
                }
                if (resUser && resUser.length > 0) {
                     res.json(resUser[0]);
                }

                //res.json({error: 'user not found!'});

            });

        });
    }
  },
  bindWeChat: function (req, res) {
    var pwd = req.param('password');
    var login = req.param('loginName');
    var openId = req.param('openId');

    if ( !openId || !pwd || !login ) {
        res.json({error: 'missing required parameters! Error code: BIND001'});
    }

    var user = new User({
        loginName: login,
        password: utils.md5(pwd)
    });

    user.checkLogin(function (result) {
        if ( result == "loginWrong" ) {
            //nodeUtil.log("webservicesAuth bindWeChat: login wrong!");
            console.log('密码错误');
            res.json({error: '密码错误'});
            //return false;
        }
        
        user.id = result;
        var sql = "SELECT u.id, u.name, c.short_name AS company, u.departmentName AS department, u.mobile_phone AS mobilePhone,u.weixin_open_id as openid FROM user u, company c WHERE u.id=" + user.id + " AND u.company_id = c.id";
        ApiModel.query(sql, function(err, resUser) {
            if (err) {
                //nodeUtil.log("webservicesAuth bindWeChat: failed to get user!" + err);
                console.log('BIND004');
                res.json({error: 'failed to bind WeChat! Error code: BIND004. ' + err});
                //return false;
            }
            if ( resUser && resUser.length > 0) {
                sql = "UPDATE user SET weixin_open_id = '" + openId + "' WHERE id = " + user.id;
                ApiModel.query(sql, function(err2, resUpdateOpenId){
                    if(err2) {
                        //nodeUtil.log('failed to update user: ' + err2);
                        console.log('BIND002');
                        res.json({error: 'failed to bind WeChat! Error code: BIND002 ' + err2});
                    }
                    console.log('success');
                     res.json({error: 'success'});
                });
                
            }

            //return res.json({error: 'user not found!'});

        });

    });
  },
  unbindWeChat: function (req, res) {
    
    var openId = req.param('openId');

    if ( !openId ) {
        res.json({error: 'missing required parameters! Error code: BIND001'});
    }

    

   
        var sql = "SELECT u.id, u.name, c.short_name AS company, u.departmentName AS department, u.mobile_phone AS mobilePhone,u.weixin_open_id as openid FROM user u, company c WHERE u.weixin_open_id='" + openId + "' AND u.company_id = c.id";
        console.log(sql);
        ApiModel.query(sql, function(err, resUser) {
            if (err) {
                //nodeUtil.log("webservicesAuth bindWeChat: failed to get user!" + err);
                res.json({error: 'failed to unbind WeChat! Error code: BIND004. ' + err});
                //return false;
            }
            if ( resUser && resUser.length > 0) {
                sql = "UPDATE user SET weixin_open_id = NULL WHERE id = " + resUser[0].id;
                ApiModel.query(sql, function(err2, resUpdateOpenId){
                    if(err2) {
                        //nodeUtil.log('failed to update user: ' + err2);
                        res.json({error: 'failed to unbind WeChat! Error code: BIND002 ' + err2});
                    }
                     res.json(resUser[0]);
                });
                
            }else{
              res.json({error: 'user not found!'});
            }

            //return res.json({error: 'user not found!'});

        });

   
  },
  SendMessage: function (req, res) {
    var input1 = req.param('name');
    var input2 = req.param('tel');
    var input3 = req.param('email');
    var input4 = req.param('product');
    var sendtoid = req.param('sendtoid');

    console.log("sendtoid:"+sendtoid);

    var sql1 = "select title from product where id = " +input4;
    var sql3 = "select email,mobile_phone,name from user where id = "+sendtoid;
    ApiModel.query(sql1, function(err, result) {
    ApiModel.query(sql3, function(err3, result3) {
      // 开启一个 SMTP 连接池
    var smtpTransport = nodemailer.createTransport("SMTP",{
        host: "smtp.126.com", // 主机
        secureConnection: false, // 使用 SSL
        port: 25, // SMTP 端口
        auth: {
            user: "youlunshidai@126.com", // 账号
            pass: "password123" // 密码
        }
    });

    console.log(result3[0].email);

    // 设置邮件内容
    var mailOptions = {
        from: "微信网上预定 <youlunshidai@126.com>", // 发件地址
        to: result3[0].email, // 收件列表
        subject: "Booking", // 标题
        html: "<b>姓名:</b> "+input1+"<br/><b>联系电话:</b>"+input2+"<br/><b>E-Mail:</b>"+input3+"<br/><b>咨询产品:</b>"+result[0].title // html 内容
    }

    var label = "send success!";

    // 发送邮件
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            label = error;
        }else{
            console.log("Message sent: " + response.message);
            
        }
        smtpTransport.close(); // 如果没用，关闭连接池
    });

    //发送短信
    var content = "微信网上预定 姓名: "+input1+" 联系电话:"+input2+" E-Mail:"+input3+" 咨询产品:"+result[0].title;
    sms.sendSMS(result3[0].mobile_phone,content);
    
    //保存邮件记录
    var sql2 = "insert into email_weixin(name,tel,email,product,toName) values ('"+input1+"','"+input2+"','"+input3+"','"+result[0].title+"','"+result3[0].name+"')";
    ApiModel.query(sql2, function(err, result2) {
        if(err){label = err;}
        res.send(label);
    });

    });
    });
  },
  getOption: function (req, res) {
    var userid = parseInt(req.param('id'));
    var openid = (req.param('openid'));
    var sql3 = "select cshort_name as companyname,name,mobile_phone as telephone, weixin_companyname,weixin_name,weixin_tel from user_company where id = " + userid +" and weixin_open_id= '"+openid+"'";
    //console.log(sql3);
    ApiModel.query(sql3, function(err, result) {
        res.json(result[0]);
    });
  },
  setOption: function (req, res) {
    var weixin_companyname = req.param('weixin_companyname');
    var weixin_name = req.param('weixin_name');
    var weixin_tel = req.param('weixin_tel');
    var userid = parseInt(req.param('id'));
    var sql4 = "update user set weixin_companyname = '"+weixin_companyname+"',weixin_name = '"+weixin_name+"',weixin_tel='"+weixin_tel+"' where id = "+userid;
    ApiModel.query(sql4, function(err, result) {
        if(err){
          res.send(err);
        }else{
          res.send("success");
        }
        
    });
  },
  resetOption: function (req, res) {
    var userid = parseInt(req.param('id'));
    var openid = (req.param('openid'));
    var sql4 = "update user set weixin_companyname = NULL,weixin_name = NULL,weixin_tel = NULL where id = "+userid +" and weixin_open_id= '"+openid+"'";
    ApiModel.query(sql4, function(err, result) {
        if(err){
          res.send(err);
        }else{
          res.send("success");
        }
        
    });
  }
}

function _parseLimit(params) {
  var offset = params.offset ? params.offset : 0;
  var limit = params.limit ? params.limit : LIMIT;
  if (limit > MAX) {
    limit = MAX;
  }
  return {offset: offset, limit: limit};
}

function _parseWhere(params) {
  var pWhere = "";
  if (params.searchStartDate) {
    pWhere = " AND start_date like '" + params.searchStartDate + "%'";
  }
  if (params.typeId) {
    pWhere += " AND type_id = " + params.typeId;
  }
  return pWhere;
}

function _parseOrder(params){
  var orderBy;
  if (params.orderBy.price) {
    orderBy = "price";
  } else if (params.orderBy.startDate) {
    orderBy = "start_date";
  } else {
    orderBy = "published_at";
  }
  return orderBy;
}

function _productTotalSql(params) {
  var pWhere = _parseWhere(params);
  var orderBy = _parseOrder(params);
  if ( params.recommendedOnly ) {
    return " SELECT count(p.id) AS total FROM product p, product_category c WHERE status_id = 3 AND start_date >= CURDATE() AND p.id = c.product_id AND (c.special=1 OR c.cheap=1 OR c.early_booking=1) " + pWhere + " ORDER BY " + orderBy;
  }
  return " SELECT count(id) AS total FROM product WHERE status_id = 3 AND start_date >= CURDATE() " + pWhere + " ORDER BY " + orderBy;
}
/**
 *
 * @param params
  {
  orderBy : { price : false, startDate : false},
  offset : null,
  limit : null,
  startDate: startDate  search product with start_date like startDate
  }
 * @returns {string}
 * @private
 */
function _productListSql(params) {
  var sql;
  var offsetLimit = _parseLimit(params);
  var offset = offsetLimit.offset;
  var limit = offsetLimit.limit;
  var pWhere = _parseWhere(params);
  var orderBy = _parseOrder(params);
  var p1;
  var selectCategory = "";

  if ( params.recommendedOnly ) {
    p1 = "(SELECT p0.id, title, type_id, start_date, published_at, days, nights, ship_id, cruise_area_id, c.special AS isSpecial, c.early_booking AS isEarlyBooking, c.cheap AS isCheap FROM product p0, product_category c WHERE p0.status_id = 3 AND p0.start_date >= CURDATE() AND p0.id = c.product_id AND (c.special=1 OR c.cheap=1 OR c.early_booking=1) "+ pWhere + ") AS p1 ";
    selectCategory = ", isSpecial, isEarlyBooking, isCheap ";
  } else {
    p1 = "(SELECT id, title, type_id, start_date, published_at, days, nights, ship_id, cruise_area_id FROM product WHERE status_id = 3 AND start_date >= CURDATE() " + pWhere + ") AS p1 ";
  }


  var pSql = " SELECT p1.id, p1.title, p1.type_id, p1.start_date, p1.published_at, p1.days, p1.nights, p1.ship_id, p1.cruise_area_id, MIN(pp.price) AS price" + selectCategory +
    " FROM " + p1 +
    " LEFT JOIN product_position pp ON p1.id = pp.product_id " +
    " GROUP BY p1.id ORDER BY " + orderBy + " LIMIT " + offset + ", " + limit;

  sql = "SELECT p.id, p.title AS productTitle, p.type_id AS productType, p.price AS startingPrice, DATE_FORMAT(p.start_date, '%Y-%c-%d') AS startDate, p.days AS durationDays, p.nights AS durationNights, CONCAT(p.days, '天', p.nights, '晚') AS duration, " +
  " ts.location AS startLocation, ts2.route, s.txtShipName AS shipName, s.txtShipLevel as shipRating, cc.txtCompanyName AS shipCompany, ca.txtCruiseArea AS cruiseArea" + selectCategory + " FROM (" +
  pSql + ") AS p " +
  " LEFT JOIN travel_schedule AS ts ON ts.product_id = p.id AND ts.day_number = 1 " +
  " LEFT JOIN (SELECT product_id, GROUP_CONCAT(location ORDER BY day_number SEPARATOR '-') AS route FROM travel_schedule GROUP BY product_id) AS ts2 ON ts2.product_id = p.id " +
  " LEFT JOIN cruise_ship s ON p.ship_id = s.id " +
  " LEFT JOIN cruise_company cc ON cc.txtCompanyNo = s.txtCompanyNo " +
  " LEFT JOIN cruise_area ca ON ca.id = p.cruise_area_id";

  return sql;
}

function _queryProductCount(params) {
  var sql = _productTotalSql(params);
  sails.log(sql);
  return function(callback) {
    ApiModel.query(sql, function (err, result){
      if ( result ){
        callback(err, result[0].total);
      } else {
        callback(err, null);
      }
    });
  }
}

function _queryProductList(params) {
  var sql = _productListSql(params);
  sails.log(sql);
  return function(total, callback) {
    ApiModel.query(sql, function (err, resultProductList){
      if ( resultProductList ){
        callback(err, {productFoundTotal: total, productList: resultProductList});
      } else {
        callback(err, null);
      }
    });
  }
}

function _queryShipImages(id) {
  var sql = "SELECT u.type, CONCAT('"+imgPath+"/', u.type, '/', u.img_name, '_lg.jpg') AS url FROM ( (SELECT img_name, 'ship' AS type FROM ship_image WHERE ship_id IN (SELECT ship_id FROM product WHERE id ="+id+") ORDER BY order_number)"+
  " UNION (SELECT rtfImg AS img_name, 'culinary' AS type FROM ship_culinary WHERE ship_id IN (SELECT ship_id FROM product WHERE id ="+id+"))"+
  " UNION (SELECT rtfImg AS img_name, 'entertainment' AS type FROM ship_entertainment WHERE ship_id IN (SELECT ship_id FROM product WHERE id ="+id+")) ) u";
  return function(callback) {
    ApiModel.query(sql, function (err, resultImages){
      if( resultImages ) {
        callback(err, resultImages);
      } else {
        callback(err, null);
      }
    });
  }
}
function _queryEntertain(id){
  var sql = "SELECT name, description, CONCAT('"+imgPath+"/entertainment/',rtfImg, '_lg.jpg') AS imgUrl FROM ship_entertainment WHERE ship_id IN (SELECT ship_id FROM product WHERE id="+id+")";
  return function(resultImages, callback){
    ApiModel.query(sql, function(err, resultEntertain){
      callback(err, resultImages, resultEntertain);
    });
  };
}
function _queryCulinary(id){
  var sql = "SELECT restaurant_name AS name, type, fees, reservation, opening_time AS openTime, clothing, CONCAT('"+imgPath+"/culinary/',rtfImg, '_lg.jpg') AS imgUrl FROM ship_culinary WHERE ship_id IN (SELECT ship_id FROM product WHERE id="+id+")";
  return function(resultImages, resultEntertain, callback){
    ApiModel.query(sql, function(err, resultCulinary){
      callback(err, resultImages, resultEntertain, resultCulinary);
    });
  };
}
function _queryProductDetail(id) {
  var pSql = " SELECT p.id, p.title, p.type, p.productNumber, p.startDate, p.days AS durationDays, p.nights AS durationNights, ts.location AS startLocation, ts2.route, s.txtShipName AS shipName, s.txtShipLevel as shipRating, cc.txtCompanyName AS shipCompany, CONCAT('"+imgPath+"/shipcompanylogo/', cc.rtfCompanyLogo) AS shipCompanyLogo, ca.txtCruiseArea AS cruiseArea, p.productfeature AS keyFeature, p.visaApplicationUntil, p.visaComment, p.bookingNote, p.excursion FROM (SELECT id, title, productfeature, type_id AS type, product_number AS productNumber, ship_id, DATE_FORMAT(start_date, '%Y-%c-%d') AS startDate, days, nights, DATE_FORMAT(visa_application_until, '%Y-%c-%d') AS visaApplicationUntil, visa_comment AS visaComment, booking_note AS bookingNote, excursion_txt AS excursion, cruise_area_id " +
    " FROM product WHERE id = " + id + ") AS p " +
    " LEFT JOIN travel_schedule ts ON ts.product_id = p.id AND ts.day_number = 1 " +
    " LEFT JOIN (SELECT product_id, GROUP_CONCAT(location ORDER BY day_number SEPARATOR '-') AS route FROM travel_schedule WHERE product_id = " + id + " GROUP BY product_id) AS ts2 ON ts2.product_id = p.id " +
    " LEFT JOIN cruise_ship s ON p.ship_id = s.id " +
    " LEFT JOIN cruise_company cc ON cc.txtCompanyNo = s.txtCompanyNo " +
    " LEFT JOIN cruise_area ca ON ca.id = p.cruise_area_id";
  sails.log(pSql);
  return function(resultImages, resultEntertain, resultCulinary, callback) {
    ApiModel.query(pSql, function (err, resultProduct) {
      if ( resultProduct ) {
        //resultProduct[0].images = resultImages;
        //resultProduct[0].entertainment = resultEntertain;
        //resultProduct[0].culinary = resultCulinary;
        callback(err, resultProduct[0], resultImages, resultEntertain, resultCulinary);
      } else {
        callback(err, {});
      }
    });
  }
}
function _queryPosition(id) {
  var ppSql = "SELECT p.id, p.product_id AS productId, ct.txtCabinType AS cabinType, c.txtCabinName AS cabinName, c.txtDecks AS decks, c.txtCabinSize AS size, c.txtCabinFacility AS facility, CONCAT('" + imgPath + "/cabin/', IFNULL(c.rtfCabinImg, 'defaultCabinImg'), '_lg.jpg') AS imageUrl, c.numCanCheckIn AS checkInMax, p.price, (CASE WHEN p.price_2>0 THEN p.price_2 ELSE '' END) AS price2, (CASE WHEN p.price_child>0 THEN p.price_child ELSE '' END) AS priceChild, p.amount, p.tip, p.comment FROM " +
  " (SELECT id, product_id, cabin_type_id, cabin_category_id, price, price_2, price_child, amount, tip, comment FROM product_position WHERE product_id = " + id + " ORDER BY cabin_type_id, price, cabin_category_id) AS p " +
  " LEFT JOIN cabin_type ct ON ct.id = p.cabin_type_id " +
  " LEFT JOIN cabin_category c ON c.id = p.cabin_category_id AND c.txtCabinType = ct.txtCabinType";
  return function(resultProduct, resultImages, resultEntertain, resultCulinary, callback) {
    var result = [];
    var cabinTypes = [];
    ApiModel.query(ppSql, function (err, resultPosition) {
      if ( resultPosition ) {
        for ( var i in resultPosition ) {
          var rp = resultPosition[i];
          var position = {posId:rp.id, productId:rp.productId, cabinName:rp.cabinName, checkInMax:rp.checkInMax, price:rp.price, price2:rp.price2, priceChild:rp.priceChild, amount:rp.amount, tip:rp.tip, comment:rp.comment};
          var idx = cabinTypes.indexOf(rp.cabinType);
          if ( idx < 0 ) {
            cabinTypes.push(rp.cabinType);
            // order by price -> lowestPrice is the first position
            result.push({cabinType:rp.cabinType, startingPrice:position.price, decks:rp.decks, size:rp.size, facility:rp.facility, imageUrl:rp.imageUrl, categories:[position]});
          } else {
            result[idx].categories.push(position);
          }
        }
      }
      callback(err, resultProduct, resultImages, resultEntertain, resultCulinary, result);
    });
  }
}
function _querySchedule(id) {
  //var tsSql = " SELECT day_number AS dayNumber, location, departure_time AS departureTime, arrival_time AS arrivalTime, description, breakfast, lunch, dinner, overnight_stay AS overNightStay FROM travel_schedule WHERE product_id = " + id + " ORDER BY day_number";
  var tsSql = "SELECT * FROM ((SELECT day_number AS dayNumber, location, departure_time AS departureTime, arrival_time AS arrivalTime, description, breakfast, lunch, dinner, "+
  " overnight_stay AS overNightStay FROM travel_schedule WHERE product_id = " + id + " ORDER BY day_number) AS t "+
  " LEFT JOIN (SELECT txtPortCityName AS location, rtfPortImg AS portImgs FROM cruise_port) p ON p.location = t.location)";
  return function(resultProduct, resultImages, resultEntertain, resultCulinary, resultPosition, callback) {
    ApiModel.query(tsSql, function (err, resultSchedule) {
      if ( !resultProduct ) {
        callback(err, {error:"product " + id + " not found"});
      } else {
        for(var i in resultSchedule ){
          if ( resultSchedule[i].portImgs ) {
            var imgs = resultSchedule[i].portImgs.split('@');
            for( k in imgs ) {
              imgs[k] = imgPath + '/port/' + imgs[k] + '.jpg';
            }
            resultSchedule[i].portImgs = imgs;
          }
        }
        callback(err, {product: resultProduct, images:resultImages, entertainment:resultEntertain, culinary:resultCulinary, cabins: resultPosition, travelSchedule: resultSchedule});
      }
    });
  }
}

function _getQueryParams(req){
  return {
    type:UtilsServices.parseInt(req.param('type')),
    minDays:UtilsServices.parseInt(req.param('minDurationDays')),
    maxDays:UtilsServices.parseInt(req.param('maxDurationDays')),
    area:UtilsServices.parseInt(req.param('cruiseArea')),
    departureLocation:req.param('departureLocation')=='*'?null:req.param('departureLocation'),
    cruiseCompany:UtilsServices.parseInt(req.param('cruiseCompanyId')),
    ship:UtilsServices.parseInt(req.param('shipId'))
  };
}
