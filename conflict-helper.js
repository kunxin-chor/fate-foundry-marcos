/*
Marco to resolve rolls in conflicts between two characters

*/

// helper function to remove html tags
function removeTags(str) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();

    // Regular expression to identify HTML tags in 
    // the input string. Replacing the identified 
    // HTML tag with a null string.
    return str.replace(/(<([^>]+)>)/ig, '');
}

function run() {

    // replace the line below with your game's combat skills
    const COMBAT_SKILLS = ['Fight', 'Technique', 'Tactics', 'Parry', 'Dodge', 'Mettle'];

    function getActor() {

        let actorD = canvas?.tokens?.controlled[0]?.actor || game.user.character || token.actor;
        return actorD;
    }

    function getCombatItems(actor, type) {
        // look for extras with the `weapon: ` in permissions
        let items = duplicate(actor.data.items);
        console.log(type);
        let processedItems = items
            .filter(i => {
                return i.data.permissions && removeTags(i.data.permissions).toLowerCase().startsWith(type)
            })
            .map(item => {

                let permission = removeTags(item.data.permissions);
                let rawProperties = permission.split(',');
                let propertyList = rawProperties.map(p => {
                    let chunks = p.split(':').map(s => s.trim());
                    return {
                        'name': chunks[0],
                        'value': chunks[1]
                    }

                })

                let properties = {};
                for (let p of propertyList) {
                    properties[p.name] = p.value;
                }

                properties.name = item.name;
                properties.id = item._id;
                return properties;

            })
        return processedItems;

    }

    function getSkills(actor, filter) {
        let filtered = [];

        for (const [skillName, value] of Object.entries(actor.data.data.skills)) {

            // exclude backgrounds
            if (skillName.startsWith("[Background")) {
                continue;
            }
            if (!filter || filter == "*") {
                filtered.push(value);
            } else if (filter == 'combat' && (COMBAT_SKILLS.includes(skillName) || skillName.startsWith('[Combat]'))) {
                filtered.push(value);
            } else if (filter == 'non-combat' && !COMBAT_SKILLS.includes(skillName) && !skillName.startsWith('[Combat]')) {
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

    function renderCombatSkillSelect(actor) {
        let output = "";
        let index = 0;
        for (let s of getSkills(actor, 'combat')) {
            output += `<div style="margin:10px">
                <input type='radio' id='select-combat-skill-${index}' class="combat-skill" name='combat-skill' value='${s.name}'/>
                <label for='select-combat-skill-${index}'>${s.name.replace('[Combat] ', '')} (Rank: ${s.rank})</label>
            </div>`;
            index++;
        }
        output += `<div style="margin:10px">
            <input type='radio' class="combat-skill" name='combat-skill' id="others" value='others'/>
            <label for="others">Others:${renderNonCombatSkillDropdown(getSkills(actor, 'non-combat'))}</label>
        </div>`
        return output;
    }

    function renderWeaponSelect(actor) {
        let weapons = getCombatItems(actor, 'weapon');
        let output = '<select id="selected-weapon">';
        for (let w of weapons) {
            output += `<option data-weapon-properties='${JSON.stringify(w)}' value="${w.id}">${w.name} (damage: ${w.weapon})</option>`
        }
        output += "</select>";
        return output;

    }

    function renderNonCombatSkillDropdown(skills) {
        let output = "<select id='non-combat-skill' style='width:auto' disabled>";
        for (let s of skills) {
            output += `<option value='${s.name}'>
               ${s.name} (Rank: ${s.rank})
            </option>`;
        }
        output += `</select>`
        return output;
    }

    function renderTargets(targets, selectedWeapon, total, isAttack=true) {
        function getSettingString(token) {
            return JSON.stringify({
                'token': token.data._id,
                'selectedWeapon': selectedWeapon,
                'total': total,
                'isAttack': isAttack
            })
        }

        let targetList = '<ul>';
        for (let t of targets) {
            targetList += `<li>${t.actor.data.name} <button class="roll-defend" style="width:auto;display:inline-block" data-settings='${getSettingString(t)}'>Roll Defence</button></li>`
        }
        targetList += '</ul>';
        return targetList;
    }

    async function roll(actor, name, rank, extraFlavor = "") {
        let r = new Roll(`4dF+${rank}`)
        let roll = await r.roll();
        roll.dice[0].options.sfx = { id: "fate4df", result: roll.result };
        let msg = ChatMessage.getSpeaker(actor)
        msg.alias = actor.name;
        let chatData = await roll.toMessage({

            flavor: `<h1>${name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                        ${extraFlavor}`,
            speaker: msg
        }, {
            create: true
        });

        return roll;
    }

    function createWeaponString(weaponProperties, extraDamage) {
        return weaponProperties.name + ` (damage: ${weaponProperties.weapon} ${extraDamage ? ` + ${extraDamage}` : ''})`;
    }

    function getSelectedSkill() {
        let selectedSkill = document.querySelector('.combat-skill:checked').value;
        if (selectedSkill == 'others') {
            selectedSkill = document.querySelector('#non-combat-skill').value
        }
        return selectedSkill;
    }

    function getSelectedWeapon() {
        let weaponSelect = document.querySelector('#selected-weapon');
        let selectedWeapon = weaponSelect.options[weaponSelect.selectedIndex];
        if (selectedWeapon) {
            let weaponProperties = JSON.parse(selectedWeapon.dataset.weaponProperties);
            return weaponProperties;
        } else {
            return {
                'name': 'No Weapon',
                'weapon': '0'
            }
        }
    }

    function getSkillByName(name) {
        let skillInfo = actor.data.data.skills[name];
        return skillInfo;
    }

    function renderDialog(actor, targets) {
        new Dialog({
            'title': 'Conflict Helper',
            'content': `<div style='display:flex;'>
                <div style='flex:1'>
                    <h3>Select Combat Skill</h3>
                    ${renderCombatSkillSelect(actor)}
                </div>
                <div style='flex:1'>
                    <h3>Select Weapons</h3>
                    ${renderWeaponSelect(actor)}

                    <h3>Modifiers</h3>
                    <div>
                        <label>Attack Modifier</label>
                        <input type="number" name="attack-modifier" style="width:auto" value="0" id="attack-modifier"/>
                    </div>
                    <div>
                        <label>Damage Modifier</label>
                        <input type="number" name="damage-modifier" style="width:auto" value="0" id="damage-modifier"/>
                    </div>
                </div>
            </div>`,
            'render': function (html) {
                
                // disable all roll buttons
                html.find('.dialog-button.attack').prop('disabled', true);
                html.find('.dialog-button.overcome').prop('disabled', true)
                html.find('.dialog-button.create_an_advantage').prop('disabled', true)

                html.find('.combat-skill').change(function (e) {
                    if (this.value == 'others') {
                        html.find('#non-combat-skill').prop('disabled', false)
                    } else {
                        html.find('#non-combat-skill').prop('disabled', true)
                    }

                    html.find('.dialog-button.attack').prop('disabled', false);
                    html.find('.dialog-button.overcome').prop('disabled', false)
                    html.find('.dialog-button.create_an_advantage').prop('disabled', false)
                })

            },
            'buttons': {
                'attack': {
                    'label': 'Attack',
                    'callback': async function () {
                        let selectedSkill = getSelectedSkill();
                        let weaponProperties = getSelectedWeapon();
                        let skillInfo = getSkillByName(selectedSkill);
                        let attackModifier = parseInt(document.querySelector('#attack-modifier').value);
                        let damageModifier = parseInt(document.querySelector("#damage-modifier").value);

                        if (!attackModifier) {
                            attackModifier = 0;
                        }
                        if (!damageModifier) {
                            damageModifier = 0;
                        }

                        weaponProperties.weapon = parseInt(weaponProperties.weapon) + damageModifier;

                        let flavorString = "Attack with " + skillInfo.name + 
                                ` (${skillInfo.rank}${attackModifier ? ` + ${attackModifier}` : ''}) and ` +
                                 createWeaponString(weaponProperties, damageModifier);
                        if (attackModifier || damageModifier) {
                            flavorString += "<ul>"
                            if (attackModifier) {
                                flavorString += `<li>Roll modifier: ${attackModifier} </li>`
                            }
                            if (damageModifier) {
                                flavorString += `<li>Damage modifier: ${damageModifier}</li>`;
                            }
                            flavorString += "</ul>"
                        }


                        let rollData = await roll(actor, "Attack", skillInfo.rank + attackModifier, flavorString);
                        let total = rollData.total;
                        let journal = '<div style="font-size:1em">'+ game.journal.getName("Combat: Attack").data.content + "</div>";
                        ChatMessage.create({
                            content: journal + "<div>Targeting" + renderTargets(game.user.targets, weaponProperties, total)+"</div>"
                        });
                    }
                },
                'overcome': {
                    'label': 'Overcome',
                    'callback': async function () {
                        let selectedSkill = getSelectedSkill();
                        let skillInfo = getSkillByName(selectedSkill);
                        let attackModifier = parseInt(document.querySelector('#attack-modifier').value);
                        let damageModifier = parseInt(document.querySelector("#damage-modifier").value);

                        if (!attackModifier) {
                            attackModifier = 0;
                        }
                        if (!damageModifier) {
                            damageModifier = 0;
                        }                     

                        let flavorString = "Overcome with " + skillInfo.name + 
                                ` (${skillInfo.rank}${attackModifier ? ` + ${attackModifier}` : ''})`;
                        if (attackModifier || damageModifier) {
                            flavorString += "<ul>"
                            if (attackModifier) {
                                flavorString += `<li>Roll modifier: ${attackModifier} </li>`
                            }
                            if (damageModifier) {
                                flavorString += `<li>Shift modifier: ${damageModifier}</li>`;
                            }
                            flavorString += "</ul>"
                        }

                        let rollData = await roll(actor, "Overcome", skillInfo.rank + attackModifier, flavorString);
                        let total = rollData.total;
                        let journal = '<div style="font-size:1em">'+ game.journal.getName("Combat: Overcome").data.content + "</div>";
                        ChatMessage.create({
                            content: journal + "Targeting" + renderTargets(game.user.targets, {
                                'name':'No weapon',
                                'weapon':0
                            }, total, false)
                        });
                    }
                },
                'create_an_advantage': {
                    'label': 'Create an Advantage',
                    'callback': async function () {
                        let selectedSkill = getSelectedSkill();
                        let skillInfo = getSkillByName(selectedSkill);
                        let attackModifier = parseInt(document.querySelector('#attack-modifier').value);
                        let damageModifier = parseInt(document.querySelector("#damage-modifier").value);

                        if (!attackModifier) {
                            attackModifier = 0;
                        }
                        if (!damageModifier) {
                            damageModifier = 0;
                        }                     

                        let flavorString = "Overcome with " + skillInfo.name + 
                                ` (${skillInfo.rank}${attackModifier ? ` + ${attackModifier}` : ''})`;
                        if (attackModifier || damageModifier) {
                            flavorString += "<ul>"
                            if (attackModifier) {
                                flavorString += `<li>Roll modifier: ${attackModifier} </li>`
                            }
                            if (damageModifier) {
                                flavorString += `<li>Shift modifier: ${damageModifier}</li>`;
                            }
                            flavorString += "</ul>"
                        }

                        let rollData = await roll(actor, "Overcome", skillInfo.rank + attackModifier, flavorString);
                        let total = rollData.total;
                        let journal = '<div style="font-size:1em">'+ game.journal.getName("Combat: Create an Advantage").data.content + "</div>";
                        ChatMessage.create({
                            content: journal + "Targeting" + renderTargets(game.user.targets, {
                                'name':'No weapon',
                                'weapon':0
                            }, total, false)
                        });
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
        }).render(true,);
    }

    let actor = getActor();
    let targets = game.targets;
    renderDialog(actor, targets);

}
run();