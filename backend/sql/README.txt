Come esportare i dati della tabella da tra due db.
--------------------------------------------------

1) Estrazione dati da db di orgine: 
   bcp "select * from APP_CA" queryout  "c:\Temp\data_APP_CA.txt" -c -t"\t" -r"\n" -S WINDOWS2012R2 -T -d DBFarmadati_WEB
   bcp "select * from TR025" queryout  "c:\Temp\data_TR025.txt" -c -t"\t" -r"\n" -S WINDOWS2012R2 -T -d DBFarmadati_WEB
   bcp "select * from TR028" queryout  "c:\Temp\data_TR028.txt" -c -t"\t" -r"\n" -S WINDOWS2012R2 -T -d DBFarmadati_WEB


2) Aggiornare la tabella in schema.sql

3) Importazione su db di destinazione:
   sqlcmd -S ARGO\SQLEXPRESS -d DBFarmadati_WEB -E -i schema.sql

Note su bulk insert
+ il file data.txt prodotto con il primo comando di esportazione bcp deve essere riportato 
  nel file bulinsert.sql prima di eseguire l'import con sqlcmd.  
+ sempre nel file bulkinsert.sql il  file deve riportare il percorso completo





