# Notes
Get the current player's actor (if the current user is not a GM)
```
let actorD = actor || canvas.tokens.controlled[0].actor || game.user.character;
```