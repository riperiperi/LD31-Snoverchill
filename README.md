# Snoverchill
![image](readmeimg/lead.gif)
Snowman's Land: Snoverchill is a multiplayer battle game written in Javascript. The goal is to perform as many flips as possible, while shooting other players with snowballs to stop them from landing theirs. The score you get from each trick scales exponentially with the number of full revolutions you can get in before landing the trick. 

The game is programmed in Javascript with few libraries, just glMatrix for math, 2D Canvas and Web Audio for game output. The collision system is entirely custom - collidable geometry is stored as lines, and continuous collision detection is supported for both rays and swept spheres - both of which check for collision against these lines.

The server is written in node.js and requires the ws module. This is quite an old module, and I'm not sure if the server will work in a modern version of node.js. In future I might preserve the server for this and Ani-Melee as a C# implementation runnable via mono, since the current node implementation has a shockingly high cpu usage even when idle, despite simply mirroring messages sent from connected clients.

The most interesting tech in the game is the ability to continue a trick by holding jump when hitting the corner of a platform, something I call a "lip trick". In the current map, it is possible to get two of these lip trick bounces in the center of the map to get an 8x flip, though it is very hard to achieve. This was not intentional, but would be something to consider making official for a sequel or full game.

Snoverchill went down pretty well in LD31, ranking 1st in the Fun category. If you can get a few friends together, it's fun to try out for about half an hour, even with a single stage.

Ludum Dare page:
http://ludumdare.com/compo/ludum-dare-31/?action=preview&uid=7339

Playable version (most of the time, when server is up):
http://freeso.org/ld31/

![image](readmeimg/liptrick.gif)

## License
Snoverchill is currently unlicensed. While the source is available for those interested, this is the only LD project I'm reserving all rights to. If you're interested in the svg collision system, another version is licensed under MPL 2.0 in my LD32 game, Ani-melee, which should contain some additional optimisations & functionality as well (quadTree.js for faster collision checking).