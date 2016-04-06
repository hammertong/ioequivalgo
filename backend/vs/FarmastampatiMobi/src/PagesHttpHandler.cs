using System;
using System.Collections.Generic;
using System.Web;
using System.IO;
using System.Web.Configuration;

namespace webapp
{
    public class PagesHttpHandler : IHttpHandler
    {
        public PagesHttpHandler()
        {
            //if (Logger.Enabled) Logger.Write("creating new instance of PagesHttpHandler ...");                 
        }

        public bool IsReusable
        {
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            HttpRequest request = context.Request;
            HttpResponse response = context.Response;

            //if (Logger.Enabled) Logger.Write("{0} {1} - {2} => {3}", request.HttpMethod,
            //    request.Path, request.UserHostAddress, request.UserAgent);

            string documentRoot = WebConfigurationManager.AppSettings["documentRoot"];
            if (!Path.IsPathRooted(documentRoot))
                documentRoot = Path.GetFullPath(context.Server.MapPath("..") + documentRoot);
            if (!documentRoot.EndsWith(@"\")) documentRoot += @"\";

            string outputPath = WebConfigurationManager.AppSettings["outputPath"];
            if (!Path.IsPathRooted(outputPath))
                outputPath = Path.GetFullPath(context.Server.MapPath("..") + outputPath);
            if (!outputPath.EndsWith(@"\")) outputPath += @"\";

            try
            {
                int n = request.Path.LastIndexOf("/");
                n++;

                bool fullpdf = false;
                string f_id = request.Path.Substring(n);

                string s_id = f_id.ToLower();
                if (s_id.EndsWith(".pdf"))
                {
                    s_id = s_id.Substring(0, s_id.Length - 4);
                    fullpdf = true;
                }
                if (s_id.StartsWith("f")) s_id = s_id.Substring(1);

                f_id = String.Format("F{0:D7}", Int32.Parse(s_id));                                

                string pdf = documentRoot;
                pdf += f_id;

                if (!pdf.ToLower().EndsWith(".pdf")) 
                {
                    pdf += ".pdf";                    
                }                

                FileInfo pdfInf = new FileInfo(pdf);

                if (!pdfInf.Exists)
                {
                    if (Logger.Enabled) Logger.Write("file {0} not found", pdf);
                    response.StatusCode = 404;
                    response.StatusDescription = "Not Found";
                    response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath(".") + "images/404.gif"));
                    response.Flush();
                    return;
                }
                
                if (fullpdf) 
                {
                    if (Logger.Enabled) Logger.Write("requested full pdf {0} ...", pdf);
                    response.ContentType = "application/pdf";
                    response.BinaryWrite(File.ReadAllBytes(pdfInf.FullName));
                    response.Flush();
                    return;
                }

                int page = -1;
                string requestPage = Tools.GetRequestParameter(request, "page");
                if (requestPage != null) Int32.TryParse(requestPage, out page);

                if (page <= 0) 
                    throw new Exception(
                        "bad request page not specified or page non positive integer");

                string outfile = outputPath;

                outfile += (Int32.Parse(
                                    f_id.Substring(5).TrimStart('0'))
                                    % 256)
                        .ToString("X2")
                        .ToUpper();

                DirectoryInfo outdir = new DirectoryInfo(outfile);

                if (!outdir.Exists)
                {
                    try
                    {
                        Directory.CreateDirectory(outdir.FullName);
                    }
                    catch (Exception e)
                    {
                        Logger.Write("Error: web app does not have wrtie access rigth to {0}, " +
                            "please modify directory permissions to make directory writable " +
                            "from this Application Pool - details: {1}", outdir, e);
                        response.StatusCode = 403;
                        response.StatusDescription = "Forbidden";
                        response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath(".") + "images/404.gif"));
                        response.Flush();
                        return;
                    }
                }

                string ext = Tools.GetRequestParameter(request, "gsext", "png");
                if (ext.StartsWith(".")) ext = ext.Substring(1);

                string command = Tools.GetRequestParameter(request, "gsopts", "-version");

                if (ext.Length > 4 || command.Length < 20 || command.IndexOf("-sDEVICE") < 0)
                    throw new Exception ("invalid ghostscript command: " + command);

                int timeout = -1;
                string requestTimeout = Tools.GetRequestParameter(request, "timeout", null);
                if (requestTimeout != null) int.TryParse(requestTimeout, out timeout);

                outfile += @"\";
                outfile += f_id + "[" + page + "]." + ext;

                bool nocache = Tools.GetRequestParameter(request, "timeout", "false")
                        .ToLower().Equals("true");

                bool cached = false;

                if (!nocache)
                {
                    FileInfo f = new FileInfo(outfile);
                    cached = (f.Exists ? (
                            (f.LastWriteTime.ToFileTime() > pdfInf.LastWriteTime.ToFileTime())
                            ) : false);
                }

                if (!cached)
                {
                    DateTime start = DateTime.Now;
                    GhostscriptWrapper wrapper = new GhostscriptWrapper();

                    if (WebConfigurationManager.AppSettings["gsPath"] != null)
                    {
                        wrapper.ExecutablePath = WebConfigurationManager.AppSettings["gsPath"];
                    }

                    if (!wrapper.ConvertPage(command, pdf, outfile, timeout))
                    {
                        if (wrapper.IsGhostscriptInstalled)
                        {
                            if (Logger.Enabled)
                                Logger.Write(
                                    "error: conversion failure from {0} to {1}[{2}]",
                                        pdf, outfile, page);
                            response.StatusCode = 500;
                            response.StatusDescription = "Server Error";
                            response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath(".") + "images/404.gif"));
                            response.Flush();                            
                        }
                        else
                        {
                            if (Logger.Enabled) Logger.Write("error: conversion unavailable from {0} to {1}[{2}] - "
                                + "GHOSTSCRIPT NOT INSTALLED OR NOT SET IN SYSTEM PATH!",
                                pdf, outfile, page);
                            response.StatusCode = 503;
                            response.StatusDescription = "Service Unavailable";
                            response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath(".") + "images/404.gif"));
                            response.Flush();                            
                        }
                        return;
                    }
                    else
                    {
                        if (Logger.Enabled)
                            Logger.Write(
                                "HTTP /pages conversion from {0} ({1}Kb) to {2} ({3}Kb) in {4:F2}\"",
                                Path.GetFileName(pdf), (new FileInfo(pdf).Length / 1024),
                                Path.GetFileName(outfile), (new FileInfo(outfile).Length / 1024),
                                (((TimeSpan)(DateTime.Now - start)).TotalMilliseconds / 1000));
                    }
                    
                }

                response.ContentType = "image/" + ext;
                response.BinaryWrite(File.ReadAllBytes(outfile));
                response.StatusCode = 200;
                response.Flush();

            }
            catch 
            {
                try
                {
                    response.ContentType = "image/gif";
                    response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath(".") + "images/404.gif"));
                    response.StatusCode = 404;
                    response.StatusDescription = "Not found";
                    response.Flush();
                }
                catch 
                {
                    try
                    {
                        response.StatusCode = 500;
                        response.StatusDescription = "Server Error";
                        response.Flush();
                    }
                    catch 
                    {
                        if (Logger.Enabled)
                            Logger.Write("error flushing response! clent disconnected?");
                    }
                }
            }

        }

    }

}
