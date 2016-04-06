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
    public class AutocompleteHttpHandler : IHttpHandler
    {
        private string connectionString;

        public AutocompleteHttpHandler()
        {
            connectionString = ConfigurationManager.ConnectionStrings["farmadati"].ConnectionString;
        }

        public bool IsReusable
        {
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            HttpRequest request = context.Request;
            HttpResponse response = context.Response;

            try
            {
                string q = Tools.GetRequestParameter(request, "q");
                if (q == null) throw new Exception("invalid autocomplete request (missing 'q')");

                if (q.StartsWith("A") || q.StartsWith("a")) q = q.Substring(1);

                string callback = Tools.GetRequestParameter(request, "callback");
                if (callback == null) throw new Exception("invalid autocomplete request (missing 'callback')");

                string res = callback;
                res += "([";

                char[] carr = "0123456789".ToCharArray();

                foreach (char c in q.ToCharArray())
                {
                    if (!carr.Contains(c))
                    {
                        res += "]);";
                        response.AppendHeader("Content-Type", "application/javascript");
                        response.Write(res);
                        response.Flush();
                        return;
                    }
                }

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    using (SqlCommand command = new SqlCommand(
                        String.Concat(
                            "SELECT DISTINCT TOP 5 [FDI_T485]",
                            "   FROM [DBFarmadati_WEB].[dbo].[FS_MOBI] ",
                            "   WHERE [FDI_T485] LIKE '", q, "%' AND [FDI_T501] <> 'S'")
                                , connection))
                    {
                        command.CommandType = CommandType.Text;
                        connection.Open();

                        using (SqlDataReader sqlreader = command.ExecuteReader(CommandBehavior.CloseConnection))
                        {
                            int count = 0;
                            while (sqlreader.Read())
                            {
                                if (count++ > 0) res += ", ";
                                res += "\"";
                                res += sqlreader.GetString(0);
                                res += "\"";
                            }
                        }
                    }
                }

                res += "]);";

                response.AppendHeader("Content-Type", "application/javascript");
                response.Write(res);
                response.Flush();

            }
            catch (Exception e)
            {
                if (Logger.Enabled) Logger.Write("autocomplete exception {0}", e);
                response.StatusCode = 500;
                response.StatusDescription = "Server Error - " + e.Message;
            }
        }
    }
}
