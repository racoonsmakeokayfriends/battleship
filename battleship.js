
var Battleship = {};

$(document).ready(function() {
/* =========================================================
                CONFIG, CONSTANTS, + GLOBALS
   ========================================================= */

/* =========================================================
                      LOGIC FUNCTIONS
   ========================================================= */

/* =========================================================
                        DOM FUNCTIONS
   ========================================================= */

/* =========================================================
                      USER INTERACTIONS
   ========================================================= */

/* =========================================================
                        BATTLESHIP
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

  // from 'this' players perspective
  Battleship.WATER = 'itswaterandiknowit!';
  Battleship.BOAT = 'deresaboathere!';

  // from 'other' players perspective
  Battleship.HIT = 'immahit!';
  Battleship.MISS = 'nothingshere!';
  Battleship.SUNK = 'immadownanddead!';

  Battleship.BLOCK_BORDER_COLOR = 'black';

  //// Stores the state of a battleship board and handles drawing it.
  Battleship.Board = function (canvas, player_ref) {
    this.context = canvas.getContext('2d');
    this.player_ref = player_ref;
    this.snapshot = null;
    this.is_my_board = false;
    this.create_random_board();

    // Listen for changes to our board.
    var self = this;
    player_ref.on('value', function(snapshot) {
      self.snapshot = snapshot;
      self.draw();
    });
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
        if (square_state == Battleship.BOAT) {
          this.context.fillStyle = 'yellow';
        }
        else if (square_state == Battleship.WATER) {
          this.context.fillStyle = 'blue';
        }
        else if (square_state == Battleship.HIT) {
          this.context.fillStyle = 'red';
        }
        else if (square_state == Battleship.MISS) {          
          this.context.fillStyle = 'green';
        }
        else if (square_state == Battleship.SUNK) {          
          this.context.fillStyle = 'black';
        }
        this.context.fillRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
        this.context.strokeRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
      }
    }
  };

  Battleship.Board.prototype.draw_their_board = function () {
    // Iterate over columns / rows in board data and draw each non-empty block.
    var square_state,left,top
    for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
      for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
        square_state = this.get_square_state(r,c);
        left = c * Battleship.SQUARE_SIZE_PIXELS;
        top = r * Battleship.SQUARE_SIZE_PIXELS;
        this.context.lineWidth = 1;
        this.context.strokeStyle = 'white';
        // this is an unknown square
        if (square_state == Battleship.BOAT||square_state == Battleship.WATER) {
          this.context.fillStyle = 'rgb(50,50,50)';
        }
        else if (square_state == Battleship.HIT) {
          this.context.fillStyle = 'red';
        }
        else if (square_state == Battleship.MISS) {          
          this.context.fillStyle = 'green';
        }
        else if (square_state == Battleship.SUNK) {          
          this.context.fillStyle = 'black';
        }
        this.context.fillRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
        this.context.strokeRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
      }
    }
  };

  //// Draws the contents of the board as well as the current piece.
  Battleship.Board.prototype.draw = function () {
    this.context.clearRect(0, 0, Battleship.BOARD_WIDTH_PIXELS, Battleship.BOARD_HEIGHT_PIXELS);
    if (this.is_my_board) {
      this.draw_my_board();
    }
    else {
      this.draw_their_board();
    }
    // // If this isn't my board, dim it out with a 25% opacity black rectangle.
    // if (!this.is_my_board) {
    //   this.context.fillStyle = "rgba(0, 0, 0, 0.50)";
    //   this.context.fillRect(0, 0, Battleship.BOARD_WIDTH_PIXELS, Battleship.BOARD_HEIGHT_PIXELS);
    // }
  };

  //// Clear the board contents.
  Battleship.Board.prototype.clear_board = function () {
    for (var i=0;i<Battleship.BOARD_HEIGHT;i++) {
      for (var j=0;j<Battleship.BOARD_WIDTH;j++) {
        this.set_square_state(i,j,Battleship.WATER);
      };
    }
  };

  //// Check if this piece will collide with another piece if it is place here
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

  Battleship.Board.prototype.init_empty_data_board = function () {
    this.data_board = [];
    for (var r = 0; r < Battleship.BOARD_HEIGHT; r++) {
      this.data_board.push([]);
      for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
        this.data_board[r].push(Battleship.WATER);
      };
    };
  }

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
  }

  //// Clear the board contents.
  Battleship.Board.prototype.is_boat = function (sq_state) {
    for (var i=0;i<Battleship.SHIPS.length;i++) {
      if (sq_state == Battleship.SHIPS[i].name) { return true; }
    }
    return false;
  };

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
  }

  Battleship.Board.prototype.set_square_state = function (row,col,square_state) {
    this.player_ref.child('board').child(row).child(col).set(square_state);
  }
  Battleship.Board.prototype.set_ship_location = function (ship_name,ship_size,row,col,horizontal) {
    var data = {name:ship_name,ship_size:ship_size,row:row,col:col,horizontal:horizontal};
    this.player_ref.child('ships').child(ship_name).set(data);
  }

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
  }

  Battleship.Board.prototype.get_square_state = function (row,col) {
    var square_contents = this.snapshot === null ? null : this.snapshot.child('board/'+row+'/'+col).val();
    return square_contents || Battleship.WATER;
  }
  Battleship.Board.prototype.get_ship_state = function (ship_name) {
    var ship_data = this.snapshot === null ? null : this.snapshot.child('ships/'+ship_name).val();
    return ship_data || -1;
  }

  Battleship.Board.get_position = function (mousex,mousey) {
    var r = Math.floor(mousey/Battleship.SQUARE_SIZE_PIXELS);
    var c = Math.floor(mousex/Battleship.SQUARE_SIZE_PIXELS);
    return {row:r,col:c};
  }

  /*
  Battleship.Board.prototype.is_boat_sunk = function (ship_name,row,col) {
    
    var boat_size;
    for (var i = 0; i < Battleship.SHIPS.length; i++) {
      if (Battleship.SHIPS[i].ship_name == ship_name) { 
        boat_size = Battleship.SHIPS[i].size;
        break;
      }
    };
    
    var ship_data = this.get_ship_state(ship_name);
    console.log('checking if ship sunk')
    for (var i = 0; i < ship_data.ship_size; i++) {
      if (ship_data.horizontal&&this.get_square_state(row,col+i)!=Battleship.HIT) {
        return false;
      }
      else if (!ship_data.horizontal&&this.get_square_state(row+i,col)!=Battleship.HIT) {
        return false;        
      }


      // for (var c = 0; c < Battleship.BOARD_WIDTH; c++) {
      //   if (this.data_board[r][c] == ship_name) {
      //     if (this.get_square_state(r,c) != Battleship.HIT) {
      //       return false;
      //     }
      //   }
      // };
    };
    return true;
  }
*/
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
  }
  Battleship.Board.prototype.get_ship_from_pos = function(row,col) {
    var ship_data;
    for (var i = 0; i < Battleship.SHIPS.length; i++) {
      ship_data = this.get_ship_state(Battleship.SHIPS[i].name);
      if (check_pos_ship_intersect(ship_data,row,col)) {
        return ship_data;
      }
    };
    return -1;
  }
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
  }

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
  }

  Battleship.Board.prototype.make_guess = function (row,col) {
    var state = this.get_square_state(row,col);
    if (state == Battleship.BOAT) {
      this.set_square_state(row,col,Battleship.HIT);
      var ship_sank = this.check_if_ship_sank(row,col)
      if (ship_sank) {
        // boat is sunk
        alert('you sunk '+ship_sank.name);
        this.sink_the_ship(ship_sank)
        // TODO: display sunken boat
        // TODO: check if gameover
      }
    }
    if (state == Battleship.WATER) {
      this.set_square_state(row,col,Battleship.MISS);
    }
    return state;
  }

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
  }
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
  }
