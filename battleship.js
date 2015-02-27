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

  var Battleship = {};
  Battleship.BOARD_HEIGHT = 10;
  Battleship.BOARD_WIDTH = 10;
  Battleship.SQUARE_SIZE_PIXELS = 25;
  Battleship.BOARD_HEIGHT_PIXELS = Battleship.BOARD_HEIGHT * Battleship.BLOCK_SIZE_PIXELS;
  Battleship.BOARD_WIDTH_PIXELS = Battleship.BOARD_WIDTH * Battleship.BLOCK_SIZE_PIXELS;
  Battleship.SHIPS = [
    {name:'carrier',size:5},
    {name:'battleship',size:4},
    {name:'submarine',size:3},
    {name:'destroyer',size:3},
    {name:'patrol boat',size:2}
  ];

  Battleship.HIT = 'immahit!';
  Battleship.EMPTY = 'nothinghere!';
  Battleship.BOAT = 'deresaboathere!';
  Battleship.UNKNOWN = 'idontknowwhatshere!';

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


  //// Draws the contents of the board as well as the current piece.
  Battleship.Board.prototype.draw = function () {
    console.log('========= Draw Board start =========');
    // Clear canvas.
    this.context.clearRect(0, 0, Battleship.BOARD_WIDTH_PIXELS, Battleship.BOARD_HEIGHT_PIXELS);

    // Iterate over columns / rows in board data and draw each non-empty block.
    var square_state,left,top
    for (var x = 0; x < Battleship.BOARD_WIDTH; x++) {
      for (var y = 0; y < Battleship.BOARD_HEIGHT; y++) {
        square_state = this.get_square_state(x,y);
        left = x * Battleship.SQUARE_SIZE_PIXELS;
        top = y * Battleship.SQUARE_SIZE_PIXELS;
        this.context.lineWidth = 1;
        this.context.strokeStyle = Battleship.BLOCK_BORDER_COLOR;
        if (square_state == Battleship.HIT) {
          this.context.fillStyle = 'red';
        }
        else if (square_state == Battleship.EMPTY) {
          this.context.fillStyle = 'blue';
          console.log(square_state)
        }
        else if (square_state == Battleship.BOAT) {
          this.context.fillStyle = 'yellow';
        }
        else {          
          this.context.fillStyle = 'green';
        }

        this.context.fillRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
        this.context.strokeRect(left, top, Battleship.SQUARE_SIZE_PIXELS, Battleship.SQUARE_SIZE_PIXELS);
      }
    }

    // If this isn't my board, dim it out with a 25% opacity black rectangle.
    if (!this.is_my_board) {
      this.context.fillStyle = "rgba(0, 0, 0, 0.25)";
      this.context.fillRect(0, 0, Battleship.BOARD_WIDTH_PIXELS, Battleship.BOARD_HEIGHT_PIXELS);
    }
    console.log('========= Draw Board done0 =========');
  };

  //// Clear the board contents.
  Battleship.Board.prototype.clear = function () {
    for (var i=0;i<this.BOARD_HEIGHT;i++) {
      for (var j=0;j<this.BOARD_WIDTH;j++) {
        this.set_square(i,j,this.EMPTY);
      };
    }
  };

  //// Check if this piece will collide with another piece if it is place here
  Battleship.Board.prototype.check_for_collision = function (col,row,ship_size,horizontal) {
    if (horizontal) {
      for (var i = col; i < col+ship_size; i++) {
        if (this.snapshot.child('board/' + row + '/' + i).val() != this.EMPTY) {
          return true;
        }
      };
    }
    else {
      for (var i = row; i < row+ship_size; i++) {        
        if (this.snapshot.child('board/' + i + '/' + col).val() != this.EMPTY) {
          return true;
        }
      };
    }
    return false;
  }

  //// Create random board 
  Battleship.Board.prototype.create_random_board = function () {
    var x,y;
    for (var i = 0; i < Battleship.SHIPS.length; i++) {
      while (false) {
        if (Math.random() < 0.500000) { // horizontal
          x = Math.floor(Math.random()*(this.BOARD_WIDTH-this.SHIPS[i].size));
          y = Math.floor(Math.random()*this.BOARD_HEIGHT);          
        }
        else { // vertical
          x = Math.floor(Math.random()*this.BOARD_WIDTH);
          y = Math.floor(Math.random()*(this.BOARD_HEIGHT-this.SHIPS[i].size));
        }
        if (!this.check_for_collision(this.SHIPS[i].size,x,y)) {
          break;
        }
      }
    };
  }

  Battleship.Board.prototype.set_ship = function (col,row,ship_size,horizontal) {
    for (var i = 0; i < ship_size; i++) {
      if (horizontal) {
        this.player_ref.child('board').child(row+i).child(col).set(this.BOAT);
      }
      else {
        this.player_ref.child('board').child(row).child(col+i).set(this.BOAT);        
      }
    };
  }

  Battleship.Board.prototype.set_square = function (row,col,square_contents) {
    this.player_ref.child('board').child(row).child(col).set(square_contents);
  }

  Battleship.Board.prototype.get_square_state = function (row,col) {
    var square_contents = this.snapshot === null ? null : this.snapshot.child('board/'+row+'/'+col).val();
    return square_contents || Battleship.EMPTY;
  }


