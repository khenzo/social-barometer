$(document).ready(function() {
    $("#searchPage_Home").tokenInput("https://z37eavgxdh.execute-api.eu-west-1.amazonaws.com/dev/search/", {
        theme: "facebook",
        queryParam: "q",
        propertyToSearch: "name",
        jsonContainer: "data",
        fbTypeParam: "page",
        hintText: "Enter page name",
        tokenLimit: 1,
        noResultsText: "No results",
    });

    $('.sendFb').on('click', function(e) {
        var pageID = "";
        var page = $('body').find('p.page').attr('id') || $('body').find('#token-input-getFbLink').val();
        var isFacebookUrl = ValidateFacebookURL(page);
        if (isFacebookUrl) {
            var pageName = page.split('/');
            pageName = pageName.pop(-1);
            pageID = pageName;
        } else if (isNumber(page)) {
            pageID = page;
        } else {
            console.log('La pagina non è stata trovata');
        }

        if (pageID != "") {
            $.ajax({
                url: "https://z37eavgxdh.execute-api.eu-west-1.amazonaws.com/dev/page/" + pageID,
                success: function(data, stato) {
                    console.log(data);
                    $('.result pre').html(syntaxHighlight(data));
                },
                error: function(richiesta, stato, errori) {
                    console.log(stao, errori)
                }
            });
        }
    })

    $('.sendIg').on('click', function(e) {
        var profile = $('body').find('#searchProfile_IG').val();
        if (typeof(profile) != "undefined") {
            $.ajax({
                url: "https://z37eavgxdh.execute-api.eu-west-1.amazonaws.com/dev/instagram/" + profile,
                success: function(data, stato) {
                    console.log(data);
                    $('.result pre').html(syntaxHighlight(data));
                },
                error: function(richiesta, stato, errori) {
                    console.log(stao, errori)
                }
            });
        }
    });


    function syntaxHighlight(json) {
        if (typeof json != 'string') {
            json = JSON.stringify(json, undefined, 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }



    function ValidateFacebookURL(url) {
        var urlregex = "";
        try {
            urlregex = new RegExp("^(https:[/][/]|http:[/][/]|www.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?/?([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])*$");
            if (urlregex.test(url)) {
                if (url.indexOf("facebook.com") != -1) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (err) {
            return false;
        }
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
});