/* =========================================================
                        CONTROLLER
   ========================================================= */

  Battleship.PLAYING_STATE = { Watching: 0, Joining: 1, Playing: 2 };

  Battleship.Controller = function (gameroom_ref,myid) {
    this.gameroom_ref = gameroom_ref;
    this.battleship_ref = gameroom_ref.child('game');

    this.create_boards();
    var self=this;
    this.gameroom_ref.child('user_list').once('value',function (userlist_snap) {
      var i=0;
      userlist_snap.forEach(function(user_snap) {
        if (user_snap.key() == myid) {
          self.start_playing(i);
        }
        i+=1;
      })
    })
  };

  Battleship.Controller.prototype.create_boards = function () {
    this.boards = [];
    for(var i = 0; i <= 1; i++) {
      var player_ref = this.battleship_ref.child('player' + i);
      var canvas = $('#canvas' + i).get(0);
      this.boards.push(new Battleship.Board(canvas, player_ref));
    }
  };

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
  */

  function inform_turn_info(is_my_turn) {
    if (is_my_turn) {        
      $('#turn-info').text('your turn!')
    }
    else {       
      $('#turn-info').text('other player\'s turn!')
    }
  }


  //// Once we've joined, enable controlling our player.
  Battleship.Controller.prototype.start_playing = function (player_num) {
    this.my_player_ref = this.battleship_ref.child('player' + player_num);
    this.opponent_player_ref = this.battleship_ref.child('player' + (1 - player_num));
    this.my_board = this.boards[player_num];
    this.my_board.is_my_board = true;
    this.my_board.draw();
    this.battleship_ref.child('player_turn').set(0);
    inform_turn_info(player_num == 0);
    this.my_num = player_num;

    // Clear my_player_ref 'online' status when we disconnect so somebody else can join.
    this.my_player_ref.child('online').onDisconnect().remove();

    this.battleship_ref.child('player_turn').on('value',function (snapshot) {
      inform_turn_info(snapshot.val() == self.my_num);
    })
    // Detect when other player pushes rows to our board.
    //ERASEthis.watch_for_extra_rows();

    // Detect when game is restarted by other player.
    this.watch_for_restart();

    $('#game_in_progress').hide();

    var self = this;
    $('#restart_button').show();
    $("#restart_button").click(function () {
      self.restart_game();
    });

    this.enable_mouse();
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



  //// Sets up handlers for all mouse commands.   
  Battleship.Controller.prototype.enable_mouse = function () {
    var self = this;
    $(document).on('click','canvas',function (evt) {
      if ($(this).attr('data')==self.my_num) {
        // TODO: [ ] inform user that's their board
        return;
      }

      self.battleship_ref.child('player_turn').once('value',function (snapshot) {
        if (snapshot.val() == self.my_num) { 
          var pos = Battleship.Board.get_position(evt.offsetX,evt.offsetY);
          // TODO: 
          // [ ] ensure guessing is what we're trying to do
          // [ ] special case: clicking on already clicked tiles
          var state = self.boards[1-self.my_num].make_guess(pos.row,pos.col);
          self.battleship_ref.child('player_turn').set(1-snapshot.val());
        }
      });
    });
    /*
      $(document).on('keydown', function (evt) {
        if (self.fallingPiece === null)
          return; // piece isn't initialized yet.

        var keyCode = evt.which;
        var key = { space:32, left:37, up:38, right:39, down:40 };

        var newPiece = null;
        switch (keyCode) {
          case key.left:
            newPiece = self.fallingPiece.moveLeft();
            break;
          case key.up:
            newPiece = self.fallingPiece.rotate();
            break;
          case key.right:
            newPiece = self.fallingPiece.moveRight();
            break;
          case key.down:
            newPiece = self.fallingPiece.drop();
            break;
          case key.space:
            // Drop as far as we can.
            var droppedPiece = self.fallingPiece;
            do {
              newPiece = droppedPiece;
              droppedPiece = droppedPiece.drop();
            } while (!self.myBoard.checkForPieceCollision(droppedPiece));
            break;
        }

        if (newPiece !== null) {
          // If the new piece position / rotation is valid, update self.fallingPiece and firebase.
          if (!self.myBoard.checkForPieceCollision(newPiece)) {
            // If the keypress moved the piece down, reset gravity.
            if (self.fallingPiece.y != newPiece.y) {
              self.resetGravity();
            }

            newPiece.writeToFirebase(self.myPlayerRef.child('piece'));
          }
          return false; // handled
        }

        return true;
      });
    */
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
    var self = this;
    var restart_ref = this.my_player_ref.child('restart');
    restart_ref.on('value', function(snap) {
      if (snap.val() === 1) {
        restart_ref.set(0);
        self.resetMyBoardAndPiece();
      }
    });
  };


  Battleship.Controller.prototype.game_over = function () {
    this.restart_game();
  };


  Battleship.Controller.prototype.restart_game = function () {
    this.opponent_player_ref.child('restart').set(1);
    this.resetMyBoardAndPiece();
  };


  Battleship.Controller.prototype.resetMyBoardAndPiece = function () {
    this.my_board.clear_board();
    var newPiece = new Battleship.Piece();
    newPiece.writeToFirebase(this.my_player_ref.child('piece'));
  }; 
  
});
