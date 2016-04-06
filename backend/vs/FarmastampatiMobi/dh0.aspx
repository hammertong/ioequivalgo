<%@ Page Language="VB" EnableSessionState="false" %>
<%@ Import Namespace="webapp" %>
<%
    Dim PAGESER as Integer = 30
    Dim aic As String = ""
    If Not Request.QueryString("aic") Is Nothing Then
        aic = Request.QueryString("aic").Trim().ToUpper()
    End If
    Response.AppendHeader("Cache-Control", "no-cache, no-store, must-revalidate")     
    Response.AppendHeader("Pragma", "no-cache")     
    Response.AppendHeader("Expires", "0")     
    %>
<!DOCTYPE html>
<html lang="en">
<head>  

    <meta name="viewport" 
        content="initial-scale=1.0,width=device-width,user-scalable=1" />
    
    
    <title>Foglietto Illustrativo</title>
    
    <!-- JQuery Libraries -->
    <link rel="stylesheet" href="js/jquery.mobile-1.4.5.min.css"/>
    <script type="text/javascript" src="js/jquery-1.11.3.min.js"></script>
    <script type="text/javascript" src="js/jquery.mobile-1.4.5.min.js"></script>

    <!-- Icons -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <link rel="apple-touch-icon-precomposed" href="images/farmadati-apple-icon.png" />
    <link rel="icon" type="image/png" href="images/farmadati-apple-icon.png">    
    
    <!-- Smartphone Splash Screen -->
    <!-- iPhone -->
	<!--
    <link href="images/apple-touch-startup-image-320x460.png"
          media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)"
          rel="apple-touch-startup-image">  
		  -->
    <!-- iPhone (Retina) -->
    <!--
    <link href="apple-touch-startup-image-640x920.png"
          media="(device-width: 320px) and (device-height: 480px)
             and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">
          -->
    <!-- iPhone 5 -->
    <!--
    <link href="apple-touch-startup-image-640x1096.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">
          -->
    <!-- iPad (portrait) -->
    <!-- 
    <link href="apple-touch-startup-image-768x1004.png"
          media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)"
          rel="apple-touch-startup-image">
          -->
    <!-- iPad (landscape) -->
    <!-- 
    <link href="apple-touch-startup-image-748x1024.png"
          media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)"
          rel="apple-touch-startup-image">
          -->
    <!-- iPad (Retina, portrait) -->
    <!-- 
    <link href="apple-touch-startup-image-1536x2008.png"
          media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">
          -->
    <!-- iPad (Retina, landscape) -->
    <!-- 
    <link href="apple-touch-startup-image-1496x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)"
          rel="apple-touch-startup-image">
          -->

    <!-- Page Scripting -->
    <script type="text/javascript" src="dh0.js"></script>
	
</head>

<body oncontextmenu="return true;" onload="_onload()" style="margin: 0px;">

<center>
    
<div id="search" data-role="page">

    <div data-role="main" class="ui-content" style="max-width: 400px;"> 
        
        <div data-role="main" class="ui-content" data-mini="true">

            <!-- logo -->
            <img alt="Farmastampati Logo" src="images/farmast.png"/><br />
            <span style="font-style: italic;">Visualizza il foglietto illustrativo</span><br /><br />

            <!-- aic text box -->
            <span style="font-weight: bolder;">Inserisci il Codice AIC</span>                   
            
            <div class="ui-content"> 
                <input name="aic" id="aic" type="text" size="10" value="<%= aic %>">
            </div>

            <!-- popup, available positions: window, origin, #id -->
            <a id="displayerror" style="display: none;" 
                    href="#popupCloseRight" data-rel="popup" class="ui-btn ui-corner-all ui-shadow ui-btn-inline" 
                    data-position-to="window" 
                    data-transition="flip">...</a>
            <div data-role="popup" id="popupCloseRight" class="ui-content"
                    style="max-width:280px; border: 3px #aa1111 solid; color: darkRed;">
                <a href="#" data-rel="back" 
                        class="ui-btn ui-corner-all ui-shadow ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right"
                        style="background-color: #dd4231;">Chiudi</a>
                <p id="error">...</p>
            </div>
            <!-- end popup -->
            
            <!-- search button click -->
            <a id="success" style="display: none" href="#page0" data-transition="slideup"></a>          
            <div id="searchbutton" class="ui-content"> 
                <a href="javascript: dosearch();" 
                    class="ui-btn ui-corner-all ui-shadow ui-btn-middle">Cerca</a><br />
            </div>
            <div id="loading" data-position="fixed" style="display: none;">
                <img alt="loading" src="js/images/ajax-loader.gif" />
            </div>

            <!-- Aic help instructions  -->
            <span>                      
                <a href="#aicPopup" data-rel="popup" data-transition="flip" data-position-to="window" 
                        class="ui-btn ui-corner-all ui-shadow ui-btn-middle">            
                        Che cosa &egrave; il codice AIC<br/>
                    <span style="font-size: 36px; font-weight: bolder;">?</span>
                </a>
            </span>            
            <div data-role="popup" id="aicPopup" class="ui-content">
            <a href="#" data-rel="back" 
                        class="ui-btn ui-corner-all ui-shadow ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right"
                        style="background-color: #dd4231;">Chiudi</a>
            <span style="font-weight: smaller;">
                Il codice AIC viene riportato sulla<br/>
                confezione come evidenziato in figura:
            </span>
            <img style="border: 0px; width: 400px;" 
                    alt="Codiice Agenzia Italiana del Farmaco" 
                    src="images/aicsample.jpg"/>
            </div>

        </div>
            
    </div>

