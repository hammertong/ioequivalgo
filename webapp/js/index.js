/*****************************************************************************************************
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * 
 * DISCLAIMER
 *
 * La legge 405/2001 nell’istituire le liste di trasparenza e la relativa sostituibilità 
 * all’interno dei gruppi di equivalenza, equipara espressamente le forme farmaceutiche 
 * solide orali (compresse, granulato, capsule).
 * 
 * E’ normale, infatti i farmaci “a denominazione generica” detti anche “generici” hanno 
 * sempre (o quasi sempre) il nome commerciale che coincide con il nome del principio attivo. 
 * La ricerca alfabetica restituisce sia principi attivi che denominazioni di farmaci.
 *
 * REFERENCES
 * 
 * APACHE CORDOVA CONFIG.XML 
 * https://cordova.apache.org/docs/en/4.0.0/config_ref/
 *
 * PHONEGAP PLUGINS
 * gitrepo @ https://github.com/wildabeast/BarcodeScanner.git 
 * gitrepo @ phonegap plugin add https://github.com/RoughshodNetworks/phonegap-plugin-barcodescanner.git
 *
 ******************************************************************************************************/ 
var QUERY_URL 						= ENDPOINT + '/query';

var MAX_AUTOCOMPLETE_RESULTS_LIST 	= 1000;
var MAX_RESULTS_SIZE 				= 1000;
var BTN_MAX_LINE_LENGTH 			= 30; 						// truncate buttons larger than this number of characters 

var QUERY_XML 						= "query.xml"; 				// may be http://... 
var ND 								= 'prezzo discrezionale';

var config = {
    "dati": null,					//
	"nascondiPrezzoND" : false,     //
	"nascondiRimborsoND" : false,	//
	"encoding": "base64", 			// TODO: get it from query.xml :: < "base64" | "xor" | null >	
	"ricercaIniziale": "",			//
	"query": null
}

function msgbox(mesg, title, delay) 
{
	if (delay) {
		setTimeout ("msgbox ('" + mesg + "', '" + title + "')", delay);
		return;
	}
	
	var prefix = $.mobile.activePage.attr("id");	
	if (prefix == 'search') { prefix = ''; }
	
	try {
		//$("html, body").animate({ scrollTop: 0 }, 400);		
		$('#popupDialog' + prefix + 'Title').html((title ? title : "Avviso"));    
		$('#popupDialog' + prefix + 'Message').html(mesg);    				
		$('#popupDialog' + prefix).popup (
				"open", 
				{ 
					allowSamePageTransition: true, 
					transition: 'pop' 
				}
		);
	}
	catch(e) {
		alert(e);
	}
}

function formatPrice(p)
{
	try {
		if (!p || p.length == 0) return ND;
		if (p.indexOf('0.00') == 0) return ND;
		if (p.indexOf('99999') == 0) return ND;		
		var dec = (p.indexOf('.') < 0 ? ',' : ".");		
		var pp = p.split(dec);
		if (pp && pp.length > 0) {
			p = pp[0];
			p += dec;
			p += pp[1].length > 2 ? pp[1].substr(0, 2) : pp[1];
		}
		return "&euro; " + p;  
	}
	catch (e) {
		return ND;
	}
}

function escapechar(value, escapeBefore) 
{
    var new_value = '';    
    if (!escapeBefore) escapeBefore = '\'';
    for (var i = 0; value != null && i < value.length; i ++) {
        var c = value.charAt(i);
        if (c == escapeBefore) new_value += '\\';
        new_value += c;
    }
    return new_value;
}

function decodificaDescrizione (s)
{
	var r = s
			.replace(/gtt /i, 	'gocce ')
			.replace(/bust /i, 	'bustine ')
			.replace(/polv /i, 	'polvere ')
			.replace(/cpr /i, 	'compresse ')
			.replace(/cps /i, 	'capsule ')
			.replace(/grat /i, 	'granulato ')
			.replace(/ riv/i, 	' rivestite')
			.replace(/ mast/i, 	' masticabili')
			.replace(/ eff/i, 	' effervescenti')
			//
			// TODO other replacements here 
			//			
			.replace(/\*/g, '<br/>');	
	var m = r.indexOf('(');
	var n = r.indexOf(')');
	if (m > 0 && n > 0 && m < n) 
	{
		r = r.substr(0, m).trim() + r.substr(n + 1).trim();		
	}
	return r;
}

function decodificaFormaFarmaceutica (s) 
{
	if (s == null) return '';	
	return s.toUpperCase();			
}

function separaUnitaPosologiche(s) 
{
	var a = s.split(' ');
	
	var i = 0;	
	var n = 0;
	
	for (i = 0; i < a.length; i ++) 
	{	
		if (!isNaN (a[i])) n++;	
		if (n == 2) break;
	}
	
	var r = '';	
	for (var j = 0; j < i; j ++) 
	{
		//if (j == 0 && isNaN(a[j])) continue;
		r += a[j];
		r += ' ';
	}
	
	return r;		
}

function fillcommand(command, params) 
{
	var count = 0;
	
	var data = command.replace (/\?/gi, function __placeholderSubstitution(x) {		
			if (count > params.length || typeof params[count] == 'undefined') return x;
			var value = params [count ++];			
			if (value.indexOf && value.indexOf('text:') == 0) {
				value = "'" + escapechar(value.substring(5, value.length), '\'') + "'";
			}
			return value;
		}
	);	
	
	if (DEBUG) console.log("SQL > " + data);	
	
	switch (config.encoding) {
		case 'base64':
			return Base64.encode (data);			
		case 'xor':
			var parameters = '';
			for (var i = 0; i < params.length; i ++) {
				if (parameters.length > 0) parameters += ';';
				parameters += params[i];
			}
			return { "data": data, "params": parameters };
		default:
			return data;
	}
	
}

