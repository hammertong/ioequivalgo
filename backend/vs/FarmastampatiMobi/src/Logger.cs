using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Diagnostics;
using System.Text.RegularExpressions;
using System.Reflection;
using System.Threading;

namespace webapp
{
    public class Logger
    {
        public static readonly object _lock = "";

        public static string _path = null;

        public static int verbosity = 0;

        public static int MAX_SIZE = 1024 * 1024;

        public static int ROLL_SIZE = 10;

        public static string LogFile
        {
            get
            {
                return _path;
            }
            set
            {
                lock (_lock)
                {
                    _path = value;
                    DirectoryInfo dir = new DirectoryInfo(Path.GetDirectoryName(_path));
                    if (!dir.Exists) Directory.CreateDirectory(Path.GetDirectoryName(_path));
                }
            }
        }

        public static bool Enabled
        {
            get
            {
                return verbosity > 0;
            }
            set
            {
                lock (_lock)
                {
                    verbosity = 1;
                }
            }
        }

        public static bool Verbose
        {
            get
            {
                return verbosity > 1;
            }
            set
            {
                lock (_lock)
                {
                    if (value) verbosity = 2;
                    else if (verbosity == 2) verbosity = 1;
                }
            }
        }


        public static void Write(string msg, params object[] args)
        {
            if (verbosity <= 0) return;

            try
            {
                string _r = msg;

                if (args != null && args.Length > 0)
                {
                    if (_r.IndexOf("{0") >= 0)
                    {
                        _r = String.Format(_r, args);
                    }
                    else if (_r.IndexOf("#") >= 0)
                    {
                        var regex = new Regex(Regex.Escape("#"));
                        for (int i = 0; i < args.Length && _r.IndexOf("#") >= 0; i++)
                        {
                            _r = regex.Replace(_r, (args[i] != null ? args[i].ToString() : "NULL"), 1);
                        }
                    }
                }

                lock (_lock)
                {
                    if (_path == null)
                    {
                        string dst = Environment.GetEnvironmentVariable("TEMP") == null ?
                            Path.GetDirectoryName(_path) : Environment.GetEnvironmentVariable("TEMP");
                        dst += @"\" + Path.GetFileNameWithoutExtension(
                            System.Reflection.Assembly.GetAssembly(typeof(Logger)).Location);
                        dst += ".log";
                        LogFile = dst;
                    }

                    string prompt = DateTime.Now.ToString("s");

                    if (verbosity > 1)
                    {
                        prompt += " [";
                        prompt += (Thread.CurrentThread.Name != null ?
                            Thread.CurrentThread.Name : "0x" + Thread.CurrentThread.ManagedThreadId.ToString("X4"));
                        prompt += "] ";

                        StackTrace stackTrace = new StackTrace();
                        StackFrame callingframe = stackTrace.GetFrame(1);

                        prompt += " ";
                        prompt += callingframe.GetMethod().DeclaringType;
                        prompt += ".";
                        prompt += callingframe.GetMethod().Name;

                        if (callingframe.GetFileLineNumber() > 0)
                        {
                            prompt += "(+";
                            prompt += callingframe.GetFileLineNumber();
                            prompt += ")";
                        }
                        else
                        {
                            prompt += "()";
                        } 

                    }

                    prompt += " > ";
                    
                    if (ROLL_SIZE > 0)
                    {
                        FileInfo f = new FileInfo(_path);
                        if (f.Exists && f.Length + _r.Length > MAX_SIZE)
                        {
                            int k = ROLL_SIZE;
                            while (k-- > 0)
                            {
                                try
                                {
                                    FileInfo src = new FileInfo(_path + (k == 0 ? "" : "." + (k - 1)));
                                    if (!src.Exists) continue;
                                    FileInfo dst = new FileInfo(_path + "." + k);
                                    if (dst.Exists) dst.Delete();
                                    src.MoveTo(dst.FullName);
                                }
                                catch { }
                            }
                        }
                    }

                    StreamWriter o = new StreamWriter(_path, true);
                    o.Write(prompt);
                    o.WriteLine(_r);
                    o.Close();

                }

            }
            catch (Exception e)
            {
                //eccezzziunale veramente!!!!
                Console.WriteLine("error - {0}", e);
                verbosity = 0;
            }

        }

    }

}
