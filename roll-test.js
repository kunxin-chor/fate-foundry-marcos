let theActor = actor || canvas.tokens.controlled[0].actor || game.user.character;
let targets = game.user.targets;
async function roll() {
	let r = new Roll(`4dF`)
    let name = 'Test';
	let roll = await r.roll();
	roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};
	let msg = ChatMessage.getSpeaker(theActor)
    msg.alias = actor.name;
    roll.toMessage({
           flavor: `<h1>${name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                    Unmarked boxes: <br>`,
           speaker: msg
    });
}
roll();