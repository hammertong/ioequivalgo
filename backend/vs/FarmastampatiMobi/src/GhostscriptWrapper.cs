using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Web;

namespace webapp
{
    public class GhostscriptWrapper
    {        
        string GSEXE = 
            System.Environment.Is64BitOperatingSystem ?
                "gswin64c.exe" : "gswin32c.exe";

        public string ExecutablePath
        {
            get
            {
                return GSEXE;
            }
            set
            {
                GSEXE = value;
            }
        }

        public bool IsGhostscriptInstalled
        {
            get 
            {
                Process p = new Process();
                try
                {
                    p.StartInfo.FileName = GSEXE;
                    p.StartInfo.Arguments = "-dNOPROMPT -version";
                    p.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                    p.Start();
                    p.WaitForExit();
                    return (p.ExitCode == 0);
                }
                catch (Exception e)
                {
                    if (Logger.Enabled) Logger.Write("exception running {0} {1} - reason: {3}",
                        p.StartInfo.FileName, p.StartInfo.Arguments, e);
                    if (Logger.Enabled) Logger.Write("Error: Ghoscript seems to be missing in server system path. Please " +
                        "install Ghostscript and add it to system environment path before running this web app !!!");
                    return false;   
                }
            }        
        }

        public bool ConvertPage(string gscmd, string inpdf, string outpng, int timeout = -1)
        {
            Process p = new Process();
            
            try
            {
                string args = String.Format (
                        "-q -dQUIET -dPARANOIDSAFER -dBATCH -dNOPAUSE -dNOPROMPT " + 
                            gscmd + " -sOutputFile=\"{0}\" \"{1}\"",
                            outpng, inpdf);

                p.StartInfo.FileName = GSEXE;
                p.StartInfo.Arguments = args;
                p.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                p.Start();
                if (timeout > 250)
                {
                    p.WaitForExit(timeout);
                    if (!p.HasExited)
                    {
                        p.Kill();
                        throw new Exception("conversion failure: ghostscript process timed out!");
                    }
                }
                else 
                {
                    p.WaitForExit();
                }

                return (p.ExitCode == 0);
                
            }
            catch (Exception e)
            {
                Logger.Write("exception running gostscript {0} {1} - reason: {3}",
                    p.StartInfo.FileName, p.StartInfo.Arguments, e);
                return false;   
            }

        }

    }

}