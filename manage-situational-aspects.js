const renderAspects = (aspects) => {
    let rows = "";
    let index =0;
    for (let aspectName in aspects) {
        let a = aspects[aspectName];
        rows += `<tr>
            <td>${a.name}</td>
            <td style='text-align:center'  id='col_${index}'>${a.free_invokes}</td>
            <td style='text-align:center'>
                <button id='inc_${index}' data-name='${aspectName}' style="width:auto" class="increment_btn" >+</button>
                <button id='dec_${index}' data-name='${aspectName}' style="width:auto" class="decrement_btn">-</button>
                <button id='del_${index}' data-name='${aspectName}' style="width:auto" class="delete_btn"><i class="fa fa-trash" aria-hidden="true"></i></button>
            </td>
        </tr>
        `;
        index++;
    }
    return rows;
}


// display all situational aspects 
if (token && token.actor.data.data.situational_aspects) {
    let actor = token.actor;
    let aspects = duplicate(actor.data.data.situational_aspects);
    let content = "<h1>Situation Aspects</h1>"


    content += `
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Free Invokes</th>
                <th>&nbsp;</th>
            </tr>            
        </thead>
        <tbody>     
        ${renderAspects(aspects)}
        </tbody>
    </table>`

    new Dialog({
        'content': content,
        'title': 'Situation Aspects Manager',
        'render':function(){
            let allIncButtons = document.querySelectorAll('.increment_btn');
            for (let b of allIncButtons) {
                b.addEventListener('click', function(e) {
                    let id = e.target.id;
                    let index = id.split('_')[1];
                    let aspectName = e.target.dataset.name;
                    aspects[aspectName].free_invokes++;
                    document.querySelector("#col_"+index).innerHTML = aspects[aspectName].free_invokes
                })
            }

            let allDecButtons = document.querySelectorAll('.decrement_btn');
            for (let b of allDecButtons) {
                b.addEventListener('click', function(e) {
                    let id = e.target.id;
                    let index = id.split('_')[1];
                    let aspectName = e.target.dataset.name;
                    aspects[aspectName].free_invokes--;
                    document.querySelector("#col_"+index).innerHTML = aspects[aspectName].free_invokes
                })
            }

            let allDeleteButtons = document.querySelectorAll('.delete_btn');
            for (let b of allDeleteButtons) {    

                b.addEventListener('click', function(e) {
                    let btn = null;                
                    if (e.target.className=='fa fa-trash') {
                        btn = e.target.parentElement;
                    } else {
                        btn = e.target;
                    }
                    let id = btn.id;
                    let index = id.split('_')[1];        
                    let aspectName = btn.dataset.name;         
                    aspects['-='+aspectName] = {};
                    document.querySelector("#col_"+index).parentElement.remove();
                })
                
            }

        },
        'buttons': {          
            'ok': {
                'label': 'Save',
                'callback': async function () {                
                    await token.actor.update({
                        'data.situational_aspects': aspects
                    }, {noHook:true, render:false})
                }
            },
            'cancel': {
                'label': 'Cancel',
                'callback': function(){

                }
            }

        }

    }).render(true);
} else {
    ui.notifications.info("No token or token has no situational aspects");
}

