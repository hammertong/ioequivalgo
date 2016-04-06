use DBFarmadati_Web
go

DROP TABLE [dbo].[APP_CA]
GO
CREATE TABLE [dbo].[APP_CA](
	[FDI_0001] [varchar](9) NULL,		-- Codice prodotto 
	[FDI_0004] [varchar](30) NULL,      -- Descrizione prodotto
	[FDI_0041] [varchar](30) NULL,      -- Ragione sociale ditta
	[FDI_0021] [varchar](2) NULL,       -- Classe
	--[FDI_10A0] [varchar](3) NULL,       -- Codice gruppo lista di trasparenza classe A
	[FDI_1094] [varchar](13) NULL,      -- Codice gruppo lista di trasparenza classe C
	[FDI_9238] [numeric](8, 3) NULL,    -- prezzo attuale logico
	[FDI_0491] [numeric](8, 3) NULL,    -- prezzo di rimborso nazionale
	[FDI_0339] [numeric](6, 0) NULL,	-- codice principio attivo
	[FDI_0340] [varchar](200) NULL,		-- descrizione principio attivo
	[FDI_0363] [numeric](6, 0) NULL,	-- codice principio attivo base 
	[FDI_0364] [varchar](200) NULL,		-- descrizione principio attivo base
	[FDI_4875] [varchar](max) NULL,     -- descrizione estesa
	[FDI_0371] [varchar](30) NULL,      -- descrizione forma farmaceutica
	[FDI_1010] [varchar](3) NULL,       -- codice gruppo di equivalenza
	[FDI_9159] [varchar](1) NULL,       -- flag lista di trasparenza
	[FDI_9172] [varchar](1) NULL,       -- flag generico
	[FDI_9250] [varchar](1) NULL,       -- flag brand
	[FDI_0012] [varchar](2) NULL        -- codice tipo ricetta (se in classe C && FDI_0012 == 'C' | 'D' | 'h' => con obbligo di prescrizione ricetta)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

DROP TABLE [dbo].[TR028]
GO
CREATE TABLE [dbo].[TR028](
	[FDI_T418] [varchar](15) NULL,		-- IDKEY
	[FDI_T333] [varchar](9) NULL,       -- Codice Prodotto
	[FDI_T334] [numeric](2, 0) NULL,    -- Indice UMR a parità di indice significa accoppiamoento dosaggio (1 con 1, 2 con 2 ...)
	[FDI_T335] [numeric](4, 0) NULL,    -- Indice PA in associazione (ordine di dosaggio)
	[FDI_T336] [varchar](1) NULL,       -- flag PA principale 
	[FDI_T337] [numeric](6, 0) NULL,    -- Codice PA Salificato UMR 
	[FDI_T338] [numeric](14, 4) NULL,   -- QTA PA Salificato UMR
	[FDI_T339] [varchar](5) NULL,       -- UM PA Salificato UMR
	[FDI_T340] [numeric](6, 3) NULL,    -- Percentuale PA Salificato UMR
	[FDI_T341] [numeric](6, 0) NULL,    -- Codice PA base UMR
	[FDI_T342] [numeric](14, 4) NULL,   -- QTA PA base UMR
	[FDI_T343] [varchar](5) NULL,       -- UM PA base UMR
	[FDI_T344] [numeric](6, 3) NULL     -- Percentuale PA base UMR
) ON [PRIMARY]

DROP TABLE [dbo].[TR025]
GO
CREATE TABLE [dbo].[TR025](
	[FDI_T421] [varchar](11) NULL,		-- IDKEY
	[FDI_T321] [varchar](9) NULL,       -- Codice Prodotto
	[FDI_T322] [numeric](2, 0) NULL,    -- Indice UMR
	[FDI_T324] [numeric](8, 0) NULL,    -- Numero UMR (unita posologiche)
	[FDI_T323] [varchar](3) NULL        -- Codice UMR
) ON [PRIMARY]
GO

--
-- Tabelle non piu utilizzate di classificazione Ospedaliera 
-- non aderente alla classificazioe AIFA
--

DROP TABLE [dbo].[TR041]
GO
CREATE TABLE [dbo].[TR041](
	[FDI_T505] [varchar](9) NULL,
	[FDI_T507] [varchar](15) NULL
) ON [PRIMARY]

DROP TABLE [dbo].[TS052]
GO
CREATE TABLE [dbo].[TS052](
	[FDI_T503] [varchar](15) NULL,		-- codifica join TR041
	[FDI_T504] [varchar](300) NULL      -- descrittore '<principio>-<forma>-<dosaggio>'
) ON [PRIMARY]
GO

--
-- caricamento massivo dati
--
 
BULK INSERT dbo.APP_CA 
	FROM 'Y:\Documents\Cittadinanzattiva2\doc\data_APP_CA.txt' 	
	WITH (FIELDTERMINATOR = '\t', ROWTERMINATOR = '\n')
GO

BULK INSERT dbo.TR028
	FROM 'Y:\Documents\Cittadinanzattiva2\doc\data_TR028.txt' 	
	WITH (FIELDTERMINATOR = '\t', ROWTERMINATOR = '\n')
GO

BULK INSERT dbo.TR025 
	FROM 'Y:\Documents\Cittadinanzattiva2\doc\data_TR025.txt' 	
	WITH (FIELDTERMINATOR = '\t', ROWTERMINATOR = '\n')
GO

BULK INSERT dbo.TR041 
	FROM 'Y:\Documents\Cittadinanzattiva2\doc\data_TR041.txt' 	
	WITH (FIELDTERMINATOR = '\t', ROWTERMINATOR = '\n')
GO

BULK INSERT dbo.TS052 
	FROM 'Y:\Documents\Cittadinanzattiva2\doc\data_TS052.txt' 	
	WITH (FIELDTERMINATOR = '\t', ROWTERMINATOR = '\n')
GO





