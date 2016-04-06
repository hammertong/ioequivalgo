<%@ Page Language="VB" EnableSessionState="false"%>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Text" %>
<%@ Import Namespace="webapp" %>
<%    
    Dim deviceid As String = ""
    Dim aic As String = Tools.GetRequestParameter(Request, "aic", "")
    Dim mailbox As String = Tools.GetRequestParameter(Request, "mailbox", "")
    Dim pharmacy As String = Tools.GetRequestParameter(Request, "pharmacy", "")
    Dim code As String = Tools.GetRequestParameter(Request, "code", "")
    
    If code.Length > 0 Then
        Dim s As String() = Encoding.UTF8.GetString(Convert.FromBase64String(code)).Split(",")
        aic = s(0)
        If (s.Length > 1) Then mailbox = s(1)
        If (s.Length > 2) Then pharmacy = s(2)
    End If
            
    If mailbox.Length > 0 And Tools.PopMailbox(Request.QueryString("mailbox")) Then
        Dim userAgent As String = HttpContext.Current.Request.UserAgent.ToLower()
        If userAgent.Contains("iphone") Then
            deviceid = "iphone56"
        ElseIf userAgent.Contains("ipad") Then
            deviceid = "iphone56"
        End If
    End If
    
    Dim querystring = ""
    If Not Request.QueryString Is Nothing Then
        For Each q As String In Request.QueryString
            If querystring.Length = 0 Then
                querystring += "?"
            Else
                querystring += "&"
            End If
            querystring += q
            querystring += "="
            querystring += Request.QueryString(q)
        Next
    End If
    
    Try
        Logger.Write("{0} {1} {2} {3} {4} {5} {6} {7}", Request.UserHostAddress, Request.HttpMethod, Request.Path, querystring, aic, mailbox, pharmacy, Request.UserAgent)
    Catch
    End Try
    
    If Len(deviceid) > 0 Then
        
        If Logger.Enabled Then Logger.Write("INSTALL HTTP {0} {1}", Request.Path, querystring)

        Dim html As String = ""
        
        Dim line As String
        Dim sr As StreamReader = New StreamReader(Path.GetFullPath(Context.Server.MapPath(deviceid + ".html")))
        Do
            line = sr.ReadLine()
            If line Is Nothing Then Exit Do
            html += line.Replace("@url", Request.Path + querystring)
        Loop
        sr.Close()
        
        Response.ContentType = "text/html"
        Response.Write(html)
        Response.Flush()
        
        Return
    End If
	
    '
    ' Process request here 
    '
    Dim xstyles = ""
    
    If Not Request.QueryString("aic") Is Nothing Then
        aic = Request.QueryString("aic").Trim().ToUpper()
    End If
    
    If (aic.Length > 0) Then xstyles = "display: none"

    Dim languages() As String = {"it", "de", "en"}
    Dim languages_desc() As String = {"Italiano", "Deutsch", "English"}

    Dim height As String = "100%"
    Dim autofocus As Boolean = False
    Dim enableprint As Boolean = False

    If Not Request.QueryString("pcdisplay") Is Nothing Then
        If Request.QueryString("pcdisplay").Trim().ToLower().Equals("true") Then
            height = "1000px"
            autofocus = True
            enableprint = True
        End If
    End If

    If Not Request.Browser.IsMobileDevice Then
        height = "1000px"
        autofocus = True
        enableprint = True
    End If
    
    Response.AppendHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    Response.AppendHeader("Pragma", "no-cache")
    Response.AppendHeader("Expires", "0")

    %>
<!DOCTYPE html>
<html>
<head>  

    <meta name="viewport" content="width=device-width, initial-scale=1">
    
	<!--
    <meta name="viewport" content="initial-scale=1.0,width=device-width,user-scalable=1" />        
    -->	
    <!--
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0;">
    -->
        
    <title>Foglio Illustrativo</title>        
    
    <link rel="stylesheet" href="js/jquery.mobile-1.4.5.min.css"/> 
    <script type="text/javascript" src="js/jquery-1.11.3.min.js"></script> 
    <script type="text/javascript" src="js/jquery.mobile-1.4.5.min.js"></script> 
        
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <link rel="apple-touch-icon-precomposed" href="images/farmadati-apple-icon.png" />
    <link rel="icon" type="image/png" href="images/farmadati-apple-icon.png">    

    <style type="text/css">

        .ui-filter-inset {
            margin-top: 0;
        }

        @media print {
            .pagebreak { page-break-after: always; }            
        }

    </style>
    
    <script type="text/javascript" src="dh3.js"></script>
        
</head>

