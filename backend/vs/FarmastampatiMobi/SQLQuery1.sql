SELECT count (*) 
FROM APP_CA

SELECT TOP 100 * 
FROM APP_CA

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
WHERE FDI_0004 LIKE 'ASP%'
ORDER BY prezzoAlPubblico ASC

SELECT TOP 1000
		FDI_0001 as codice,
		FDI_0004 as descrizione,		
		FDI_0041 as ditta,		
		FDI_1094 as codice_LT_C,
		FDI_9238 as prezzoAlPubblico,
		FDI_0491 as prezzoRimborsoNazionale,
		FDI_0340 as principioAttivo
FROM APP_CA
WHERE FDI_0004 LIKE 'asp%'
ORDER BY prezzoAlPubblico ASC


