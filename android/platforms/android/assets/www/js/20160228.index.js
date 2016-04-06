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

/* ************************************************************
 *
 *  Phonegap Plugins: 
 *  -----------------
 *      phonegap plugin add https://github.com/wildabeast/BarcodeScanner.git 
 * 		http://docs.phonegap.com/en/2.0.0/cordova_storage_storage.md.html
 *
 *  Documentation:
 *  --------------
 *  JQuery Mobile API Guide:
 *      @see http://demos.jquerymobile.com/1.0rc2/docs/api/events.html
 *      @see http://demos.jquerymobile.com/1.4.5/icons/       
 *
 *
 * HOWTO STRINGIFYFI
 * -----------------
 * var s = JSON.stringify(data);                
 *  s = s.replace(/\[/gi, '\[\n\t').replace(/\}/gi, '\}\n\t\t');        
 *
 *
 *
 *	Schema Tabella 
 *	--------------
 * 
 *		CREATE TABLE [dbo].[APP_CA](
 *			[FDI_0001] [varchar](9) NULL,		-- Codice prodotto
 *			[FDI_0004] [varchar](30) NULL,		-- Descrizione prodotto
 *			[FDI_0040] [varchar](4) NULL,		-- Codice ditta
 *			[FDI_0041] [varchar](30) NULL,		-- Ragione sociale ditta
 *			[FDI_0021] [varchar](2) NULL,		-- Classe
 *			[FDI_10A0] [varchar](3) NULL,		-- Codice gruppo lista di trasparenza classe A
 *			[FDI_1094] [varchar](13) NULL,		-- Codice gruppo lista di trasparenza classe C
 *			[FDI_9238] [numeric](8, 3) NULL,	-- prezzo attuale logico
 *			[FDI_0491] [numeric](8, 3) NULL,	-- prezzo di rimborso nazionale
 *			[FDI_0339] [numeric](6, 0) NULL,	-- codice principio attivo
 *			[FDI_0340] [varchar](200) NULL, 	-- descrizione principio attivo
 *			[FDI_0363] [numeric](6, 0) NULL,	-- codice principio attivo base
 *			[FDI_0364] [varchar](200) NULL, 	-- descrizione principio attivo base
 *			[FDI_4875] [varchar](max) NULL,		-- descrizione estesa
 *			[FDI_0371] [varchar](30) NULL,		-- descrizione forma farmaceutica
 *			[FDI_0578] [varchar](40) NULL,		-- forma farmaceutica di riferimento
 *			[FDI_1010] [varchar](3) NULL,		-- codice gruppo di equivalenza
 *			[FDI_9159] [varchar](1) NULL		-- flag lista di trasparenza
 *			[FDI_9172] ????						-- flag generico
 *		) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
 *
 * 
 * 
 * *************************************************************/

var ENDPOINT_PROD = 'http://www.farmastampati.mobi/FarmastampatiMobi';
var ENDPOINT_TEST = 'http://127.0.0.1:60510';

//var ENDPOINT = ((typeof cordova == "undefined") ? ENDPOINT_TEST : ENDPOINT_PROD);
var ENDPOINT = ENDPOINT_TEST;
//var ENDPOINT = ENDPOINT_PROD;

var MAX_AUTOCOMPLETE_RESULTS_LIST = 200;
var MAX_RESULTS_SIZE = 1000;

var ND = 'non disponibile';

var QUERY_URL = ENDPOINT + '/query';

var autocompleteTextBox = null;

var OPT_STRICT_FILTER = false;

