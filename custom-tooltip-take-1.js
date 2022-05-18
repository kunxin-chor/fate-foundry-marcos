let output = "";
for (let aspectName in data.aspects) {
	let aspect = data.aspects[aspectName];
	output += aspectName + ": " + aspect.value + "|"
}
tooltip.renderingFinished.then(($html) => {
	let oldHtml = $html.html();
	let newHtml = oldHtml.replaceAll('|','<br>');
	$html.html(newHtml);
	let $allChild = $html.find('div');
    for (let $c of $allChild) {
	   $c.className = "";	
	   $c.style.color = 'black';
	}
	console.log($html.html())
	
});
return output

