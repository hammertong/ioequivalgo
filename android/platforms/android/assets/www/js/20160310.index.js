/*
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
 */
 
 /*
 
 TODO:
 Disclaimer:
 
 La legge 405/2001 nell’istituire le liste di trasparenza e la relativa sostituibilità 
 all’interno dei gruppi di equivalenza, equipara espressamente le forme farmaceutiche 
 solide orali (compresse, granulato, capsule).
 
 E’ normale, infatti i farmaci “a denominazione generica” detti anche “generici” hanno 
 sempre (o quasi sempre) il nome commerciale che coincide con il nome del principio attivo. 
 La ricerca alfabetica restituisce sia principi attivi che denominazioni di farmaci.
 
 DEVELOPMENT
 
 - raggruppamenti risultati per unita posologiche 
  
 */

/* ************************************************************
 *
 *  DEVELOPMENT TIPS
 *  ----------------
 *  var s = JSON.stringify(data);                
 *  s = s.replace(/\[/gi, '\[\n\t').replace(/\}/gi, '\}\n\t\t');        
 *
 *
 *	DATA MODEL
 *	----------
 * 
 *		CREATE TABLE APP_CA (
 *			FDI_0001 varchar(9)    NULL,	-- Codice prodotto
 *			FDI_0004 varchar(30)   NULL,	-- Descrizione prodotto
 *			FDI_0040 varchar(4)    NULL,	-- Codice ditta
 *			FDI_0041 varchar(30)   NULL,	-- Ragione sociale ditta
 *			FDI_0021 varchar(2)    NULL,	-- Classe
 *			FDI_10A0 varchar(3)    NULL,	-- Codice gruppo lista di trasparenza classe A
 *			FDI_1094 varchar(13)   NULL,	-- Codice gruppo lista di trasparenza classe C
 *			FDI_9238 numeric(8, 3) NULL,	-- prezzo attuale logico
 *			FDI_0491 numeric(8, 3) NULL,	-- prezzo di rimborso nazionale
 *			FDI_0339 numeric(6, 0) NULL,	-- codice principio attivo
 *			FDI_0340 varchar(200)  NULL, 	-- descrizione principio attivo
 *			FDI_0363 numeric(6, 0) NULL,	-- codice principio attivo base
 *			FDI_0364 varchar(200)  NULL, 	-- descrizione principio attivo base
 *			FDI_4875 varchar(max)  NULL,	-- descrizione estesa
 *			FDI_0371 varchar(30)   NULL,	-- descrizione forma farmaceutica
 *			FDI_0578 varchar(40)   NULL,	-- forma farmaceutica di riferimento
 *			FDI_1010 varchar(3)    NULL,	-- codice gruppo di equivalenza
 *			FDI_9159 varchar(1)    NULL,	-- flag lista di trasparenza
 *			FDI_9172 varchar(1)    NULL		-- flag generico
 *		)
 *
 *      CREATE TABLE TR041 (
 * 			FDI_T505 varchar(9)    NULL,    -- codice aic (FD_0001 ?)
 *          FDI_T507 varchar(15)   NULL     -- codifica join TS052
 *      )
 *
 *      CREATE TABLE TS052 (
 *	        FDI_T503 varchar(15)   NULL,    -- codifica join TR041
 *          FDI_T504 varchar(300)  NULL     -- descrittore '<principio>-<forma>-<dosaggio>'
 *      )
 *
 *
 *  CORDOVA/PHONEGAP PLUGINS  
 *  ------------------------
 *
 * 	phonegap-plugin-barcodescanner block
 *  gitrepo @ https://github.com/wildabeast/BarcodeScanner.git 
 *  gitrepo @ phonegap plugin add https://github.com/RoughshodNetworks/phonegap-plugin-barcodescanner.git
 *
 * *************************************************************/

var ENDPOINT_PROD = 'http://www.farmastampati.mobi/FarmastampatiMobi';
var ENDPOINT_TEST = 'http://127.0.0.1:60510';

//var ENDPOINT = ((typeof cordova == "undefined") ? ENDPOINT_TEST : ENDPOINT_PROD);
//var ENDPOINT = ENDPOINT_TEST;
var ENDPOINT = ENDPOINT_PROD;

var MAX_AUTOCOMPLETE_RESULTS_LIST = 200;
var MAX_RESULTS_SIZE = 1000;

//var ND = 'non disponibile';
var ND = 'prezzo discrezionale';

var QUERY_URL = ENDPOINT + '/query';

var autocompleteTextBox = null;

