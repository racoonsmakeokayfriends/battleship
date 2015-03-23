
var Battleship = {};

$(document).ready(function() {
/* =========================================================
                      LOGIC FUNCTIONS
   ========================================================= */


/* =========================================================
                        DOM ELEMENTS
   ========================================================= */

  var $MSG_CLICK_OWN_BOARD = $('#msg-click-own-board');
  var $MSG_SHIP_SUNK = $('#msg-ship-sunk');
  var $MSG_TARGET_LIMIT = $('#msg-target-limit');
  var $MSG_EXTRA_TARGETS = $('#msg-extra-targets');
  var $NUM_SHOTS_REMAINING = $('#num-shots-remaining');
  var $FIRE_SHOTS_BTN = $('#fire-shots-btn');
/* =========================================================
                CONFIG, CONSTANTS, + GLOBALS
   ========================================================= */
  Battleship.BOARD_HEIGHT = 10;
  Battleship.BOARD_WIDTH = 10;
  Battleship.SQUARE_SIZE_PIXELS = 25;
  Battleship.BOARD_HEIGHT_PIXELS = Battleship.BOARD_HEIGHT * Battleship.SQUARE_SIZE_PIXELS;

  Battleship.BOARD_WIDTH_PIXELS = Battleship.BOARD_WIDTH * Battleship.SQUARE_SIZE_PIXELS;
  $('canvas').attr('height',Battleship.BOARD_HEIGHT_PIXELS.toString()+'px');
  $('canvas').attr('width',Battleship.BOARD_WIDTH_PIXELS.toString()+'px');

  Battleship.SHIPS = [
    {name:'carrier',size:5},
    {name:'battleship',size:4},
    {name:'submarine',size:3},
    {name:'destroyer',size:3},
    {name:'patrol boat',size:2}
  ];

  Battleship.WATER = 'itswaterandiknowit!';
  Battleship.BOAT = 'deresaboathere!';
  Battleship.HIT = 'immahit!';
  Battleship.MISS = 'nothingshere!';
  Battleship.SUNK = 'immadownanddead!';
  Battleship.FLAG_W = 'flaggedandh20';
  Battleship.FLAG_B = 'flaggedandshit';
  Battleship.TARGET_W = 'targetw';
  Battleship.TARGET_B = 'targetb';

  Battleship.BLOCK_BORDER_COLOR = 'black';
  Battleship.TURN_TIME_LIMIT = 30000;

/* =========================================================
                           BOARD
   ========================================================= */

  //// Stores the state of a battleship board and handles drawing it.
  Battleship.Board = function (canvas, player_ref,game_options) {
    this.context = canvas.getContext('2d');
    this.player_ref = player_ref;
    this.gameroom_ref = player_ref.parent().parent();
    this.snapshot = null;
    this.is_my_board = false;
    this.create_random_board();
    this.stats = {};
    this.game_options = game_options;
    this.stats.remaining_ships = Battleship.SHIPS.length;
    this.stats.biggest_ship = Battleship.SHIPS[0].size;

    // Listen for changes to our board.
    var self = this;
    player_ref.on('value', function(snapshot) {
      self.snapshot = snapshot;
      self.draw();
    });
  };

  /*------------
     displaying 
    ------------*/

  Battleship.Board.prototype.alert_ship_sunk = function(ship_name) {
    if (!this.game_options.ship_sink_alert_on) {return;}

    $MSG_SHIP_SUNK.find('.text').html(ship_name+' has been sunk!');
    $MSG_SHIP_SUNK.fadeIn();
  };
  Battleship.Board.prototype.draw_target = function(left,top) {
    this.context.fillStyle = 'white';
  };
  Battleship.Board.prototype.draw_hit = function (left,top) {
    this.context.fillStyle = 'red';
  };
  Battleship.Board.prototype.draw_miss = function (left,top) {
    this.context.fillStyle = 'green';
  };
  Battleship.Board.prototype.draw_fog = function (left,top) {
    this.context.fillStyle = 'rgb(50,50,50)';
  };
  Battleship.Board.prototype.draw_flag = function (left,top) {
    this.context.fillStyle = 'pink';
  };
  Battleship.Board.prototype.draw_boat = function (left,top) {
    this.context.fillStyle = 'yellow';
  };
  Battleship.Board.prototype.draw_water = function (left,top) {
    this.context.fillStyle = 'blue';
  };
  Battleship.Board.prototype.draw_sink = function (left,top) {
    if (this.game_options.ship_sink_alert_on) {
      this.context.fillStyle = 'black';
    }
    else {
      this.draw_hit(left,top);
    }
    // this.context.fillStyle='black';
  };
  Battleship.Board.prototype.draw_my_board = function () {
    // Iterate over columns / rows in board data and draw each non-empty block.
    var square_state,left,top
    for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
      for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
        square_state = this.get_square_state(r,c);
        left = c * Battleship.SQUARE_SIZE_PIXELS;
        top = r * Battleship.SQUARE_SIZE_PIXELS;
        this.context.lineWidth = 1;
        this.context.strokeStyle = Battleship.BLOCK_BORDER_COLOR;
        if (square_state == Battleship.BOAT || square_state == Battleship.FLAG_B || square_state == Battleship.TARGET_B) {
          this.draw_boat(left,top);
        }
        else if (square_state == Battleship.WATER || square_state == Battleship.FLAG_W || square_state == Battleship.TARGET_W) {
          this.draw_water(left,top);
        }
        else if (square_state == Battleship.HIT) {
          this.draw_hit(left,top);
        }
        else if (square_state == Battleship.MISS) {    
          this.draw_miss(left,top);
        }
        else if (square_state == Battleship.SUNK) {  
          this.draw_sink(left,top);
        }
        this.context.fillRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
        this.context.strokeRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
      }
    }
  };

  Battleship.Board.prototype.draw_their_board = function () {
    var square_state,left,top
    for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
      for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
        square_state = this.get_square_state(r,c);
        left = c * Battleship.SQUARE_SIZE_PIXELS;
        top = r * Battleship.SQUARE_SIZE_PIXELS;
        this.context.lineWidth = 1;
        this.context.strokeStyle = 'white';
        if (square_state == Battleship.BOAT||square_state == Battleship.WATER) {
          this.draw_fog(left,top);
        }
        else if (square_state == Battleship.HIT) {
          this.draw_hit(left,top);
        }
        else if (square_state == Battleship.MISS) {
          this.draw_miss(left,top);
        }
        else if (square_state == Battleship.SUNK) {      
          this.draw_sink(left,top);
        }
        else if (square_state == Battleship.FLAG_W || square_state == Battleship.FLAG_B) { 
          this.draw_flag(left,top);
        }
        else if (square_state == Battleship.TARGET_B || square_state == Battleship.TARGET_W) {
          this.draw_target(left,top);
        }
        this.context.fillRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
        this.context.strokeRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
      }
    }
  };

  //// Main drawing handler
  Battleship.Board.prototype.draw = function () {
    this.context.clearRect(0, 0, Battleship.BOARD_WIDTH_PIXELS, Battleship.BOARD_HEIGHT_PIXELS);
    if (this.is_my_board) {
      this.draw_my_board();
    }
    else {
      this.draw_their_board();
    }
  };

  /*------------
     creating 
    ------------*/

  //// Clear the board contents.
  Battleship.Board.prototype.clear_board = function () {
    for (var i=0;i<Battleship.BOARD_HEIGHT;i++) {
      for (var j=0;j<Battleship.BOARD_WIDTH;j++) {
        this.set_square_state(i,j,Battleship.WATER);
      };
    }
  };
  //// Creates a new board with only water spots
  Battleship.Board.prototype.init_empty_data_board = function () {
    this.data_board = [];
    for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
      this.data_board.push([]);
      for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
        this.data_board[r].push(Battleship.WATER);
      };
    };
  };
  //// HELPER: Check if this piece will collide with another piece if it is place here
  Battleship.Board.prototype.check_for_collision = function (row,col,ship_size,horizontal) {
    if (horizontal) {
      for (var i = col; i < col+ship_size; i++) {
        if (this.data_board[row][i] != Battleship.WATER) {
          return true;
        }
      };
    }
    else {
      for (var i = row; i < row+ship_size; i++) {      
        if (this.data_board[i][col] != Battleship.WATER) {
          return true;
        }
      };
    }
    return false;
  };
  //// Create random board 
  Battleship.Board.prototype.create_random_board = function () {
    var col,row,horizontal;
    this.clear_board();
    this.init_empty_data_board();
    for (var i = 0; i < Battleship.SHIPS.length; i++) {
      while (true) {
        horizontal = Math.random() < 0.500000;
        if (horizontal) { // horizontal
          col = Math.floor(Math.random()*(Battleship.BOARD_WIDTH-Battleship.SHIPS[i].size));
          row = Math.floor(Math.random()*Battleship.BOARD_HEIGHT);          
        }
        else { // vertical
          col = Math.floor(Math.random()*Battleship.BOARD_WIDTH);
          row = Math.floor(Math.random()*(Battleship.BOARD_HEIGHT-Battleship.SHIPS[i].size));
        }
        if (!this.check_for_collision(row,col,Battleship.SHIPS[i].size,horizontal)) {
          break;
        }
      }
      this.set_ship(row,col,Battleship.SHIPS[i].size,horizontal,Battleship.SHIPS[i].name);
    };
    this.set_board();
  };

  /*------------
      setters 
    ------------*/

  //// Sets the state of a square
  Battleship.Board.prototype.set_square_state = function (row,col,square_state) {
    this.player_ref.child('board').child(row).child(col).set(square_state);
  };
  //// Positions given ship in board and saves its info
  Battleship.Board.prototype.set_ship = function (row,col,ship_size,horizontal,ship_name) {
    for (var i = 0; i < ship_size; i++) {
      if (horizontal) {
        this.data_board[row][col+i] = ship_name;
      }
      else {
        this.data_board[row+i][col] = ship_name;      
      }
    };
    this.set_ship_location(ship_name,ship_size,row,col,horizontal);
  };
  //// Saves the info about a ship in the fb
  Battleship.Board.prototype.set_ship_location = function (ship_name,ship_size,row,col,horizontal) {
    var data = {name:ship_name,ship_size:ship_size,row:row,col:col,horizontal:horizontal,sunk:false};
    this.player_ref.child('ships').child(ship_name).set(data);
  };
  //// takes a matrix(data_board) and saves it as the board in fb
  Battleship.Board.prototype.set_board = function () {
    for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
      for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
        
        if (this.data_board[r][c] != Battleship.WATER) {
          this.set_square_state(r,c,Battleship.BOAT);
        }
        else {
          this.set_square_state(r,c,Battleship.WATER);
        }
        
        // this.set_square_state(r,c,this.data_board[r][c]);
      };
    };
  };
  //// sinks the given ship
  Battleship.Board.prototype.sink_the_ship = function (ship_data) {
    var r=ship_data.row;
    var c=ship_data.col;
    for (var i = 0; i < ship_data.ship_size; i++) {
      if (ship_data.horizontal) {        
        this.set_square_state(r,c+i,Battleship.SUNK); 
      }  
      else {        
        this.set_square_state(r+i,c,Battleship.SUNK); 
      } 
    };
    this.player_ref.child('ships').child(ship_data.name).child('sunk').set(true)
  };
  //// updates the number of shots this player has
  Battleship.Board.prototype.update_num_shots = function (sunk_ship_data) {
    if (this.game_options.num_shots_type == 'remaining') {
      this.stats.remaining_ships -= 1;      
    }
    if (this.game_options.num_shots_type == 'biggest') {
      if (sunk_ship_data.ship_size == this.stats.biggest_ship) {
        var next_biggest = -1;
        this.player_ref.child('ships').once('value',function (all_ships) {
          all_ships.forEach(function(ship_snap) {
            var ship_d = ship_snap.val();
            if (!ship_d.sunk && ship_d.ship_size > next_biggest) {
              next_biggest = ship_d.ship_size;
            }
          })
        })
        this.stats.biggest_ship = next_biggest;
      }     
    }
  };

  /*------------
      getters 
    ------------*/
  //// gets the state of a given square
  Battleship.Board.prototype.get_square_state = function (row,col) {
    var square_contents = this.snapshot === null ? null : this.snapshot.child('board/'+row+'/'+col).val();
    return square_contents || Battleship.WATER;
  };
  //// gets the info of a given ship
  Battleship.Board.prototype.get_ship_state = function (ship_name) {
    var ship_data = this.snapshot === null ? null : this.snapshot.child('ships/'+ship_name).val();
    return ship_data || -1;
  };
  //// Figures out which ship is in this square
  Battleship.Board.prototype.get_ship_from_pos = function(row,col) {
    var ship_data;
    for (var i = 0; i < Battleship.SHIPS.length; i++) {
      ship_data = this.get_ship_state(Battleship.SHIPS[i].name);
      if (check_pos_ship_intersect(ship_data,row,col)) {
        return ship_data;
      }
    };
    return -1;
  };

  /*------------
     check-ers 
    ------------*/
  //// Helper function that checks if this spot and this ship intersect
  function check_pos_ship_intersect(ship_data,row,col) {
    if (ship_data.horizontal) {
      if (ship_data.row != row) {return false;}
      return ship_data.col<=col && ship_data.col+ship_data.ship_size>=col;
    }
    else {
      if (ship_data.col != col) {return false;}
      return ship_data.row<=row && ship_data.row+ship_data.ship_size>=row;     
    }
    return -1;
  };
  //// Checks if all spots for this ship have been hit
  Battleship.Board.prototype.check_if_ship_sank = function (row,col) {
    var ship_data = this.get_ship_from_pos(row,col);
    if (ship_data == -1) {
      alert('BOOBOO: :[ Line 324');
    }
    var sq_state;
    for (var i = 0; i < ship_data.ship_size; i++) {
      if (ship_data.horizontal) {        
        sq_state = this.get_square_state(ship_data.row,ship_data.col+i);
      }
      else {        
        sq_state = this.get_square_state(ship_data.row+i,ship_data.col);
      }

      if (sq_state != Battleship.HIT) {
        return false;
      }
    };

    return ship_data;
  };
  //// Checks if all ships have been sunk
  Battleship.Board.prototype.check_if_game_over = function () {
    var gameover = true;
    this.player_ref.child('ships').once('value',function (snapshot) {
      snapshot.forEach(function (ship_snap) {
        if (!ship_snap.val().sunk) {gameover=false;}
      });
    });
    return gameover;
  };

  /*------------
      'public' 
    ------------*/

  //// Converts mouse position to board position
  Battleship.Board.get_position = function (mousex,mousey) {
    var r = Math.floor(mousey/Battleship.SQUARE_SIZE_PIXELS);
    var c = Math.floor(mousex/Battleship.SQUARE_SIZE_PIXELS);
    return {row:r,col:c};
  };
  //// User wants to flag/unflag this square
  Battleship.Board.prototype.flag_square = function (row,col) {
    var state = this.get_square_state(row,col);
    console.log(state);
    if (state == Battleship.BOAT) {
      this.set_square_state(row,col,Battleship.FLAG_B);
    }
    if (state == Battleship.WATER) {
      this.set_square_state(row,col,Battleship.FLAG_W);
    }
    if (state == Battleship.FLAG_B) {
      this.set_square_state(row,col,Battleship.BOAT);
    }
    if (state == Battleship.FLAG_W) {
      this.set_square_state(row,col,Battleship.WATER);
    }
  };
  //// 
  Battleship.Board.prototype.make_guess = function (row,col) {
    var state = this.get_square_state(row,col);
    if (state == Battleship.BOAT) {
      this.set_square_state(row,col,Battleship.HIT);
      var ship_sank = this.check_if_ship_sank(row,col)
      if (ship_sank) {      
        this.alert_ship_sunk(ship_sank.name);
        this.sink_the_ship(ship_sank)
        if (this.check_if_game_over()) { //todo
          alert('gameover');
          this.gameroom_ref.child('gameover').set(true);
          return;
        }

        this.update_num_shots(ship_sank);
      }
    }
    if (state == Battleship.WATER) {
      this.set_square_state(row,col,Battleship.MISS);
    }
    return (state==Battleship.BOAT||state==Battleship.WATER);
  };
  //// Get the number of shots per turn for this player
  Battleship.Board.prototype.get_num_shots = function() {
    if (this.game_options.num_shots_type == 'standard') {
      return 1;
    }
    if (this.game_options.num_shots_type == 'remaining') {
      return this.stats.remaining_ships;
    }
    if (this.game_options.num_shots_type == 'biggest') {
      return this.stats.biggest_ship;
    }
  };
  //// Set this sq to be targetted, it returns the change in targets set
  Battleship.Board.prototype.set_target = function(row,col) {
    var sq_state = this.get_square_state(row,col);
    if (sq_state == Battleship.WATER) {
      this.set_square_state(row,col,Battleship.TARGET_W);
      return -1;
    }
    else if (sq_state == Battleship.BOAT) {
      this.set_square_state(row,col,Battleship.TARGET_B);
      return -1;      
    }
    else if (sq_state == Battleship.TARGET_W) {
      this.set_square_state(row,col,Battleship.WATER);
      return 1;
    }
    else if (sq_state == Battleship.TARGET_B) {
      this.set_square_state(row,col,Battleship.BOAT);
      return 1;
    }
    return 0;
  };
  //// Like set_target() except it exclusively undos targets
  Battleship.Board.prototype.set_target_undo_only = function(row,col) {
    var sq_state = this.get_square_state(row,col);
    if (sq_state == Battleship.TARGET_W) {
      this.set_square_state(row,col,Battleship.WATER);
      return 1;
    }
    else if (sq_state == Battleship.TARGET_B) {
      this.set_square_state(row,col,Battleship.BOAT);
      return 1;
    }
    return 0;
  };
  //// Makes a guess for each square in the given targets[]
  Battleship.Board.prototype.fire_all_targets = function(targets) {
    var row,col,sq_state;
    for (var i = 0; i < targets.length; i++) {
      row = targets[i].row;
      col = targets[i].col;
      sq_state = this.get_square_state(row,col);
      if (sq_state == Battleship.TARGET_B) {
        this.set_square_state(row,col,Battleship.HIT);
        var ship_sank = this.check_if_ship_sank(row,col)
        if (ship_sank) {      
          this.alert_ship_sunk(ship_sank.name);
          this.sink_the_ship(ship_sank)
          if (this.check_if_game_over()) { //todo
            alert('gameover');
            this.gameroom_ref.child('gameover').set(true);
            return;
          }
          this.update_num_shots(ship_sank);
        }
      }
      else if (sq_state == Battleship.TARGET_W) {
        this.set_square_state(row,col,Battleship.MISS);
      }
      else {
        alert('ERROR: ==> line 533 a target wasnt marked as target');
      }
    };
  };

  /*------------
      printers 
    ------------*/

  Battleship.Board.prototype.print_board = function() {
    var st,state;
    for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
      st = '';
      for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
        state = this.get_square_state(r,c);
        if (state == Battleship.BOAT) {
          st += 'B ';
        }
        else if (state==Battleship.WATER) {
          st += '- ';
        }
      };
      console.log(st)
    };
  };
  Battleship.Board.prototype.print_board2 = function() {
    var st,state;
    st = '-----\n';
    for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
      for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
        state = this.data_board[r][c];
        if (state===Battleship.WATER) {
          st += '- ';          
        }
        else {
          st += state[0] + ' ';
        }
      };
      st += '\n';
    };
    console.log(st);
    console.log('-----');
  };
