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
    const COMBAT_SKILLS = ['Fight', 'Technique', 'Tactics', 'Parry', 'Dodge', 'Mettle'];

    if (game.settings.settings.has('process-defence')) {
        ui.notifications.error("This has already been enabled");
        return;
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

    function getCombatItems(actor, type) {
        // look for extras with the `weapon: ` in permissions
        let items = duplicate(actor.data.items);
        console.log(type);
        let processedItems = items
            .filter(i => {
                let permissions = removeTags(i.data.permissions);
                return permissions && permissions.toLowerCase().startsWith(type)
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

    function renderArmorSelect(actor) {

        let armor = getCombatItems(actor, 'armor');
        let output = '<select id="selected-armor">';
        for (let a of armor) {
            output += `<option data-armor-properties='${JSON.stringify(a)}' value="${a.id}">${a.name} (armor: ${a.armor})</option>`
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

    function getSkillByName(actor, name) {
        let skillInfo = actor.data.data.skills[name];
        return skillInfo;
    }

    function getSelectedSkill() {
        let selectedSkill = document.querySelector('.combat-skill:checked').value;
        if (selectedSkill == 'others') {
            selectedSkill = document.querySelector('#non-combat-skill').value
        }
        return selectedSkill;
    }

    function getSelectedArmor() {
        let armorSelect = document.querySelector('#selected-armor');
        let selectedArmor = armorSelect.options[armorSelect.selectedIndex];
        if (selectedArmor) {
            let properties = JSON.parse(selectedArmor.dataset.armorProperties);
            return properties;
        } else {
            return {
                'name': 'No armor',
                'armor': 0  // no armor
            }
        }


    }

    ui.notifications.notify("Process Defence Script started");
    game.settings.settings.set('process-defence', true);

    Hooks.on('renderChatMessage', function (message, html, data) {
        // find all buttons, add event listener
        html.find('button').click(function (e) {

            let settings = JSON.parse(e.target.dataset.settings);
            console.log(settings);
            let token = canvas.scene.tokens.find(t => t.data._id == settings.token);
            console.log(token);

            new Dialog({
                'title': 'Roll Defend action',
                'content': `<div style='display:flex;'>
                <div style='flex:1'>
                    <h3>Select Combat Skill</h3>
                    ${renderCombatSkillSelect(token.actor)}
                </div>
                <div style='flex:1'>
                    <h3>Armour Listing</h3>
                    ${renderArmorSelect(token.actor)}
                    <h3>Modifiers</h3>
                    <div>
                        <label>Defend Modifier</label>
                        <input type="number" name="defend-modifier" style="width:auto" value="0" id="defend-modifier"/>
                    </div>
                    <div>
                        <label>Armor Modifier</label>
                        <input type="number" name="armor-modifier" style="width:auto" value="0" id="armor-modifier"/>
                    </div>
                </div>
            </div>`,
                'render': function (html) {


                    html.find('.dialog-button.roll').prop('disabled', true)


                    html.find('.combat-skill').change(function (e) {
                        if (this.value == 'others') {
                            html.find('#non-combat-skill').prop('disabled', false)
                        } else if (this.value) {
                            html.find('#non-combat-skill').prop('disabled', true)
                        }
                        html.find('.dialog-button.roll').prop('disabled', false)
                    })

                },
                'buttons': {
                    'roll': {
                        'label': 'Roll',
                        'callback': async function () {
                            let selectedSkill = getSelectedSkill();
                            let skillInfo = getSkillByName(token.actor, selectedSkill);
                            let selectedArmor = getSelectedArmor();

                            let defendModifier = parseInt(document.querySelector('#defend-modifier').value);
                            let armorModifier = parseInt(document.querySelector("#armor-modifier").value);

                            if (!defendModifier) {
                                defendModifier = 0;
                            }

                            if (!armorModifier) {
                                armorModifier = 0;
                            }


                            // Do the defend roll
                            let r = new Roll(`4dF+${skillInfo.rank + defendModifier}`)
                            let roll = await r.roll();
                            roll.dice[0].options.sfx = { id: "fate4df", result: roll.result };
                            let msg = ChatMessage.getSpeaker(token.actor)
                            msg.alias = token.actor.name;

                            //  calculate shifts, damage, etc
                            let shifts = settings.total - roll.total;
                            let protection = parseInt(selectedArmor.armor);
                            let damage = shifts - defendModifier > 0 ? shifts + parseInt(settings.selectedWeapon.weapon) : 0;
                            let minDamage = 1 + parseInt(settings.selectedWeapon.weapon);
                            let totalDamage = Math.max(damage - protection - armorModifier, 0);
                            let extraFlavor = null;
                            if (settings.isAttack) {
                                extraFlavor = `<div>
                                <p>${skillInfo.name} (rank: ${skillInfo.rank}  ${defendModifier != 0 ? `+ ${defendModifier}` : ''}) vs.${settings.total}</p>                            
                                ${(() => {
                                            if (shifts > 0) {
                                                return "<h2>FAILURE!</h2>";
                                            } else if (shifts == 0) {
                                                return "<h2>NEAR MISS!</h2>"
                                            } else {
                                                return "<h2>SUCCESS!</h2>"
                                            }
                                        })()}
                                <ul>
                                    <li>Shifts from Attacker: ${shifts}</li>
                                    <li>Weapon Damage: ${settings.selectedWeapon.weapon}</li>
                                    ${shifts > 0 ?
                                            `<li>Raw Damage: ${shifts} + ${settings.selectedWeapon.weapon} = ${shifts + settings.selectedWeapon.weapon}</li>` :
                                            `<li>Raw Damage: 0 (miss!)</li>`
                                        }                                
                                    
                                    <li>Armor: ${protection} ${armorModifier ? ` +  ${armorModifier} = ${protection + armorModifier}` : ''}</li>                           
                                    <li>Best Min Damage: ${Math.max(minDamage - protection - armorModifier, 0)}</li>
                                    <li>Total Damage: ${Math.max(totalDamage, 0)}</li>
                                </ul>
                                </div>`;
                            } else {
                                extraFlavor = `<div>
                                 <p>${skillInfo.name} (rank: ${skillInfo.rank}  ${defendModifier != 0 ? `+ ${defendModifier}` : ''}) vs.${settings.total}</p>
                                 ${(() => {
                                    if (shifts > 0) {
                                        return "<h2>FAILURE!</h2>";
                                    } else if (shifts == 0) {
                                        return "<h2>NEAR MISS!</h2>"
                                    } else {
                                        return "<h2>SUCCESS!</h2>"
                                    }
                                })()}
                            <ul>
                                <li>Shifts from Attacker: ${shifts}</li>
                            </ul>
                                 </div>`;                       
                            }

                            let chatData = await roll.toMessage({

                                flavor: `<h1>Defend</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                                            ${extraFlavor}
                                            `,
                                speaker: msg
                            }, {
                                create: true
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
            }).render(true);

        })
    });
}
run();