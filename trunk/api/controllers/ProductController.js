/**
 * Created by teng on 21.11.2014.
 */

var MAX = 100;
var LIMIT = 10;
var imgPath = sails.config.globals.url.shipImg.default;

module.exports = {

  getTotal: function (req, res) {
    var sql = "SELECT count(id) AS total FROM product WHERE status_id=3 AND start_date > CURDATE()";
    ApiModel.query(sql, function(err, result){
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result[0]);
    });
  },

  getShipInfo: function (req, res) {
    var shipId = parseInt(req.param('shipId'));
    var sql = "SELECT b.txtCompanyName,a.txtShipName,a.txtShipNationality,a.txtDeckFloorTotal,a.txtShipWeight,a.txtPassengerTotal,a.txtShipLength,a.txtShipWidth,a.txtRoomTotal,a.txtShipAbstract FROM cruise_ship a LEFT JOIN cruise_company b  ON a.company_id = b.id WHERE a.id=" + shipId;
    //console.log(sql);
    ApiModel.query(sql, function(err, result){
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result[0]);
    });
  },

  /** url sample: http://localhost:1339/product/getlist?type=1&page=1&max=5&order=price&startDate=2015-01
   * available parameters:
   type:  1->单船票, 2->团队游产品,
   startDate(出发日期): start date to search
   page: the page number started by 1
   max(最多产品数): the limit of product
   order(排序): available values -> price or startDate, default order by date published
   * all parameters are optional
   */
  getList: function (req, res) {
    var typeId = parseInt(req.param('type'));
    var searchStartDate = req.param('startDate');
    var page = parseInt(req.param('page'));
    var limit = parseInt(req.param('max'));
    var orderBy = req.param('order');
    var recommendedOnly = ('true'==req.param('recommendedOnly'));
    page = (page && page > 0) ? (page - 1) : 0;
    limit = (limit && limit > 0) ? limit : 50;
    var params = {
      typeId: typeId,
      offset: page,
      limit: limit,
      searchStartDate: searchStartDate,
      orderBy: {price: orderBy == 'price' ? true : false, startDate: orderBy == 'startDate' ? true : false},
      recommendedOnly: recommendedOnly
      //columns: ['title', 'start_date', 'product_number']
    };
    sails.waterfall([
      _queryProductCount(params),
      _queryProductList(params)
    ],
    function (err, result) {
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result);
    });
  },

  /**
   * url sample: http://localhost:1339/product/getdetail?productId=1
   * parameter productId is required
   */
  getDetail: function (req, res) {
    var id = req.param('productId') ? parseInt(req.param('productId')) : null;
    if (!id) {
      sails.log.error(err);
      res.json({error: '参数productId缺失'});
      return false;
    }

    sails.waterfall([
        _queryShipImages(id),
        _queryEntertain(id),
        _queryCulinary(id),
        _queryProductDetail(id),
        _queryPosition(id),
        _querySchedule(id)
      ],
      function (err, result) {
        if (err) {
          sails.log.error(err);
          res.json({error: err});
          return false;
        }
        res.json(result);
      });
  },

  getFees: function (req, res) {
    var id = req.param('productId') ? parseInt(req.param('productId')) : null;
    if ( !id ) {
      sails.log.error(err);
      res.json({error: '参数productId缺失'});
      return false;
    }

    var sql = "SELECT incl_cruise_ticket AS inclCruiseTicket, incl_cruise_ticket_comment AS cruiseTicketFeeComment, " +
        " port_tax_fee AS portTaxFee, incl_port_tax AS inclPortTax, incl_port_tax_comment AS portTaxComment, " +
      " tip, incl_tip AS inclTip, incl_tip_comment AS tipComment, visa_fee AS visaFee, incl_visa_fee AS inclVisaFee, incl_visa_comment AS visaFeeComment, " +
      " tourist_guide_fee AS guideFee, incl_tourist_guide AS inclGuide, incl_tourist_guide_comment AS guideFeeComment, " +
      " excursion_fee AS excursionFee, incl_excursion AS inclExcursion, incl_excursion_comment AS excursionFeeComment, " +
      " incl_meal_on_board AS inclMealOnBoard, incl_meal_on_board_comment AS mealOnBoardFeeComment, " +
      " incl_entertainment AS inclEntertainment, incl_entertainment_comment AS entertainmentFeeComment, " +
      " incl_passport AS inclPassport, incl_passport_comment AS passportFeeComment, " +
      " incl_transfer AS inclTransfer, incl_transfer_comment AS transferFeeComment, " +
      " incl_single_room_fee AS inclSingleRoom, incl_single_room_fee_comment AS singleRoomFeeComment, " +
      " incl_self_consumption AS inclSelfConsumption, incl_self_consumption_comment AS selfConsumptionComment, " +
      " incl_travel_insurance AS inclTravelInsurance, incl_travel_insurance_comment AS insuranceFeeComment, " +
      " incl_fee_not_mentioned AS inclFeeNotMentioned, incl_fee_not_mentioned_comment AS feeNotMentionedComment, fee_comment AS otherFeeComment " +
      " FROM included_fee WHERE product_id=" + id;
    ApiModel.query(sql, function (err, result){

      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }

      if( result && result.length > 0 ) {

        var incl = [], excl = [];

        if ( result[0].inclCruiseTicket == 1 ){
          incl.push({name:'船票费用',comment:result[0].cruiseTicketFeeComment});
        } else {
          excl.push({name:'船票费用',comment:result[0].cruiseTicketFeeComment});
        }
        if ( result[0].inclPortTax == 1 ){
          incl.push({name:'港务费', fee:result[0].portTaxFee, comment:result[0].portTaxComment});
        } else {
          excl.push({name:'港务费', fee:result[0].portTaxFee, comment:result[0].portTaxComment});
        }
        if ( result[0].inclTip == 1 ){
          incl.push({name:'小费', comment:result[0].tipComment});
        } else {
          excl.push({name:'小费', comment:result[0].tipComment});
        }
        if ( result[0].inclVisaFee == 1 ){
          incl.push({name:'签证费', fee:result[0].visaFee, comment:result[0].visaFeeComment});
        } else {
          excl.push({name:'签证费', fee:result[0].visaFee, comment:result[0].visaFeeComment});
        }
        if ( result[0].inclGuide == 1 ){
          incl.push({name:'领队派遣费', fee:result[0].guideFee, comment:result[0].guideFeeComment});
        } else {
          excl.push({name:'领队派遣费', fee:result[0].guideFee, comment:result[0].guideFeeComment});
        }
        if ( result[0].inclExcursion == 1 ){
          incl.push({name:'岸上观光费', fee:result[0].excursionFee, comment:result[0].excursionFeeComment});
        } else {
          excl.push({name:'岸上观光费', fee:result[0].excursionFee, comment:result[0].excursionFeeComment});
        }
        if ( result[0].inclTransfer == 1 ){
          incl.push({name:'出发地至港口交通费', comment:result[0].transferFeeComment});
        } else {
          excl.push({name:'出发地至港口交通费', comment:result[0].transferFeeComment});
        }
        if ( result[0].inclSingleRoom == 1 ){
          incl.push({name:'邮轮单人房差价费用', comment:result[0].singleRoomFeeComment});
        } else {
          excl.push({name:'邮轮单人房差价费用', comment:result[0].singleRoomFeeComment});
        }
        if ( result[0].inclSelfConsumption == 1 ){
          incl.push({name:'邮轮上私人消费费用', comment:result[0].selfConsumptionComment});
        } else {
          excl.push({name:'邮轮上私人消费费用', comment:result[0].selfConsumptionComment});
        }
        if ( result[0].inclTravelInsurance == 1 ){
          incl.push({name:'旅游保险费用', comment:result[0].insuranceFeeComment});
        } else {
          excl.push({name:'旅游保险费用', comment:result[0].insuranceFeeComment});
        }
        if ( result[0].inclFeeNotMentioned == 1 ){
          incl.push({name:'其他费用', comment:result[0].feeNotMentionedComment});
        } else {
          excl.push({name:'其他费用', comment:result[0].feeNotMentionedComment});
        }

        res.json({fees:{includedFees:incl, excludedFees:excl}});
      } else {
        res.json({fees:{}});
      }
    });
  },

  get4Calendar : function (req, res) {

    var params = _getQueryParams(req);
    var where = '';
    if ( params.type ) {
      where += ' AND type_id=' + params.type;
    }
    if ( params.minDays ) {
      where += ' AND days>=' + params.minDays;
    }
    if ( params.maxDays ) {
      where += ' AND days<=' + params.maxDays;
    }
    if ( params.area ) {
      where += " AND cruise_area_id=" + params.area;
    }
    if ( params.departureLocation ) {
      where += " AND id in (SELECT product_id FROM travel_schedule WHERE day_number = 1 AND location='" + params.departureLocation + "')";
    }
    if ( params.ship ) {
      where += " AND ship_id=" + params.ship;
    } else if ( params.cruiseCompany ){
      where += " AND ship_id in (SELECT s.id FROM cruise_ship s, cruise_company c WHERE c.id=" + params.cruiseCompany + " AND s.company_id=c.id)";
    }

    var sql = "SELECT DISTINCT(p.id), DATE_FORMAT(p.start_date, '%Y-%m-%d') AS startDate, p.title, p.productfeature, ts.location AS startLocation, p.price, p.cruiseArea " +
    " FROM ( SELECT MIN(pp.price) AS price, p1.id, p1.productfeature, p1.start_date, p1.title, a.txtCruiseArea AS cruiseArea FROM ( select id, start_date, title, cruise_area_id, productfeature FROM product WHERE status_id = 3 AND start_date > CURDATE() " + where + " ) AS p1 LEFT JOIN product_position pp ON p1.id = pp.product_id LEFT JOIN cruise_area a ON p1.cruise_area_id=a.id GROUP BY p1.id) AS p " +
    " LEFT JOIN (SELECT product_id, day_number, location FROM travel_schedule WHERE day_number = 1) AS ts ON p.id = ts.product_id " +
    " LEFT JOIN product_position pp ON p.id = pp.product_id ";
    sails.log(sql);

    ApiModel.query(sql, function (err, result){
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      if( result) {
        res.json(result);
      } else {
        res.json({});
      }
    });
  },
  getSearchResult : function (req, res) {

    var params = _getQueryParams1(req);
    var where = '';
    if ( params.startDate ) {
      where += ' AND start_date like "%' + params.startDate + '%"';
    }
    if ( params.type ) {
      where += ' AND type_id=' + params.type;
    }
    if ( params.minDays ) {
      where += ' AND days>=' + params.minDays;
    }
    if ( params.maxDays ) {
      where += ' AND days<=' + params.maxDays;
    }
    if ( params.area ) {
      where += " AND cruise_area_id=" + params.area;
    }
    if ( params.departureLocation ) {
      where += " AND id in (SELECT product_id FROM travel_schedule WHERE day_number = 1 AND location='" + params.departureLocation + "')";
    }
    if ( params.ship ) {
      where += " AND ship_id=" + params.ship;
    } else if ( params.cruiseCompany ){
      where += " AND ship_id in (SELECT s.id FROM cruise_ship s, cruise_company c WHERE c.id=" + params.cruiseCompany + " AND s.company_id=c.id)";
    }

    sails.log(where);

    var sql = "SELECT DISTINCT(p.id), DATE_FORMAT(p.start_date, '%Y-%m-%d') AS startDate,cs.txtShipName,cc.txtCompanyName, p.title, ts.location AS startLocation, p.price, p.cruiseArea " +
    " FROM ( SELECT MIN(pp.price) AS price, p1.id,p1.ship_id, p1.start_date, p1.title, a.txtCruiseArea AS cruiseArea FROM ( select id,ship_id, start_date, title, cruise_area_id FROM product WHERE status_id = 3 AND start_date > CURDATE() " + where + " ) AS p1 LEFT JOIN product_position pp ON p1.id = pp.product_id LEFT JOIN cruise_area a ON p1.cruise_area_id=a.id GROUP BY p1.id) AS p " +
    " LEFT JOIN (SELECT product_id, day_number, location FROM travel_schedule WHERE day_number = 1) AS ts ON p.id = ts.product_id " +
    " LEFT JOIN product_position pp ON p.id = pp.product_id " +
    " LEFT JOIN cruise_ship cs ON p.ship_id = cs.id " +
    " LEFT JOIN cruise_company cc ON cs.company_id = cc.id " +
    "order by p.start_date asc";
    sails.log(sql);

    ApiModel.query(sql, function (err, result){
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      if( result) {
        res.json(result);
      } else {
        res.json({});
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
    return " SELECT count(p.id) AS total FROM product p, product_category c WHERE status_id = 3 AND start_date > CURDATE() AND p.id = c.product_id AND (c.special=1 OR c.cheap=1 OR c.early_booking=1) " + pWhere + " ORDER BY " + orderBy;
  }
  return " SELECT count(id) AS total FROM product WHERE status_id = 3 AND start_date > CURDATE() " + pWhere + " ORDER BY " + orderBy;
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
    p1 = "(SELECT p0.id, title, type_id, start_date, published_at, days, nights, ship_id, cruise_area_id, c.special AS isSpecial, c.early_booking AS isEarlyBooking, c.cheap AS isCheap FROM product p0, product_category c WHERE p0.status_id = 3 AND p0.start_date > CURDATE() AND p0.id = c.product_id AND (c.special=1 OR c.cheap=1 OR c.early_booking=1) "+ pWhere + ") AS p1 ";
    selectCategory = ", isSpecial, isEarlyBooking, isCheap ";
  } else {
    p1 = "(SELECT id, title, type_id, start_date, published_at, days, nights, ship_id, cruise_area_id FROM product WHERE status_id = 3 AND start_date > CURDATE() " + pWhere + ") AS p1 ";
  }


  var pSql = " SELECT p1.id, p1.title, p1.type_id, p1.start_date, p1.published_at, p1.days, p1.nights, p1.ship_id, p1.cruise_area_id, MIN(pp.price) AS price" + selectCategory +
    " FROM " + p1 +
    " LEFT JOIN product_position pp ON p1.id = pp.product_id " +
    " GROUP BY p1.id ORDER BY " + orderBy + " LIMIT " + offset + ", " + limit;

  sql = "SELECT p.id, p.title AS productTitle, p.type_id AS productType, p.price AS startingPrice, DATE_FORMAT(p.start_date, '%Y-%m-%d') AS startDate, p.days AS durationDays, p.nights AS durationNights, CONCAT(p.days, '天', p.nights, '晚') AS duration, " +
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
  var sql = "SELECT u.type, CONCAT('"+imgPath+"/', u.type, '/', u.img_name, '_md.jpg') AS url FROM ( (SELECT img_name, 'ship' AS type FROM ship_image WHERE ship_id IN (SELECT ship_id FROM product WHERE id ="+id+") ORDER BY order_number)"+
  " UNION (SELECT rtfImg AS img_name, 'culinary' AS type FROM ship_culinary WHERE txtLabel='L' and ship_id IN (SELECT ship_id FROM product WHERE id ="+id+"))"+
  " UNION (SELECT rtfImg AS img_name, 'entertainment' AS type FROM ship_entertainment WHERE txtLabel='L' and ship_id IN (SELECT ship_id FROM product WHERE id ="+id+")) ) u";
  return function(callback) {
    ApiModel.query(sql, function (err, resultImages){
      if( resultImages ) {
        //
        /*
        for(var k in resultImages){
            if(resultImages[k].type=="entertainment" || resultImages[k].type=="culinary"){
              resultImages[k].url = (resultImages[k].url).replace("md","sm");
            }
        }*/
        //console.log("--begin--");
        //console.log(resultImages);
        //console.log("--end--");
        callback(err, resultImages);
      } else {
        callback(err, null);
      }
    });
  }
}
function _queryEntertain(id){
  var sql = "SELECT name, description, CONCAT('"+imgPath+"/entertainment/',rtfImg, '_sm.jpg') AS imgUrl FROM ship_entertainment WHERE ship_id IN (SELECT ship_id FROM product WHERE id="+id+")";
  return function(resultImages, callback){
    ApiModel.query(sql, function(err, resultEntertain){
      callback(err, resultImages, resultEntertain);
    });
  };
}
function _queryCulinary(id){
  var sql = "SELECT restaurant_name AS name, type, fees, reservation, opening_time AS openTime, clothing, CONCAT('"+imgPath+"/culinary/',rtfImg, '_sm.jpg') AS imgUrl FROM ship_culinary WHERE ship_id IN (SELECT ship_id FROM product WHERE id="+id+")";
  return function(resultImages, resultEntertain, callback){
    ApiModel.query(sql, function(err, resultCulinary){
      callback(err, resultImages, resultEntertain, resultCulinary);
    });
  };
}
function _queryProductDetail(id) {
  var pSql = " SELECT p.id,p.ship_id,min(a.price) as minprice, p.title, p.type, p.productNumber, p.startDate, p.days AS durationDays, p.nights AS durationNights, ts.location AS startLocation, ts2.route, s.txtShipName AS shipName, s.txtShipLevel as shipRating, cc.txtCompanyName AS shipCompany, CONCAT('"+imgPath+"/shipcompanylogo/', cc.rtfCompanyLogo) AS shipCompanyLogo, ca.txtCruiseArea AS cruiseArea, p.productfeature AS keyFeature, p.visaApplicationUntil, p.visaComment, p.bookingNote, p.excursion FROM (SELECT id, title, productfeature, type_id AS type, product_number AS productNumber, ship_id, DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate, days, nights, DATE_FORMAT(visa_application_until, '%Y-%c-%d') AS visaApplicationUntil, visa_comment AS visaComment, booking_note AS bookingNote, excursion_txt AS excursion, cruise_area_id " +
    " FROM product WHERE id = " + id + ") AS p " +
    " LEFT JOIN travel_schedule ts ON ts.product_id = p.id AND ts.day_number = 1 " +
    " LEFT JOIN (SELECT product_id, GROUP_CONCAT(location ORDER BY day_number SEPARATOR '-') AS route FROM travel_schedule WHERE location !='航海日' and product_id = " + id + " GROUP BY product_id) AS ts2 ON ts2.product_id = p.id " +
    " LEFT JOIN cruise_ship s ON p.ship_id = s.id " +
    " LEFT JOIN cruise_company cc ON cc.txtCompanyNo = s.txtCompanyNo " +
    " LEFT JOIN cruise_area ca ON ca.id = p.cruise_area_id" +
    " LEFT JOIN product_position a ON a.product_id = p.id";
  sails.log(pSql);
  return function(resultImages, resultEntertain, resultCulinary, callback) {
    ApiModel.query(pSql, function (err, resultProduct) {
      if ( resultProduct ) {
        //resultProduct[0].images = resultImages;
        //resultProduct[0].entertainment = resultEntertain;
        //resultProduct[0].culinary = resultCulinary;
        var r1 = resultProduct[0].visaComment;
        var r2 = resultProduct[0].bookingNote;
        var r3 = resultProduct[0].excursion;
        resultProduct[0].visaComment = r1?r1.replace(/\r\n/g,"<br/>"):"";
        resultProduct[0].bookingNote = r2?r2.replace(/\r\n/g,"<br/>"):"";
        resultProduct[0].excursion = r3?r3.replace(/\r\n/g,"<br/>"):"";
        //console.log(resultProduct[0].visaComment);
        callback(err, resultProduct[0], resultImages, resultEntertain, resultCulinary);
      } else {
        callback(err, {});
      }
    });
  }
}

function _queryPosition(id) {
  var ppSql = "SELECT p.id, p.product_id AS productId, ct.txtCabinType AS cabinType, c.txtCabinName AS cabinName, c.txtDecks AS decks, c.txtCabinSize AS size, c.txtCabinFacility AS facility, CONCAT('" + imgPath + "/cabin/', IFNULL(c.rtfCabinImg, 'defaultCabinImg'), '_md.jpg') AS imageUrl, c.numCanCheckIn AS checkInMax, p.price, (CASE WHEN p.price_2>0 THEN p.price_2 ELSE '' END) AS price2, (CASE WHEN p.price_child>0 THEN p.price_child ELSE '' END) AS priceChild, p.amount, p.tip, p.comment FROM " +
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
          var c1 = rp.price2==""?"":parseInt(rp.price2);
          var c2 = rp.priceChild==""?"":parseInt(rp.priceChild);
          var position = {posId:rp.id, productId:rp.productId, cabinName:rp.cabinName, checkInMax:rp.checkInMax, price:rp.price, price2:c1, priceChild:c2, amount:rp.amount, tip:rp.tip, comment:rp.comment};
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
  var tsSql = "SELECT * FROM ((SELECT day_number AS dayNumber, location,location as l, departure_time AS departureTime, arrival_time AS arrivalTime, description, breakfast, lunch, dinner, "+
  " overnight_stay AS overNightStay FROM travel_schedule WHERE product_id = " + id + " ORDER BY day_number) AS t "+
  " LEFT JOIN (SELECT txtPortCityName AS l, rtfPortImg AS portImgs FROM cruise_port) p ON p.l = t.l)";
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
        for(var k in resultSchedule){
            resultSchedule[k].departureTime = (resultSchedule[k].departureTime).substring(0,5);
            resultSchedule[k].arrivalTime = (resultSchedule[k].arrivalTime).substring(0,5);
            if(resultSchedule[k].departureTime=="00:00"){
              resultSchedule[k].departureTime = "-";
            }
            if(resultSchedule[k].arrivalTime=="00:00"){
              resultSchedule[k].arrivalTime = "-";
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

function _getQueryParams1(req){
  return {
    startDate:(req.param('startDate')),
    type:UtilsServices.parseInt(req.param('type')),
    minDays:UtilsServices.parseInt(req.param('minDurationDays')),
    maxDays:UtilsServices.parseInt(req.param('maxDurationDays')),
    area:UtilsServices.parseInt(req.param('cruiseArea')),
    departureLocation:req.param('departureLocation')=='*'?null:req.param('departureLocation'),
    cruiseCompany:UtilsServices.parseInt(req.param('cruiseCompanyId')),
    ship:UtilsServices.parseInt(req.param('shipId'))
  };
}
