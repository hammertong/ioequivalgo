<%@ Page Language="VB" EnableSessionState="false"%>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="webapp" %>
<%    
	Dim redirectPage = "default.aspx"
    
    Dim querystring As String = ""
    
    If Not Request.QueryString Is Nothing Then
        
        For Each q As String In Request.QueryString
            
            If q.ToLower() = "mailbox" Then
                Tools.PushMailbox(Request.QueryString(q))
            End If
            
            If querystring.Length = 0 Then
                querystring = "?"
            Else
                querystring += "&"
            End If
            
            querystring += q
            querystring += "="
            querystring += Request.QueryString(q)
            
        Next
        
    End If
   
    Response.Redirect(redirectPage + querystring, True)
        
    %>
