using System;
using System.Collections.Generic;
using System.Text;
using System.Web;
using System.Runtime.Serialization;
using System.Configuration;
using System.Runtime.Serialization.Json;
using System.Data.SqlClient;
using System.IO;
using System.Data;
using System.Collections;
using System.Web.Configuration;

using webapp;

namespace webapp
{
    public class Autocomplete2HttpHandler : IHttpHandler
    {
        private string connectionString_;

        public Autocomplete2HttpHandler()
        {
            connectionString_ = ConfigurationManager.ConnectionStrings["farmadati"].ConnectionString;
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
                StringBuilder json = new StringBuilder();

                string encoding = Tools.GetRequestParameter(request, "encoding", "base64");

                string connectionString = Tools.GetRequestParameter(request, "connectionString", connectionString_);

                string sql = Tools.GetRequestParameter(request, "sql", "");

                if (encoding == "base64")
                {
                    sql = Encoding.UTF8.GetString(Convert.FromBase64String(sql));
                }
                
                if (Logger.Enabled) Logger.Write("AUTOCOMP PARAMS > {0}", sql);

                string []v = sql.Split(';');

                sql  = 
                    "select distinct top 1000 " +
				    "  'A|' + left(TS052.FDI_T504, charindex('-', TS052.FDI_T504) - 1) " +
				    "from TS052 " +
				    "inner join TR041 on TS052.FDI_T503 collate Latin1_General_CI_AS = TR041.FDI_T507 " +
				    "inner join APP_CA on TR041.FDI_T505 collate Latin1_General_CI_AS = APP_CA.FDI_0001 " +
				    "where TS052.FDI_T504 like '" + v[0] + "%' " +
				    "  and (APP_CA.FDI_0021 IN ('A', 'C', 'CN')) " + // filtro no ospedalieri da ricerca per p.a.
				    "union " +
				    "select distinct top 1000 'B|' + left(APP_CA.FDI_4875, charindex('*', APP_CA.FDI_4875) - 1) " +
				    "from APP_CA " +
				    "left outer join TR041 on TR041.FDI_T505 = APP_CA.FDI_0001 " +
				    "where APP_CA.FDI_4875 like '" + v[1] + "%' " +
				    "and (not (TR041.FDI_T505 is NULL)) " + 		// filtro no farmaci non presenti in TS052
				    //"	and (not (APP_CA.FDI_1094 is NULL)) or (not (APP_CA.FDI_1010 is NULL)) " +	// filtro no farmaci senza gruppi di equivalenza
				    "order by 1 asc";

                if (Logger.Enabled) Logger.Write("SQL > {0}", sql);

                string callback = Tools.GetRequestParameter(request, "callback", "");

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.CommandType = CommandType.Text;
                        connection.Open();

                        using (SqlDataReader reader = command.ExecuteReader(CommandBehavior.CloseConnection))
                        {
                            int n = reader.FieldCount;
                            string[] names = new string[n];

                            if (callback.Length == 0)
                            {
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    names[i] = reader.GetName(i);
                                }
                            }

                            int count = 0;

                            json.Append(callback.Length == 0 ? "[ " : callback + "([ ");

                            while (reader.Read())
                            {
                                if (count++ > 0) json.Append(", ");

                                if (callback.Length == 0) json.Append("\n\t{ ");

                                for (int j = 0; j < n; j++)
                                {
                                    if (j > 0) json.Append(", ");

                                    if (callback.Length == 0)
                                    {
                                        json.Append("\"")
                                                .Append(names[j])
                                                .Append("\": ");
                                    }

                                    string x = reader.IsDBNull(j) ? "" : null;

                                    if (x == null)
                                    {
                                        try
                                        {
                                            x = reader.GetString(j);
                                        }
                                        catch
                                        {
                                            x = null;
                                        }
                                    }

                                    if (x == null)
                                    {
                                        try
                                        {
                                            x = reader.GetDecimal(j).ToString();
                                        }
                                        catch
                                        {
                                            x = null;
                                        }
                                    }

                                    if (x == null)
                                    {
                                        try
                                        {
                                            x = reader.GetDouble(j).ToString();
                                        }
                                        catch
                                        {
                                            x = null;
                                        }
                                    }

                                    if (x == null)
                                    {
                                        try
                                        {
                                            x = reader.GetInt32(j).ToString();
                                        }
                                        catch
                                        {
                                            x = null;
                                        }
                                    }
                                    if (x == null)
                                    {
                                        try
                                        {
                                            x = reader.GetInt64(j).ToString();
                                        }
                                        catch
                                        {
                                            x = null;
                                        }
                                    }

                                    if (x == null)
                                    {
                                        try
                                        {
                                            x = reader.GetBoolean(j).ToString();
                                        }
                                        catch
                                        {
                                            x = null;
                                        }
                                    }

                                    if (x == null)
                                    {
                                        try
                                        {
                                            x = reader.GetDateTime(j).ToString();
                                        }
                                        catch
                                        {
                                            x = null;
                                        }
                                    }

                                    json.Append("\"").Append(x
                                                .Replace('"', '\'')
                                                .Replace('\n', ' ')
                                                .Replace('\r', ' ')
                                                .Replace('\t', ' ')
                                                .Trim())
                                                .Append("\"");

                                    if (callback.Length > 0) break;
                                }

                                if (callback.Length == 0) json.Append(" }");

                            }

                            json.Append(callback.Length == 0 ? "\n]" : "]);");

                        }

                    }

                }

                response.AppendHeader("Access-Control-Allow-Origin", "*");
                response.AppendHeader("Content-Type",
                        (callback.Length == 0 ?
                            "application/json" :
                            "application/javascript; charset=utf-8"
                            ));

                response.Write(json);
                response.Flush();

            }
            catch (Exception e)
            {
                if (Logger.Enabled) Logger.Write("sql exception {0}", e);
                response.StatusCode = 500;
                response.StatusDescription = "Server Error - " + e.Message;
            }
        }
    }
}