function populateResults()
{		
	var html = '';    
	var formaSelezionata  = decodificaFormaFarmaceutica(config.formaSelezionata).toUpperCase();
	
	$("#resultsHeader").html('');	
    $("#resultsList").empty();
	
	html += '<ul data-role="listview" data-autodividers="false" data-inset="true">';			
	html += '<li data-role="list-divider" style="color: #808080; min-height: 50px;">';
	html += '<span style="white-space:normal;">';
	html += 'FARMACI EQUIVALENTI<br/>';	
	html += config.ricercaIniziale + '<br>';
		
	var heax = sel_[4];
	heax += ' ';
	for (var i = 0; i < 4; i ++) {
		if (!sel_ || !sel_[i] || sel_[i].length == 0) continue;
		if (heax.length > 0) heax += ' ';
		heax += sel_[i];		
	}		
	html += heax;
	
	html += '</span>';
	html += '</li>';
	
	var count  = 0;
	var data = config.dati;
	
	var lst = '';
	
    for (var i = 0; data != null && i < data.length; i++) {

        var rec = data[i];
		
		var descrizione	= decodificaDescrizione (rec.descrizione);		
		var prezzo = formatPrice(rec.prezzoAlPubblico);
		var rimborso = formatPrice(rec.prezzoRimborsoNazionale);

        if (prezzo == ND && config.nascondiPrezzoND) continue;
        if (rimborso == ND && config.nascondiRimborsoND) continue;
		
		// ignora duplicati
		var id = '[[' + rec.descrizione + ',' + rec.ditta + ']]';
		if (lst.indexOf(id) >= 0) continue;
		lst += id;
		
		// ignora posologie non selezionate
		if (sel_[STAGE_LAST] != null 
				&& sel_[STAGE_LAST] != '1' 
				&& sel_[STAGE_LAST] != '' 
				&& rec.descrizione.indexOf(sel_[STAGE_LAST]) < 0) {
			if (DEBUG) console.log('ignora posologia non selezionata (' + sel_[STAGE_LAST] + '): ' + rec.descrizione);
			continue;
		}
		
		var styles = (rec.brand != 'S' ? 'color: darkGreen;' : 'color: red;');
		
        html += '<li data-role="list-divider" style="background: white">';
        html += '<span class="x-scrolling" style=" ' + styles + '">';
        html += descrizione;
		
        html += '<br/><span style="font-size: smaller;">';
        html += rec.ditta;
		html += '</span>';
		
		if (rec.classe == 'CN') rec.classe = 'C';
		
        if (prezzo != ND) 
		{
            html += '<br/>Prezzo ' + (rec.classe == 'C' ? 'massimo' : '') + ' <span color="' + (prezzo == ND ? 'darkRed' : 'darkBlue') + '">'; 
            html += prezzo;
            html += '</span>';        
        }
		else 
		{
			html += '<br/><i>Prezzo discrezionale</i>';
		}

		if (rec.tipoRicetta && rec.classe == 'C' && (
				rec.tipoRicetta != 'C' && rec.tipoRicetta != 'D' && rec.tipoRicetta != 'h'
				)) 
		{
			html += '<br/><b>Con obbligo di ricetta</b>';
		}

        if (rimborso != ND) {
			var diff = parseFloat(rec.prezzoAlPubblico);
			diff -= parseFloat(rec.prezzoRimborsoNazionale);
			diff *= 100;
			diff = Math.round(diff);			
			var sdiff = '' + diff;
			var x0 = sdiff.substr(0, sdiff.length - 2);
			if (x0.length == 0) x0 = '0';
			var x1 = sdiff.substr(sdiff.length - 2, sdiff.length);
									
			if (rec.classe == 'C') {
				html += '<br/><b><u>Costo a carico del cittadino</u></b>';
			}
			else if (rec.classe == 'A') {				
				html += '<br/><b>Costo a carico del cittadino ' + x0 + (x1 != '0' && x1 != '00' ? '.' + x1 : '') + ' &euro;</b>';					
			}				
        }
		
		if (rec.inListaDiTrasparenza == 'CN') {
			html += '&nbsp;<img src="images/inlista.png" style="border: 0px; width: 16px;" ';
			html += 'alt="in lista di trasparenza"/>&nbsp;in lista di trasparenza';
		}
		
		html += '<br/><span>Classe ' + rec.classe + '</span>';	
		
		html += '</span>';		
        html += '</li>';
        		
		count ++;

    }

	$("#resultsList").append(html);
	$('#resultsList ul').each(function(ev) { $(this).listview().listview("refresh"); });

    return count ;
}

function getItemsByCustomFilter (productsFilter) {
	
    $.ajax ({

        url: QUERY_URL,        
		dataType: 'json',        
		crossDomain: true,
		
        data: {
			sql: getQuery (
				ups_ != null ? 'cercaDettagli' : 'cercaDettagliSenzaUPS', 
				ups_ != null ? 
				[
					MAX_RESULTS_SIZE,
					productsFilter,
					ups_
				]
				:
				[
					MAX_RESULTS_SIZE,
					productsFilter
				]
			),
			encoding: config.encoding
		}, 
		
		method: 'POST',
	
        success: function (data) {
		            
			config.dati = data;
			
			if (populateResults() <= 0) {				
				msgbox ('Nessun farmaco equivalente autorizzato in<br/>classe A o C', 'Avviso', 200);
				return;
			}                        
            
			$.mobile.changePage('#results', { 
					allowSamePageTransition: true, 
					transition: 'slide'
			});
			
        },

        error: function (data) {                           
            msgbox ("La ricerca della lista dei farmaci ha causato un errore", "Avviso", 200);
        }

    });

}

function conv32To10(code32, paddingLeft, suffix)
{
    var wres = 0;
    var strcon = "0123456789BCDFGHJKLMNPQRSTUVWXYZ";    
    for (var wx = code32.length - 1; wx >= 0; wx--) {
        var widx = strcon.indexOf(code32.substr(wx, 1));
        wres += widx * Math.pow(32, (code32.length - (wx + 1)));
    }
    var r = "" + wres;      
    if (paddingLeft && paddingLeft > 0) {
        while (r.length < paddingLeft)  { r = "0" + r; }
    }
    return (suffix ? suffix + r : r); 
}

