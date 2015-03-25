http://racoonsmakeokayfriends.github.io/battleship/battleship.html

Battleship


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
              creator   -> id of player who created it
              gameover  -> bool of whether or not the game is over
              player_left -> flag whether a player has gone
              options
                  + $'option-name'$: state
              chatlog
                  + $message_key$
                      timestamp -> time sent
                      message -> the message sent
                      author -> who sent the message
              user_list
                  + $username$
              game
                  player_turn
                      num -> the num of the player whose turn it is
                      timestamp -> time this turn began
                  player0|player1
                      + $board(row,col)$ -> square state ('water','boat','hit',etc)
                      + $shipname$
                          name       -> name of ship
                          ship_size  -> size of ship
                          sunk       -> true|false
                          col        -> positon
                          row        -> position
                          horizontal -> true|false
                      num_shots -> current number of shots this player can make in 1 turn


========== GOALS+TIMELINES ==========
  3/13/15 goals:
    [x] alerting sunken ship option
    [x] put on interwebs
  3/14/15 goals:
    [ ] contact me
        [ ] bugs
        [ ] suggestions
    [ ] unresponsive players
        [ ] detect they are unresponsive
        [ ] decide what to do when they are

X = some max timeout

=> Invitations
  + user1 enters lobby, sees that user2 is in the lobby
  + user1 selects some gameplay option and invites user2 to the lobby
  + user2 and user1 recieve an invitation with the details of game user1 proposed

  + potential scenarios (creator/invitee roles dont apply):
    - user1 accepts the invitation first, user2 accepts the invitation second
      > user1's invitation will turn into a "waiting" screen
      > when user2 accepts, both players will enter the gameroom and begin the game
    - user1 rejects the invitation before user2 answers
      > user1's invitation will close, and they will return to lobby
      > user2's invitation will close, they will return to lobby, and a message will appear
    - user1 accepts the invitation, then user2 rejects the invitation:
      > user1 will return to the lobby and a message will appear
      > user2's invitation will close, and they will return to lobby
    - user1 accepts the invitation, and user2 does not response for X seconds
      > user1 will return to the lobby, and a message will appear
      > user2's invitation will close, and a message saying they have timed out
    - neither user1 or user2 accept the invitation within X seconds
      > user1 and user2's invitation will close and a message will appear saying they have timed out
    - user1 accepts the invitation, then user1 cancels the invitation
      > user1's invitation will close, and they will return to lobby
      > user2's invitation will close, they will return to lobby, and a message will appear

=> Game Over
  + user1 and user2 have played a game which is now over
  + both users recieve a dialog asking if they'd like to play again
  + this will work out exactly as in Invitations

=> Unresponsive Players (during game)
  + it's user1's turn, which has lasted X seconds without them finishing
    * the goal is to let everyone know this has taken too long and let them figure it out
    > user1 is told to hurry up
    > user2 is told that user1 has taken a long time, and user2 is prompted to leave
  + its user1's turn, which has lasted X^X (some very large number) and both players are still there
    > we kill the game!

=> Player Leaving (mid game)
  + user1 exits the game (in any way), leaving user2 alone in the gameroom
    > user1 returns to the lobby
    > user2 returns to lobby with a message telling them what happened



