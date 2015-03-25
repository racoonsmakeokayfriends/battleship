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
  var $MD_WAITING = $('#md-waiting');
  var $ACCEPT_INVITE_BTN = $('#accept_invite_btn');
  var $REJECT_INVITE_BTN = $('#reject_invite_btn');
  var $CANCEL_INVITE_BTN = $('#cancel_invite_btn')
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
  var $MSG_OPPONENT_CANCELLED = $('#msg-opponent-cancelled');
  // Some globals for this user
  var my_name = 'noone';
  var my_data = {id:'',name:'',status:''};
  var battleship_controller;
  var DEAD_GAMEROOM_AGE = 600000/100;
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
      if (snapshot.val().gameroom_key){create_invitation(snapshot);}
    }
  });

  function set_gameplay_options(gameroom_ref) {
    var bs_op = new Battleship_Options();
    if ($GAME_OPT_SINK_ALERT.hasClass('on')) {
      bs_op.set_ship_sink_alert(true);
    }
    else {
      bs_op.set_ship_sink_alert(false);
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

    gameroom_ref.child('options').set(bs_op.to_obj());
    return gameroom_ref
  }

  function continue_inviting(user_list) {    
    // initialize the gameroom
    var gameroom_ref = game_rooms_ref.push({'timestamp':Firebase.ServerValue.TIMESTAMP});
    var gameroom_key = gameroom_ref.key();
    gameroom_ref.child('user_list').child(PLACEHOLDER_FLAG).set('');
    gameroom_ref.child('chatlog').set('');
    gameroom_ref.child('gameover').set(false);
    gameroom_ref.child('creator').set(my_data.id);

    gameroom_ref = set_gameplay_options(gameroom_ref);

    // invite the users
    for (var i = 0; i < user_list.length; i++) {
      all_users_ref.child(user_list[i].id).child('status').set('invited');
      all_users_ref.child(user_list[i].id).child('gameroom_key').set(gameroom_key);
    };
  }
  function invite_users(user_list) {
    // this deletes any empty gamerooms
    game_rooms_ref.once('value',function (gameroom_list_snap) {
      gameroom_list_snap.forEach(function (gameroom_snap) {
        var data = gameroom_snap.val();
        if (!data.user_list) {
          gameroom_snap.ref().remove();
        }
        else if (gameroom_snap.child('user_list').numChildren() == 1 && (new Date()-data.timestamp) > DEAD_GAMEROOM_AGE) {
          gameroom_snap.ref().remove();
        }
        else {            
        }        
      });
      continue_inviting(user_list);
    })
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
    open_page($PAGE_GAMEROOM);
    $MD_WAITING.addClass('hidden');
    var battleship_ref = get_my_gameroom_ref();
    battleship_controller = new Battleship.Controller(battleship_ref,my_data.id);
    // battleship_ref.child('options').once('value',function(options_snap) {
    //   console.log('==== start: options ====')
    //   var options_obj = options_snap.val();
    //   console.log(options_obj.ship_sink_alert_on)
    //   console.log(options_obj.ship_sink_alert_on)
    //   if (!options_obj.ship_sink_alert_on){
    //     battleship_controller.set_ship_sink_alert(false);
    //   }
    //   if (options_obj.num_shots_type){
    //     battleship_controller.set_num_shots(options_obj.num_shots_type);
    //   }
    //   console.log('====  end : options ====')
    // })
  }

  function join_game() {
    var my_gr = get_my_gameroom_ref();

    my_gr.child('player_left').set(false);

    all_users_ref.child(my_data.id).child('status').set('gameroom');
    var onlycallonce_hack = true;

    // add me to the gameroom
    my_gr.child('user_list').child(my_data.id).set({'timestamp':Firebase.ServerValue.TIMESTAMP});

    // === PLAYER ENTERED ===
    my_gr.child('user_list').on('child_added', function (user_snap) {
      if (get_user_id(user_snap) == PLACEHOLDER_FLAG) return;
      // add_user_to_user_list(user_snap); // we're not showing the userlist for battleship
      // todo: check if the right number of players are here
      my_gr.child('user_list').once('value',function(s) {
        // NOTE: edit this to reflect when we're ready to play
        // NOTE: the -1 is for that stupid placeholder
        if (s.numChildren()-1 == NUM_USERS&&onlycallonce_hack) {
          start_game();
          onlycallonce_hack = false;
        }
        else if (s.numChildren()-1 < NUM_USERS) {
          $MD_WAITING.removeClass('hidden');
        }        
      });
    }); 

    // === MESSAGE ADDED ===
    my_gr.child('chatlog').on('child_added', function (snapshot) {
      add_msg_to_chatlog(snapshot);
    });
    // === GAME OVER ===
    my_gr.child('gameover').on('value',function (snapshot) {
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

  function send_back_to_lobby(my_gr) {
    my_gr.child('player_left').set(true);
    my_gr.child('user_list').child(my_data.id).remove();
    all_users_ref.child(my_data.id).child('status').set('lobby');
    all_users_ref.child(my_data.id).child('gameroom_key').set(null);
  }

  $ACCEPT_INVITE_BTN.click(function () {
    join_game();
  });

  $REJECT_INVITE_BTN.click(function () {
    var my_gr = get_my_gameroom_ref();
    //alert_invite_rejection(my_gr); will need for >2 player games (i think)
    send_back_to_lobby(my_gr);
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

  $CANCEL_INVITE_BTN.click(function () {
    leave_game_room();
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
    $(this).closest('.message').removeClass('hidden');
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
    my_user_ref.once('value',function(snapshot) { 
      gameroom_key = snapshot.val()['gameroom_key']; 
    });
    return game_rooms_ref.child(gameroom_key);
  }

  function leave_game_room() {
    var my_gameroom_ref = get_my_gameroom_ref();
    my_gameroom_ref.child('player_left').set(true);
    my_gameroom_ref.child('user_list').child(my_data.id).remove();
    // my_gameroom_ref.child('player_left').set(true);
    all_users_ref.child(my_data.id).child('status').set('lobby');
    all_users_ref.child(my_data.id).child('gameroom_key').set(null);
    open_page($PAGE_LOBBY);    
  }

  function create_invitation() {
    // put all the nessecary game info into the invitation
    var txt = 'A Classic Game';
    var my_gr = get_my_gameroom_ref();
    // get the creator's id 
    my_gr.child('creator').once('value',function(host_snap) {
      $LOBBY_MD_INVITATION.find('#game-creator').html(host_snap.val());
    });
    // get the options the creator choose  
    my_gr.child('options').once('value',function (options_snap) {
      var options = options_snap.val();
      txt += '<br/>Num Shots Type: ' + options.num_shots_type;
      txt += '<br/>Ship Sink Alert: ';
      txt += options.ship_sink_alert_on ? 'on' : 'off';        
      $LOBBY_MD_INVITATION.find('.md-txt').html(txt);
    });

    $LOBBY_MD_INVITATION.removeClass('hidden');


    // see if this has been removed (by other player rejecting to replay)
    // === PLAYER LEFT/REJECTED GAME ===
    my_gr.child('player_left').on('value',function (snap) {
      if (snap.val() == true) {
        open_page($PAGE_LOBBY);
        $MSG_OPPONENT_CANCELLED.fadeIn();
        send_back_to_lobby(my_gr);
      }
    });
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
