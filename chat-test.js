
function getSettingString(token) {
    return JSON.stringify({
        'token': token.data._id
    })
}
function renderTargets(targets) {
    let targetList = '<ul>';
    for (let t of targets) {
        console.log(t);
        targetList += `<li>${t.actor.data.name} <button style="width:auto;display:inline-block" data-settings='${getSettingString(t)}'>Roll Defence</button></li>`
    }
    targetList += '</ul>';
    return targetList;
}

ChatMessage.create({
    content: "Targeting" + renderTargets(game.user.targets)
  });

