Battleship
todo:
  [ ] Clicking
    [ ] figure out which board we're guessing from
    [ ] ensure guessing is what we're trying to do
    [ ] special case: clicking on already clicked tiles
    [ ] not clicking your own board
  [ ] Game over
  [ ] Player Made Boards
  [x] fix board collision
  [/] hiding the other player's board
  [ ] taking turns
  [x] when boat is sunk, show that
      [x] determine when boat is sunken
  [ ] display boat sinking
  [ ] game rooms
  [ ] flagging



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