function startBarcodeScanner()
{	
    $('#resultsList').html('');
	
    if (typeof cordova == "undefined") {        
		msgbox("Funzione non disponibile in questa versione");
		//cercaPerAIC('000307052');
        return;
    }	
	
	//#begin cordova
    
    cordova.plugins.barcodeScanner.scan 
    (
        function (result) 
        {  
			/*
			$('#cerca0').html(
					'<span style="font-size: smaller;">codice: ' + result.text 
					+ '<br/>format: ' + result.format + '</span>');
			*/
            if (result.cancelled) {                
                return;
            }
            if (result.format == 'CODE_39') {
                var code = conv32To10(result.text, 9);
                if (code.indexOf('A') >= 0) code = code.substr(1);				
				ups_ = null;
                cercaPerAIC (code);
            }
            else {
                msgbox("Il codice a barre non &egrave; valido<br/>provare con un altro codice a barre riportato sulla scatola");
            }
        }, 

        function (error) 
        {
          msgbox("Scansione fallita<br/>codice di errore:" + error);
        }
    ); 
	
	//#end cordova
}

function OnClickAutocomplete(code, type, target)
{   
	$(target).html("");
	$(target).listview("refresh");
	$(target).listview().listview("refresh");	
		
	if (target == '#autocomplete1') {
		$('#autocomplete2div').hide();
	}
	else if (target == '#autocomplete2') {
		$('#autocomplete1div').hide();		
	}
		
	selectedTarget = target;
	
    $('#search').find("input").val(code); 
	
	var v = getInputValue();
	
	config.ricercaIniziale = v;

	if (sel_) {
		for (var i = 0; i < sel_.length; i++) {
			sel_[i] = '';
		}	
	}
	
	switch (type) {
		case 'C':
			cercaTabellaOrdinataDosaggi('tabellaOrdinataDosaggiPerPA', v);
			break;
		case 'D':
			cercaTabellaOrdinataDosaggi('tabellaOrdinataDosaggiPerNF', v);
			break;
		default:
			if (DEBUG) console.log('ERROR: OnClickAutocomplete invoked with invalid type: ' + type);
			break;		
	}
}

var selectedTarget = null;

function getInputValue() {	
	var v = '';
	var count  = 0;
	$('#search .ui-input-search')
			.find("input")
			.each(function(ev) { 
				v = $(this).val(); 
				//count ++;	
				//if (DEBUG) console.log('------------> ' + v + ' (' + count + ')'); 				
			});
	return v;
}

function setInputValueEnabled(enabled, target) {
	var v = '';
	$('#search .ui-input-search ' + target)
			.find("input")
			.each(function(ev) { 			
		$(this).textinput (enabled ? 'enable' : 'disable'); 		
	});
	return v;
}

function setInputValueEmpty() {	
	$('#search .ui-input-search') 
			.find("input")
			.each(function(ev) { 				
		$(this).val(''); 				
	});	
}

