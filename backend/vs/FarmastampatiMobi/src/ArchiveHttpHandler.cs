using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime.Serialization;
using System.Configuration;
using System.Runtime.Serialization.Json;
using System.Data.SqlClient;
using System.IO;
using System.Data;
using System.Collections;
using System.Web.Configuration;

using iTextSharp.text;
using iTextSharp.text.pdf;

namespace webapp
{
    [DataContract]
    internal class DocumentRequest
    {
        [DataMember]
        internal string aic = null;
    }

    [DataContract]
    internal class DocumentResponse
    {
        [DataMember]
        internal string filename;

        [DataMember]
        internal string language;

        [DataMember]
        internal int pagesCount;

        [DataMember]
        internal bool isDefaultLanguage;

        [DataMember]
        internal bool foglioVisualizzabile;

        [DataMember]
        internal bool foglioNonFornitoDalProduttore;
    }

    public class ArchiveHttpHandler : IHttpHandler
    {
        private string connectionString;
        private string documentRoot;

        public ArchiveHttpHandler()
        {
            connectionString = ConfigurationManager.ConnectionStrings["farmadati"].ConnectionString;
            documentRoot = WebConfigurationManager.AppSettings["documentRoot"] != null ?
                                    WebConfigurationManager.AppSettings["documentRoot"] : @"C:\Temp\";
            if (!documentRoot.EndsWith(@"\")) documentRoot += @"\";
        }

        public bool IsReusable
        {
            get { return true; }
        }

        private int countPdfPages(string pdfinput) 
        {   
            if (!new FileInfo(pdfinput).Exists) return -1;
            PdfReader reader = new PdfReader(pdfinput);
            int n = reader.NumberOfPages;
            try { reader.Close(); } catch { }
            return n;            
        }

        public void ProcessRequest(HttpContext context)
        {
            HttpRequest request = context.Request;
            HttpResponse response = context.Response;

            DateTime start = DateTime.Now;

            try
            {
                DataContractJsonSerializer deserializer = new DataContractJsonSerializer(typeof(DocumentRequest));
                DocumentRequest form = (DocumentRequest)deserializer.ReadObject(request.InputStream);

                if (form.aic != null)
                {
                    Stream stream = response.OutputStream;
                    DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(DocumentResponse));

                    using (SqlConnection connection = new SqlConnection(connectionString))
                    {
                        using (SqlCommand command = new SqlCommand(
                            String.Concat (
                                "SELECT ",
                                "  TR001.FDI_0001, ",      // 0 - aic banca dati
                                "  TDF.FDI_T227, ",        // 1 - nome file pdf
                                "  TDF.FDI_T483, ",        // 2 - lingua
                                "  FS_MOBI.FDI_T485, ",    // 3 - aic farmastampati (null => foglietto aggiornato)
                                "  FS_MOBI.FDI_T501 ",     // 4 - aic di produttore che non ha reso disponibile il foglio                  
                                "FROM TR001 " + 
                                "  LEFT JOIN TDF ON (TR001.FDI_0001=TDF.FDI_T218 COLLATE Latin1_General_CI_AS) " +  
                                "  LEFT JOIN FS_MOBI ON (TR001.FDI_0001=FS_MOBI.FDI_T485) " +  
                                "WHERE TR001.FDI_0001='", form.aic, "'")
                                    , connection))
                        {
                            command.CommandType = CommandType.Text;
                            connection.Open();

                            using (SqlDataReader sqlreader = command.ExecuteReader(CommandBehavior.CloseConnection))
                            {
                                if (sqlreader.HasRows)
                                {
                                    ArrayList lst = new ArrayList();
                                    response.ContentType = "application/json";

                                    while (sqlreader.Read())
                                    {
                                        DocumentResponse entry = new DocumentResponse();

                                        entry.language = sqlreader.IsDBNull(2) ? "" : sqlreader.GetString(2);                                        
                                        entry.filename = sqlreader.IsDBNull(1) ? "" : sqlreader.GetString(1).ToUpper().Replace(".PDF", "");
                                        entry.pagesCount = sqlreader.IsDBNull(1) ? 0 : countPdfPages(documentRoot + sqlreader.GetString(1));
                                        entry.foglioVisualizzabile = !sqlreader.IsDBNull(3);
                                        entry.foglioNonFornitoDalProduttore = !sqlreader.IsDBNull(4) 
                                                && sqlreader.GetString(4).ToUpper().Trim().Equals("S");

                                        lst.Add(entry);
                                    }

                                    bool hasUserLanguage = false;

                                    foreach (string lang in request.UserLanguages)
                                    {
                                        for (int i = 0; !hasUserLanguage && i < lst.Count; i++)
                                        {
                                            DocumentResponse entry = (DocumentResponse)lst[i];
                                            if (entry.language == null || entry.language.Length == 0) continue;
                                            if (lang.ToLower().StartsWith(entry.language.ToLower().Substring(0, 2)))
                                            {
                                                entry.isDefaultLanguage = true;
                                                hasUserLanguage = true;
                                                break;
                                            }
                                        }
                                    }

                                    if (!hasUserLanguage) ((DocumentResponse)lst[0]).isDefaultLanguage = true;

                                    serializer.WriteObject(stream, lst.ToArray());

                                }
                                else
                                {
                                    throw new Exception("aic not found");
                                }
                            }
                        }
                    }
                }

            }
            catch (Exception e)
            {
                response.StatusCode = 500;
                response.StatusDescription = e.Message;
            }
            finally 
            {
                double elapsed = (double)(DateTime.Now - start).TotalMilliseconds / 1000;

                string pharmacy = request.QueryString["pharmacy"];
                string mailbox = request.QueryString["mailbox"];

                if (Logger.Enabled)
                    Logger.Write("HTTP /archive {0}\t{1:F2}\t{2}\t{3}\t{4}\t{5}\t{6}",
                            response.StatusCode == 200 ? "OK" : "FAIL",
                            elapsed,
                            request.UserHostAddress,
                            request.UserHostName != null && request.UserHostName.Length > 0 ? request.UserHostName : "anonymous",
                            request.UserAgent,
                            response.StatusCode,
                            response.StatusDescription
                                .Replace('\r', ' ')
                                .Replace('\n', ' ')
                                .Replace('\t', ' ')
                                .Trim()
                            );

            }

        }
    }
}
