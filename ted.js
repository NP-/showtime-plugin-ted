/**
 * TED Talks plugin for showtime version 0.13  by NP
 *
 *  Copyright (C) 2011 NP
 * 
 *  ChangeLog:
 *  0.13
 *  Added support for youtube (requires youtube plugin)
 *  0.12
 *  Minor fix
 *  0.11
 *  Code clean up
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

//TODO : Clean up, add youtube sources

(function(plugin) {

var PREFIX = 'ted:';
var TED = 'http://www.ted.com';

//settings 

  var service =
    plugin.createService("TED Talks", PREFIX + "start", "tv", true,
			   plugin.path + "ted.jpg");
  
  var settings = plugin.createSettings("TED Talks",
					  plugin.path + "ted.jpg",
					 "Here you will find the best talks and performances from TED conferences");

  settings.createInfo("info",
			     plugin.path + "ted.jpg",
			     "\n"+ 
			     "TED  Talks  began as a simple  attempt to share what \n"+ 
			     "happens  at  TED  with the world.  Under the moniker \n"+
			     '"ideas worth spreading," talks were released online. \n'+
			     "They rapidly  attracted  a  global  audience  in the \n"+
			     "millions.  Indeed, the  reaction was so enthusiastic \n"+
			     "that the entire  TED  website has been  reengineered \n"+
			     "around  TED Talks, with the  goal of giving everyone \n"+
			     "on-demand access to the world's most inspiring voices. \n"+
				 "\n    Plugin developed by NP \n");

	settings.createBool("hd", "HD", false, function(v) {
				service.hd = v;
				});
	
	settings.createBool("youtube", "Support Youtube links (requires youtube plugin)", false, function(v) {
	    service.youtube = v;
	  });


function startPage(page) {      	

   page.type = "directory";
   page.metadata.logo = plugin.path + "ted.jpg";
   page.metadata.title = "TED Talks: " + "Order By";
   
   var list = { indice: [ 
		{name: "Newest releases" , 			link: "?"},
		{name: "Date filmed" , 				link: "?orderedby=FILMED"},
		{name: "Most viewed" , 				link: "?orderedby=MOSTVIEWED"},
		{name: "Most emailed this week" , 	link: "?orderedby=MOSTEMAILED"},
		{name: "Most comments this week" , 	link: "?orderedby=MOSTDISCUSSED"},
		{name: "Rated jaw-dropping" , 		link: "?orderedby=JAW-DROPPING"},
		{name: "Rated persuasive" , 		link: "?orderedby=PERSUASIVE"},
		{name: "Rated courageous" , 		link: "?orderedby=COURAGEOUS"},			
		{name: "Rated ingenious" , 			link: "?orderedby=INGENIOUS"},
		{name: "Rated fascinating" , 		link: "?orderedby=FASCINATING"},
		{name: "Rated inspiring" , 			link: "?orderedby=INSPIRING"},
		{name: "Rated beautiful" , 			link: "?orderedby=BEAUTIFUL"},
		{name: "Rated funny" , 				link: "?orderedby=FUNNY"}
		//{name: "Rated informative" , 		link: "?orderedby=INFORMATIVE"}
			]
		}
   
   for each (var indice in list.indice) {
		page.appendItem( PREFIX + 'list:'+ indice.name +':'+ indice.link + ':' + "1", "directory", { title:  indice.name });
	 }  
   page.loading = false;  

 }

plugin.addURI( PREFIX + "list:(.*):(.*):(.*)", function(page, title, link, page_nbr) {
	 
  page.type = "directory";
  page.contents = "video";
  page.metadata.logo = plugin.path + "ted.jpg";
  page.metadata.title = "TED Talks: " + title;
  
  if(page_nbr > 1 ){
	page.metadata.title = "TED Talks: " + title + " " + page_nbr;
	var linkp =link +"&page=" + page_nbr;
	}else{ var linkp = link; }
  showtime.trace( TED +"/talks/list" + linkp );
  var content = showtime.httpGet( TED + "/talks/list" + linkp ).toString();
  
  content = content.slice(content.indexOf('<dt class="thumbnail">'),content.indexOf('<div class="themes_links"></div>'));
  content = content.split('<dt class="thumbnail">');
  
  var name = null;
  var img = null;
  var pubDate = null;
  var descrip = null;
  
  for each (var talk in content){
	  if(talk.indexOf('<a title="') != -1){ //&& talk.indexOf('play_botw_icon.gif') == -1){
		name = talk.slice(talk.indexOf('<a title="')+10,talk.indexOf('" href="')).replace(/&quot;/g,'"');
		descrip = name;
		
		if(name.indexOf(":") != "-1");
			name=name.slice(0,name.indexOf(":"));
		
		img =  talk.slice(talk.lastIndexOf('http://',talk.indexOf('" /></a>')),talk.indexOf('" /></a>'));
		if(showtime.probe(img.replace('132x99.jpg','615x461.jpg')).result == 0)
			img = img.replace('132x99.jpg','615x461.jpg');
			
		pubDate =talk.slice(talk.indexOf('<p><em class="date">')+20,talk.indexOf('</em></p>',talk.indexOf('<p><em class="date">')));
		
		var metadata = {
	      title: name,
	      description: descrip,
	      year: pubDate,
	      icon: img
			};
		
		var url = talk.slice(talk.indexOf('href="')+6,talk.indexOf('"',talk.indexOf('href="')+6));
		if(talk.indexOf('/images/play_botw_icon.gif')==-1)
			page.appendItem( PREFIX + "videos:"+url.replace('http://','') , "video", metadata);
		else
			if(service.youtube == "1")
				page.appendItem( 'youtube:video:simple:'+ escape(metadata.title) + ':' + getYoutubeId(url) , "video", metadata);			
	  }
	}
  if(content[content.length-1].indexOf('">Next') != -1 ){
	  page_nbr++;
	  page.appendItem('ted:list:'+ title +':' +link  + ':' + page_nbr , "directory", { title:  "Next" });
  }else{
	//thank u come a again ...
	//if(talk.indexOf('">Next') == -1 && talk.indexOf('<a title="') == -1)
		page.appendItem( PREFIX + 'list:'+ title +':' +link + ':' + "1" , "directory", { title:  "The end ... thank you come again.." });
  }

  page.loading = false;

});


plugin.addURI( PREFIX + "videos:(.*)", function(page, url){
	
	url = getUrl(url);

	page.source = "videoparams:" + showtime.JSONEncode({           
		sources: [
		{	
			url: url
		}]    
	});    
	page.type = "video";
});

function getUrl(link) {
  var content = showtime.httpGet( TED + link).toString();
  
  if(service.hd == 1)
	content = content.slice(content.lastIndexOf('http://',content.indexOf('.mp4')),content.indexOf('.mp4')+4).replace('.mp4','-480p.mp4');  
  else
	content = content.slice(content.lastIndexOf('http://',content.indexOf('.mp4')),content.indexOf('.mp4')+4);
	
  return content;	
}

function getYoutubeId(link) {
	var content = showtime.httpGet(TED + link).toString();
	return content.slice(content.indexOf('/v/')+3, content.indexOf('&',content.indexOf('/v/')+3));
}	
plugin.addURI("ted:start", startPage);
})(this);