var dataset = {
	
    "dati": null,
	"nascondiPrezzoND" : false,
    "nascondiRimborsoND" : false,
	"encoding": "base64" 			// Query encoding format < "base64" | "xor" | null >
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

function decodificaDescrizioneBreve(s, separatore)
{
	
	var x = s.split('*');
	
	var nome = x[0];
	if (x[0].indexOf('(') > 0) {
		nome = x[0].split('(')[0];
	}
	var dosaggio = '';
	if (x.length > 1) {
		dosaggio = x[1]
			.replace(/gtt/g, 'gocce')
			.replace(/cpr/g, 'compresse')
			.replace(/cps/g, 'capsule')
			;
	}	
	return nome + (separatore ? separatore : ' ' ) + dosaggio;

}

function estrai(p, pselector, ending)
{
	for (var j = 0; j < p.length; j ++) {
		if (ending) {
			if (p[j].indexOf(pselector) == p[j].length - pselector.length) {
				return p[j];
			}
		}
		else {
			if (p[j].indexOf(pselector) >= 0) {
				return p[j];
			}
		}		
	}
	return null;
}

function estraiToken(s, pselector)
{
	var k = s.indexOf('*') + 1;
	var v = '';
	var n = 0;
	var p = [ '', '', '', '', '' ];
	
	for (var i = k; i < s.length; i++) {		
	
		c = s.charAt(i);		
		
		if (c == ' ') {
			n ++;
		}
		else {
			if (n < p.length) {
				p[n] += c;
			}
		}	
		
	}
		
	return estrai(p, pselector);
}

function estraiDosaggio(s, normalize)
{
	var d = estraiToken(s, 'MG');
	if (d == null) {
		d = estraiToken(s, 'G');
		if (normalize && d == '0,5G') d = '500MG';
		if (normalize && d == '1G') d = '1000MG';
	}
	if (d == null) {
		d = estraiToken(s, 'M', true);
		if (normalize && d != null) d += 'G';
	}
	
	//
	// TODO other tokens to find here ...
	//	
	
	return d == null ? null : d
		.replace(/RIV/gi, '');
}

function estraiUnitaPosologiche(s)
{
	var d = estraiToken(s, 'CPR');
	if (d == null) d = estraiToken(s, 'CPS');
	if (d == null) d = estraiToken(s, 'BUST');
	if (d == null) d = estraiToken(s, 'BS');
	
	//
	// TODO other tokens to find here ...
	//
	
	return d == null ? null : d
		.replace(/CPR/gi, ' compresse')
		.replace(/CPS/gi, ' capsule')
		.replace(/BUST/gi, ' bustine')
		.replace(/BS/gi, ' bustine');
}


function fillcommand(command, params) 
{
	var count = 0;
	var data = command.replace (/\?/gi, function __f001(x) {		
			if (count > params.length || typeof params[count] == 'undefined') return x;
			var value = params [count ++];			
			if (value.indexOf && value.indexOf('text:') == 0) {
				value = "'" + escapechar(value.substring(5, value.length), '\'') + "'";
			}
			return value;
		}
	);	
	
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
    var rec = null;
    var html = '';
	
    $("#resultsList").empty();
	
	var data = dataset.dati;

	var count  = 0;
	
	//var m = new Map();
	
    for (var i = 0; data != null && i < data.length; i++) {

        rec = data[i];				
		
		var descrizione	= decodificaDescrizioneBreve(rec.descrizione, '<br/>');		
        
		var prezzo = formatPrice(rec.prezzoAlPubblico);
        
		var rimborso = formatPrice(rec.prezzoRimborsoNazionale);

        if (prezzo == ND && dataset.nascondiPrezzoND) continue;
        if (rimborso == ND && dataset.nascondiRimborsoND) continue;

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////		
		// TODO
		//console.log(' --> ' + forma_ + ' ---- ' + rec.forma + ' - ' + rec.descrizione + ' - ' + descrizione + '\r\n');
		if (OPT_STRICT_FILTER) {
			if (forma_.indexOf(rec.forma) < 0)  continue;
		}
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var mm = estraiDosaggio(dosaggio_)
				.replace(/MG/g, ' mg')
				.replace(/0,5G/g, '500 mg')
				.replace(/1G/g, '1000 mg');
		if (mm.indexOf('mg') > 0 && mm.indexOf('+') > 0) mm = mm.replace(/\+/g, ' mg + ');
		
		if (rec.descrizione.indexOf(mm) < 0) {
			console.log('SKIPPING  --> ' + dosaggio_ + ' - \'' + rec.descrizione + '\' doesn\'t contain? \'' + mm + '\'\r\n');	
			continue;	
		}

		var xstyles = rec.inListaDitrasparenza == 'N' && rec.generico == 'N' ? 'style="color: red;"' : '';
		
        html += '<li data-role="list-divider" ' + xstyles + '>';
        html += '<span class="x-scrolling">';
        html += descrizione;
		html += '</span>'
		
        html += '<br/><span style="font-size: smaller;">';
        html += rec.ditta;
		
        if (prezzo != ND) {
            html += '<br/>Prezzo <font color="' + (prezzo == ND ? 'darkRed' : 'darkBlue') + '">'; 
            html += prezzo;
            html += '</font><br/>';        
        }
				
        if (rimborso != ND) {                    
            html += '<br/>Rimborso nazionale '; 
            html += rimborso;
			html += '<br/>';        
        }				
		
		if (rec.inListaDiTrasparenza == 'S') {
			html += '<img src="images/inlista.png" style="border: 0px; width: 16px;" alt="in lista di trasparenza"/>';	
		}
				
		/*
		else if (rec.classe != 'A') {
			html += '<br/><span style="color: red;">il farmaco non &egrave; rimborsato</span>';	
		}
		*/
		
		if (rec.classe == 'CN') rec.classe = 'CNN';
		html += '&nbsp;<span>Classe di rimborsabilit&agrave; ' + rec.classe + '</span>';	
		
		if (rec.generico == 'S') {
			html += '&nbsp;<span>Farmaco Generico</span>';					
		}		
		
        html += '</span>';
        html += '</li>';

		var key = estraiUnitaPosologiche(rec.descrizioneBreve);		
		
		//var x = m.get (key);
		//if (x == null) x = '';
		//m.set (key, x + html);	
				
		count ++;

    }
	
	var ht = html;
	/*
	var ht = '';
	m.forEach(
		function(value, key) {
			ht += '<li data-role="list-divider" style="background: white; font-weight: bolder; font-size: 16px; color: darkBlue;">';
			ht += key;
			ht += '</li>';
			ht += value 
		}, 
		m
	);
	*/

    $("#resultsList").append(ht);	
    $('#resultsList').listview().listview("refresh");    
	
    return count ;
}

function getItemsByCodeList_A(codeValue)
{
    //getItemsByCodeList("FDI_10A0", codeValue);
	getItemsByCodeList("FDI_1010", codeValue);
}

function getItemsByCodeList_C(codeValue)
{
    getItemsByCodeList("FDI_1094", codeValue);
}

function getItemsByCodeList(codeKey, codeValue)
{   	
	var _sql = fillcommand(
        "SELECT TOP ? " +
        "    FDI_0001 as codice, " + 
        "    ISNULL(FDI_4875, FDI_0004) as descrizione, " +
		"    FDI_0004 as descrizioneBreve, " + 
        "    FDI_0040 as codiceDitta, " +
        "    FDI_0041 as ditta, " +
        "    FDI_0021 as classe, " +
		"    FDI_0371 as forma, " +
	    "    CASE FDI_9238 WHEN 0 THEN 99999.99 ELSE FDI_9238 END as prezzoAlPubblico, " +
	    "    CASE FDI_0491 WHEN 0 THEN 99999.99 ELSE FDI_0491 END as prezzoRimborsoNazionale, " +
        "    FDI_0364 as principioAttivoBase, " +
        "    FDI_0340 as principioAttivo, " +
		"    FDI_9159 as inListaDiTrasparenza, " +
		"    FDI_9172 as generico " +
        "FROM APP_CA " +
        "WHERE ? = ? " +		
		//"AND (FDI_9159 <> 'N' OR FDI_9172 <> 'N') " + //rimuove i brand dalla lista finale			
        "ORDER BY prezzoAlPubblico ASC, descrizione ASC",
		[
			MAX_RESULTS_SIZE, 
			codeKey, 
			'text:' + codeValue
		]
	);	
	
	getItemsBySql(_sql)
	
}

function getItemsByCustomFilter(productsFilter)
{   	
	var _sql = fillcommand(
        "SELECT TOP ? " +
        "    FDI_0001 as codice, " + 
        "    ISNULL(FDI_4875, FDI_0004) as descrizione, " +
		"    FDI_0004 as descrizioneBreve, " + 
        "    FDI_0040 as codiceDitta, " +
        "    FDI_0041 as ditta, " +
        "    FDI_0021 as classe, " +
		"    FDI_0371 as forma, " +
	    "    CASE FDI_9238 WHEN 0 THEN 99999.99 ELSE FDI_9238 END as prezzoAlPubblico, " +
	    "    CASE FDI_0491 WHEN 0 THEN 99999.99 ELSE FDI_0491 END as prezzoRimborsoNazionale, " +
        "    FDI_0364 as principioAttivoBase, " +
        "    FDI_0340 as principioAttivo, " +
		"    FDI_9159 as inListaDiTrasparenza, " +
		"    FDI_9172 as generico " +
        "FROM APP_CA " +
        "WHERE " + productsFilter + " " +		
		//"AND (FDI_9159 <> 'N' OR FDI_9172 <> 'N') " + //rimuove i brand dalla lista finale			
        "ORDER BY prezzoAlPubblico ASC, descrizione ASC",
		[
			MAX_RESULTS_SIZE 		
		]
	);	
	
	getItemsBySql(_sql)
	
}
	
function getItemsBySql(_sql) {
	
    $.ajax ({

        url: QUERY_URL,
        dataType: 'json',
        crossDomain: true,
        data: { 
			sql: _sql,
			encoding: dataset.encoding
		}, 
		method: 'POST',
	
        success: function (data) {
		
            if (!data || data.length <= 0) {
                msgbox('il farmaco non ha equivalenti', 'Avviso', 500);
                return;
            }
			
			dataset.dati = data;
			            
            if (populateResults() > 0) {            
				$.mobile.changePage('#results', { 
						allowSamePageTransition: true, 
						transition: 'slide'
				});
			}
			else {
				msgbox('il farmaco non ha equivalenti', 'Avviso', 500);
                return;				
			}
			
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
	
    if (typeof cordova == "undefined") {
        msgbox("Funzione non disponibile in questa versione");
        return;
    }	

    $('#resultsList').html('');
    
    //
    // BEGIN phonegap-plugin-barcodescanner block
    // gitrepo @ https://github.com/wildabeast/BarcodeScanner.git 
    // gitrepo @ phonegap plugin add https://github.com/RoughshodNetworks/phonegap-plugin-barcodescanner.git

    cordova.plugins.barcodeScanner.scan 
    (
        function (result) 
        {  
            if (result.cancelled) {                
                return;
            }
            if (result.format == 'CODE_39') {
                var code = conv32To10(result.text, 9);
                if (code.indexOf('A') >= 0) code = code.substr(1);
                cercaprodottiPerAIC (code);
            }
            else {
                msgbox("Il codice a barre non &egrave; valido<br/>provare con un altro codice a barre riportato sulla scatola");
            }
        }, 

        function (error) 
        {
          msgbox("Scansione fallita<br/>codice di errore:" + error);
        }
        /*,
        { 
            "PROMPT_MESSAGE": 
                "Inquadrare il rettangolo sul codice a barre\n" +
                "Premere il pulsande indietro per annullare l'operazione"
        }*/
    ); 

    //
    // END phonegap-plugin-barcodescanner block
    // 
}

//
// not to be passed through minifier
//

var searchBy = null;

function onAutocompleteClick(code, type)
{   
	$('#autocomplete').html("");    
	$('#autocomplete').listview("refresh");
	$('#autocomplete').listview().listview("refresh");
	
    $('#search').find("input").val(code); 
	searchBy = type;
	switch (type) {
		case 'P':
			$('#cerca1').click();
			break;
		case 'F':
			$('#cerca2').click();
			break;
	}
}

function cercaprodottiPerPrincipioAttivo () {
		
	var value = getInputValue();	
	var forma = forma_;	
	var dosaggio = dosaggio_;	
		
	var _sql = fillcommand (
		"SELECT TOP ? " +
			"FDI_0001 as codice, " +
			"FDI_4875 as descrizione, " +
			"FDI_0004 as descrizioneEstesa, " +
			"FDI_0371 as forma, " +
			"FDI_0040 as codiceDitta, " +
			"FDI_0041 as ditta, " + 
			"FDI_0021 as classe, " + 	
			"FDI_10A0 as lista_AH, " +
			"FDI_1094 as lista_C, " +
			"FDI_1010 as lista_P_A_B, " +
			"CASE FDI_9238 WHEN 0 THEN 99999.99 ELSE FDI_9238 END as prezzoAlPubblico, " +	    
			"CASE FDI_0491 WHEN 0 THEN 99999.99 ELSE FDI_0491 END as prezzoRimborsoNazionale, " +
			"FDI_9159 as inListaDiTrasparenza, " +	
			"FDI_9172 as generico " +			
		"FROM APP_CA " + 
		"WHERE FDI_0364 = ? " +
			"AND FDI_0021 in ('A', 'C', 'CN') " +
			"AND FDI_0371 = ? " +			
			"AND FDI_0004 like ? " +			
		"ORDER BY prezzoAlPubblico ASC, descrizioneEstesa ASC",
		[
			MAX_RESULTS_SIZE, 
			'text:' + value, 
			'text:' + forma,
			'text:%' + dosaggio
		]
	);
		
	$('#productsHeader').html(value + "<br/>" + forma);
			
	cercaprodotti (value, forma, _sql); 
    
}

function cercaprodottiPerNome () {

	var value = getInputValue();	
	var forma = forma_;	
	var dosaggio = dosaggio_;	
	
	var _sql = fillcommand (
		"SELECT TOP ? " +
			"FDI_0001 as codice, " +
			"FDI_4875 as descrizione, " +
			"FDI_0004 as descrizioneEstesa, " +
			"FDI_0371 as forma, " +
			"FDI_0040 as codiceDitta, " +
			"FDI_0041 as ditta, " + 
			"FDI_0021 as classe, " + 	
			"FDI_10A0 as lista_AH, " +
			"FDI_1094 as lista_C, " +
			"FDI_1010 as lista_P_A_B, " +
			"CASE FDI_9238 WHEN 0 THEN 99999.99 ELSE FDI_9238 END as prezzoAlPubblico, " +	    
			"CASE FDI_0491 WHEN 0 THEN 99999.99 ELSE FDI_0491 END as prezzoRimborsoNazionale, " +
			"FDI_9159 as inListaDiTrasparenza, " +	
			"FDI_9172 as generico " +			
		"FROM APP_CA " + 
		"WHERE FDI_0004 like ? " +
			"AND FDI_0021 in ('A', 'C', 'CN') " +
			"AND FDI_0371= ? " +			
		"ORDER BY prezzoAlPubblico ASC, descrizioneEstesa ASC",
		[ 
			MAX_RESULTS_SIZE, 
			'text:' + value + '*%', 
			'text:' + forma,
			'text:%' + dosaggio
		]
	);
	
	$('#productsHeader').html(value + "<br/>" + forma);			
			
	cercaprodotti (value, forma, _sql); 
		
}


function cercaprodotti (value, forma, _sql) {
	
	$.ajax ({

		url: QUERY_URL,
		dataType: 'json',
		crossDomain: true,
		
		data: { 
			sql: _sql,
			encoding: dataset.encoding
		}, 
		
		method: 'POST',

		success: function (data) {
			
			$('#resultsHeader').html(
				'ELENCO FARMACI EQUIVALENTI<br/>' + value + '<br/>' + forma + '&nbsp;' + decodificaDosaggio(dosaggio_, true));
				
			if (!data || data.length <= 0) {
				msgbox (
					"Il prodotto selezionato non possiede<br/>nessun farmaco equivalente", 'Avviso', 200);
				return;
			}
									
			dataset.dati = data;

			//
			// popolamento lista prodotti per forma selezionata
			//
			
			var rec = null;
			var html = '';
	
			$("#productsList").empty();
	
			var data = dataset.dati;
			
			var productsFilter = '';

			for (var i = 0; data != null && i < data.length; i++) {
				
				rec = data[i];
				
				/*
								
				var xstyles = '';

				if (rec.generico == 'N' && rec.inListaDiTrasparenza == 'N') {
					xstyles = 'style="color: red;"';						
				}
				
				if (rec.generico == 'S') continue;
				html = '<li data-role="list-divider" ' + xstyles + '>';
				html += '<span class="x-scrolling">';
				html += decodificaDescrizioneBreve(rec.descrizione, '<br/>');
				html += '</span>'

				html += '<br/><span style="font-size: smaller;">';
				html += rec.ditta;
				var prezzo = formatPrice (rec.prezzoAlPubblico);
				
				if (prezzo != ND) {
					html += '<br/>Prezzo <font color="' + (prezzo == ND ? 'darkRed' : 'darkBlue') + '">'; 
					html += prezzo;
					html += '</font>';        
					if (rec.generico != 'N') html += ' (generico)';
					if (rec.inListaDiTrasparenza != 'N') html += ' (LT)';
					var rimborso = formatPrice (rec.prezzoRimborsoNazionale);
					if (rimborso != ND) html += ' il farmaco &egrave; rimborsato';					
					html += '<br/>';
				}				

				html += '</span>';
				html += '</li>';

				html+= '<li>';            
				html += '<a ';
				switch(rec.classe) {
					case 'A':
					case 'H':
						html += 'href="javascript:getItemsByCodeList_A(\'' + rec.lista_P_A_B + '\')">';
						if (productsFilter.length > 0) productsFilter += " OR ";
						productsFilter += "FDI_1010 = '" + rec.lista_P_A_B + "'";
						break;
					case 'C':
					case 'CN':	
						html += 'href="javascript:getItemsByCodeList_C(\'' + rec.lista_C + '\')">';
						if (productsFilter.length > 0) productsFilter += " OR ";
						productsFilter += "FDI_1094 = '" + rec.lista_C + "'";
						break;
					default:
						html += 'href="#">';
				}		
				
				html += '<span>';
				html += 'Visualizza i farmaci equivalenti';					
				html += '</span>';
				html += '</a>';
				html += '</li>';
				
				$("#productsList").append(html);
				*/
				
				switch(rec.classe) {
					case 'A':
					case 'H':						
						if (productsFilter.length > 0) productsFilter += " OR ";
						productsFilter += "FDI_1010 = '" + rec.lista_P_A_B + "'";
						break;
					case 'C':
					case 'CN':							
						if (productsFilter.length > 0) productsFilter += " OR ";
						productsFilter += "FDI_1094 = '" + rec.lista_C + "'";
						break;
					default:
						console.log('classe non trovata per ' + rec.descrizione + ' ! ---> ' + rec.classe);;
				}

			}
			
			getItemsByCustomFilter(productsFilter);
			
			/*
			$('#productsList').listview().listview("refresh");
			
			$.mobile.changePage('#products', { 
					allowSamePageTransition: true, 
					transition: 'slide'
			});
			*/
		},

		error: function (data) {                           
			msgbox ("La ricerca della lista dei farmaci ha causato un errore");
		}

	});
	
}

function cercaprodottiPerAIC(codeValue)
{
	var _sql = fillcommand (
        "SELECT TOP 1 " +
        " FDI_0021 as classe, " +    
		"FDI_1010 as codice_P_A_B, " +
		"FDI_1094 as codice_C " +		
        "FROM APP_CA " + 
        "WHERE FDI_0001 = ? ",
		[
			'text:' + codeValue
		]
	);

    $.ajax ({

        url: QUERY_URL,
        dataType: 'json',
        crossDomain: true,
        
		data: { 
			sql: _sql, 
			encoding: dataset.encoding
		},                     
		
		method: 'POST',

        success: function (data) {
            
            if (!data || data.length <= 0) {
                msgbox ("Non esistono farmaci equivalenti per la ricerca effettuata<br/>");
                return;
            }
            
			switch (data[0].classe) {
				case 'A':
					getItemsByCodeList_A (data[0].codice_P_A_B);
					break;
				case 'C':
				case 'CN':
					getItemsByCodeList_C (data[0].codice_C);
					break;				
				default:
					msgbox (
						"Il farmaco selezionato non appartiene a nessuna delle classi visualizzabili<br/>" + 
						"classe di appartenenza: " + data[0].classe + ".", "Avviso", 200);	
			}
            
        },

        error: function (data) {                           
            msgbox ("La ricerca dei farmaci equivalenti ha causato un errore<br/>" +
                "Messaggio di errore dal server:<br/>" + data);
        }

    });    
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

/*
var swipe_enabled = true;

function enable_swipe(on) 
{
	swipe_enabled = on;
}
*/

function decodificaDosaggio(s) {

	var r = null;
		
	return estraiDosaggio(s, true);	
		
	/*
	if (!r) r = s.match(/\d+,\d+MG/g);
	if (r) r[0] = r[0].replace(/MG/g, ' milligrammi');
	
	if (!r) r = s.match(/\d+MG/g);	
	if (r) r[0] = r[0].replace(/MG/g, ' milligrammi');
	
	if (!r) r = s.match(/\d+,\d+ML/g);	
	if (r) r[0] = r[0].replace(/ML/g, ' millilitri');
	
	if (!r) r = s.match(/\d+ML/g);
	if (r) r[0] = r[0].replace(/ML/g, ' millilitri');	
	
	if (!r) r = s.match(/\d+,\d+L/g);	
	if (r) r[0] = r[0].replace(/L/g, ' litri');
	
	if (!r) r = s.match(/\d+L/g);
	if (r) r[0] = r[0].replace(/L/g, ' litri');
	
	if (!r) r = s.match(/\d+,\d+G/g);	
	if (r) r[0] = r[0].replace(/G/g, ' grammi');
	
	if (!r) r = s.match(/\d+G/g);
	if (r) r[0] = r[0].replace(/G/g, ' grammi');
	
	if (!r) r = s.match(/\d+,\d+MCG/g);	
	if (r) r[0] = r[0].replace(/MCG/g, ' microgrammi');
	
	if (!r) r = s.match(/\d+MCG/g);	
	if (r) r[0] = r[0].replace(/MCG/g, ' microgrammi');
		
	if (!r) r = s.match(/\d+CPR/g);	
	if (r) r[0] = r[0].replace(/CPR/g, ' compresse');
	
	if (!r) r = s.match(/\d+BUST/g);	
	if (r) r[0] = r[0].replace(/BUST/g, ' bustine');
	
	if (!r) r = s.match(/\d+BS/g);	
	if (r) r[0] = r[0].replace(/BS/g, ' bustine');
	
	if (!r) r = s.match(/\d+SUPP/g);
	if (r) r[0] = r[0].replace(/BS/g, ' supposte');
	
	if (!r) r = s.match(/\d+FL/g);
	if (r) r[0] = r[0].replace(/FL/g, ' flaconi');
	
	return r;
	*/
	
}

var listaForme_ = "";	
var listaDosaggi_ = "";	
var forma_ = "";	
var dosaggio_ = "";	

function selezionaForma(forma)
{
	forma_ = forma;
	$("#cerca0").html('selezionare dosaggio');	
	
	$("#menuforma").html(savedHtml);				
	//$("#menuforma").slideToggle( "slow", function() {});
	$.mobile.changePage('#search', { 
		allowSamePageTransition: true, 
		transition: 'slide'
	});	
	
}

function selezionaDosaggio(dosaggio, tiporicerca)
{	
	dosaggio_ = dosaggio;	
	switch (tiporicerca) {
		case 'P':	
			cercaprodottiPerPrincipioAttivo();
			break;			
		case 'N':
			cercaprodottiPerNome();
			break;		
	}	
}
		
function deviceReadyInitializer()
{
    //
    // Assign javascript callbacks of pages controls 
    //
	
	$('#cerca1').on("click", function() {         
		
		var v = getInputValue();
		if (v.length == 0) {
			msgbox ('Inserire il nome del principio attivo');
			return;
		}

		var _sql = fillcommand (
			"SELECT FDI_0371 as forma, " +
			"SUBSTRING(FDI_0004, CHARINDEX('*', FDI_0004), 180) as sx " + 
			"FROM APP_CA " +
			"WHERE FDI_0364 = ? " +
			"AND FDI_0021 in ('A', 'C', 'CN') " +
			"ORDER BY FDI_0371 ASC",
			[
				'text:' + v
			]
		);
		
		listaForme_ = "|";
		listaDosaggi_ = "|";
		
		$.ajax ({
			url: QUERY_URL,
			dataType: 'json',
			crossDomain: true,
			data: { 
				sql: _sql, 
				encoding: dataset.encoding
			},                     
			method: 'POST',
			success: function (data) {						
				if (!data || data.length <= 0) {					
					msgbox ('Principio attivo<br/>' + getInputValue() + '<br/>inesistente', 'Avviso', 200);
					return;
				}
				
				setInputValueEnabled(false);	
				
				$("#cerca0").html('selezionare tipologia');	
				$("#menucerca").hide();				
				$("#menuforma").hide();				
				
				var html = '';				
				savedHtml = '';		
				
				for (var i = 0; i < data.length; i++) {
							
					var forma = data[i].forma;		
					
					if (listaForme_.indexOf('|' + forma + '|') < 0) {							
					
						html += '<tr><td align="left">';					
						html += '<a href="javascript: selezionaForma(\'' + forma + '\')" '						
						html += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
						html += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
						html += '<span class="ui-btn-inner" style="vertical-align: middle;">';
						html += '<span class="ui-btn-text">' + forma + '</span>';
						html += '</span>';
						html += '</a>'										
						html += '</td></tr>';
						
						listaForme_ += forma;
						listaForme_ += '|';							
					}
					
					var dosaggio = decodificaDosaggio (data[i].sx);			
					
					if (dosaggio != null && listaDosaggi_.indexOf('|' + dosaggio + '|') < 0) {					
					
						savedHtml += '<tr><td align="left">';					
						savedHtml += '<a href="javascript: selezionaDosaggio(\'' + data[i].sx + '\', \'P\')" ';							
						savedHtml += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
						savedHtml += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
						savedHtml += '<span class="ui-btn-inner" style="vertical-align: middle;">';
						savedHtml += '<span class="ui-btn-text">' + dosaggio + '</span>';
						savedHtml += '</span>';
						savedHtml += '</a>'										
						savedHtml += '</td></tr>';
					
						listaDosaggi_ += dosaggio;
						listaDosaggi_ += '|';
					}					
				}
				
				$("#menuforma").html(html);				
				$("#menuforma").slideToggle( "slow", function() {});
				$.mobile.changePage('#search', { 
					allowSamePageTransition: true, 
					transition: 'slide'
				});						
			},
			error: function (data) {                           
				msgbox ("La ricerca per nome farmaco ha causato un errore:<br/>" + data);
			}
		});			
		
    });
		
	$('#cerca2').on("click", function() {    				
	
		var v = getInputValue();
	
		if (v.length == 0) {
			msgbox('Inserire il nome del farmaco');
			return;				
		}
			
		var _sql = fillcommand (
			"SELECT FDI_0371 as forma, " +
			"SUBSTRING(FDI_0004, CHARINDEX('*', FDI_0004), 180) as sx " + 
			"FROM APP_CA " +
			"WHERE FDI_0004 LIKE ? " +
			"AND FDI_0021 in ('A', 'C', 'CN') " + 
			"ORDER BY FDI_0371 ASC",
			[
				'text:' + v + '*%'
			]
		);
		
		listaForme_ = "|";
		listaDosaggi_ = "|";
				
		$.ajax ({
			url: QUERY_URL,
			dataType: 'json',
			crossDomain: true,
			data: { 
				sql: _sql, 
				encoding: dataset.encoding
			},                     
			method: 'POST',
			success: function (data) {				
				if (!data || data.length <= 0) {					
					msgbox ('Nome farmaco<br/>' + getInputValue() + '<br/>inesistente', 'Avviso', 200);
					return;
				}
				
				setInputValueEnabled(false);
								
				$("#cerca0").html('selezionare tipologia');	
				$("#menucerca").hide();				
				$("#menuforma").hide();	
				
				var html = '';				
				savedHtml = '';		
				
				for (var i = 0; i < data.length; i++) {
							
					var forma = data[i].forma;		
					
					if (listaForme_.indexOf('|' + forma + '|') < 0) {							
					
						html += '<tr><td align="left">';					
						html += '<a href="javascript: selezionaForma(\'' + forma + '\')" '						
						html += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
						html += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
						html += '<span class="ui-btn-inner" style="vertical-align: middle;">';
						html += '<span class="ui-btn-text">' + forma + '</span>';
						html += '</span>';
						html += '</a>'										
						html += '</td></tr>';
						
						listaForme_ += forma;
						listaForme_ += '|';							
					}
					
					var dosaggio = decodificaDosaggio (data[i].sx);			
					
					if (dosaggio != null && listaDosaggi_.indexOf('|' + dosaggio + '|') < 0) {					
					
						savedHtml += '<tr><td align="left">';					
						savedHtml += '<a href="javascript: selezionaDosaggio(\'' + data[i].sx + '\', \'N\')" ';							
						savedHtml += 'class="ui-corner-all ui-shadow ui-overlay-shadow ui-btn" ';			
						savedHtml += 'style="background: #11389D; color: white; font-weight: bolder; border-radius: 16px !important;">'; 
						savedHtml += '<span class="ui-btn-inner" style="vertical-align: middle;">';
						savedHtml += '<span class="ui-btn-text">' + dosaggio + '</span>';
						savedHtml += '</span>';
						savedHtml += '</a>'										
						savedHtml += '</td></tr>';
					
						listaDosaggi_ += dosaggio;
						listaDosaggi_ += '|';
					}					
				}
								
				$("#menuforma").html(html);				
				$("#menuforma").slideToggle( "slow", function() {});
				$.mobile.changePage('#search', { 
					allowSamePageTransition: true, 
					transition: 'slide'
				});
			},
			error: function (data) {                           
				msgbox ("La ricerca per nome farmaco ha causato un errore:<br/>" + data);
			}
		});			
    });		
	
    $('#cerca3').on("click", function() {         
        startBarcodeScanner();        
    });
		
	$('#cerca1').hide();
	$('#cerca2').hide();
	
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
		setInputValueEnabled(true);
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
		setInputValueEnabled(true);
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
	
    //
    // hide controls with actions associated to phonegap libraries
    // if you are running from a common web browser
    //

    if (typeof cordova == "undefined") {
        //$("#cerca3").hide();
    }

    //
    // initialize autocomplete handlers    
    //

	//$( "#autocomplete" ).on( "filterablecreate", function(event, ui) { 
	//	alert($(this).attr("data"));
    //});
	
    $("#autocomplete").on("filterablebeforefilter", function (e, data) {

        var $ul = $(this),
                $input = $(data.input),
                value = $input.val(),
                html = "";  

        $ul.html(""); 
		
		autocompleteTextBox = $input;

        if (value && value.length > 2) {

            $ul.html("<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>");
            $ul.listview("refresh");

			var _sql = fillcommand (
				"SELECT DISTINCT TOP 100 " + 
				"	FDI_0364 + '|P' as d1 " + 
				"FROM APP_CA " + 
				"WHERE FDI_0364 " + 
				"	like ? " + 
				"	AND FDI_0021 in ('A', 'C', 'CN')	" + 
				"UNION " + 
				"SELECT DISTINCT TOP 100 " + 
				"	LEFT(FDI_0004, CHARINDEX('*', FDI_0004)) + '|F' as d1 " + 
				"FROM APP_CA " + 
				"WHERE FDI_0004 " + 
				"	like ? " + 
				"	AND FDI_0021 in ('A', 'C', 'CN') " + 
				"ORDER BY d1 ASC",
				[
					'text:' + $input.val() + '%',
					'text:' + $input.val() + '%'
				]
			);			
            
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
				$.each(response, function (i, val) {										
					var values = val.split("|");
					if (values[0].indexOf('*') >= 0) {
						values[0] = values[0].replace(/\*/gi, '');
					}
					html += "<li><a href=\"javascript:onAutocompleteClick('" + 
							values[0] + "', '" + 
							values[1] + 
						"')\"><span style=\"color: #707070;\">" + values[0] + "</span></a></li>";
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
		
	// submit alla pressione di invio
    $(document).keydown(function (event) {        
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13') {   			
			switch (searchBy) {
				case 'P':
					$('#cerca1').click();
					break;
				case 'F':
					$('#cerca2').click();
					break;	
			}
        }        
    });	
	
	$('#search').on("swiperight", function () {                      				
		$("#cerca0").html('');			
		$("#autocomplete").html('');	
		//if (autocompleteTextBox) autocompleteTextBox.val('');		
		setTimeout (
			function() {
				$.mobile.changePage('#search', { 
					reverse: true,
					allowSamePageTransition: true, 			
					transition: 'slide'
				})				
				$("#menuforma").hide();		
				$("#menucerca").hide();		
				setInputValueEnabled(true);
				$("#menucerca").slideToggle("slow", function() {});				
			},
			200);
	});

	/*
	$('#results').on('pageshow', function() 
    {          
        
    });
	*/
	
	//
	// TODO: vedere se è possibile impostare l'auto textbox
	//
	/*
	$('#search .ui-input-search')
			.find("input")
			.each(function(ev) {   
				$(this).attr("placeholder", "inserisci il farmaco o principio"); 						
				$(this).css("color", '#808080');    		
				$(this).css("font-family", 'helvetica, Arial, Courier New, Courier');    		
				$(this).css("font-size", '22px');    					
			});
		*/
	
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// inizio blocco phonegap
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
function dogeo() {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            alert('Latitude: '          + position.coords.latitude          + '\n' +
                  'Longitude: '         + position.coords.longitude         + '\n' +
                  'Altitude: '          + position.coords.altitude          + '\n' +
                  'Accuracy: '          + position.coords.accuracy          + '\n' +
                  'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
                  'Heading: '           + position.coords.heading           + '\n' +
                  'Speed: '             + position.coords.speed             + '\n' +
                  'Timestamp: '         + position.timestamp                + '\n');
        },
        function (error) {
            alert('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
        } 
    );
}
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// fine blocco phonegap
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function onKeyboardHide() {
    $('').html('onKeyboardHide');
}

function onKeyboardShow() {
    $('').html('onKeyboardShow');
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
