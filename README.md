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
    [x] alerting sunken ship option
    [x] put on interwebs
