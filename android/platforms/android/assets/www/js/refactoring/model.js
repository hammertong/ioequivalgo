
/* ************************************************************
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
 *			FDI_9250 varchar(1)    NULL		-- flag brand
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
 */

var model = {

    getEntityNames: function(param) {
                
		var names = [
			{
				tipo: "",
				valore: ""			
			},
			{
				tipo: "",
				valori: ""			
			}
		}
		
		return names;
		
    },

    getEntities: function(name) {
        
		var entities = [
			{
				forma: "",
				dosaggio: [ 
					{
						gruppo: "",
						descrizione: ""
					},
					{
						gruppo: "",
						descrizione: ""
					}
				]
			},				
			{
				forma: "",
				dosaggio: [ 
					{
						gruppo: "",
						descrizione: ""
					},
					{
						gruppo: "",
						descrizione: ""
					}
				]
			}
		];
		
		return entities;
    },		

    getDetails: function(group) {        
	
		var details = [
			{
				nome: "",
				ditta: "",
				prezzo: "",
				rimborso: "",
				classe: "",
				dosaggio: "",
				unitaPosologiche: ""
			},
			{
				nome: "",
				ditta: "",
				prezzo: "",
				rimborso: "",
				classe: "",
				dosaggio: "",
				unitaPosologiche: ""
			}			
		];
		
		return details;		
        
    },
	
	getGroup: function (aic) {
		
		var group = 0;
		
		return group;
		
	}
    
};