function descriviDosaggio(s)
{
    var count = 0;
    var r = "";
    
    var p = s.split(' ');
    var wasW = false;
    
    for (var k = 0; k < p.length; k ++) {
        
        if (count == 3 && r.length > 0) break;
        
        var tk = p[k].replace(/\,/g, '.').toUpperCase();
        
        if (k == 0 && !isNaN(tk)) continue;
        
        if (p[k] == '+' && wasW) {
            r += ' +';
            wasW = false;
            count  = 0;
        }
        else if (!isNaN(tk)) {
            r += ' ';
            r += p[k];
            wasW = false;
            count = 0;
        }
		else if (
				tk.indexOf('CPR') >= 0
                 || tk.indexOf('CPS') >= 0
                 || tk.indexOf('BUST') >= 0
                 || tk.indexOf('GRAT') >= 0
                 || tk.indexOf('BOMB') >= 0) {
			r = '';
            wasW = true;
            count = 0;
        }
        else {
            if (r.length > 0) {
                r += ' ';
                r += p[k];
            }
            wasW = true;
        }
        
        count ++;
    }
    
    if (r.trim().length == 0) return s;
    
    var ret =  r.trim();
    
    //
    // rimuovo alcune schifezze
    // ....
    //
    return ret.replace(/litro litri/i, 'litri')
            .replace(/litri litri/i, 'litri')
			.replace(/litri \(litri/i, 'litri')
            .replace(/litri con/i, 'litri')
			.replace(/ con/i, '');;
    
}

function getItemsByAIC (_aic) {

	var _sql = null;
	if (DEBUG) console.log('recupero dettagli di farmaci senza equiv.: ' + _aic);

	if (_aic.indexOf(',') > 0) {
		var aic = _aic.split(',');
		var _s = '';
		for (var i = 0; i < aic.length; i ++) {
			if (!aic[i]) continue;
			if (aic[i].length == 0) continue;
			if (_s.length > 0) _s += ', ';
			_s += "'" + aic[i] + "'";
		}		
		_sql = getQuery ('recuperaDettaglioAIC', 
				[
					MAX_RESULTS_SIZE,
					_s
				]);
	}
	else {
		_sql = getQuery ('recuperaDettaglioAIC', 
				[
					MAX_RESULTS_SIZE,
					'text:' + _aic
				]);					
	}	
	
    $.ajax ({

        url: QUERY_URL,        
		dataType: 'json',        
		crossDomain: true,
		
        data: {
			sql: _sql,
			encoding: config.encoding
		}, 
		
		method: 'POST',
	
        success: function (data) {
		            
			config.dati = data;
			
			if (populateResults() <= 0) {				
				msgbox ('Nessun farmaco equivalente autorizzato in<br/>classe A o C', 'Avviso', 200);
				return;
			}                        
            
			$.mobile.changePage('#results', { 
					allowSamePageTransition: true, 
					transition: 'slide'
			});
			
        },

        error: function (data) {                           
            msgbox ("La ricerca della lista dei farmaci ha causato un errore", "Avviso", 200);
        }

    });

}
		
function cercaPerAIC (_aic)
{	
	var _sql = '';		
	
	if (_aic.indexOf(',') > 0) {
		var aic = _aic.split(',');
		var _s = '';
		for (var i = 0; i < aic.length; i ++) {
			if (!aic[i]) continue;
			if (aic[i].length == 0) continue;
			if (_s.length > 0) _s += ', ';
			_s += "'" + aic[i] + "'";
		}		
		_sql = getQuery ('cercaGruppoPerAIC_in', [ _s ]);						
	}
	else {
		_sql = getQuery ('cercaGruppoPerAIC', [ 'text:' + _aic ]);						
	}	

	$.ajax ({
			
			url: QUERY_URL,
			
			dataType: 'json',
			crossDomain: true,
			
			data: { 			
				sql: _sql, 				
				encoding: config.encoding				
			},                     
			
			method: 'POST',
			
			success: function (data) {

				if (!data || data.length <= 0) {
					getItemsByAIC (_aic);
					//il farmaco non ha equivalenti, nella lista viene comunque riportato								
					//msgbox ('Nessun farmaco equivalente autorizzato in<br/>classe A o C ...', 'Avviso', 200);
					return;
				}

				//console.log(' passed ---> ' + _aic);
				
				var productsFilter = '';				
				
				for (var i = 0; i < data.length; i++) {
					
					//config.ricercaIniziale = data[i].descrizione; 
					config.formaSelezionata = data[i].dosaggio;
					dosaggioSelezionato = '';
					
					if ((!data[i].codeA || data[i].codeA.length == 0) &&
						(!data[i].codeC || data[i].codeC.length == 0)) continue;

					switch(data[i].classe) {
					
					case 'A':
					case 'H':											
						if (productsFilter.length > 0) productsFilter += " OR ";
						productsFilter += "APP_CA.FDI_1010 = '" + data[i].codeA + "'";
						break;
					
					case 'C':
					case 'CN':
						if (productsFilter.length > 0) productsFilter += " OR ";
						productsFilter += "APP_CA.FDI_1094 = '" + data[i].codeC + "'";
						break;
					
					default:
						if (DEBUG) console.log('warning: trovata classe non valida: ' + data[i].classe);
					
					}	
					
					if (AIC_MODE != 2) break;
				}					
				
				if (productsFilter.length == 0) {
					getItemsByAIC (_aic);
					//msgbox('Il prodotto non ha farmaci equivalenti', 'Avviso', 200);
					//console.log('la ricerca non ha prodotto gruppi di equivalenza validi');
					return;
				}

				getItemsByCustomFilter(productsFilter);
				
			},
			
			error: function (data) {                           
				msgbox ("La ricerca dei farmaci equivalenti ha causato un errore:<br/>" + data);
			}			
			
	});
			
}

function normalizzaForma(c) {
	
	switch (c.toUpperCase()) {		
	
		case 'COMPRESSE DELITESCENTI':
		case 'COMPRESSE DISPERSIBILI':
		case 'COMPRESSE DIVISIBILI':
		case 'COMPRESSE DIVISIBILI RM':
		case 'COMPRESSE DIVISIBILI RP':	
		case 'COMPRESSE DIVISIBILI RILASCIO MODIFICATO':
		case 'COMPRESSE DIVISIBILI RILASCIO PROLUNGATO':
		case 'COMPRESSE EFFERVESCENTI SOLUB':
		case 'COMPRESSE EFFERVESCENTI SOLUB.':
		case 'COMPRESSE EFFERVESCENTI SOLUBILI':
		case 'COMPRESSE GASTRORESISTENTI':
		case 'COMPRESSE GASTRORESISTENTI RM':
		case 'COMPRESSE GASTRORESISTENTI RP':
		case 'COMPRESSE GASTRORESISTENTI RILASCIO MODIFICATO':
		case 'COMPRESSE GASTRORESISTENTI RILASCIO PROLUNGATO':
		case 'COMPRESSE MUCOADESIVE':
		case 'COMPRESSE ORODISPERSIBILI':
		case 'COMPRESSE ORODISPERS/SUBLING':		
		case 'COMPRESSE ORODISPERS./SUBLING.':
		case 'COMPRESSE ORODISPERSIBILI/COMPRESSE SUBLINGUALI':
		case 'COMPRESSE RC':
		case 'COMPRESSE RILASCIO CONTROLLATO':
		case 'COMPRESSE RIVESTITE':
		case 'COMPRESSE RIVESTITE DIVISIBILI':
		case 'COMPRESSE RIVESTITE GASTRORES':
		case 'COMPRESSE RIVESTITE GASTRORESISTENTI':
		case 'COMPRESSE RIVESTITE MASTICAB':
		case 'COMPRESSE RIVESTITE MASTICABILI':
		case 'COMPRESSE RIVESTITE RM':
		case 'COMPRESSE RIVESTITE RP':
		case 'COMPRESSE RIVESTITE RILASCIO MODIFICATO':
		case 'COMPRESSE RIVESTITE RILASCIO PROLUNGATO':
		case 'COMPRESSE RM':
		case 'COMPRESSE RILASCIO MODIFICATO':
		case 'COMPRESSE RP':
		case 'COMPRESSE RILASCIO PROLUNGATO':
		case 'COMPRESSE SOLUBILI':
		case 'COMPRESSE SOLUB E MASTICABILI':
		case 'COMPRESSE SOLUBILI E MASTICABILI':
		case 'COMPRESSE SOLUZIONE CUTANEA':
		case 'COMPRESSE PER SOLUZIONE CUTANEA':
		case 'COMPRESSE SUBLINGUALI':		
			return 'COMPRESSE';	
		
		case 'COMPRESSE RIVESTITE MASTICAB':
		case 'COMPRESSE RIVESTITE MASTICABILI':
			return 'COMPRESSE MASTICABILI';		
	}
	
	return c;
}

function getQuery(name, params)	{		
	var r = null;	
	if (DEBUG) console.log('searching named query: ' + name + ' ...');
	config.query.find('query').each(
		function() {			
			var n = $(this).attr('name');
			if (n.toLowerCase().trim() == name.toLowerCase().trim()) {										
				return $(this).find('sql').each(
					function() {												
						r = {
							"sql": $(this).text().trim(), 
							"encoding": $(this).attr('encoding')
						}
					}						
				);
			}
		}
	);					
	return fillcommand(r.sql, params);
}

//
// variabile di controllo per gestire back button: 
//  if #results -> goback()
//  else block back button
//
var goback_ = false;

function deviceReadyInitializer()
{ 
	//
	// BEGIN - OVERRIDE BACK BUTTON BEHAVIOUR
	//
	
	if ('onhashchange' in window) {

		window.location.hash = "no-back-button";
		window.location.hash = "Again-No-back-button";
		
		window.onhashchange = function() 
		{			
			if (goback_) 
			{
				goback_ = false;
				goback();
				return;
			}

			var hash = window.location.hash;

			if (hash == "#no-back-button") {
				return;
			}
			else if (hash == "#results") {
				setTimeout(function () { goback_ = true; }, 1000);
			}			
			else if (hash == "#search") {
				//TODO :: ?
			}			

	        window.location.hash = "no-back-button";			
		}
	}
	else {
		console.log('warning: cannot detect back/forward pressed...');		
	}
	
	//
	// END - OVERRIDE BACK BUTTON BEHAVIOUR
	//
		
    $('#cerca3').on("click", function() {  	
		startBarcodeScanner();
    });
		
	$('#resultsMenu :input').change(function(){        
        switch (this.name) {
            case 'choice-1':
                config.nascondiPrezzoND = this.checked;
                populateResults();
                break;
            case 'choice-2':
                config.nascondiRimborsoND = this.checked;
                populateResults();
                break;
        } 
    });

	$('#searchclickProducts').on("click", function() {    		
		$("#cerca0").html('');	
		$("#menuforma").hide();		
		$("#menucerca").hide();				
		$("#menucerca").slideToggle("slow", function() {});
		setTimeout (
			function() {
				$.mobile.changePage('#search', { 
					reverse: true,
					allowSamePageTransition: true, 			
					transition: 'slide'
				})
			},
			200);
    });
	
	$('#searchclick').on("click", function() {
		
		$("#menuforma").hide();		
		$("#menucerca").hide();				
		$("#menucerca").slideToggle("slow", function() {});
        
		setInputValueEmpty();
		$('#autocomplete1div').show();
        $('#autocomplete2div').show();
        $("#cerca0").html('');
        
		setTimeout (
			function() {
				$.mobile.changePage('#search', { 
					reverse: true,
					allowSamePageTransition: true, 			
					transition: 'slide'
				})
			},
			200);
    });

    if (typeof cordova == "undefined") {
        //$("#cerca3").hide();
    }

    $("#autocomplete1").on("filterablebeforefilter", function (e, data) {

        var $ul = $(this),
                $input = $(data.input),
                value = $input.val(),
                html = "";

        $ul.html(""); 
		
        if (value && value.length > 2) {

            $ul.html("<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>");
            $ul.listview("refresh");
			
			var v1 = '';			
			var a = value.split(' ');
			for (var i = 0; i < a.length; i ++) {
				var b = a[i];
				if (b.length == 0) continue;				
				v1 += (v1.length > 0 ? '%' + b : b);
			}
			
			var v2 = v1;	
			if (v1.length <= 2) return;			
			
			var _sql = getQuery (
				'autocompletaPrincipioAttivo',
				[
					MAX_AUTOCOMPLETE_RESULTS_LIST,
					'text:' + v1 + '%'
				]
			);	
				
            $.ajax({
				
                url: QUERY_URL,
                dataType: "jsonp",
                crossDomain: true,				
                
				data: {
					sql: _sql, 
					encoding: config.encoding
				}
				
            })
            .then (function (response) {
				
				var lst = '|';
				
				$.each(response, function (i, val) {
					
					var v = null;
					var f = val.split('|');
					
					if (f[0] == 'A' || f[0] == 'C') {
						v = f[1]; //.replace(/\//gi, ' + ');
						if (lst.indexOf("|" + v + "|") >= 0) return;
						lst += v + '|';						
						v = '<span style="color: #007700; white-space:normal;">' + v + '</span>';
					}
					else if (f[0] == 'B' || f[0] == 'D') {
						v = f[1].replace(/\(/gi, '<i style="font-size: smaller;">')
								.replace(/\)/gi, '</i>');
						if (lst.indexOf("|" + v + "|") >= 0) return;
						lst += v + '|';						
						v = '<span style="color: #000077; white-space:normal;">' + v + '</span>';
					}
					
					html += "<li><a href=\"javascript:OnClickAutocomplete('" + 
							f[1] + "', '" + f[0] + "', '#autocomplete1')\">" + v + "</a></li>";
							
                });	
				
                $ul.html(html);
                $ul.listview("refresh");
                $ul.trigger("updatelayout");
            });
			
        }
    });
	
	$("#autocomplete2").on("filterablebeforefilter", function (e, data) {

        var $ul = $(this),
                $input = $(data.input),
                value = $input.val(),
                html = "";  

        $ul.html("");
		
        if (value && value.length > 2) {

            $ul.html("<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>");
            $ul.listview("refresh");
			
			var v1 = '';			
			var a = value.split(' ');
			for (var i = 0; i < a.length; i ++) {
				var b = a[i];
				if (b.length == 0) continue;				
				v1 += (v1.length > 0 ? '%' + b : b);
			}
			
			var v2 = v1;	
			if (v1.length <= 2) return;			
			
			var _sql = getQuery (				
				'autocompletaNomeFarmaco',
				[					
					MAX_AUTOCOMPLETE_RESULTS_LIST,
					'text:' + v2 + '%'
				]
			);	
				
            $.ajax({
				
                url: QUERY_URL,
                dataType: "jsonp",
                crossDomain: true,				
                
				data: {
					sql: _sql, 
					encoding: config.encoding
				}
				
            })
            .then (function (response) {
				
				var lst = '|';
				
				$.each(response, function (i, val) {
					
					var v = null;
					 
					var f = val.split('|');
					
					if (f[0] == 'A' || f[0] == 'C') {
						v = f[1]; //.replace(/\//gi, ' + ');
						if (lst.indexOf("|" + v + "|") >= 0) return;
						lst += v + '|';						
						v = '<span style="color: #007700; white-space:normal;">' + v + '</span>';
					}
					else if (f[0] == 'B' || f[0] == 'D') {
						v = f[1].replace(/\(/gi, '<i style="font-size: smaller;">')
								.replace(/\)/gi, '</i>');
						if (lst.indexOf("|" + v + "|") >= 0) return;
						lst += v + '|';						
						v = '<span style="color: #000077; white-space:normal;">' + v + '</span>';
					}
					
					html += "<li><a href=\"javascript:OnClickAutocomplete('" + 
							f[1] + "', '" + f[0] + "', '#autocomplete2')\">" + v + "</a></li>";
							
                });	
				
                $ul.html(html);
                $ul.listview("refresh");
                $ul.trigger("updatelayout");
            });
			
        }
		else if (value && value.length == 0) {
	
			setInputValueEmpty();
			$('#autocomplete1div').show();
			$('#autocomplete2div').show();
			$("#cerca0").html('');		
			
		}
		
    });
	
	//
	// load queries
	//	
	$.ajax({
		type: "GET", 
		url: QUERY_XML,
		dataType: "xml", 
		success: function(xml){
			config.query = $(xml);				
		},
		error: function() {
			alert("Cannot load backend queries from XML.");
			return;
		}
	});	
	
	//
	// perform autocomplete styles
	//	
	$("#search").on( "pageshow", function( event ) { 
    
    	if (!$('#displaysearch').is(':visible')) {
			$('#displaysearch').slideToggle("fast", function() {});    		
			//$('#displaysearch').fadeIn(400);
    	}

		$('#search div .ui-input-search')            
			.each(function(ev) {             
				$(this).css('font-size', '16px');
				$(this).css('height', '40px');
				//$(this).css('border-radius', '14px !important');                        
				//$(this).css('-moz-border-radius', '14px !important');                                        
				$(this).css('border', '4px solid #c0c0c0');                        
		});
		
		$('#search .ui-input-search')
			.find("input")
			.each(function(ev) {             
				$(this).css('font-size', '16px');
				$(this).css('height', '100%');
				$(this).css('color', 'darkBLue');
				//$(this).css('background-color', '#efefef');
		});
				
		$('#search .ui-input-clear')
				.on("click", function(ev) {             
					//if (DEBUG) console.log('clear invoked...');
					for (var i = 0; i < sel_.length; i++) {
						sel_[i] = '';
					}
					$("#cerca0").html('');	
					$("#menuforma").hide();						
					setInputValueEmpty();
					$('#autocomplete1div').show();
					$('#autocomplete2div').show();
					$("#menucerca").show();

		});    
		
	});
		
    //
    // initialize ajax loader
    //
    $(document)
        .ajaxStart(function () {                           
            $("html, body").animate({ scrollTop: 0 }, 400);
            $('#popupWait').popup (
                    "open", 
                    { 
                        allowSamePageTransition: true, 
                        transition: 'pop' 
                    }
            );
        })
        .ajaxStop(function () {                            
            $("html, body").animate({ scrollTop: 0 }, 400);
            $('#popupWait').popup ("close");
        });
		
	//
	// gestione pressione tasti speciali
	//
    $(document).keydown(function (event) {
        
		var doPrevent = false;
		var keycode = (event.keyCode ? event.keyCode : event.which);
		
        if (keycode == '8') { 			// BACKSPACE
			//if (DEBUG) console.log(' **** backspace pressed');
			var d = event.srcElement || event.target;
			if ((d.tagName.toUpperCase() === 'INPUT' && (
					d.type.toUpperCase() === 'TEXT' ||
					d.type.toUpperCase() === 'PASSWORD' || 
					d.type.toUpperCase() === 'FILE' || 
					d.type.toUpperCase() === 'SEARCH' || 
					d.type.toUpperCase() === 'EMAIL' || 
					d.type.toUpperCase() === 'NUMBER' || 
					d.type.toUpperCase() === 'DATE' )
						) || d.tagName.toUpperCase() === 'TEXTAREA') {
				doPrevent = d.readOnly || d.disabled;
			}
			else {
				doPrevent = true;
			}
        }        
		else if (keycode == '9') { 		// HORIZONTAL TAB
			//if (DEBUG) console.log(' **** tab pressed');
        }        
		else if (keycode == '13') { 	// CR
			//if (DEBUG) console.log(' **** carriage return pressed');
        }        
		
		if (doPrevent) {
			event.preventDefault();
		}
		
    });	
	
	$('#search').on("swiperight", function () {                      						
		//
		// TODO ancora non funziona bene:
		//		1) si sminchia la ricerca ritornando in forward
		//
		//goprev();
	});
	
	$('#results').on("swiperight", function () {
		//
		// TODO ancora non funziona bene:
		//		1) se c'e' us salto diretto senza passaggi 
		//			intermedi non rileva correttamente il goprev
		//		2) interferisce negativamente con lo zoom
		//
		//goback();
	});	
}

function goprev() {

	//
	// decremento i contatori della tabella grammature
	//
	for (var j = 0; j < table.length; j ++) {
		if (table[j][1] > 0) table[j][1] --;
	}

	//
	// riporto la selezione corrente indietro di 1
	//
	var i = 0;
	for (i = sel_.length - 1; i > 0; i --) {
		if (sel_[i] != '') {
			break;
		}
	}
	sel_[i] = '';
	i --;	

	if (i > 0) {		
		setPage(i, sel_[i], true);
	}
	else {
		goback();
	}

}

function goback() {
	
	if ($("#cerca0").html().length == 0) return;

	for (var i = 0; i < sel_.length; i++) {
		sel_[i] = '';
	}

	setTimeout (

		function() {
			
			$("#menuforma").hide();		
			$("#menucerca").hide();					
			
			$.mobile.changePage('#search', { 
				reverse: true,
				allowSamePageTransition: true, 			
				transition: 'slide'
			});
			
			$("#cerca0").html('');	

			setInputValueEmpty();

			$('#autocomplete1div').show();
			$('#autocomplete2div').show();
			
			$("#menucerca").slideToggle("slow", function() {});				

		},

		200);
}

function onKeyboardHide() {    
	$('html, body').animate({scrollTop: 0}, 400);	
}

function onKeyboardShow() {
    $('html, body').animate({scrollTop: 320}, 400);	
}

var app = {

    initialize: function() {
        this.bindEvents();
        if (typeof cordova == "undefined") {            
            this.onDeviceReady();
        }       
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {        

        document.addEventListener('hidekeyboard', onKeyboardHide, false);
        document.addEventListener('showkeyboard', onKeyboardShow, false);

        app.receivedEvent('deviceready');
        var parentElement = document.getElementById("home1");
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');                
        
		deviceReadyInitializer();       
		
    },
    
    receivedEvent: function(id) {
        if (console) { 
            if (DEBUG) console.log('Received Event: ' + id); 
        }
    }

};

/////////////////////////////////////////////////////////////
//
// nuovo controller
//
/////////////////////////////////////////////////////////////

function cercaTabellaOrdinataDosaggi(query, value)
{
	if (!query || query.length == 0) {
		if (DEBUG) console.log ('ERRORE: query non specificata in cercaTabellaOrdinataDosaggi()');
		return;	
	}
	
	if (!value || value.length == 0) {
		if (DEBUG) console.log ('ERRORE: chiave di ricerca non specificata in cercaTabellaOrdinataDosaggi()');
		return;	
	}
	
	if (query == 'tabellaOrdinataDosaggiPerNF') {
		value += '%';
	}		
	
	$.ajax ({
		
		url: QUERY_URL,		
		dataType: 'json',
		crossDomain: true,		
		
		data: { 
			sql: getQuery (
				query, 
				[ 'text:' + value ]
			), 
			encoding: config.encoding
		},
		
		method: 'POST',
		
		success: function (data) {
			
			if (!data || data.length <= 0) {
				msgbox ('Nessun farmaco autorizzato in<br/>classe A o C', 'Avviso', 200);
				return;
			}			
						
			var o_aic = null;
			var o_id_par = null;
			var o_id_seq = null;
			
			var count = 0;
			
			var add_ups = false;
			
			table = [ '' ];
			
			for (var i = 0; i < data.length; i++) {		
			
				if (o_aic != data[i].aic || 
					o_id_par != data[i].id_par) 		// new record condition
				{	
					count ++;

					var forma = normalizzaForma(data[i].forma);
					var ups = parseInt(data[i].ups);	
					
					add_ups = true;					
					
					table [count] = [
							data[i].aic,
							0,
							forma,
							getDose(data[i]),
							ups,
							ups
					];									
					
				}
				else 									// previous record join
				{	
					if (o_id_seq == data[i].id_seq && add_ups) 
					{						
						table [count][4] += parseInt(data[i].ups);						
					}
					else 
					{						
						add_ups = false;
						
						var dose  = getDose(data[i]);						
						if (dose.length > 0) 
						{
							if (table [count][3].length > 0) 
							{
								table [count][3] += ' + ';
							}
							table [count][3] += dose;
						}							
					}
					
				}
				
				o_aic = data[i].aic;
				o_id_par = data[i].id_par;
				o_id_seq = data[i].id_seq;
								
			}
			
			stage = 1;
			setPage (1, null);		
			
		},
		error: function (data) {     
			if (DEBUG) console.log("remote error: " + JSON.stringify(data));		
			msgbox ('Impossibile collegarsi al backend', 'Avviso', 500);
		}
		
	});
		
}

function trimZeros(value) 
{
	var s = value.split('.');
	var x0 = s[0];
	var x1 = s[1];		
	var n = x1.length - 1
	while (n >= 0) 
	{
		if (x1[n] != '0') break;
		n --;
	}
	if (n < 0) 
	{
		return x0;
	}
	else 
	{
		return x0 + ',' + x1.substr(0, n + 1);
	}
}

function splitString(s) 
{	
	if (!isNaN(s) || s.length < BTN_MAX_LINE_LENGTH) return s;	
	return s.substr (0, BTN_MAX_LINE_LENGTH) + " ...";
}

function getDose(rec) 
{
	var dose  = '';
	
	try
	{
		if (dose.length == 0 && rec.pa_qta != null) 
		{			
			var qta = rec.pa_qta.replace(/\,/g, '.');			
			if (parseFloat (qta) > 0) 
			{			
				dose += trimZeros(qta);
				dose += ' ';
				dose += rec.pa_um;
			}				
		}
		
		if (dose.length == 0 && rec.pa_perc != null) 
		{
			var perc = rec.pa_perc.replace(/\,/g, '.');
			if (parseFloat (perc) > 0) 
			{	
				dose += trimZeros(perc);		
				dose += ' ';
				dose += '%';
			}
		}
		
		if (dose.length == 0 && rec.pas_qta != null) 
		{
			var qta = rec.pas_qta.replace(/\,/g, '.')			
			if (parseFloat (qta) > 0) 
			{
				dose += trimZeros(qta);
				dose += ' ';
				dose += rec.pas_um;													
			}
		}
		
		if (dose.length == 0 && rec.pas_perc != null) 
		{					
			var perc = rec.pas_perc.replace(/\,/g, '.');
			if (parseFloat (perc) > 0) 
			{	
				dose += trimZeros(perc);							
				dose += ' ';
				dose += '%';
			}
		}		
	}
	catch (err) 
	{
		if (DEBUG) console.log("error: " + err + " - getDose() -> from " + JSON.stringify(rec));
	}

	if (dose.charAt(dose.length - 1) == ',') dose = dose.substr(0, dose.length - 1);
	
	return dose;	
}

var STAGE_LAST = 4;

// 
// struttura array: 
//	[ aic(0) , hcount(1), forma(2), dosaggio(3), ups(4), ups_first ] 
//
var table = [ '' ];

var sel_ = [ '', '', '', '', '', '', '' ];

var ups_ = null;

//
//  AIC_MODE - admitted values:
//
//	- 0 only last aic found (default))
//	- 1 only first aic
//	- 2 concatenate all aic
//
var AIC_MODE = 2; 

function setPage (stage, keep, reverse) {
	
	sel_[stage] = keep;	

	if (stage >= STAGE_LAST) 
	{
		var aicList = '';
		var ups = null;	
		
		for (var i = 1; i < table.length; i ++)
		{	
			//hide non selected in previous stage
			//if (DEBUG) console.log ('comparing keep: ' + keep + ' with ' + table[i][stage]);			
			if (keep && stage > 1 && keep != table[i][stage])
			{
				table[i][1] ++;	
			}
			
			//skip hidden			
			if (stage > 1 && table[i][1] > 0) continue;
			
			var aic = table[i][0];
			ups = table[i][5]; 
			
			switch (AIC_MODE)
			{
			case 2:
				if (aicList.length > 0) {
					aicList += ',';
				}
				aicList += aic;
				break;
			case 1:
				if (aicList.length == 0) {
					aicList = aic;
				}
				break;
			case 0:
				aicList = aic;				
				break;
			}	
			
		}

		ups_ = ups;
		cercaPerAIC (aicList);
		
		return; 
		
	}
	else 
	{			
		var html = '';
		
		var selections = [ '' ];
		var selections_ptr = 0;
		var lst = '|';

		for (var i = 1; i < table.length; i ++)
		{			
			//if (DEBUG) console.log(' ********* ' + JSON.stringify(table[i]));
			
			//hide non selected in previous stage
			//if (DEBUG) console.log ('comparing keep: ' + keep + ' with ' + table[i][stage]);			
			if (keep && stage > 1 && keep != table[i][stage])
			{
				table[i][1] ++;	
			}
			
			//skip hidden
			if (stage > 1 && table[i][1] > 0) continue;			
			
			//keep trace of displayed yet
			var sel = table[i][stage + 1];
			
			if (lst.indexOf('|' + sel + '|') >= 0) continue;
			lst += sel;
			lst += '|';			
			
			//show html choice 
			html += '<tr><td align="left">';
			html += '<a href="javascript: setPage(' + (stage + 1) + ', \'' + sel + '\')" ';
			html += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';
			html += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
			html += '<span class="ui-btn-inner" style="vertical-align: middle;">';
			html += '<span class="ui-btn-text" style="font-size: 14px;">' + splitString (sel) + '</span>';
			html += '</span>';
			html += '</a>';
			html += '</td></tr>';

			selections [selections_ptr ++] = sel;

		}
		
		// va avanti fino a quando c'e' la possibilita' di scelta
		if (selections_ptr < 2) {
			//if (DEBUG) console.log('entering automatic selection ...');
			setPage (stage + 1, selections[0]);
			return;
		}
		
	}	
	
	var head = '<span style="font-size: 12px;">';	
	for (var i = 2; i <= stage + 1; i ++) {
		if (i > 2) head += ' &gt; ';
		head += sel_[i];				
	}
	head += '</span><br/>';
	
	switch(stage) {
		case 1:	
			head += 'selezionare la tipologia';									
			break;
		case 2:	
			head += 'selezionare il dosaggio';						
			break;
		case 3:	
			head += 'selezionare unit&agrave; posologiche';						
			break;
		
	}
	
	$("#cerca0").html(head);
	$("#menucerca").hide();
	$("#menuforma").hide();				
	
	//
	// transition 
	//	
	$("#menuforma").html(html);			
	
	//
	// ordinamento della tabella
	//	
	
	var irow = 0;
	var trow = [ '' ];
	
	$('#menuforma tr').each(function() {
		var row = $(this);
		trow[irow ++] = row.text();
	});
	
	trow = trow.sort (
		function (a, b) {			
			try {
				var t0 = a.replace(/\,/g, '.').split(' ')[0].toLowerCase();
				var t1 = b.replace(/\,/g, '.').split(' ')[0].toLowerCase();
				
				if (!isNaN(t0) && !isNaN(t0)) {			
					return (parseFloat(t0) < parseFloat(t1) ?
						1 : -1);
				}
				else {
					t0 = a;
					t1 = b;	
					for (var k = 0; k < t0.length && k < t1.length; k ++) 
					{
						if (t0.charCodeAt(k) < t1.charCodeAt(k)) {
							return 1;
						}
						else if (t0.charCodeAt(k) > t1.charCodeAt(k)) {
							return -1;
						}						
					}
					return (t0.length < t1.length ? 1 : -1);
				}
			}
			catch (ex) {
				if (DEBUG) console.log('sort error => ' + ex);
			}
			return 0;
		}
	);
	
	for (var k = 0; k < trow.length; k ++) 
	{
		$('#menuforma tr').each(function() 
		{		
			var row = $(this);
			if (row.text() != trow[k]) return;
			//if (DEBUG) console.log('shifting @top ...' + row.text());
			row.insertBefore (row.parent().find('tr:first-child'));			
		});
	}
	
	//
	// fine ordinamento
	//
	if (reverse) {
		$.mobile.changePage('#search', { 		
			allowSamePageTransition: true, 
			transition: 'slide',
			reverse: true
		});						
	}
	else {
		$.mobile.changePage('#search', { 		
			allowSamePageTransition: true, 
			transition: 'slide'
		});							
	}
		
	$("#menuforma").fadeIn(1000);
	//$("#menuforma").slideToggle( "slow", function() {});

}