/* =========================================================
                        CONTROLLER
   ========================================================= */

  Battleship.PLAYING_STATE = { Watching: 0, Joining: 1, Playing: 2 };

  Battleship.Controller = function (gameroom_ref,myid) {
    this.gameroom_ref = gameroom_ref;
    this.battleship_ref = gameroom_ref.child('game');
    var self=this;
    // get game options
    this.gameroom_ref.child('options').once('value',function (options_snap) {
      self.game_options = options_snap.val();
      self.create_boards(); 
      var self2 = self;
      self.gameroom_ref.child('user_list').once('value',function (userlist_snap) {
        var i=0;
        userlist_snap.forEach(function(user_snap) {
          if (user_snap.key() == myid) {
            self2.start_playing(i);
          }
          i+=1;
        })
      })
      if (self.game_options.num_shots_type == 'standard') {
        $('#game-dashboard').addClass('hidden');
      }
      self.targets = [];
    });

     
  };


  /*------------
    initializers 
    ------------*/


  Battleship.Controller.prototype.create_boards = function () {
    this.boards = [];
    for(var i = 0; i <= 1; i++) {
      var player_ref = this.battleship_ref.child('player' + i);
      var canvas = $('#canvas' + i).get(0);
      this.boards.push(new Battleship.Board(canvas, player_ref,this.game_options));
    }
  };
  //// Indicate to the player which board belongs to whom
  Battleship.Controller.prototype.set_board_identification = function () {
    var a = this.my_num.toString();
    var b = (1-this.my_num).toString();
    $('canvas').removeClass('my_board');
    $('canvas#canvas'+a).addClass('my_board');
    $('#canvas'+a+'-lbl').html('my board');
    $('#canvas'+b+'-lbl').html('opponent\'s board');
  };
  //// Once we've joined, enable controlling our player.
  Battleship.Controller.prototype.start_playing = function (player_num) {
    this.my_player_ref = this.battleship_ref.child('player' + player_num);
    this.opponent_player_ref = this.battleship_ref.child('player' + (1 - player_num));
    this.my_board = this.boards[player_num];
    this.my_board.is_my_board = true;
    this.my_board.draw();
    this.battleship_ref.child('player_turn/num').set(0);
    this.battleship_ref.child('player_turn/timestamp').set(Firebase.ServerValue.TIMESTAMP);
    inform_turn_info(player_num == 0);
    this.my_num = player_num;
    this.set_board_identification();

    // Clear my_player_ref 'online' status when we disconnect so somebody else can join.
    this.my_player_ref.child('online').onDisconnect().remove();


    // init player num shots
    this.my_player_ref.child('num_shots').set(this.my_board.get_num_shots());
    var self = this;
    // inform the player whose turn it is
    this.battleship_ref.child('player_turn').on('value',function (snapshot) {
      inform_turn_info(snapshot.val().num == self.my_num);
    });
    // update the num shots
    this.battleship_ref.child('player'+this.my_num.toString()+'/num_shots').on('value',function(snap){ 
      $NUM_SHOTS_REMAINING.html(snap.val());
    })
    this.enable_mouse();
  };


  /*------------
    user actions 
    ------------*/
  Battleship.Controller.prototype.standard_turn_handler = function(pos) {           
    var op =  1-this.my_num;
    var turn_success = this.boards[op].make_guess(pos.row,pos.col);
    if (turn_success) {
      this.battleship_ref.child('player_turn/num').set(op);
      this.battleship_ref.child('player_turn/timestamp').set(Firebase.ServerValue.TIMESTAMP);
    }
    // clearInterval(turn_timer);
    // var turn_timer = setInterval(function() {func_turn_timer()},Battleship.TURN_TIME_LIMIT);
  };

  //// Helper: keeps the targets[] updated
  Battleship.Controller.prototype.update_target_arr = function(pos,dtar) {
    if (dtar == -1) { // we need to add pos to arr
      this.targets.push(pos);
    }
    if (dtar == 1) { // find {pos} and remove it
      for (var i=0; i<this.targets.length;i++) {
        if (this.targets[i].row == pos.row && this.targets[i].col == pos.col) {
          this.targets.splice(i,1);
          break;
        }
      }
    }
  };
  //// Handles selecting/deselecting targets
  Battleship.Controller.prototype.target_handler = function(pos) {    
    var op =  1-this.my_num;
    var self = this;
    this.my_player_ref.child('num_shots').once('value',function(snap) {
      var remaining_shots = snap.val();
      var dtar;
      if (remaining_shots <= 0) {
        dtar = self.boards[op].set_target_undo_only(pos.row,pos.col);
      }
      else {
        dtar = self.boards[op].set_target(pos.row,pos.col);
      }
      var new_remaining_shots = remaining_shots+dtar;
      if (new_remaining_shots == 0) {        
        $MSG_TARGET_LIMIT.removeClass('hidden');
      }
      self.my_player_ref.child('num_shots').set(new_remaining_shots);
      self.update_target_arr(pos,dtar);
    });
  };
  //// Handles selecting/deselecting targets
  Battleship.Controller.prototype.fire_the_missles = function() { 
    var op =  1-this.my_num;
    this.boards[op].fire_all_targets(this.targets);
    this.targets = [];

    // switch turns
    this.battleship_ref.child('player_turn/num').set(op);
    this.battleship_ref.child('player_turn/timestamp').set(Firebase.ServerValue.TIMESTAMP);

    var num_shots = this.boards[op].get_num_shots();
    this.battleship_ref.child('player'+op.toString()+'/num_shots').set(num_shots);
    //alert('player'+op.toString()+'/num_shots/'+num_shots.toString());
    // clearInterval(turn_timer);
    // var turn_timer = setInterval(function() {func_turn_timer()},Battleship.TURN_TIME_LIMIT);
  }
  //// Sets up handlers for all mouse actions    
  Battleship.Controller.prototype.enable_mouse = function () {
    var self = this;
    $(document).on('click','canvas',function (evt) {
      // CLICKING ON OWN BOARD
      if ($(this).attr('data')==self.my_num) {
        $MSG_CLICK_OWN_BOARD.fadeIn();
        return;
      }

      var pos = Battleship.Board.get_position(evt.offsetX,evt.offsetY);

      // FLAGGING
      if (evt.shiftKey) {
        self.boards[1-self.my_num].flag_square(pos.row,pos.col);
        return;
      }

      // MAKING A GUESS
      self.battleship_ref.child('player_turn/num').once('value',function (snapshot) {
        if (snapshot.val() == self.my_num) {
          if (self.game_options.num_shots_type == 'standard') { 
            self.standard_turn_handler(pos);
          }
          else {
            self.target_handler(pos);
          }
        }
      });
    });

    // FIRING MULTIPLE SHOTS
    $FIRE_SHOTS_BTN.click(function() {
      var op = 1-self.my_num;

      // 1. get the num shots remaining
      // 2. if num > 0, tell user, ask for confirmation
      // 3. 
      // fire the shots

      self.my_player_ref.child('num_shots').once('value',function(snap) {
        var remaining_shots = snap.val();
        if (remaining_shots > 0) {
          $MSG_EXTRA_TARGETS.fadeIn();         
        }
        self.fire_the_missles();        
      })  
    });
  }
  
  function func_turn_timer() {
    alert('rawwwrtooktoolong!');
  }

  Battleship.Controller.prototype.game_over = function () {
    this.restart_game();
  };


  Battleship.Controller.prototype.restart_game = function () {
    this.opponent_player_ref.child('restart').set(1);
    this.reset_my_board();
    this.gameroom_ref.child('gameover').set(false);
  };


  Battleship.Controller.prototype.reset_my_board = function () {
    this.my_board.create_random_board();
  }; 
  



