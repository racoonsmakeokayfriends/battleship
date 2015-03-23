$(document).ready(function() {

  /* =========================================================
                      CONSTANTS & GLOBALS
     ========================================================= */

  var MAX_USERS = 2;
  var NUM_USERS = 2;

  var FB_URL = 'https://battlesomeships.firebaseio.com/';
  var PLACEHOLDER_FLAG = 'sdfjweute8rteijdkfvnm';

  // CREATE A REFERENCE TO FIREBASE
  var fb = new Firebase(FB_URL);
  var all_users_ref = fb.child('all_users');
  var game_rooms_ref = fb.child('game_room_list');

  /*------------
    DOM ELEMENTS  
    ------------*/
    
  var $PAGE_SIGNIN = $('#page-signin');
  var $PAGE_LOBBY = $('#page-lobby');
  var $PAGE_GAMEROOM = $('#page-gameroom');

  var $SIGNIN_FIELD_USERNAME = $('#page-signin #username_field');
  var $SIGNIN_FIELD_LOBBY_TYPE = $('#page-signin #lobby_type_field');
  var $SIGNIN_BTN_ENTER_LOBBY = $('#page-signin #enter_lobby_btn');
  var $SIGNIN_MESSAGE = $('#signin_msg');

  var $PROPOSE_GAME_CLASSIC_BTN = $('#page-lobby #propose_classic_game_btn');
  var $PROPOSE_GAME_BIG_SHIP_BTN = $('#page-lobby #propose_big_ship_game_btn');
  var $PROPOSE_GAME_REMAINING_BTN = $('#page-lobby #propose_remaining_game_btn');
  var $GAME_OPT_SINK_ALERT = $('#page-lobby #opt-sink-alert');
  var $GAME_OPT_NUM_SHOTS = $('#page-lobby #opt-num-shots');
  var $PROPOSE_GAME_INDIA_BTN = $('#page-lobby #propose_india_game_btn');
  var $PROPOSE_GAME_JAPAN_BTN = $('#page-lobby #propose_japan_game_btn');
  var $PROPOSE_GAME_RUSSIA_BTN = $('#page-lobby #propose_russia_game_btn');

  var $LOBBY_LIST_USERS = $('#page-lobby #present_users');
  var $LOBBY_MD_INVITATION = $('#page-lobby #md-invitation');

  var $ACCEPT_INVITE_BTN = $('#accept_invite_btn');
  var $REJECT_INVITE_BTN = $('#reject_invite_btn');

  var $EXIT_GAMEROOM_BTN = $('#exit_gameroom_btn');
  var $ACCEPT_REPLAY_BTN = $('#accept_replay_btn');
  var $REJECT_REPLAY_BTN = $('#reject_replay_btn');

  var $GAMEROOM_USER_LIST = $('#page-gameroom #game_user_list');
  var $SEND_MSG_BTN = $('#send_msg_btn');
  var $MSG_FIELD = $('#msg_field');
  var $GAMEROOM_CHATLOG = $('#game_chatlog');

  var $MSG_INVITE_TOO_MANY = $('#msg-invite-too-many');
  var $MSG_USERNAME_EMPTY = $('#msg-username-empty');
  var $MSG_USERNAME_TAKEN = $('#msg-username-taken');
  var $MSG_OPPONENT_LEFT = $('#msg-opponent-left');

  // Some globals for this user
  var my_name = 'noone';
  var my_data = {id:'',name:'',status:''};
  var battleship_controller;

  /*------------
       SIGNIN  
    ------------*/

  //// USER ATTEMPTS TO ENTER LOBBY
  $SIGNIN_BTN_ENTER_LOBBY.click(function () {
    if ($SIGNIN_FIELD_USERNAME.val() == '') {
      $SIGNIN_MESSAGE.text('You must specify a username');
      $MSG_USERNAME_EMPTY.fadeIn();
      return;
    }
    var username = $SIGNIN_FIELD_USERNAME.val();
    var user_data = {name:username,status:'lobby'};
    my_name = username;
    try_create_user(username,user_data);
  });

  function try_create_user(username,user_data) {
    all_users_ref.child(username).transaction(function(current_user_data) {
      if (current_user_data === null) {
        return user_data;
      }
    }, function(error, committed) {
      user_created(username, committed);
    });
  };

  function user_created(username,success) {
    if (!success) {
      $SIGNIN_MESSAGE.text('That username is taken by another user, please choose another.');
      $MSG_USERNAME_TAKEN.fadeIn();
      open_page($PAGE_SIGNIN);
      my_name = '';
      return;
    }
    open_page($PAGE_LOBBY);
    

    // this snippet makes it so the user is deleted when they leave the page
    // Get a reference to my own presence status.
    var connected_ref = new Firebase(FB_URL+'/.info/connected');
    connected_ref.on('value', function(is_online) {
      if (is_online.val()) {
        // if player is in a gameroom, delete that gameroom
        all_users_ref.child(username).onDisconnect().remove();
      }
      else {
      }
    });
    // if user has been invited to a game, open the invitation
    all_users_ref.child(username).on('child_changed',function (snapshot) {
      if (snapshot.val().status == 'invited') {
        $LOBBY_MD_INVITATION.removeClass('hidden');
      }
    });
  };
  
  /*------------
        LOBBY  
    ------------*/

  //// USER SELECTS/DESELECTS A PLAYER
  $(document).on('click','#page-lobby #present_users li.user',function (e) {
    $(this).toggleClass('selected');
    $(this).children('i').toggleClass('fa-check-square-o');
    $(this).children('i').toggleClass('fa-square-o');
  });
  //// USER ATTEMPTS TO START A 'CLASSIC' GAME
  $PROPOSE_GAME_CLASSIC_BTN.click(function () {
    // check that no more than X users are chosen
    if ($LOBBY_LIST_USERS.children('li.user.selected').length > MAX_USERS) {
      $MSG_INVITE_TOO_MANY.fadeIn();
      return;
    }

    // get game options
    if ($GAME_OPT_SINK_ALERT.hasClass('on')) {
      // do stuff
    }
    if ($('#opt-num-shots-remaining').hasClass('active')) {
      // do stuff
    }
    if ($('#opt-num-shots-biggest').hasClass('active')) {
      // do stuff
    }
    // otherwise, it'a a classic game

    // create a list of all selected users
    var user_list = [];
    user_list.push(my_data);
    $LOBBY_LIST_USERS.children('li.user.selected').each(function () {
      user_list.push({id:$(this).attr('id'),name:$(this).children('.username').text(),status:'lobby'});
    });

    invite_users(user_list);
  });

  /*------------
  upating the lobby  
    ------------*/

  all_users_ref.on('child_added',function (snapshot) {
    //GET DATA
    var data = snapshot.val();
    var username = data.name || 'anonymous';

    if (username == my_name) {
      my_data.id = get_user_id(snapshot);
      my_data.name = username;
      my_data.status = 'lobby';
      return;
    }

    //CREATE ELEMENTS MESSAGE & SANITIZE TEXT
    var user_element = $('<li class="user">');
    user_element.attr('id',get_user_id(snapshot))
    user_element.append($('<i class="fa fa-square-o"></i>'));
    var name_element = $('<strong class="username"></strong>');
    name_element.text(username);
    user_element.append(name_element);

    //ADD PLAYER
    $LOBBY_LIST_USERS.append(user_element);

    //SCROLL TO BOTTOM OF MESSAGE LIST
    //messageList[0].scrollTop = messageList[0].scrollHeight;
  });
  all_users_ref.on('child_removed', function (snapshot) {
    var data = snapshot.val();
    var user_id = get_user_id(snapshot);
    $LOBBY_LIST_USERS.children('#' + user_id).remove();
    if (data.status == 'gameroom') {
      // remove from gameroom
      game_rooms_ref.child(data.gameroom_key).child('user_list').child(user_id).remove();
    }
  });
  all_users_ref.on('child_changed',function (snapshot,prev_child_name) {
    // ensure the lobby list is up to date
    if (snapshot.val().status == 'lobby') {
      $LOBBY_LIST_USERS.children('#' + get_user_id(snapshot)).show();
    }
    if (snapshot.val().status != 'lobby') {
      $LOBBY_LIST_USERS.children('#' + get_user_id(snapshot)).hide();
    }

    // check if its us&we got a invitation
    if (get_user_id(snapshot) == my_data.id && snapshot.val().status == 'invited') {
      // put all the nessecary game info into the invitation
      var txt = 'A Classic Game';
      var my_gr = get_my_gameroom_ref();
      my_gr.child('creator').once('value',function(snap) {
        $LOBBY_MD_INVITATION.find('#game-creator').html(snap.val());
      });
      my_gr.child('sink_alert').once('value',function(snap) {
        if (!snap.val()) {
          txt += '<br/>+ NO alerts when a ship has been sunk';
        }
        $LOBBY_MD_INVITATION.find('.md-txt').html(txt);
      });
      $LOBBY_MD_INVITATION.removeClass('hidden');
    }
  });


  function invite_users(user_list) {
    // initialize the gameroom
    var gameroom_key = game_rooms_ref.push({'timestamp':Firebase.ServerValue.TIMESTAMP}).key();
    game_rooms_ref.child(gameroom_key).child('user_list').child(PLACEHOLDER_FLAG).set('');
    game_rooms_ref.child(gameroom_key).child('chatlog').set('');
    game_rooms_ref.child(gameroom_key).child('gameover').set(false);
    game_rooms_ref.child(gameroom_key).child('creator').set(my_data.id);

    // set the gameplay options
    var bs_op = new Battleship_Options();
    if ($GAME_OPT_SINK_ALERT.hasClass('on')) {
      bs_op.set_ship_sink_alert(false);
    }
    else {
      bs_op.set_ship_sink_alert(true);
    }

    if ($('#opt-num-shots-remaining').hasClass('active')) {
      bs_op.set_num_shots_type('remaining');
    }
    else if ($('#opt-num-shots-biggest').hasClass('active')) {
      bs_op.set_num_shots_type('biggest');
    }
    else {
      bs_op.set_num_shots_type('standard');
    }

    game_rooms_ref.child(gameroom_key).child('options').set(bs_op.to_obj());


    // invite the users
    for (var i = 0; i < user_list.length; i++) {
      all_users_ref.child(user_list[i].id).child('status').set('invited');
      all_users_ref.child(user_list[i].id).child('gameroom_key').set(gameroom_key);
    };
  }

  function add_user_to_user_list(user_snapshot) {
    var data = user_snapshot.val();      
    var user_element = $('<li class="user">');
    user_element.attr('val',get_user_id(user_snapshot));
    user_element.text(get_user_id(user_snapshot));
    $GAMEROOM_USER_LIST.append(user_element);
  }

  function remove_user_from_user_list(user_snapshot) {
    $GAMEROOM_USER_LIST.children('[val="'+get_user_id(user_snapshot)+'"]').remove();
  }

  function add_msg_to_chatlog(msg_snapshot) {  
    var data = msg_snapshot.val();
    var $msg_element = $('<li class="msg">');
    var $author_element = $('<strong class="author">');
    var $timestamp_element = $('<strong class="timestamp">');
    var $text_element = $('<p class="msg-text">');
    $author_element.text(data.author);
    var t = new Date(data.timestamp);
    $timestamp_element.text(t.toLocaleString());
    $text_element.text(data.message);
    $msg_element.prepend($text_element).prepend($timestamp_element).prepend($author_element);
    $GAMEROOM_CHATLOG.append($msg_element);
  }

  function start_game() {
    var battleship_ref = get_my_gameroom_ref();
    battleship_controller = new Battleship.Controller(battleship_ref,my_data.id);
    battleship_ref.once('value',function(snap) {
      if (!snap.val().sink_alert){
        battleship_controller.set_ship_sink_alert(false);
      }
      if (snap.val().num_shots_type){
        battleship_controller.set_num_shots(snap.val().num_shots_type);
      }
    })
  }

  function join_game() {
    var my_gameroom_ref = get_my_gameroom_ref();
    my_gameroom_ref.child('player_left').set(false);
    // see if this has been removed (by other player rejecting to replay)
    my_gameroom_ref.child('player_left').on('value',function (snap) {
      if (snap.val() == true) {
        alert('other player rejected replay');
        leave_game_room();
        my_gameroom_ref.remove();
      }
    });

    my_gameroom_ref.child('user_list').child(my_data.id).set({'timestamp':Firebase.ServerValue.TIMESTAMP});
    open_page($PAGE_GAMEROOM);
    
    var onlycallonce_hack = true;

    // === PLAYER ENTERED ===
    my_gameroom_ref.child('user_list').on('child_added', function (snapshot) {
      if (get_user_id(snapshot) == PLACEHOLDER_FLAG) return;
      // add_user_to_user_list(snapshot); // we're not showing the userlist for battleship
      // todo: check if the right number of players are here
      my_gameroom_ref.child('user_list').once('value',function(s) {
        // NOTE: edit this to reflect when we're ready to play
        // NOTE: the -1 is for that stupid placeholder
        if (s.numChildren()-1 == NUM_USERS&&onlycallonce_hack) {
          start_game();
          onlycallonce_hack = false;
        }

        
      });
    }); 

    // === PLAYER LEFT ===
    my_gameroom_ref.child('user_list').on('child_removed', function (snapshot) {
      // delete the entire gameroom when everyone leaves
      // note, it needs to be 1/we have the placeholder because if we get to 0, the userlist (not gameroom) will delete itself
      $MSG_OPPONENT_LEFT.fadeIn();
      // todo: take player back to lobby
      // my_gameroom_ref.child('user_list').child(my_data.id).remove();
      leave_game_room();
      my_gameroom_ref.child('user_list').once('value',function (snapshot) {
        if (snapshot.numChildren() == 1) {
          my_gameroom_ref.remove();
        }
      });
    });

    // === MESSAGE ADDED ===
    my_gameroom_ref.child('chatlog').on('child_added', function (snapshot) {
      add_msg_to_chatlog(snapshot);
    });
    // === GAME OVER ===
    my_gameroom_ref.child('gameover').on('value',function (snapshot) {
      if (snapshot.val() == true) {
        $('#md-replay').removeClass('hidden');
      }
    });
  }

  function alert_invite_rejection(my_gameroom_ref) {
    var alert_data = {'author':'SYS','timestamp':Firebase.ServerValue.TIMESTAMP};
    alert_data['message'] = 'User ' + my_data.id + ' has rejected your invitation.';
    my_gameroom_ref.child('chatlog').push(alert_data);
  }

  $ACCEPT_INVITE_BTN.click(function () {
    all_users_ref.child(my_data.id).child('status').set('gameroom');
    join_game();
  });

  $REJECT_INVITE_BTN.click(function () {
    alert_invite_rejection(get_my_gameroom_ref());
    all_users_ref.child(my_data.id).child('status').set('lobby');
  });

  $EXIT_GAMEROOM_BTN.click(function() {
    leave_game_room();
  });

  $ACCEPT_REPLAY_BTN.click(function () {        
    battleship_controller.restart_game();
  });

  $REJECT_REPLAY_BTN.click(function () {
    leave_game_room();
  });

  $SEND_MSG_BTN.click(function () {
    var msg = $MSG_FIELD.val();
    $MSG_FIELD.val('');
    var my_gameroom_ref = get_my_gameroom_ref();
    var msg_data = {'message':msg,'author':my_data.id,'timestamp':Firebase.ServerValue.TIMESTAMP};
    my_gameroom_ref.child('chatlog').push(msg_data);
  });

/* =========================================================
                  GENERAL FUNCTIONALITY/HELPER
   ========================================================= */

  $('.md .md-close').click(function() {
    $(this).closest('.md').addClass('hidden');
    $(this).closest('.md').fadeOut();
  });

  $('.message .close.btn').click(function() {
    $(this).closest('.message').fadeOut();
  });
  $('.tgl-btn').on('click', function() {
    $(this).toggleClass('on');
  });
  $('.tgl-btns .btn').click(function() {
    $(this).parents('.tgl-btns').children('.btn').removeClass('active');
    $(this).addClass('active');
  });

  function open_page($page_to_open) {
    $('.page, .page .md').addClass('hidden');
    $page_to_open.removeClass('hidden');
  }

  function get_user_id(snapshot) {
    return snapshot.key().replace(/[^a-z0-9\-\_]/gi,'');
  }

  function get_my_gameroom_ref() {
    var my_user_ref = all_users_ref.child(my_data.id);
    var gameroom_key;
    my_user_ref.once('value',function(snapshot) { gameroom_key = snapshot.val()['gameroom_key']; });
    return game_rooms_ref.child(gameroom_key);
  }

  function leave_game_room() {
    var my_gameroom_ref = get_my_gameroom_ref();
    my_gameroom_ref.child('user_list').child(my_data.id).remove();
    my_gameroom_ref.child('player_left').set(true);
    all_users_ref.child(my_data.id).child('status').set('lobby');
    all_users_ref.child(my_data.id).child('gameroom_key').set(null);
    open_page($PAGE_LOBBY);    
  }

/* =========================================================
                      SENDING FEEDBACK
   ========================================================= */


  $('#report-bug-btn').click(function() {
    $('#md-report-bug').fadeIn();
  });
  $('#give-feedback-btn').click(function() {
    $('#md-give-feedback').fadeIn();
  });

  $('#send_bug_btn').click(function() {
    var summary_val = $('#bug_report_summary_field').val().trim();
    var os_val = $('#bug_report_summary_field').val().trim();
    var brows_val = $('#bug_report_summary_field').val().trim();
    if (summary_val == '') {
      // validation crap
    }
    var report = {summary:summary_val, os:os_val, browser:brows_val, timestamp:Firebase.ServerValue.TIMESTAMP};
    fb.child('meta').child('bug-report').push(report);
  });
  $('#send_feedback_btn').click(function() {
    var summary_val = $('#feedback_summary_field').val().trim();
    var type_val = $('#feedback_type').val();
    if (summary_val == '') {
      // validation crap
    }
    var report = {summary:summary_val, timestamp:Firebase.ServerValue.TIMESTAMP};
    fb.child('meta').child('feedback').child(type_val).push(report);
  });

})
