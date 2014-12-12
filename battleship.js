$(document).ready(function() {
/* =========================================================
                CONFIG, CONSTANTS, + GLOBALS
   ========================================================= */
  var BOARD_WIDTH = 5;
  var BOARD_HEIGHT = 5;

  var ROUND = {
    picture: [],
    horizontal_hints: [],
    vertical_hints: []
  }

/* =========================================================
                      LOGIC FUNCTIONS
   ========================================================= */


  function make_random_board() {
    var pic = [];
    for (var i = 0; i < BOARD_WIDTH; i++) {
      pic.push([]);
      for (var j = 0; j < BOARD_HEIGHT; j++) {
        pic[i].push(Math.floor(Math.random()*2));
      };
    };
    return pic;
  }

  function generate_game(round) {
    round.picture = make_random_board();

    var streak;
    // create the horizontal hints
    round.horizontal_hints = [];
    for (var i = 0; i < BOARD_HEIGHT; i++) {
      round.horizontal_hints.push([]);
      streak = 0;
      for (var j = 0; j < BOARD_WIDTH; j++) {
        if (round.picture[i][j] == 1) {
          streak += 1;
        }
        else {
          if (streak != 0) {
            round.horizontal_hints[i].push(streak);
          }
          streak = 0;
        }
      };
      if (streak != 0) {
        round.horizontal_hints[i].push(streak);
      }
      if (round.horizontal_hints[i].length == 0) {
        round.horizontal_hints[i].push(0);
      }
    };

    // create the vertical hints
    round.vertical_hints = [];
    for (var i = 0; i < BOARD_WIDTH; i++) {
      round.vertical_hints.push([]);
      streak = 0;
      for (var j = 0; j < BOARD_HEIGHT; j++) {
        if (round.picture[j][i] == 1) {
          streak += 1;
        }
        else {
          if (streak != 0) {
            round.vertical_hints[i].push(streak);
          }
          streak = 0;
        }
      };
      if (streak != 0) {
        round.vertical_hints[i].push(streak);
      }
      if (round.vertical_hints[i].length == 0) {
        round.vertical_hints[i].push(0);
      }
    };

    return round;
  }

  function has_won(round) {
    var $sq;
    for (var i=0;i<BOARD_HEIGHT;i++) {
      for (var j=0;j<BOARD_WIDTH;j++) {
        if (round.picture[i][j] == 1) {
          $sq = $('#game .grid .square[row="'+i.toString()+'"][col="'+j.toString()+'"]');
          if (!$sq.hasClass('fill')) {
            return false;
          }
        }        
      }
    }
    return true;
  }


/* =========================================================
                        DOM FUNCTIONS
   ========================================================= */

  function make_vert_hints_html(hints) {
    var html = '<div class="col">';
    for (var i = 0; i < hints.length; i++) {
      html += '<div class="number">' + hints[i].toString() + '</div>';
    };
    html += '</div>'
    return html;
  }

  function make_hor_hints_html(hints) {
    var html = '<div class="row">';
    for (var i = 0; i < hints.length; i++) {
      html += '<div class="number">' + hints[i].toString() + '</div>';
    };
    html += '</div>'
    return html;
  }

  function make_square_html(row,col) {
    var html = '<div class="square"'
    html += 'row="' + row.toString() + '" col="' + col.toString() + '"'
    html += '></div>';
    return html;
  }

  function populate_game(round) {
    // populate the vertical hints
    for (var i = 0; i < BOARD_WIDTH; i++) {
      $('#game .hints.vertical').append(make_vert_hints_html(round.vertical_hints[i]));      
    };

    // populate the horizontal hints
    for (var i = 0; i < BOARD_HEIGHT; i++) {
      $('#game .hints.horizontal').append(make_hor_hints_html(round.horizontal_hints[i]));      
    };

    // populate the grid
    for (var i = 0; i < BOARD_HEIGHT; i++) {
      for (var j = 0; j < BOARD_WIDTH; j++) {
        $('#game .grid').append(make_square_html(i,j));
      };    
    };
  }
  
  function game_won() {
    alert('you won!');
  }
/* =========================================================
                      USER INTERACTIONS
   ========================================================= */

  $('#start_btn').click(function() {
    init_game();
    $(this).hide();
    $('#toggle_click_btn').removeClass('hidden')
  });

  $('#toggle_click_btn').click(function() {
   $(this).toggleClass('X');
   $(this).toggleClass('fill'); 
  })
  
  $(document).on('click','#game .square',function() {
    if ($(this).hasClass('fill')) { return; }
    
    if ($('#toggle_click_btn').hasClass('X')) {
      $(this).addClass('X');
      return;
    }
    var r = Number($(this).attr('row'));
    var c = Number($(this).attr('col'));
    if (ROUND.picture[r][c] == 1) {
      $(this).addClass('fill');
      if (has_won(ROUND)) {
        game_won();
      }
    }
    else {
      $(this).addClass('mistake');
    }
  });
  
  $(document).on('click','#game .square.X',function() {
    $(this).removeClass('X');
  });
/* =========================================================
                            MISC.
   ========================================================= */

  function init_game() {
    ROUND = generate_game(ROUND);
    populate_game(ROUND);
  }

  function print_board(board) {
    var s;
    for (var i=0; i<board.length;i++) {
      s = '';
      for (var j = 0; j < board[i].length; j++) {
        s += board[i][j] + '\t';
      };
      console.log(s);
    }
  }

  function is_here(arr,ele) {
    if (arr.length == 0) {return false;}

    for (var i = 0; i < arr.length; i++) {
      if (ele == arr[i]) { return true; }
    };
    return false;
  }
});