/* =========================================================
                          INTERFACE
   ========================================================= */


  function inform_turn_info(is_my_turn) {
    if (is_my_turn) {        
      $('#turn-info').text('your turn!')
    }
    else {       
      $('#turn-info').text('other player\'s turn!')
    }
  }

/* =========================================================
                    RANDOM EXAMPLE FUNCS
   ========================================================= */

  /*
    Battleship.Controller.prototype.wait_to_join = function() {
      var self = this;

      // Listen on 'online' location for player0 and player1.
      // this.battleship_ref.child('player0/online').on('value', function(online_snap) {
      //   if (online_snap.val() === null && self.playing_state === Battleship.PLAYING_STATE.Watching) {
      //     self.try_to_join(0);
      //   }
      // });

      // this.battleship_ref.child('player1/online').on('value', function(online_snap) {
      //   if (online_snap.val() === null && self.playing_state === Battleship.PLAYING_STATE.Watching) {
      //     self.try_to_join(1);
      //   }
      // });

      this.battleship_ref.child('player0/online').once('value', function(online_snap) {
        if (online_snap.val() === null) {
          self.try_to_join(0);
          return;
        }
      });

      this.battleship_ref.child('player1/online').once('value', function(online_snap) {
        if (online_snap.val() === null) {
          self.try_to_join(1);
        }
      });

      console.log('idk');
    };

    //// Try to join the game as the specified player_num.
    Battleship.Controller.prototype.try_to_join = function(player_num) {
      // Set ourselves as joining to make sure we don't try to join as both players. :-)
      this.playing_state = Battleship.PLAYING_STATE.Joining;

      // Use a transaction to make sure we don't conflict with other people trying to join.
      var self = this;
      this.battleship_ref.child('player' + player_num + '/online').transaction(function(online_val) {
        if (online_val === null) {
          return true; // Try to set online to true.
        } else {
          return; // Somebody must have beat us.  Abort the transaction.
        }
      }, function(error, committed) {
        if (committed) { // We got in!
          self.playing_state = Battleship.PLAYING_STATE.Playing;
        } else {
          self.playing_state = Battleship.PLAYING_STATE.Watching;
        }
      });
    };
    
    //// Sets a timer to make the piece repeatedly drop after GRAVITY_DELAY ms.
    Battleship.Controller.prototype.reset_gravity = function () {
      // If there's a timer already active, clear it first.
      if (this.gravityIntervalId !== null) {
        clearInterval(this.gravityIntervalId);
      }

      var self = this;
      this.gravityIntervalId = setInterval(function() {
        self.doGravity();
      }, Battleship.GRAVITY_DELAY);
    };


    Battleship.Controller.prototype.doGravity = function () {
      if (this.fallingPiece === null)
        return; // piece isn't initialized yet.

      var newPiece = this.fallingPiece.drop();

      // If we've hit the bottom, add the (pre-drop) piece to the board and create a new piece.
      if (this.myBoard.checkForPieceCollision(newPiece)) {
        this.myBoard.addLandedPiece(this.fallingPiece);

        // Check for completed lines and if appropriate, push extra rows to our opponent.
        var completedRows = this.myBoard.removeCompletedRows();
        var rowsToPush = (completedRows === 4) ? 4 : completedRows - 1;
        if (rowsToPush > 0)
          this.opponentPlayerRef.child('extrarows').push(rowsToPush);

        // Create new piece (it'll be initialized to a random piece at the top of the screen).
        newPiece = new Battleship.Piece();

        // Is the board full?
        if (this.myBoard.checkForPieceCollision(newPiece))
          this.gameOver();
      }

      newPiece.writeToFirebase(this.myPlayerRef.child('piece'));
    };


    //// Detect when our opponent pushes extra rows to us.
    Battleship.Controller.prototype.watch_for_extra_rows = function () {
      var self = this;
      var extraRowsRef = this.myPlayerRef.child('extrarows');
      extraRowsRef.on('child_added', function(snapshot) {
        var rows = snapshot.val();
        extraRowsRef.child(snapshot.key()).remove();

        var overflow = self.myBoard.addJunkRows(rows);
        if (overflow)
          self.gameOver();

        // Also move piece up to avoid collisions.
        if (self.fallingPiece) {
          self.fallingPiece.y -= rows;
          self.fallingPiece.writeToFirebase(self.myPlayerRef.child('piece'));
        }
      });
    };


    //// Detect when our opponent restarts the game.
    Battleship.Controller.prototype.watch_for_restart = function () {
      // var self = this;
      // var restart_ref = this.my_player_ref.child('restart');
      // restart_ref.on('value', function(snap) {
      //   if (snap.val() === 1) {
      //     restart_ref.set(0);
      //     self.reset_my_board();
      //   }
      // });
    };
    Battleship.Controller.prototype.initialize_piece = function() {
      this.fallingPiece = null;
      var pieceRef = this.myPlayerRef.child('piece');
      var self = this;

      // Watch for changes to the current piece (and initialize it if it's null).
      pieceRef.on('value', function(snapshot) {
        if (snapshot.val() === null) {
          var newPiece = new Battleship.Piece();
          newPiece.writeToFirebase(pieceRef);
        } else {
          self.fallingPiece = Battleship.Piece.fromSnapshot(snapshot);
        }
      });
    };

  */
  
});
