/**
 * Created by teng on 27.12.2014.
 */

module.exports = {

  getShip : function (req, res) {
    var shipId = req.param('shipId');
    var sql = "SELECT * FROM cruise_ship WHERE id="+shipId;
    ApiModel.query(sql, function (err, result) {
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result);
    });
  },
  getAllShipHasProduct :  function (req, res) {
    var sql = "SELECT DISTINCT c.id,c.txtShipName FROM cruise_ship c,product p where p.ship_id = c.id and p.status_id = 3 and p.start_date >= CURDATE()";
    ApiModel.query(sql, function (err, result) {
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result);
    });
  },
  getCompanies : function (req, res) {
    var sql = "SELECT c.id AS companyId, c.txtCompanyName AS companyName, s.id AS shipId, s.txtShipName AS shipName FROM cruise_ship s" +
      " LEFT JOIN cruise_company c ON c.id = s.company_id ORDER BY c.id, s.id";
      ApiModel.query(sql, function(err, resultShip) {
        if (err) {
          sails.log.error(err);
          res.json({error: err});
          return false;
        }
        var result=[];
        for(var i in resultShip){
          var companyExist=false;
          for(var j in result) {
            if (result[j].company.id==resultShip[i].companyId) {
              companyExist=true;
              result[j].ships.push({id:resultShip[i].shipId, name:resultShip[i].shipName});
              break;
            }
          }
          if(!companyExist){
            var company = {company:{id:resultShip[i].companyId, name:resultShip[i].companyName}, ships:[]};
            company.ships.push({id:resultShip[i].shipId, name:resultShip[i].shipName});
            result.push(company);
          }
        }
        res.json(result);
      });
  },
  getCompaniesOnly : function (req, res) {
    var sql = "SELECT id, txtCompanyName AS companyName FROM cruise_company";
    ApiModel.query(sql, function (err, result) {
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result);
    });
  }

}
