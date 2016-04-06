using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Configuration;
using System.Web.Security;
using System.Web.SessionState;

namespace webapp
{
    public class Global : System.Web.HttpApplication
    {

        protected void Application_Start(object sender, EventArgs e)
        {   
            string logfile = WebConfigurationManager.AppSettings["logFile"];

            if (logfile != null)
            {
                Logger.Enabled = true;
#if DEBUG
                Logger.Verbose = true;
#endif
                if (Path.IsPathRooted(logfile))
                {
                    Logger.LogFile = logfile;
                }
                else 
                {
                    Logger.LogFile = Path.GetFullPath(Server.MapPath(".") + logfile);
                }
                Logger.Write("Web Aplication Started");
            }
            else
            {
                Logger.Enabled = true;
            }

        }

        protected void Session_Start(object sender, EventArgs e)
        {

        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {

        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {

        }

        protected void Application_Error(object sender, EventArgs e)
        {

        }

        protected void Session_End(object sender, EventArgs e)
        {

        }

        protected void Application_End(object sender, EventArgs e)
        {
            if (Logger.Enabled) Logger.Write("Web Aplication End");
        }
    }
}