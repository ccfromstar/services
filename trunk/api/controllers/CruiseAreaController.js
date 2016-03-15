/**
 * Created by teng on 17.01.2015.
 */
module.exports = {

  getAll: function (req, res) {
    var sql = "SELECT id, txtCruiseArea AS name FROM cruise_area order by range_number asc";
    ApiModel.query(sql, function (err, result) {
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result);
    });
  },
  getDeparturePorts: function(req, res) {
    var sql = "select p.id, dp.name from cruise_port p, (select distinct(t.location) AS name from travel_schedule t, product p where p.type_id=1 and p.status_id=3 and t.product_id=p.id and t.day_number=1 and t.location != '' and t.location is not null) dp where p.txtPortCityName=dp.name";
    ApiModel.query(sql, function(err, result){
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result);
    });
  },
  getDeparturePortsByArea: function(req, res) {
    var areaId = req.param('area_id');
    var sql = "select p.id, dp.name from cruise_port p, cruise_area_port ap, " +
      "(select distinct(t.location) AS name from travel_schedule t, product p where p.type_id=1 and p.status_id=3 and t.product_id=p.id and t.day_number=1 and t.location != '' and t.location is not null) dp " +
      " where p.txtPortCityName=dp.name and p.id = ap.port_id and ap.area_id="+areaId;
    ApiModel.query(sql, function(err, result){
      if (err) {
        sails.log.error(err);
        res.json({error: err});
        return false;
      }
      res.json(result);
    });
  }
}