/* =========================================================
                        CONTROLLER
   ========================================================= */

  Battleship.PLAYING_STATE = { Watching: 0, Joining: 1, Playing: 2 };

  Battleship.Controller = function (battleship_ref) {
    console.log('=============== Controller Start ===============');
    this.battleship_ref = battleship_ref;
    this.create_boards();

    this.playing_state = Battleship.PLAYING_STATE.Watching;
    this.wait_to_join();
    console.log('=============== Controller Done ===============');
  };

  Battleship.Controller.prototype.create_boards = function () {
    console.log('============= Create Boards Start =============');
    this.boards = [];
    for(var i = 0; i <= 1; i++) {
      var player_ref = this.battleship_ref.child('player' + i);
      var canvas = $('#canvas' + i).get(0);
      this.boards.push(new Battleship.Board(canvas, player_ref));
    }
    console.log('============= Create Boards End =============');
  };


  Battleship.Controller.prototype.wait_to_join = function() {
    console.log('============= Wait To Join Start =============');
    var self = this;

    // Listen on 'online' location for player0 and player1.
    this.battleship_ref.child('player0/online').on('value', function(online_snap) {
      if (online_snap.val() === null && self.playing_state === Battleship.PLAYING_STATE.Watching) {
        self.try_to_join(0);
      }
    });

    this.battleship_ref.child('player1/online').on('value', function(online_snap) {
      if (online_snap.val() === null && self.playing_state === Battleship.PLAYING_STATE.Watching) {
        self.try_to_join(1);
      }
    });
    console.log('============= Wait To Join End =============');
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
        self.start_playing(player_num);
      } else {
        self.playing_state = Battleship.PLAYING_STATE.Watching;
      }
    });
  };


  /**
   * Once we've joined, enable controlling our player.
   */
  Battleship.Controller.prototype.start_playing = function (player_num) {
    this.my_player_ref = this.battleship_ref.child('player' + player_num);
    this.opponent_player_ref = this.battleship_ref.child('player' + (1 - player_num));
    this.my_board = this.boards[player_num];
    this.my_board.is_my_board = true;
    this.my_board.draw();

    // Clear my_player_ref 'online' status when we disconnect so somebody else can join.
    this.my_player_ref.child('online').onDisconnect().remove();

    // Detect when other player pushes rows to our board.
    this.watch_for_extra_rows();

    // Detect when game is restarted by other player.
    this.watch_for_restart();

    $('#game_in_progress').hide();

    var self = this;
    $('#restart_button').show();
    $("#restart_button").click(function () {
      self.restart_game();
    });

    this.initialize_piece();
    this.enable_keyboard();
    this.reset_gravity();
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


  //// Sets up handlers for all keyboard commands.   
  Battleship.Controller.prototype.enable_keyboard = function () {
    var self = this;
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


  /**
   * Detect when our opponent pushes extra rows to us.
   */
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
    this.my_board.clear();
    var newPiece = new Battleship.Piece();
    newPiece.writeToFirebase(this.my_player_ref.child('piece'));
  };
  
  var canvas = $("#canvas0").get(0);
  if (!canvas || !canvas.getContext || !canvas.getContext('2d'))
    alert("You must use a browser that supports HTML5 Canvas to run this demo.");

  function start() {
    var battleship_ref = new Firebase('https://battlesomeships.firebaseio.com/');
    var battleship_controller = new Battleship.Controller(battleship_ref);
  }

  start();
});
