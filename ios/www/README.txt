04/11 Mail originale riunione MDB/GC/LB

21/12

- Codice (Solo Farmaci) 								<AB: KEY>
- Descrizione 		 			[MB: breve]				<AB: FILBD>
- Ditta 						[MB: Ditta 1] 			<AB: FILBD - FILCP>
- Classe 						[MB: classe tutte] 		<AB: FILBD>
- Liste di trasparenza          [MB: CC]				<AB: FILNT(CC)>
- Prezzo 						[MB: al pubblico]   	<AB: FILBD>
- Prezzo Massimo di Rimborso 							<AB: FILBD>
- Principio Attivo descrizione  [MB: solo descrizione] 	<AB: FILBD - FILPA>

[MB: elencare classe A H C]
[MB: commercio S]

-------------------------------------------------------------------------

21/12/2015
Codice (solo farmaci) solo in commercio (commercio = S)
Descrizione breve (filbd)
Ditta 1 (filbd e descrizione da filcp)
non più "regime ssn", ma classe (es A H C) (filbd)
Lista di trasparenza (filnt CC) / codice raggruppamento per legare i farmaci equivalenti
Prezzo al pubblico (filbd)
Prezzo massimo di rimborso (filbd)
Principio attivo solo descrizione (filbd e descrizione da filpa)

SELECT TOP 1000
		FDI_0001 as codice,
		FDI_0004 as descrizione,		
		FDI_0041 as ditta,
		FDI_0021 as classe,
		FDI_10A0 as codice_LT_A,		
		FDI_1094 as codice_LT_C,
		FDI_9238 as prezzoAlPubblico,
		FDI_0491 as prezzoRimborsoNazionale,
		FDI_0340 as principioAttivo
FROM APP_CA
WHERE FDI_0004 LIKE 'BEN%'
ORDER BY prezzoAlPubblico ASC

-------------------------------------------------------------------------

Tabella [DBFarmadati_WEB].[APP_CA]

Codice prodotto							FDI_0001  
Descrizione prodotto					FDI_0004  
Codice ditta  							FDI_0040  --> usare per filtrare per ditta
Ragione sociale ditta 					FDI_0041  descrizione ditta 1 ?
Classe                  				FDI_0021  è la classe A, H o C ?
Codice gruppo liste di trasparenza A    FDI_10A0  
Codice gruppo liste di trasparenza C    FDI_1094   
Prezzo attuale logico					FDI_9238  è il prezzo al pubblico ? prezzo 0 ?
Prezzo di rimborso nazionale			FDI_0491  
Codice Pincipio Attivo  				FDI_0339  --> usare per filtrare per principio attivo
Descrizione Principio Attivo 			FDI_0340  

Per filtrare per ditta e principio attivo è più performante utilizzare i campi codice (FDI_0040, FDI_0339).

Per ottenere i farmaci equivalenti, testare il campo classe del prodotto:
se A, H -> estrarre tutte le referenze che hanno stesso codice “FDI_10A0”
se C -> estrarre tutte le referenze che hanno stesso codice “FDI_1094”

-------------------------------------------------------------------------

var o = {
	"codice": ,
	"descrizione": ,
	"ditta": ,
	"classe": ,
	"listaTrasparenza": {			
		"codice": ,
	}
	"prezzoAlPubblico": ,
	"perzzoMassimoRimborso": ,
	"principioAttivodescrizione": 
};