<body oncontextmenu="return false;" onload="_onload('<%= aic %>', <%= autofocus.ToString().ToLower() %>)">

<noscript>
  <meta http-equiv="refresh" content="0;url=noscript.html">
</noscript>

<center>
    
<div id="search" data-role="page">

    <div data-role="main" class="ui-content" style="max-width: 400px; height: <%= height %>; <%= xstyles %>"> 
        
        <!-- BEGIN LOGO HEADER AND TITLE -->
        <img alt="Farmastampati Logo" src="images/farmast.png"/><br />
        <span style="font-style: italic;">Visualizza il foglio illustrativo</span><br /><br />
        <!-- END -->
        
        <!-- BEGIN AUTOCOMPLETE AIC TEXT BOX  -->
        <span style="font-weight: bolder;">Inserisci il Codice AIC</span>        
        <ul id="autocomplete" 
                data-role="listview" 
                data-inset="true"
                data-filter="true" 
                data-filter-placeholder="Inserisci il codice AIC ..." 
                data-filter-theme="a">
        </ul>
        <!-- END -->
        
        <!-- BEGIN DIALOG MESSAGE BOX -->        
        <a id="popupDialogClick" href="#popupDialog" data-rel="popup" data-position-to="window" data-transition="pop" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-icon-delete ui-btn-icon-left ui-btn-b" style="display: none;" data-history="false">dummy</a>
        <div data-role="popup" id="popupDialog" data-overlay-theme="b" data-theme="b" data-dismissible="true" style="max-width:400px;" data-history="false">
            <div data-role="header" data-theme="a">
            <h1>Avviso</h1>
            </div>
            <div role="main" class="ui-content">
                <h3 class="ui-title" id="popupDialogMessage">Messaggio di prova</h3>    
                <!--
                <a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back">Cancel</a>
                -->
                <a href="#" 
                    class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" 
                    data-rel="back" 
                    data-transition="flow"
                    onclick="restore_enter()">Chiudi</a>
            </div>
        </div>
        <!-- END -->        
       
        <!-- BEGIN SEARCH BUTTON -->        
        <a href="javascript: dosearch();" id="searchButton"
            class="ui-btn ui-corner-all ui-shadow ui-btn-middle">Cerca</a>
        <!-- END -->

        <!-- BEGIN AJAX LOADER -->
        <div id="loading" data-position="fixed" style="display: none;">
            <img alt="loading" src="js/images/ajax-loader.gif" style="opacity: 0.3;"/>
        </div>
        <!-- END -->
        
        <!-- BEGIN AIC HELPER DISPLAY BUTTON -->
        <span>
            <a href="#popupAic" data-position-to="window" data-transition="pop"
                    class="ui-btn ui-corner-all ui-shadow ui-btn-middle" style="color: #a0a0a0;">
                    Che cosa &egrave; il codice AIC
            </a>
        </span>
        <!-- END -->
        
    </div>

</div>

<!-- END SEARCH FORM -->

<!-- BEGIN VISUALIZER -->

