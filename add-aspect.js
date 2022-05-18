
async function processAddAspect(name, invokes) {
    /*
    Add a temp aspect to the actor via the token. Experiment to see if we can set a `temp` flag to true first
    */    
    let aspects = actor.data.data.situational_aspects ? duplicate(actor.data.data.situational_aspects) : {}
    let newAspect = {
        'name': name,    
        'free_invokes': invokes,         
    }    
    aspects[newAspect.name] = newAspect;   

    await token.actor.update({
        'data.situational_aspects': aspects
    }, {noHook:true, render:false})

}
const html = `<div style='margin-bottom:10px'>
				<label>Aspect Name:</label>
                <input type="text" id="new-aspect-name"/>    
              </div>
              <div style='margin-bottom:10px'>
				<label>Invokes:</label>
                <input type="text" id="new-aspect-invokes"/>    
              </div>           			
`

new Dialog({
    'content':html,
    'buttons': {
        'ok':{
            'label':"Add",
            'callback':function(){
                const name = document.querySelector('#new-aspect-name').value;
                const invokes = document.querySelector('#new-aspect-invokes').value;
                processAddAspect(name, invokes);
            }
        },
        'cancel':{
            'label':'Cancel',
            'callback':function(){

            }
        }
    }
}).render(true);

