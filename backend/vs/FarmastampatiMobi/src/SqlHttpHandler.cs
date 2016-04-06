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
    public class SqlHttpHandler : IHttpHandler
    {
        private string connectionString_;

        public SqlHttpHandler()
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
