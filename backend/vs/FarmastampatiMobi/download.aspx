<%@ Page Language="VB" EnableSessionState="false" %>
<%@ Import Namespace="System.IO" %>
<%
    Response.AppendHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    Response.AppendHeader("Pragma", "no-cache")
    Response.AppendHeader("Expires", "0")    
	Response.ContentType = "application/vnd.android.package-archive"
	Response.AddHeader("Content-Disposition", "attachment;filename=""IoEquivalgo-Debug.apk""")
    
    Dim basepath As String = Path.GetDirectoryName(Server.MapPath(Request.Url.AbsolutePath))
    Dim data() As Byte = My.Computer.FileSystem.ReadAllBytes(basepath + "\android-debug.apk")
    Response.AppendHeader("Content-Lenght:", data.Length)
    Response.OutputStream.Write(data, 0, data.Length)
    Response.Flush()
    
    %>

