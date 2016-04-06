cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/net.roughshod.plugins.barcodescanner/www/barcodescanner.js",
        "id": "net.roughshod.plugins.barcodescanner.BarcodeScanner",
        "pluginId": "net.roughshod.plugins.barcodescanner",
        "clobbers": [
            "cordova.plugins.barcodeScanner"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.2.1",
    "net.roughshod.plugins.barcodescanner": "3.0.0"
}
// BOTTOM OF METADATA
});