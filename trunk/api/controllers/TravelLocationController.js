/**
 * Created by teng on 17.01.2015.
 */
module.exports = {

  getStartLocations: function (req, res) {
    var sql = "SELECT name FROM travel_location WHERE start_location=1";
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