var dataset = {	
    "dati": null,					//
	"nascondiPrezzoND" : false,     //
	"nascondiRimborsoND" : false,	//
	"encoding": "base64", 			// query encoding format < "base64" | "xor" | null >	
	"ricercaIniziale": "",			//
	//"joinTable":			"APP_CA"	
	"joinTable":			"TR041"	
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
	return s
			.replace(/gtt /g, 	'gocce ')
			.replace(/bust /g, 	'bustine ')
			.replace(/polv /g, 	'polvere ')
			.replace(/cpr /g, 	'compresse ')
			.replace(/cps /g, 	'capsule ')
			.replace(/grat /g, 	'granulato ')
			.replace(/riv /g, 	'rivestite ')
			.replace(/mast /g, 	'masticabili ')
			.replace(/eff /g, 	'effervescenti ')
			//
			// TODO other replacements here 
			//
			.replace(/\*/g, '<br/>');	
}

function decodificaFormaFarmaceutica (s) 
{
	s = s.toUpperCase();
	for (var i = 0; i < forma_f_.length; i += 2) {
		if (forma_f_[i] == s) {
			return forma_f_[i + 1];
		}
	}	
	return decodificaDescrizione(s.toLowerCase());
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
	
	console.log("SQL > " + data);	
	
	switch (dataset.encoding) {
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

function populateResults ()
{
	var unitbak = null;
    var rec = null;
    var html = '';
	
    $("#resultsList").empty();
	
	var count  = 0;
	var data = dataset.dati;
	
    for (var i = 0; data != null && i < data.length; i++) {

        rec = data[i];
		
		var descrizione	= decodificaDescrizione (rec.descrizione);		
		
		var unit = separaUnitaPosologiche (rec.unit);
		
		if (unitbak != unit)
		{
			html += '<li data-role="list-divider" style="color: black; font-weight: bolder;">';
			html += '<span class="x-scrolling">';
			html += decodificaDescrizione (unit);
			html += '</span>';
			html += '</li>';
		}
		
		unitbak = unit;
				
		var prezzo = formatPrice(rec.prezzoAlPubblico);
        
		var rimborso = formatPrice(rec.prezzoRimborsoNazionale);

        if (prezzo == ND && dataset.nascondiPrezzoND) continue;
        if (rimborso == ND && dataset.nascondiRimborsoND) continue;

		//if (rec.descrizione.indexOf(mm) < 0) {
		//	console.log('SKIPPING  --> ' + dosaggio_ + ' - \'' + rec.descrizione + '\' doesn\'t contain? \'' + mm + '\'\r\n');	
		//	continue;	
		//}
		
		// 
		// TODO ottenere dalla base dati il flag brand
		//		
		rec.brand = (rec.generico != 'S');

		var styles = (rec.brand ? 'color: red;' : 'color: darkGreen;');
		
        html += '<li data-role="list-divider" style="background: white">';
        html += '<span class="x-scrolling" style=" ' + styles + '">';
        html += descrizione;
		
        html += '<br/><span style="font-size: smaller;">';
        html += rec.ditta;
		html += '</span>'
		
        if (prezzo != ND) {
            html += '<br/>Prezzo <span color="' + (prezzo == ND ? 'darkRed' : 'darkBlue') + '">'; 
            html += prezzo;
            html += '</span>';        
        }
		else {
			html += '<br/><i>Prezzo discrezionale</i>';             
		}
				
        if (rimborso != ND) {                    
            html += '<br/>Rimborso '; 
            html += rimborso;			
        }				
		
		if (rec.inListaDiTrasparenza == 'S') {
			html += '&nbsp;<img src="images/inlista.png" style="border: 0px; width: 16px;" alt="in lista di trasparenza"/>' +
				'&nbsp;<span style="font-style: italic;"> in lista di trasparenza</span>';	
		}
				
		/*
		else if (rec.classe != 'A') {
			html += '<br/><span style="color: red;">il farmaco non &egrave; rimborsato</span>';	
		}
		*/
		
		if (rec.classe == 'CN') rec.classe = 'CNN';
		html += '<br/><span>Classe ' + rec.classe + '</span>';	
		
		if (rec.generico == 'S') {
			html += '<br/><span style="font-style: italic;">Farmaco Equivalente</span>';					
		}				
        
		html += '</span>';
		
        html += '</li>';
		
		count ++;

    }
	
	var ht = html;	
	
    $("#resultsList").append(ht);	
    $('#resultsList').listview().listview("refresh");    
	
    return count ;
}
	
function getItemsByCustomFilter (productsFilter) {
	
    $.ajax ({

        url: QUERY_URL,
        
		dataType: 'json',
        
		crossDomain: true,
		
        data: { 
			sql: fillcommand (
				"SELECT TOP ? " +
				"    APP_CA.FDI_0001 as codice, " + 
				"    APP_CA.FDI_4875 as descrizione, " +				
				"    SUBSTRING(APP_CA.FDI_4875, CHARINDEX('*', APP_CA.FDI_4875) + 1, 300) as unit, " + 	
				"    APP_CA.FDI_0004 as descrizioneBreve, " + 
				"    APP_CA.FDI_0040 as codiceDitta, " +
				"    APP_CA.FDI_0041 as ditta, " +
				"    APP_CA.FDI_0021 as classe, " +
				"    APP_CA.FDI_0371 as forma, " +
				"    CASE APP_CA.FDI_9238 WHEN 0 THEN 99999.99 ELSE APP_CA.FDI_9238 END as prezzoAlPubblico, " +
				"    CASE APP_CA.FDI_0491 WHEN 0 THEN 99999.99 ELSE APP_CA.FDI_0491 END as prezzoRimborsoNazionale, " +
				"    APP_CA.FDI_0364 as principioAttivoBase, " +
				"    APP_CA.FDI_0340 as principioAttivo, " +
				"    APP_CA.FDI_9159 as inListaDiTrasparenza, " +
				"    APP_CA.FDI_9172 as generico " +
				"FROM APP_CA " +
				"INNER JOIN TR041 ON APP_CA.FDI_0001 = TR041.FDI_T505 " +
				"WHERE " + productsFilter + " " +				
				"ORDER BY unit ASC, prezzoAlPubblico ASC, descrizione ASC",
				[
					MAX_RESULTS_SIZE 		
				]
			),
			encoding: dataset.encoding
		}, 
		
		method: 'POST',
	
        success: function (data) {
		            
			dataset.dati = data;
			
			if (populateResults() <= 0) {
				$("#resultsHeader").html($("#resultsHeader").html() 
						+ '<br><br><b style="color: red; font-weight: bolder;">IL FARMACO NON HA EQUIVALENTI</b>');
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
				dataset.ricercaIniziale = code;
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

function OnClickAutocomplete(code, type)
{   
	$('#autocomplete').html("");    
	$('#autocomplete').listview("refresh");
	$('#autocomplete').listview().listview("refresh");	
    $('#search').find("input").val(code); 
	
	var v = getInputValue();
	
	switch (type) {
		case 'A':
			dataset.ricercaIniziale = v;
			cercaPerPrincipioAttivo(v);
			break;	
		case 'B':
			dataset.ricercaIniziale = v;
			cercaPerDescrizioneEstesa(v);
			break
		default:
			console.log('ERROR: OnClickAutocomplete invokde with invalid type: ' + type);
			break;		
	}
}

function getInputValue() {	
	var v = '';
	$('#search .ui-input-search')
			.find("input")
			.each(function(ev) { v = $(this).val(); });
	return v;
}

function setInputValueEnabled(enabled) {
	var v = '';
	$('#search .ui-input-search')
			.find("input")
			.each(function(ev) { 			
		$(this).textinput (enabled ? 'enable' : 'disable'); 		
	});
	return v;
}

function OnClickForma(forma, dosaggi)
{
	var html = '';
	
	if (selectionMap_ != null) {
		
		var d = selectMap(forma);	
		
		//alert(JSON.stringify(d));
		
		for (var i = 0; i < d.dosaggi.length; i ++) {
			if (d.dosaggi[i].dosaggio == null) continue; 
			if (d.dosaggi[i].dosaggio.length == 0) continue; 
			//console.log(" +++++++++++ <" + d.dosaggi[i].dosaggio + "> --> [" + descriviDosaggio(d.dosaggi[i].dosaggio) + "]");									
			html += '<tr><td align="left">';					
			html += '<a href="javascript: OnClickDosaggio(\'' + forma + '\', \'' + d.dosaggi[i].dosaggio + '\')" ';							
			html += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
			html += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
			html += '<span class="ui-btn-inner" style="vertical-align: middle;">';
			html += '<span class="ui-btn-text">' + descriviDosaggio(d.dosaggi[i].dosaggio) + '</span>';
			html += '</span>';
			html += '</a>'										
			html += '</td></tr>';			
		}		
		
	}
	else {
		
		var d = dosaggi.split('|');	
		
		for (var i = 0; i < d.length; i ++) {	
			if (d[i].length == 0)  continue;
			//console.log(" ----------- <" + d[i] + "> --> [" + descriviDosaggio(d[i]) + "]");	
			html += '<tr><td align="left">';					
			html += '<a href="javascript: OnClickDosaggio(\'' + forma + '\', \'' + d[i] + '\')" ';							
			html += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
			html += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
			html += '<span class="ui-btn-inner" style="vertical-align: middle;">';
			html += '<span class="ui-btn-text">' + descriviDosaggio(d[i]) + '</span>';
			html += '</span>';
			html += '</a>'										
			html += '</td></tr>';
		}
		
	}	
		
	//$("#cerca0").html(		
	//		'<a href="javascript:goback();" style="text-decoration: none; color: #e0e0e0; position: absolute; left: 0px;">&#10094;</a>' +
	//		'selezionare dosaggio');		
	
	$("#cerca0").html('selezionare dosaggio');		
			
	$("#menuforma").html(html);	
	$.mobile.changePage('#search', { 
		allowSamePageTransition: true, 
		transition: 'slide'
	});
	
}

function OnClickDosaggio(forma, dosaggio)
{
	$("#resultsHeader").html(
		'ELENCO DEI FARMACI EQUIVALENTI<br/>' + dataset.ricercaIniziale + ' - ' + forma + ' ' + dosaggio
	);
	
	var _sql = '';
	
	if (selectionMap_ != null) 
	{
		var lista_aic = selectMap(forma, dosaggio).aic;
		
		var sql_append = '(';		
		for (var i = 0; i < lista_aic.length; i ++) {
			if (i > 0) sql_append += ',';
			sql_append += '\'';
			sql_append += lista_aic[i];
			sql_append += '\'';
		}
		sql_append += ')';
		
		switch (dataset.joinTable) {
			
			case "APP_CA":
				_sql = 
						"select distinct top 1000 " +
						"FDI_0021 as classe, FDI_1010 as codeA, FDI_1094 as codeC " +
						"from APP_CA " +
						"where FDI_0001 in " + sql_append;
				break;
				
			case "TR041":
				_sql = 
						"select distinct top 1000 FDI_T507 as codeGR, 'GR' as classe " +
						"from TR041 " +
						"where FDI_T505 in " + sql_append;
				break;
		}
	}
	else
	{
		switch (dataset.joinTable) {
			
			case "APP_CA":
				_sql = 
						"select distinct top 1000 " +
						"FDI_0021 as classe, FDI_1010 as codeA, FDI_1094 as codeC " +
						"from APP_CA " +
						"where FDI_0001 in (" + 
							"select TR041.FDI_T505 " +
							"from TR041 " +						
							"join TS052 on TR041.FDI_T507 collate Latin1_General_CI_AS = TS052.FDI_T503 " +												
							"  where TS052.FDI_T504 = '" + 
								getInputValue() + "*" +
								forma + "*" +
								dosaggio + "'" +
						")";
				break;
				
			case "TR041":			
				_sql = 
						"select distinct top 1000 TR041.FDI_T507 as codeGR, 'GR' as classe " +			
						"from TR041 " +
						"where TR041.FDI_T505 in (" + 
							"select TR041.FDI_T505 " +
							"from TR041 " +						
							"join TS052 on TR041.FDI_T507 collate Latin1_General_CI_AS = TS052.FDI_T503 " +												
							"  where TS052.FDI_T504 = '" + 
								getInputValue() + "*" +
								forma + "*" +
								dosaggio + "'" +
						")";
				break;
				
		}
		
	}
	
	$.ajax ({
			
			url: QUERY_URL,
			
			dataType: 'json',
			crossDomain: true,
			
			data: { 			
				sql: fillcommand (_sql), 				
				encoding: dataset.encoding				
			},                     
			
			method: 'POST',
			
			success: function (data) {
			
				if (!data || data.length <= 0) {					
					msgbox ('Non esistono farmaci equivalenti<br/>al prodotto selezionato:<br/>' 
							+ dataset.ricercaIniziale, 'Avviso', 200);
					return;
				}
				
				var productsFilter = '';				
				
				for (var i = 0; i < data.length; i++) {
					
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
					
					case 'GR':					
						if (productsFilter.length > 0) productsFilter += " OR ";
						productsFilter += "TR041.FDI_T507 = '" + data[i].codeGR + "'";
						break;
					
					default:
						console.log('warning: trovata classe non valida: ' + data[i].classe);
					
					}	
					
				}
					
				
				if (productsFilter.length == 0) {
					msgbox('Il prodotto non ha farmaci equivalenti', 'Avviso', 200);
					console.log('la ricerca non ha prodotto gruppi di equivalenza validi');
					return;
				}
				
				getItemsByCustomFilter(productsFilter);
				
			},
			
			error: function (data) {                           
				msgbox ("La ricerca dei farmaci equivalenti ha causato un errore:<br/>" + data);
			}			
			
	});
			
}		

function descriviDosaggio(x)
{
	//
	// TODO implement here human readable ....
	//
	return x;	
}		

function ordinaListaDosaggiPerForma (listaDosaggiPerForma)
{
	//
	// TODO implement here sorted list ....
	//
	return listaDosaggiPerForma;	
}
	
function cercaPerAIC(v) {         
	
	if (v.length == 0) {
		msgbox ('Inserire il codice AIC');
		return;
	}

	$.ajax ({
		
		url: QUERY_URL,
		
		dataType: 'json',
		
		crossDomain: true,
		
		data: { 
			sql: fillcommand (
				"select TOP 1 FDI_0364 as pa " +
				"from APP_CA " +
				"where " +
				"  FDI_0001 = ? ", 		
				[
					'text:' + v 
				]
			),
			encoding: dataset.encoding
		},                     
		
		method: 'POST',
		
		success: function (data) {						
		
			if (!data || data.length <= 0) {					
				msgbox ('codice AIC ' + v 
						+ ' non valido,<br/>impossibile ottenere il principio attivo base del farmaco', 
						'Avviso', 200);
				return;
			}
			
			cercaPerPrincipioAttivo(data[0].pa);
			
		},
		error: function (data) {                           
			msgbox ("La ricerca per codice AIC ha causato un errore:<br/>" + data);
		}
	});	
	
}	

var selectionMap_ = null;

function selectMap (forma, dosaggio) {
	for (var j = 0; j < selectionMap_.length; j ++) {						
		if (forma == selectionMap_[j].forma) {			
			if (dosaggio) {
				var dosaggi = selectionMap_[j].dosaggi;
				for (var i = 0; i < dosaggi.length; i ++) {
					if (dosaggi[i].dosaggio == dosaggio) {
						return dosaggi[i];
					}
				}
				return null;				
			}
			else {
				return selectionMap_[j];			
			}
		}
	}		
	return null;
}

function cercaPerDescrizioneEstesa(v) {         
	
	if (v.length == 0) {
		msgbox ('Inserire il nome del farmaco');
		return;
	}
	
	autocompleteTextBox.val(v);

	$.ajax ({
		
		url: QUERY_URL,
		
		dataType: 'json',
		crossDomain: true,
		
		data: { 
			sql: fillcommand (
				"select distinct substring(TS052.FDI_T504, charindex('*', TS052.FDI_T504) + 1, 1000) as dx, TR041.FDI_T505 as aic " +
				"from TS052 " + 
				"left join TR041 on TR041.FDI_T507 collate Latin1_General_CI_AS = TS052.FDI_T503 " +
				"where TR041.FDI_T505 in ( " +
				"	select FDI_0001 as pa from APP_CA " +
				"	where FDI_4875 like ? " +
				") " + 
				"order by 1 asc",
				[
					'text:' + v + '%'
				]
			), 
			encoding: dataset.encoding
		},                     
		
		method: 'POST',
		
		success: function (data) {						
		
			if (!data || data.length <= 0) {					
				msgbox ('Il farmaco ' + getInputValue() + '<br/>non ha equivalenti associati', 'Avviso', 200);
				return;
			}
					
			//setInputValueEnabled(false);				
			//$("#cerca0").html(				
			//	'<a href="javascript:goback();" style="text-decoration: none; color: #e0e0e0; position: absolute; left: 0px;">&#10094;</a>' +
			//	'selezionare tipologia');	
			$("#cerca0").html('selezionare tipologia');						
				
			$("#menucerca").hide();				
			$("#menuforma").hide();				
			
			var html = '';				
			savedHtml = '';		
			
			selectionMap_  = [ '' ];
						
			for (var i = 0; i < data.length; i++) {
						
				var fp = data[i].dx.split('*');
				
				var f = selectMap(fp[0]);				
				
				if (!f) {
					f = {
						forma: fp[0],						
						dosaggi: [ { 
							dosaggio: fp[1], 
							aic: [ data[i].aic ] 
						} ]	
					};
					selectionMap_[selectionMap_.length] = f;
				}
												
				var d = selectMap(fp[0], fp[1]);
				
				if (!d) {
					d = { dosaggio: fp[1], aic: [ '' ] };							
					f.dosaggi[f.dosaggi.length]	= d;
				}
				
				d.aic[d.aic.length] = data[i].aic;

			}				
			
			for (var j = 0; j < selectionMap_.length; j ++) {				
				
				if (!selectionMap_[j].forma) continue;
				if (selectionMap_[j].forma.length == 0) continue;
				
				html += '<tr><td align="left">';
				html += '<a href="javascript: OnClickForma(\'' + selectionMap_[j].forma + '\')" ';
				html += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
				html += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important; word-wrap: break-word;">'; 
				html += '<span class="ui-btn-inner" style="vertical-align: middle;">';
				html += '<span class="ui-btn-text" style="font-size: 14px;">' + decodificaFormaFarmaceutica (selectionMap_[j].forma) + '</span>';
				html += '</span>';
				html += '</a>'										
				html += '</td></tr>';												
			}			
			
			$("#menuforma").html(html);				
			$("#menuforma").slideToggle( "slow", function() {});
			$.mobile.changePage('#search', { 
				allowSamePageTransition: true, 
				transition: 'slide'
			});						
		},
		
		error: function (data) {                           
			msgbox ("La ricerca per principio attivo ha causato un errore:<br/>" + data);
		}
		
	});		

}

function cercaPerPrincipioAttivo(v) {
		
	if (v.length == 0) {
		msgbox ('Inserire il nome del principio attivo');
		return;
	}
	
	autocompleteTextBox.val(v);
	
	selectionMap_ = null;

	$.ajax ({
		
		url: QUERY_URL,
		
		dataType: 'json',
		crossDomain: true,
		
		data: { 
			sql: fillcommand (
				"select distinct top 1000 " +
				"  substring(TS052.FDI_T504, charindex('*', TS052.FDI_T504) +1, 1000) as dx " +
				"from TS052 " +
				"where " +
				"  TS052.FDI_T504 like ? " +
				"order by 1 asc" ,
				[
					'text:' + v + '*%'
				]
			), 
			encoding: dataset.encoding
		},                     
		
		method: 'POST',
		
		success: function (data) {
		
			if (!data || data.length <= 0) {					
				msgbox ('Principio attivo<br/>' + getInputValue() + '<br/>inesistente', 'Avviso', 200);
				return;
			}
			
			//setInputValueEnabled(false);	
			
			$("#cerca0").html(				
				'<a href="javascript:goback();" style="text-decoration: none; color: #e0e0e0; position: absolute; left: 0px;">&#10094;</a>' +
				'selezionare tipologia');
				
				
			$("#menucerca").hide();				
			$("#menuforma").hide();				
			
			var html = '';				
			savedHtml = '';		
							
			var JN = 0;
			var listaDosaggiPerForma = [ '' ];
			
			for (var i = 0; i < data.length; i++) {
						
				var fp = data[i].dx.split('*');		

				//
				// creo la mappa forme / dosaggi
				//
				
				var gotIt = false;
				
				for (var j = 0; j < JN; j += 2) {
					if (fp[0] == listaDosaggiPerForma[j]) {
						var dosaggi = listaDosaggiPerForma[j + 1];
						if (dosaggi.indexOf('|' + fp[1] + '|') < 0) {								
							listaDosaggiPerForma[j + 1] += fp[1];
							listaDosaggiPerForma[j + 1] += '|';
						}
						gotIt = true;
						break;
					}
				}
				
				if (!gotIt) {
					JN += 2;
					listaDosaggiPerForma[JN - 2] = fp[0];
					listaDosaggiPerForma[JN - 1] = fp[1];
					listaDosaggiPerForma[JN - 1] += '|';
				}

			}				
			
			var orderedList = ordinaListaDosaggiPerForma (listaDosaggiPerForma);
			
			for (var j = 0; j < JN; j += 2) {
				html += '<tr><td align="left">';					
				html += '<a href="javascript: OnClickForma(\'' + orderedList[j] + '\', \'' + orderedList[j + 1] + '\')" ';						
				html += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
				html += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
				html += '<span class="ui-btn-inner" style="vertical-align: middle;">';
				html += '<span class="ui-btn-text" style="font-size: 14px;">' + decodificaFormaFarmaceutica (orderedList[j]) + '</span>';
				html += '</span>';
				html += '</a>';										
				html += '</td></tr>';												
			}				
			
			$("#menuforma").html(html);				
			$("#menuforma").slideToggle( "slow", function() {});
			$.mobile.changePage('#search', { 
				allowSamePageTransition: true, 
				transition: 'slide'
			});						
		},
		error: function (data) {                           
			msgbox ("La ricerca per principio attivo ha causato un errore:<br/>" + data);
		}
	});			

}		

function deviceReadyInitializer()
{
    //
    // Assign javascript callbacks of pages controls 
    //	
	window.location.hash="no-back-button";
	window.location.hash="Again-No-back-button";
	window.onhashchange=function(){window.location.hash="no-back-button";}
	
    $('#cerca3').on("click", function() {         
        startBarcodeScanner();        
    });
		
	$('#resultsMenu :input').change(function(){        
        switch (this.name) {
            case 'choice-1':
                dataset.nascondiPrezzoND = this.checked;
                populateResults();
                break;
            case 'choice-2':
                dataset.nascondiRimborsoND = this.checked;
                populateResults();
                break;
        } 
    });            

	$('#searchclickProducts').on("click", function() {    		
		$("#cerca0").html('');	
		if (autocompleteTextBox) autocompleteTextBox.val('');
		$("#menuforma").hide();		
		$("#menucerca").hide();		
		//setInputValueEnabled(true);
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
		$("#cerca0").html('');			
		if (autocompleteTextBox) autocompleteTextBox.val('');
		$("#menuforma").hide();		
		$("#menucerca").hide();		
		//setInputValueEnabled(true);
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

    if (typeof cordova == "undefined") {
        //$("#cerca3").hide();
    }
    
    $("#autocomplete").on("filterablebeforefilter", function (e, data) {

        var $ul = $(this),
                $input = $(data.input),
                value = $input.val(),
                html = "";  

        $ul.html(""); 
		
		if (!autocompleteTextBox) {
			autocompleteTextBox = $input;
			$input.on('change', function(){				
				$("#menuforma").hide();		
				$("#menucerca").hide();						
				$("#menucerca").slideToggle("slow", function() {});						
				//console.log('detected change, value: <' + $input.val() + '>');
			});
			
			autocompleteTextBox.onChange = function() { }
		}
		
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
				
			/*var _sql = fillcommand (
				"select distinct top 1000 " +
				"  'A|' + left(TS052.FDI_T504, charindex('-', TS052.FDI_T504) - 1) " +
				"from TS052 " +
				"where " +
				"  TS052.FDI_T504 like ? " +
				"union " +
				"select distinct top 1000 'B|' + left(FDI_4875, charindex('*', FDI_4875) - 1) " +
				"from APP_CA " +
				"where " +
				"  FDI_4875 like ?" +
				"order by 1 asc",
				[
					'text:' + v1 + '%',
					'text:' + v2 + '%'
				]
			);*/

			/*
			var _sql = fillcommand (	
				"select distinct top 1000 " +
				"  'A|' + left(TS052.FDI_T504, charindex('-', TS052.FDI_T504) - 1) " +
				"from TS052 " +
				"inner join TR041 on TS052.FDI_T503 collate Latin1_General_CI_AS = TR041.FDI_T507 " +
				"inner join APP_CA on TR041.FDI_T505 collate Latin1_General_CI_AS = APP_CA.FDI_0001 " +
				"where TS052.FDI_T504 like ? " +
				"  and (APP_CA.FDI_0021 IN ('A', 'C', 'CN')) " +
				"union " +
				"select distinct top 1000 'B|' + left(FDI_4875, charindex('*', FDI_4875) - 1) " +
				"from APP_CA " +
				"where FDI_4875 like ? " +
				//"	and (not (FDI_1094 is NULL)) or (not (FDI_1010 is NULL)) " +
				"order by 1 asc",
				[
					'text:' + v1 + '%',
					'text:' + v2 + '%'
				]
			);	
			*/
			
			var _sql = fillcommand (
				"select distinct top 1000 " +
				"  'A|' + left(TS052.FDI_T504, charindex('*', TS052.FDI_T504) - 1) " +
				"from TS052 " +
				"inner join TR041 on TS052.FDI_T503 collate Latin1_General_CI_AS = TR041.FDI_T507 " +
				"inner join APP_CA on TR041.FDI_T505 collate Latin1_General_CI_AS = APP_CA.FDI_0001 " +
				"where TS052.FDI_T504 like ? " +
				//"  and (APP_CA.FDI_0021 IN ('A', 'C', 'CN')) " + // filtro no ospedalieri da ricerca per p.a.
				"union " +
				"select distinct top 1000 'B|' + left(APP_CA.FDI_4875, charindex('*', APP_CA.FDI_4875) - 1) " +
				"from APP_CA " +
				"left outer join TR041 on TR041.FDI_T505 = APP_CA.FDI_0001 " +
				"where APP_CA.FDI_4875 like ? " +
				"and (not (TR041.FDI_T505 is NULL)) " + 		// filtro no farmaci non presenti in TS052
				//"	and (not (APP_CA.FDI_1094 is NULL)) or (not (APP_CA.FDI_1010 is NULL)) " +	// filtro no farmaci senza gruppi di equivalenza
				"order by 1 asc",
				[
					'text:' + v1 + '%',
					'text:' + v2 + '%'
				]
			);	
			
			/*
			var _sql = fillcommand (	
				"select distinct top 1000 " +
				"  'A|' + left(TS052.FDI_T504, charindex('*', TS052.FDI_T504) - 1) + '|' + TS052.FDI_503" +
				"from TS052 " +
				"inner join TR041 on TS052.FDI_T503 collate Latin1_General_CI_AS = TR041.FDI_T507 " +
				"inner join APP_CA on TR041.FDI_T505 collate Latin1_General_CI_AS = APP_CA.FDI_0001 " +
				"where TS052.FDI_T504 like ? " +
				"  and (APP_CA.FDI_0021 IN ('A', 'C', 'CN')) " + // filtro no ospedalieri da ricerca per p.a.
				"union " +
				"select distinct top 1000 'B|' + left(APP_CA.FDI_4875, charindex('*', APP_CA.FDI_4875) - 1) + '|' + TR041.FDI_507 " +
				"from APP_CA " +
				"left outer join TR041 on TR041.FDI_T505 = APP_CA.FDI_0001 " +
				"where APP_CA.FDI_4875 like ? " +
				"and (not (TR041.FDI_T505 is NULL)) " + 		// filtro no farmaci non presenti in TS052
				//"	and (not (APP_CA.FDI_1094 is NULL)) or (not (APP_CA.FDI_1010 is NULL)) " +	// filtro no farmaci senza gruppi di equivalenza
				"order by 1 asc",
				[
					'text:' + v1 + '%',
					'text:' + v2 + '%'
				]
			);
			*/
				
            $.ajax({
				
                url: QUERY_URL,
                dataType: "jsonp",
                crossDomain: true,				
                
				data: {
					sql: _sql, 
					encoding: dataset.encoding
				}
				
            })
            .then (function (response) {
				
				var lst = '|';
				
				$.each(response, function (i, val) {
					
					var v = null;
					
					var f = val.split('|');
					
					if (f[0] == 'A') {
						v = f[1]; //.replace(/\//gi, ' + ');
						if (lst.indexOf("|" + v + "|") >= 0) return;
						lst += v + '|';						
						v = '<span style="color: #007700;">' + v + '</span>';
					}
					else if (f[0] == 'B') {
						v = f[1].replace(/\(/gi, '<i style="font-size: smaller;">')
								.replace(/\)/gi, '</i>');
						if (lst.indexOf("|" + v + "|") >= 0) return;
						lst += v + '|';						
						v = '<span style="color: #000077;">' + v + '</span>';
					}
					
					html += "<li><a href=\"javascript:OnClickAutocomplete('" + 
							f[1] + "', '" + f[0] + "')\">" + v + "</a></li>";
							
                });	
				
                $ul.html(html);
                $ul.listview("refresh");
                $ul.trigger("updatelayout");
            });
			
        }
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
			console.log(' **** backspace pressed');
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
			console.log(' **** tab pressed');
        }        
		else if (keycode == '13') { 	// CR
			console.log(' **** carriage return pressed');
        }        
		
		if (doPrevent) {
			//event.preventDefault();
		}
		
    });	
	
	$('#search').on("swiperight", function () {                      				
		goback();
	});
	
	$('#results').on("swiperight", function () {                      				
		goback();
	});
	
}

function goback() {
	if ($("#cerca0").html().length == 0)  return;
	$("#cerca0").html('');			
	$("#autocomplete").html('');			
	setTimeout (
		function() {
			$.mobile.changePage('#search', { 
				reverse: true,
				allowSamePageTransition: true, 			
				transition: 'slide'
			})				
			$("#menuforma").hide();		
			$("#menucerca").hide();		
			//setInputValueEnabled(true);
			$("#menucerca").slideToggle("slow", function() {});				
		},
		200);
}


function onKeyboardHide() {
    console.log (' **** onKeyboardHide ...');
}

function onKeyboardShow() {
    console.log (' **** onKeyboardShow ...');
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
            console.log('Received Event: ' + id); 
        }
    }

};
