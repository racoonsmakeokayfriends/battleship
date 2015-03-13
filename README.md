Battleship
========== TODOS ==========
  ---> features <---
    [x] Clicking
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
    [ ] users+passwords, keeping stats (LOW, kind of unnessecary and tons of work)
        [ ] option to create account (vs. guest)
        [ ] create html form for creating account
        [ ] create html form for logging in
        [ ] saving this user in fb
        [ ] reset passwords?
        [ ] email
        [ ] keeping win record
    [ ] Player Made Boards (LOW)
    [x] flagging (like minesweeper) (HIGH)
        [x] making flags
        [x] unflagging flags
    [ ] keeping score for one gameroom
    [ ] unresponsive players (HIGH)
    [ ] contacting mandy
    [ ] deleting empty chatrooms
    [ ] collecting meta-data
    [ ] security stuff (baby)

  ---> variations <---
      [x] html for choosing these variations
      [ ] don't alert a ship has been sunk
      [ ] different number of 'guesses' per round
          [ ] 1 for remaining ships
          [ ] 1 for the size of the largest remaining ship
      [ ] A slightly different version of the game is played in India. Instead of announcing whether a shot is a hit or miss immediately, the players simply say how many of their opponent's three shots were hits, and if so on what kind of vessel. This allows for more strategy in game play and loosens the game's dependency on luck. A slightly different recording system is used in this variation as there is a new importance on what turn a player hit something on. The ships themselves are also slightly different: the Indian version uses two submarines (two spaces), two destroyers (three spaces), one battleship (five spaces), and one aircraft carrier (five spaces arranged in a 'T')

  ---> polish <---
    [ ] gameover
        [ ] smooth out the kinks
    [ ] instructions
        [ ] shift-click flags
    [ ] playability
        [ ] when player clicks, if say they clicked on a HIT/MISS, dont change the turn
    [ ] alerting
        [ ] when player clicks their own board
        [ ] when a ship has been sunk
    [ ] working out player leaving scenarios
    [ ] work on graphics for board

  ---> prettiness <---
      [ ] signin

========== DATABASE ==========
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


========== GOALS+TIMELINES ==========
  3/13/15 goals:
    [ ] alerting sunken ship option
    [ ] put on interwebs