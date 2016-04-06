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

    <!--
    <meta name="viewport" 
        content="initial-scale=1.0,width=device-width,user-scalable=1" />
    -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
        
    <title>Foglietto Illustrativo</title>
    
    <!-- JQuery Libraries -->
    
    <!-- jquery 1.4.2 -->
    <link rel="stylesheet" href="js/jquery.mobile-1.4.2.min.css"/>
    <script type="text/javascript" src="js/jquery-1.10.2.min.js"></script>
    <script type="text/javascript" src="js/jquery.mobile-1.4.2.min.js"></script>
    
    <!-- jquery 1.4.5 -->
    <!-- <link rel="stylesheet" href="js/jquery.mobile-1.4.5.min.css"/> -->
    <!-- <script type="text/javascript" src="js/jquery-1.11.3.min.js"></script> -->
    <!-- <script type="text/javascript" src="js/jquery.mobile-1.4.5.min.js"></script> -->        
	
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

	<style type="text/css">
	.ui-filter-inset {
		margin-top: 0;
	}
	</style>
    <!-- Page Scripting -->
    <script type="text/javascript" src="dh3.js"></script>	
	
</head>

<body oncontextmenu="return false;" onload="_onload('<%= aic %>')">

<center>
    
<div id="search" data-role="page">

    <div data-role="main" class="ui-content" style="max-width: 400px;"> 
        
		<!-- logo -->
		<img alt="Farmastampati Logo" src="images/farmast.png"/><br />
		<span style="font-style: italic;">Visualizza il foglietto illustrativo</span><br /><br />

		<!-- aic autocomplete  text box -->
		<span style="font-weight: bolder;">Inserisci il Codice AIC</span>
		
		<ul id="autocomplete" 
				data-role="listview" 
				data-inset="true"
				data-filter="true" 
				data-filter-placeholder="Inserisci il codice AIC ..." 
				data-filter-theme="a">
		</ul>
		
        <!-- msgbox -->        
        <div tabindex="0" id="popupDialog-popup" class="ui-popup-container pop in ui-popup-active" data-history="false" >
            <div data-position-to="origin" data-transition="none" data-corners="true" data-shadow="true" data-disabled="false" aria-disabled="false" data-role="popup" id="popupDialog" data-overlay-theme="a" data-theme="c" style="background: white;" class="ui-corner-all ui-popup ui-body-c ui-overlay-shadow" data-history="false" >
                <div role="banner" data-role="header" data-theme="b" class="ui-corner-top ui-header ui-bar-a">
                    <h1 aria-level="1" role="heading" class="ui-title">Avviso</h1>
                </div>
                <div role="main" data-role="content" data-theme="d" class="ui-corner-bottom ui-content ui-body-d">
                    <h3 class="ui-title" id="popupDialogMessage"></h3>            
                    <a class="ui-btn ui-shadow ui-btn-corner-all ui-btn-inline ui-btn-up-c" data-wrapperels="span" data-iconshadow="true" data-shadow="true" data-corners="true" href="#" data-role="button" data-inline="true" data-rel="back" data-theme="c"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Chiudi</span></span></a>
                </div>
            </div>
        </div>
		
		<!-- search button click -->		
		<a href="javascript: dosearch();" id="searchButton"
			class="ui-btn ui-corner-all ui-shadow ui-btn-middle">Cerca</a>
		
        <!-- ajax loader -->
        <div id="loading" data-position="fixed" style="display: none;">
			<img alt="loading" src="js/images/ajax-loader.gif" style="opacity: 0.3;"/>
		</div>
        
		<!-- aic help instructions  -->
		<span>                      
			<a href="#popupAic" data-rel="popup" data-position-to="window" data-transition="slideup"
					class="ui-btn ui-corner-all ui-shadow ui-btn-middle" style="color: #a0a0a0;">            
					Che cosa &egrave; il codice AIC				
			</a>
		</span>            
        <div tabindex="1" id="popupAic-popup" class="ui-popup-container pop in ui-popup-active" data-history="false">
            <div data-position-to="origin" data-corners="true" data-shadow="true" data-disabled="false" aria-disabled="false" data-role="popup" id="popupAic" data-overlay-theme="a" data-theme="c" style="background: white; overflow: hidden;" class="ui-corner-all ui-popup ui-body-c ui-overlay-shadow" data-history="false" >
                <div role="banner" data-role="header" data-theme="b" class="ui-corner-top ui-header ui-bar-a">
                    <h1 aria-level="1" role="heading" class="ui-title">Informazione</h1>
                </div>
                <div role="main" data-role="content" data-theme="d" class="ui-corner-bottom ui-content ui-body-d">
                    <p style="font-weight: smaller;">
                        Il codice AIC &egrave; riportato sul bollino della confezione come evidenziato in giallo   
                    </p>
                    <img style="border: 0px; width: 370px;" 
                            alt="Codiice Agenzia Italiana del Farmaco" 
                            src="images/aicsample.jpg"/>
                    <a class="ui-btn ui-shadow ui-btn-corner-all ui-btn-inline ui-btn-up-c" data-wrapperels="span" data-iconshadow="true" data-shadow="true" data-corners="true" href="#" data-role="button" data-inline="true" data-rel="back" data-theme="c"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Chiudi</span></span></a>
                </div>                
            </div>
        </div>

    </div>

</div>

<!-- END SEARCH FORM -->

<!-- BEGIN VISUALIZER -->

<div data-role="page" id="page0" data-history="false">  
    
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
            </ul>			
        </div>		
    </div>    
	
	<div data-role="main" class="ui-content" style="vertical-align: middle; padding: 0px;" data-history="false">         	
        <div id="caricamento" style="width: 100%; height: 800px;">
            <br /><br /><br /><br /><br />
            <img src="js/images/ajax-loader.gif" alt="caricamento" style="border: 0px; opacity: 0.3;"></src>
        </div>
    	<%
        For i As Integer = 0 To PAGESER
        %>    
        <div style="box-shadow: 10px 10px 5px #888888; width: 100%;">
            <img style="width: 100%;" src="#" id="page<%= i %>file" />    
    	    <span data-role="footer" class="ui-btn-text" id="page<%= i %>footer"></span>    
        </div>
        <%
        Next 
        %>		
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
                            <img style="width: 20px;" src="images/en.png" /><br/>
                            <span class="ui-btn-text">English</span>                                                    
                        </a>
                    </span>
                </li>                
            </ul>
        </div>       

        <br/>
        
        <a href="#demo-links" data-rel="close" class="ui-btn ui-shadow ui-corner-all ui-btn-a ui-icon-delete ui-btn-icon-left ui-btn-inline">Chiudi</a>
        <p>Per chiudere questo pannello usare il pulsante 'chiudi' o cliccare fuori dai bordi, trascinare il dito a sinistra o premere il tasto Esc</p>

    </div>
    <!-- /leftpanel1 -->

</div>

<!-- END VISUALIZER -->

</center>

</body>

</html>
