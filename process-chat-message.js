function run() {
    if (game.settings.settings.has('process-defence')) {
        ui.notifications.error("This has already been enabled");
        return;
    }

    ui.notifications.notify("Process Defence Script started");
    game.settings.settings.set('process-defence', true);

    Hooks.on('renderChatMessage', function(message, html, data){
        // find all buttons, add event listener
        html.find('button').click(function(e){
           
            let settings = JSON.parse(e.target.dataset.settings);
            console.log(settings);
            let token =  canvas.scene.tokens.find( t => t.data._id == settings.token);
            console.log(token);
            new Dialog({
                'title':'Roll Defend action',
                'content':`<h1>Roll Defend Action</h1>`,
                'buttons':{
                    'roll': {
                        'label':'Roll',
                        'callback':function(){

                        }
                    },                    
                    'cancel': {
                        'label':'Cancel',
                        'callback': function(){

                        }                   

                    }
                }
                
            }).render(true);
            
        })
    });
}
run();