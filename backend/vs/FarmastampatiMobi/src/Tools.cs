using System;
using System.Collections.Generic;
using System.Collections;
using System.Web;
using System.Web.Configuration;
using System.IO;
using System.Configuration;

namespace webapp
{
    public class Tools
    {
        static object transaction_lock = "";
        static Int32 transaction_counter = 0;
        static Random rnd = new Random(-84612123);

        static ArrayList mailboxList = new ArrayList();

        public static string CreateTransactionId()
        { 
            string id = null;            
            lock (transaction_lock)
            {
                transaction_counter++;
                transaction_counter %= 1000000000;
                id = String.Format("{0:D9}-{1:D9}", rnd.Next(1000000000), transaction_counter);        
            }
            return id;
        }

        public static void PushMailbox(string mailbox)
        {
            lock (mailboxList)
            {
                if (mailboxList.Contains(mailbox)) return;
                mailboxList.Add(mailbox);
            }
        }

        public static bool PopMailbox(string mailbox)
        {
            lock (mailboxList)
            {
                if (mailboxList.Contains(mailbox))
                {
                    mailboxList.Remove(mailbox);
                    return true;
                }
                else
                {
                    return false;
                }
            }
        }

        public static void ReplyJSon(HttpResponse response, params object[] args)
        {
            response.ContentType = "application/json; charset=utf-8";
            response.Write("{ ");
            response.Write("\"http\": { \"code\": ");

            bool override_status = false;
            if (args != null && args.Length > 0) 
            {
                for (int i = 0; i < args.Length && !override_status; i++)
                {
                    string arg = args[i].ToString();
                    if (arg.Equals("code"))
                    {
                        response.StatusCode = 200;
                        response.Write(args[++i]);
                        response.Write(", ");
                        override_status = true;
                    }
                }
            }

            if (!override_status)
            {
                response.Write(response.StatusCode);
                response.Write(", ");
            }

            response.Write(" \"description\": \"");

            if (response.StatusDescription != null)
                response.Write(response.StatusDescription
                        .Replace("'", @"\'")                
                        .Replace('"', '\'')                
                        .Replace('\r', ' ')
                        .Replace('\n', ' ')
                        .Trim(' ', '\t'));
            response.Write("\" }");            

            for (int i = 0; args != null && i < args.Length; i++)
            {
                response.Write(",");
                response.Write(" \"");
                response.Write(args[i++]);
                response.Write("\": ");
                if (args[i].GetType() == typeof(string))
                {
                    response.Write("\"");
                    response.Write(((string)args[i])
                            .Replace("'", @"\'")
                            .Replace('"', '\'')
                            .Replace('\r', ' ')
                            .Replace('\n', ' ')
                            .Trim(' ', '\t'));
                    response.Write("\"");
                }
                else
                {
                    response.Write(args[i]);
                }
            }
            response.Write(" }");
        }

        public static string GetPreferredLanguageId(string [] userLanguages)
        {
            foreach (string lang in userLanguages)
            {                
                if (lang.ToLower().StartsWith("it")) return "it";
                else if (lang.ToLower().StartsWith("en")) return "en";
                else if (lang.ToLower().StartsWith("de")) return "de";
                else if (lang.ToLower().StartsWith("es")) return "es";
                else if (lang.ToLower().StartsWith("fr")) return "fr";
            }
            return "it";
        }

        public static int GetBrowserId(HttpRequest request)
        {
            string ua = request.UserAgent.ToLower();
            if (ua.IndexOf("droid") >= 0)
            {
                return 1;
            }
            else if (ua.IndexOf("ios") >= 0
                || ua.IndexOf("osx") >= 0
                || ua.IndexOf("ipad") >= 0)
            {
                return 2;
            }
            else if (ua.IndexOf("chrome") >= 0)
            {
                return 3;
            }
            else 
            { 
                return 0;  
            }
        }

        public static string GetRequestParameter(
                HttpRequest request, string key, string defaultValue = null)
        {
            string valueFromrequest = (request.Params[key] != null ?
                request.Params[key] : request.QueryString[key]);
            return (valueFromrequest != null ? valueFromrequest : defaultValue);
        }

        public static string WrapMailMessage()
        {
            return null;
            /*
            // costruiamo alcune intestazioni generali
            $header = “From: Inviante <inviante@dominio.org>\n”;
            $header .= “CC: Altro Ricevente <altroricevente@dominio.net>\n”;
            $header .= “X-Mailer: Il nostro Php\n”;

            // generiamo le stringhe utilizzate come separatori
            $boundary = “==String_Boundary_x” .md5(time()). “x”;
            $boundary2 = “==String_Boundary2_y” .md5(time()). “y”;

            // costruiamo le intestazioni specifiche per un messaggio
            // con parti relazionate
            $header .= “MIME-Version: 1.0\n”;
            $header .= “Content-Type: multipart/related;\n”;
            $header .= ” type=\”multipart/alternative\”;\n”;
            $header .= ” boundary=\”$boundary\”;\n\n”;

            $messaggio = “Se visualizzi questo testo il tuo programma non supporta i MIME\n\n”;

            // il primo segmento del multipart/related
            // è definito come multipart/alternative
            $messaggio .= “–$boundary\n”;
            $messaggio .= “Content-Type: multipart/alternative;\n”;
            $messaggio .= ” boundary=\”$boundary2\”;\n\n”;

            // sezione alternativa in puro testo
            $messaggio .= “–$boundary2\n”;
            $messaggio .= “Content-Type: text/plain; charset=\”iso-8859-1\”\n”;
            $messaggio .= “Content-Transfer-Encoding: 7bit\n\n”;
            $messaggio .= “Messaggio alternativo in formato testo.\n\n”;

            // sezione alternativa in formato html
            $messaggio .= “–$boundary2\n”;
            $messaggio .= “Content-Type: text/html; charset=\”iso-8859-1\”\n”;
            $messaggio .= “Content-Transfer-Encoding: 7bit\n\n”;
            $messaggio .= “<html><body><p>Questo messaggio è in formato <i>html</i> ma ha una parte testo.</p><p>Visita il sito <a href=\”http://www.html.it\”>www.html.it</a><img src=\”cid:MiaImmagine123\”></p></body></html>\n”;

            // chiusura della sezione multipart/alternative
            $messaggio .= “–$boundary2–\n”;

            // seconda sezione del multipart/related contenente l’immagine
            $messaggio .= “–$boundary\n”;
            $messaggio .= “Content-ID: <MiaImmagine123>\n”;
            $messaggio .= “Content-Type: image/jpeg\n”;
            $messaggio .= “Content-Transfer-Encoding: base64\n\n”;

            $allegato = “./images/miaimmagine.jpg”;
            $file = fopen($allegato,’rb’);
            $data = fread($file,filesize($allegato));
            fclose($file);

            $data = chunk_split(base64_encode($data));
            $messaggio .= “$data\n\n”;

            // chiusura della sezione multipart/related
            $messaggio .= “–$boundary–\n”;

            $subject = “oggetto del messaggio alternativo con immagini inline”;
              
            */
            
        }

    }

}
