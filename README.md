Battleship
features:
  [x] Clicking
    [ ] figure out which board we're guessing from
    [ ] ensure guessing is what we're trying to do
    [ ] special case: clicking on already clicked tiles
    [ ] not clicking your own board
  [x] Game over
    [x] check when it happens
    [x] alert both players when it happens
    [x] ask players if theyd like to play again
    [x] if not, take back to lobby
    [x] if not, alert the other player
    [x] if so, restart the game (only if both players agree)
  [x] fix board collision
  [x] hiding the other player's board
  [x] taking turns
  [x] BUG: when making guess, it seems to believe the boards switched
  [x] when boat is sunk, show that
      [x] determine when boat is sunken
  [x] display boat sinking
  [x] game rooms
  [x] BUG: figure out why printboard != board displayed
  [ ] auto-match (in gameroom) (MED)
      [ ] create html element
      [ ] set up auto-matching process
  [ ] users+passwords, keeping stats (LOW)
      [ ] option to create account (vs. guest)
      [ ] create html form for creating account
      [ ] create html form for logging in
      [ ] saving this user in fb
      [ ] reset passwords?
      [ ] email
      [ ] keeping win record
  [ ] Player Made Boards (LOW)
  [ ] flagging (like minesweeper) (HIGH)
      [ ] making flags
      [ ] unflagging flags

Polish:
  [ ] gameover
    [ ] smooth out the kinks



the firebase database scheme looks like this:
(I dont know any markup/down/sideways or any proper db scheme writing so here's my made-up system:
  > a main branch of the application
  + this a list of many

  $example$
    this is a key

  example -> example description
      this is a leaf

)
battlesomeships
    > all_users
        + $username$
            name -> their username
            status -> 'lobby'|'invited'|'gameroom'
            gameroom_key -> the key to the gameroom they are playing/invited to, null if in lobby
    > game_room_list
        + $gameroom_key$
            timestamp -> when it was created
            chatlog
                + $message_key$
                    timestamp -> time sent
                    message -> the message sent
                    author -> who sent the message
            user_list
                + $username$
            battleship


