function getActor() {

    let actorD = canvas?.tokens?.controlled[0]?.actor || game.user.character || token.actor;
    return actorD;
}

const COMBAT_SKILLS = ['Fight', 'Technique', 'Tactics', 'Parry', 'Dodge', 'Mettle'];

function getSkills(actor, filter) {
    let filtered = [];

    for (const [skillName, value] of Object.entries(actor.data.data.skills)) {

        if (!filter || filter == "*") {
            filtered.push(value);
        } else if (filter == 'combat' && (COMBAT_SKILLS.includes(skillName) || skillName.startsWith('[Combat]'))) {
            filtered.push(value);
        } else if (filter == 'non-combat' &&
            !COMBAT_SKILLS.includes(skillName) &&
            !skillName.startsWith('[Combat]') &&
            !skillName.startsWith('[Background]') &&
            !skillName.startsWith('[Domain]')){
            filtered.push(value);
        } else if (filter == 'background' && skillName.startsWith('[Background]')) {
            filtered.push(value);
        } else if (filter=="domain" && skillName.startsWith('[Domain]')) {
            filtered.push(value);
        }

    }
    // sort by name
    filtered.sort((a, b) => {
        if (a.name > b.name) {
            return 1;
        } else if (b.name > a.name) {
            return -1;
        } else {
            return 0;
        }
    });

    return filtered;

}

function run() {
    let actor = getActor();
    let nonCombatSkills = getSkills(actor, 'non-combat');
    let backgroundSkills = getSkills(actor, 'domain');
    

    async function roll(actionType){
        let background = document.querySelector('#select-background-skill').value;
        let skill = document.querySelector("#select-skill").value;
        let backgroundSkillInfo = actor.data.data.skills[background];
        let skillInfo = actor.data.data.skills[skill];
        let rank = backgroundSkillInfo.rank + skillInfo.rank
        let modifier = parseInt(document.querySelector("#modifier").value);
        if (!modifier) {
            modifier = 0;
        }
        
        let r = new Roll(`4dF+${rank}+${modifier}`)
        let roll = await r.roll();
        roll.dice[0].options.sfx = { id: "fate4df", result: roll.result };
        let msg = ChatMessage.getSpeaker(actor)
        msg.alias = actor.name;

        let actionFullName = null;
        switch (actionType) {
            case 'attack': 
                actionFullName = 'Attack'
                break;
            case 'defend':
                actionFullName = 'Defend';
                break;
            case 'create_an_advantage':
                actionFullName = 'Create an Advantage';
                break;
            case 'overcome':
                actionFullName = 'Overcome'
                break;
        }

        let extraFlavor = `Attempts to ${actionFullName} with <span style="font-weight:bold">${backgroundSkillInfo.name.replace('[Background]','')}</span> (rank: ${backgroundSkillInfo.rank}) + <span style="font-weight:bold">${skillInfo.name}</span> (rank: ${skillInfo.rank})`
        if (modifier) {
            extraFlavor += " with modifier " + (modifier >=0 ? '+' : '-') + modifier
        }

        await roll.toMessage({
            flavor: `<h1>${actionFullName}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                        ${extraFlavor}
                        <button class="show-action-help" data-action-type="${actionFullName}" style="margin-top:10px; margin-bottom:10px">Help</button>                      
                        `,
            speaker: msg
        }, {
            create: true
        });
    }

    new Dialog({
        'content': `<h1>Make a Magic Roll</h1>
            <button style="margin-top:10px; margin-bottom:25px" id="show-magic-help">Show Help for Magic</button>
            <div style="display:flex; flex-direction: column">         
                <div style="flex:1; display:flex; align-items:center; margin-bottom:10px">
                    <label style="flex:1">Domain Skill:</label>
                    <select style="flex:3" id="select-background-skill">
                        ${backgroundSkills.map(s => `<option value="${s.name}">${s.name.replace('[Domain]', '')} (rank: ${s.rank})</option>`)}
                    </select>
                </div>
                <div style="flex:1; display:flex; align-items:center; margin-bottom:10px">
                    <label style="flex:1">Skill:</label>
                    <select style="flex:3" id="select-skill">
                        ${nonCombatSkills.map(s => `<option value="${s.name}">${s.name} (rank: ${s.rank})</option>`)}
                    </select>
               </div>                           
               <div style="flex:1; display:flex; align-items:center; margin-bottom:10px">
                    <label style="flex:1">Modifier:</label>
                    <input type="number" style="flex:3" id="modifier" value="0" />                      
                </div>                   
            </div>`,
        'render':function(html){
            html.find('#show-magic-help').click(function(){
                game.journal.getName("Magic").sheet.render(true)
            })
        },
        'buttons': {
            'overcome': {
                'label': 'Overcome',
                'callback': function () {
                    roll("overcome")
                }
            },
            'create_an_advantage': {
                'label': 'Create an Advantage',
                'callback': function () {
                    roll("create_an_advantage")
                }
            },
            'attack': {
                'label': 'Attack',
                'callback': function () {
                    roll("attack")
                }
            },
            'defend': {
                'label': 'Defend',
                'callback': function () {
                    roll("defend")
                }
            },
            'cancel': {
                'label': 'Cancel',
                'callback': function () {

                }
            }
        }
    }, {
        'width': 600
    }).render(true)

}
run();