</div>

<!-- END SEARCH FORM -->

<!-- BEGIN VISUALIZER -->

<div data-role="page" id="page0">  
    
	<div data-role="header" class="ui-header ui-bar-a" role="contentinfo">
	
        <div data-role="navbar" class="ui-navbar ui-mini" role="navigation">		
		
            <ul class="ui-grid-b">			
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
                    <a href="#search" 
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
            </ul>			
        </div>		
    </div>    
	
	<div data-role="main" class="ui-content" style="vertical-align: middle;">
        <iframe id="pdfembedded" src="#" 
            style="width:100%; height:1500px;" frameborder="0"></iframe>
    </div>
	
    <!-- leftpanel1 -->
    <div data-role="panel" id="leftpanel0" data-position="left" data-display="reveal" data-theme="a">   
       
        <img src="images/farmast.png" style="width: 100%;" />

        <p>Il documento &egrave; disponibile nelle seguenti versioni</p>

        <div data-role="navbar">

            <ul>
                <li id="lang-it-0" style="width: 100%;">
                    <span class="ui-btn-inner ui-btn-text">
                        <a href="javascript:chlang('it')" 
                                data-rel="close">                        
                            <img style="width: 20px;" src="images/it.png" /><br/>
                            <span class="ui-btn-text">Italiano</span>                                                    
                        </a>
                    </span>
                </li>
                <li id="lang-de-0" style="width: 100%;">
                    <span class="ui-btn-inner ui-btn-text">
                        <a href="javascript:chlang('de')"
                                data-rel="close">                        
                            <img style="width: 20px;" src="images/de.png" /><br/>
                            <span class="ui-btn-text">Deutsch</span>                                                    
                        </a>
                    </span>
                </li>
                <li id="lang-fr-0" style="width: 100%;">
                    <span class="ui-btn-inner ui-btn-text">
                        <a href="javascript:chlang('fr')"
                                data-rel="close">                        
                            <img style="width: 20px;" src="images/fr.png" /><br/>
                            <span class="ui-btn-text">Francais</span>                                                    
                        </a>
                    </span>
                </li>
                <li id="lang-en-0" style="width: 100%;">
                    <span class="ui-btn-inner ui-btn-text">
                        <a href="javascript:chlang('en')"
                                data-rel="close">                        
                            <img style="width: 20px;" src="images/is.png" /><br/>
                            <span class="ui-btn-text">English</span>                                                    
                        </a>
                    </span>
                </li>
                <li id="lang-es-0" style="width: 100%;">
                    <span class="ui-btn-inner ui-btn-text">
                        <a href="javascript:chlang('es')"
                                data-rel="close">                        
                            <img style="width: 20px;" src="images/es.png" /><br/>
                            <span class="ui-btn-text">Espanol</span>                                                    
                        </a>
                    </span>  
                </li>
            </ul>
        </div>       

        <br/>
        
        <a href="#demo-links" data-rel="close" class="ui-btn ui-shadow ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-left ui-btn-inline">Chiudi</a>
        <p>Per chiudere questo pannello usare il pulsante 'chiudi' o cliccare fuori dai bordi, trascinare il dito a destra o sinistra o premere il tasto Esc</p>

    </div>
    <!-- /leftpanel1 -->

</div>

<!-- END VISUALIZER -->

</center>

</body>

</html>
