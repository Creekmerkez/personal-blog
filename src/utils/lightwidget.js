((e, i, d) => {
    var g;
    void 0 === e.lightwidget && (e.lightwidget = {},
    g = null,
    e.addEventListener("message", function(e) {
        var t;
        -1 !== d.indexOf(e.origin.replace(/^https?:\/\//i, "")) && ("lightwidget_lightbox" === (t = "object" == typeof e.data ? e.data : JSON.parse(e.data)).type && null === g ? ((g = i.createElement("script")).src = "https://cdn.lightwidget.com/widgets/lightwidget-lightbox.y.js".replace("y", t.version),
        i.body.appendChild(g)) : t.size <= 0 || [].forEach.call(i.querySelectorAll('iframe[src*="lightwidget.com/widgets/x"],iframe[data-src*="lightwidget.com/widgets/x"],iframe[src*="instansive.com/widgets/x"]'.replace(/x/g, t.widgetId)), function(e) {
            e.style.height = t.size + "px"
        }))
    }, !1))
})(window, document, ["lightwidget.com", "dev.lightwidget.com", "cdn.lightwidget.com"]); 