<div data-role="page" id="page0">
        
    <div id="navigbar" data-role="header" class="ui-header ui-bar-a" role="contentinfo">
    
        <div data-role="navbar" class="ui-navbar ui-mini" role="navigation">
        
            <ul class="ui-grid-b">

            <% If enableprint Then %>

	            <% If aic = "" Then %>

	                <li class="ui-block-a">
	                    <a href="#leftpanel0" 
	                        data-icon="bars" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top">
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Lingua</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>               
	
	                <li class="ui-block-b">
	                    <a href="#search" id="searchclick"
	                        data-transition="slidedown"                         
	                        data-icon="search" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top"> 
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Nuova Ricerca</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>
	 
	                <li class="ui-block-c">
	                    <a href="javascript:printpdf()" 
	                        data-transition="slidedown"                         
	                        data-icon="edit" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top"> 
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Stampa</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>
		
	            <% Else %>

			<li class="ui-block-a" style="width: 50%;">
	                    <a href="#leftpanel0" 
	                        data-icon="bars" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top">
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Lingua</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>               
	
	                <li class="ui-block-c" style="width: 50%;">
	                    <a href="javascript:printpdf()" 
	                        data-transition="slidedown"                         
	                        data-icon="edit" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top"> 
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Stampa</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>
	
            	    <% End If %>         

            <% Else %>


		<% If aic = "" Then %>

	                <li class="ui-block-a" style="width: 50%;">
	                    <a href="#leftpanel0" 
	                        data-icon="bars" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top">
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Lingua</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>               
	
	                <li class="ui-block-b" style="width: 50%;">
	                    <a href="#search" id="searchclick"
	                        data-transition="slidedown"                         
	                        data-icon="search" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top"> 
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Nuova Ricerca</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>

		<% Else %>

			<li class="ui-block-a" style="width: 100%;">
	                    <a href="#leftpanel0" 
	                        data-icon="bars" 
	                        data-corners="false" 
	                        data-shadow="false" 
	                        data-iconshadow="true" 
	                        data-wrapperels="span" 
	                        data-iconpos="top" 
	                        data-theme="a" 
	                        data-inline="false" 
	                        data-mini="true" 
	                        class="ui-btn-icon-top">
	                        <span class="ui-btn-inner">
	                            <span class="ui-btn-text">Lingua</span>
	                            <span class="ui-icon ui-icon-grid ui-icon-shadow">&nbsp;</span>
	                        </span>
	                    </a>
	                </li>   

		<% End If %>

            <% End If %>
                
            </ul>    

        </div>      

    </div>    
    
    <div id="caricamento" style="width: 100%; height: 800px;">        
        <img src="js/images/ajax-loader.gif" alt="caricamento" style="border: 0px; opacity: 0.3; margin-top: 80px;"></img>
    </div>
    
    <div id="foglietto" data-role="main" class="ui-content" style="vertical-align: middle; padding: 0px;" data-history="false">        
        <!-- 
            serialized html, 
            javascript initilization and reload document here             
            -->
    </div>
    
    <!-- leftpanel1 -->
    <div data-role="panel" id="leftpanel0" data-position="left" data-display="reveal" data-theme="a">   
       
        <img src="images/farmast.png" style="width: 100%;" />

        <p>Il documento &egrave; disponibile nelle seguenti versioni</p>

        <div data-role="navbar">

            <ul>
                <%
                For i As Integer = 0 To languages.Length - 1
                %>
                <li id="lang-<%= languages(i) %>-0" style="width: 100%;">
                    <span class="ui-btn-inner ui-btn-text">
                        <a href="javascript:chlang('<%= languages(i) %>')"
                                data-rel="close">
                            <img style="width: 20px;" src="images/<%= languages(i) %>.png" /><br/>
                            <span class="ui-btn-text"><%= languages_desc(i) %></span>
                        </a>
                    </span>
                </li>                
                <%
                Next 
                %>                              
            </ul>
        </div>       

        <br/>
        
        <a href="#demo-links" data-rel="close" class="ui-btn ui-shadow ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-left ui-btn-inline">Chiudi</a>
        <p>
            Per chiudere questo pannello usare il pulsante 'chiudi' o cliccare fuori dai bordi, 
            trascinare il dito a sinistra o premere il tasto Esc
        </p>

    </div>
    <!-- /leftpanel1 -->

</div>

<!-- END VISUALIZER -->

<!-- BEGIN POPUP AIC -->

<div data-role="page" id="popupAic">
    
    <div role="banner" data-role="header" data-theme="b" class="ui-corner-top ui-header ui-bar-a">
        <a href="#search" data-role="button" data-theme="b" data-icon="delete" data-iconpos="notext" class="ui-btn-right">Close</a>
        <h1 aria-level="1" role="heading" class="ui-title">Informazione</h1>
    </div>

    <div role="main" data-role="content" data-theme="d" class="ui-corner-bottom ui-content ui-body-d">
        <div role="main" data-role="content" style="max-width: 300px;">        
            <b>Il codice AIC &egrave; riportato, come evidenziato in giallo:</b><br/>
            <ol type="a" style="text-align: left;">
                <li>
                    <span style="font-size: 14px;">Sul bollino autoadesivo</span><br/>            
                    <img style="border: 0px;" alt="Codice Agenzia Italiana del Farmaco" 
                            src="images/aicsample.jpg" width="200px" />        
                </li>
                <li> 
                    <span style="font-size: 14px;">Su uno dei lati della confezione</span><br/>                
                    <img style="border: 0px;" alt="Codice Agenzia Italiana del Farmaco" 
                            src="images/aicsample2.jpg" width="200px" />
                </li>
            </ol>
        </div>
    </div>    

    <div data-role="footer">
        <a class="ui-btn ui-shadow ui-btn-corner-all ui-btn-inline ui-btn-up-c" data-wrapperels="span" data-iconshadow="true" data-shadow="true" data-corners="true" href="#search" data-transition="slidedown" data-role="button" data-inline="true" data-theme="c" data-history="false">
            <span class="ui-btn-inner ui-btn-corner-all">                        
                <span class="ui-btn-text">Chiudi</span>
            </span>
        </a>
    </div>

</div>

<!-- END POPUP AIC -->

</center>

</body>

</html>

