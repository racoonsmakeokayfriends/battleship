
var Battleship_Options = function() {
  this.__ship_sink_alert_on = true;
  this.__num_shots_type = 'standard';
}
Battleship_Options.prototype.set_ship_sink_alert = function(bool) {
  this.__ship_sink_alert_on = bool;
};
Battleship_Options.prototype.set_num_shots_type = function(type) {
  this.__num_shots_type = type;
};

Battleship_Options.prototype.get_num_shots_type = function() {
  return this.__num_shots_type;
};
Battleship_Options.prototype.get_ship_sink_alert = function() {
  return this.__ship_sink_alert_on;
};

Battleship_Options.prototype.to_obj = function() {
  var o = {ship_sink_alert_on:this.__ship_sink_alert_on,num_shots_type:this.__num_shots_type};
  return o;
};