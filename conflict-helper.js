/*
Marco to resolve rolls in conflicts between two characters

*/

function run() {

    // replace the line below with your game's combat skills
     const COMBAT_SKILLS = ['Fight', 'Technique', 'Tactics', 'Parry', 'Dodge', 'Canny' ];

    function getSkills(actor, filter) {
        if (!filter || filter == '*') {
            return Object.entries(duplicate(actor.data.data.skills));
        } else if (filter=='combat') {
           let filtered = [];
           for(let skillName in actor.data.data.skills) {
                if (COMBAT_SKILLS.includes(skillName)) {
                    filtered.push(duplicate(actor.data.data.skills[skillName]))
                }
           }
           return filtered;
        }
        return [];
    }
    
    function renderDialog(actor, targets) {
    
    }
  
}
run();